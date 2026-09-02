<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditController extends Controller
{
    public function list(Request $request)
    {
        return AuditLog::with('user:id,name,email')
            ->where('organization_id', $request->user()->organization_id)
            ->orderByDesc('created_at')
            ->limit(100)
            ->get();
    }

    public function myLogins(Request $request)
    {
        return AuditLog::where('user_id', $request->user()->id)
            ->where('action', 'LOGIN')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();
    }
}
