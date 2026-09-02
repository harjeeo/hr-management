<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApiKey;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ApiKeysController extends Controller
{
    public function list(Request $request)
    {
        return ApiKey::where('organization_id', $request->user()->organization_id)
            ->orderByDesc('created_at')
            ->get(['id', 'name', 'key_prefix', 'last_used_at', 'revoked_at', 'created_at']);
    }

    public function create(Request $request)
    {
        $data = $request->validate(['name' => ['required', 'string', 'min:2']]);

        $rawKey = 'hrms_'.Str::random(48);
        $keyHash = hash('sha256', $rawKey);
        $keyPrefix = substr($rawKey, 0, 12);

        $apiKey = ApiKey::create([
            'organization_id' => $request->user()->organization_id,
            'name' => $data['name'],
            'key_hash' => $keyHash,
            'key_prefix' => $keyPrefix,
            'created_at' => now(),
        ]);

        return response()->json([
            'id' => $apiKey->id,
            'name' => $apiKey->name,
            'key' => $rawKey,
            'keyPrefix' => $keyPrefix,
        ]);
    }

    public function revoke(Request $request, string $id)
    {
        $key = ApiKey::where('id', $id)->where('organization_id', $request->user()->organization_id)->first();
        abort_if(! $key, 404, 'API key not found');

        $key->update(['revoked_at' => now()]);

        return response()->json(['success' => true]);
    }
}
