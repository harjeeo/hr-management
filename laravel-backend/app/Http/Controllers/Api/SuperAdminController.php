<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SuperAdminController extends Controller
{
    public function organizations()
    {
        return Organization::withCount(['employees', 'users'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Organization $org) {
                $data = $org->toArray();
                $data['_count'] = [
                    'employees' => $org->employees_count,
                    'users' => $org->users_count,
                ];
                unset($data['employees_count'], $data['users_count']);

                return $data;
            });
    }

    public function setStatus(Request $request, string $id)
    {
        $org = Organization::findOrFail($id);

        $data = $request->validate([
            'status' => ['required', Rule::in(['TRIAL', 'ACTIVE', 'SUSPENDED'])],
        ]);

        $org->update(['status' => $data['status']]);

        return response()->json($org);
    }

    public function stats()
    {
        return response()->json([
            'totalOrgs' => Organization::count(),
            'activeOrgs' => Organization::where('status', 'ACTIVE')->count(),
            'trialOrgs' => Organization::where('status', 'TRIAL')->count(),
            'suspendedOrgs' => Organization::where('status', 'SUSPENDED')->count(),
            'totalEmployees' => Employee::count(),
        ]);
    }
}
