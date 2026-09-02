<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Organization;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Support\AuditLogger;
use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use PragmaRX\Google2FA\Google2FA;

class AuthController extends Controller
{
    private function slugify(string $name): string
    {
        $slug = Str::slug($name);

        return $slug !== '' ? $slug : 'org';
    }

    private function authPayload(User $user, string $token): array
    {
        return [
            'accessToken' => $token,
            'user' => [
                'userId' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'organizationId' => $user->organization_id,
            ],
        ];
    }

    public function registerOrganization(Request $request)
    {
        $data = $request->validate([
            'companyName' => ['required', 'string', 'min:2'],
            'ownerName' => ['required', 'string', 'min:2'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        if (User::where('email', $data['email'])->exists()) {
            throw ValidationException::withMessages(['email' => 'Email already registered'])
                ->status(409);
        }

        $baseSlug = $this->slugify($data['companyName']);
        $slug = $baseSlug;
        $suffix = 1;
        while (Organization::where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$suffix}";
            $suffix++;
        }

        [$user, $token] = DB::transaction(function () use ($data, $slug) {
            $org = Organization::create([
                'name' => $data['companyName'],
                'slug' => $slug,
            ]);

            $user = User::create([
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'name' => $data['ownerName'],
                'role' => 'ORG_ADMIN',
                'organization_id' => $org->id,
            ]);

            $freePlan = Plan::firstOrCreate(
                ['name' => 'Free'],
                [
                    'price' => 0,
                    'employee_limit' => 5,
                    'features' => ['Basic employee management', 'Attendance', 'Leave'],
                ],
            );

            Subscription::create([
                'organization_id' => $org->id,
                'plan_id' => $freePlan->id,
                'status' => 'TRIAL',
                'trial_ends_at' => now()->addDays(14),
            ]);

            $token = $user->createToken('auth')->plainTextToken;

            return [$user, $token];
        });

        return response()->json($this->authPayload($user, $token));
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'totpCode' => ['sometimes', 'nullable', 'string'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! $user->is_active || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['email' => 'Invalid credentials'])->status(401);
        }

        if ($user->two_factor_enabled) {
            if (empty($data['totpCode'])) {
                return response()->json(['requires2FA' => true]);
            }

            $valid = (new Google2FA)->verifyKey($user->two_factor_secret, $data['totpCode']);
            if (! $valid) {
                throw ValidationException::withMessages(['totpCode' => 'Invalid 2FA code'])->status(401);
            }
        }

        AuditLogger::log([
            'organizationId' => $user->organization_id,
            'userId' => $user->id,
            'action' => 'LOGIN',
            'entityType' => 'User',
            'entityId' => $user->id,
            'description' => "{$user->email} logged in",
            'ipAddress' => $request->ip(),
            'userAgent' => $request->userAgent(),
        ]);

        $token = $user->createToken('auth')->plainTextToken;

        return response()->json($this->authPayload($user, $token));
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('organization');

        return response()->json([
            'id' => $user->id,
            'email' => $user->email,
            'name' => $user->name,
            'role' => $user->role,
            'organizationId' => $user->organization_id,
            'organization' => $user->organization,
            'twoFactorEnabled' => $user->two_factor_enabled,
        ]);
    }

    public function setupTwoFactor(Request $request)
    {
        $user = $request->user();

        $google2fa = new Google2FA;
        $secret = $google2fa->generateSecretKey();
        $user->update(['two_factor_secret' => $secret]);

        $otpauth = $google2fa->getQRCodeUrl('HR Management', $user->email, $secret);
        $qrCodeDataUrl = (new Builder(writer: new PngWriter, data: $otpauth, size: 300, margin: 10))
            ->build()
            ->getDataUri();

        return response()->json(['secret' => $secret, 'qrCodeDataUrl' => $qrCodeDataUrl]);
    }

    public function enableTwoFactor(Request $request)
    {
        $data = $request->validate(['code' => ['required', 'string', 'size:6']]);
        $user = $request->user();

        abort_if(! $user->two_factor_secret, 400, 'Run 2FA setup first');

        $valid = (new Google2FA)->verifyKey($user->two_factor_secret, $data['code']);
        if (! $valid) {
            throw ValidationException::withMessages(['code' => 'Invalid code'])->status(400);
        }

        $user->update(['two_factor_enabled' => true]);

        return response()->json(['success' => true]);
    }

    public function disableTwoFactor(Request $request)
    {
        $data = $request->validate(['code' => ['required', 'string', 'size:6']]);
        $user = $request->user();

        abort_if(! $user->two_factor_enabled || ! $user->two_factor_secret, 400, '2FA is not enabled');

        $valid = (new Google2FA)->verifyKey($user->two_factor_secret, $data['code']);
        if (! $valid) {
            throw ValidationException::withMessages(['code' => 'Invalid code'])->status(400);
        }

        $user->update(['two_factor_enabled' => false, 'two_factor_secret' => null]);

        return response()->json(['success' => true]);
    }
}
