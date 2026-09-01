<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class OrganizationController extends Controller
{
    public function show(Request $request)
    {
        $org = $request->user()->organization;

        abort_if(! $org, 404, 'Organization not found');

        return response()->json($org);
    }

    public function update(Request $request)
    {
        $org = $request->user()->organization;
        abort_if(! $org, 404, 'Organization not found');

        $data = $request->validate([
            'name' => ['sometimes', 'string'],
            'logoUrl' => ['sometimes', 'nullable', 'string'],
            'industry' => ['sometimes', 'nullable', 'string'],
            'companySize' => ['sometimes', 'nullable', 'string'],
            'timezone' => ['sometimes', 'string'],
            'currency' => ['sometimes', 'in:INR,USD,EUR,GBP'],
        ]);

        $org->update([
            'name' => $data['name'] ?? $org->name,
            'logo_url' => $data['logoUrl'] ?? $org->logo_url,
            'industry' => $data['industry'] ?? $org->industry,
            'company_size' => $data['companySize'] ?? $org->company_size,
            'timezone' => $data['timezone'] ?? $org->timezone,
            'currency' => $data['currency'] ?? $org->currency,
        ]);

        return response()->json($org);
    }
}
