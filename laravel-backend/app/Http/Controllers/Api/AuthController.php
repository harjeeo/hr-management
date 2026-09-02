<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Organization;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

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
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! $user->is_active || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['email' => 'Invalid credentials'])->status(401);
        }

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
        ]);
    }
}
