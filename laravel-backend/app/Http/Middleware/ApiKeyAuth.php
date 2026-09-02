<?php

namespace App\Http\Middleware;

use App\Models\ApiKey;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiKeyAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $key = $request->header('X-API-Key');
        abort_if(! $key || ! is_string($key), 401, 'Missing X-API-Key header');

        $apiKey = ApiKey::where('key_hash', hash('sha256', $key))->whereNull('revoked_at')->first();
        abort_if(! $apiKey, 401, 'Invalid or revoked API key');

        $apiKey->update(['last_used_at' => now()]);
        $request->attributes->set('apiOrganizationId', $apiKey->organization_id);

        return $next($request);
    }
}
