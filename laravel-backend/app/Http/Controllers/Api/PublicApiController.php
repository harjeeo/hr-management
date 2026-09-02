<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class PublicApiController extends Controller
{
    public function listEmployees(Request $request)
    {
        return Employee::with(['department:id,name', 'designation:id,title'])
            ->where('organization_id', $request->attributes->get('apiOrganizationId'))
            ->orderBy('full_name')
            ->get()
            ->map(fn (Employee $e) => [
                'id' => $e->id,
                'employeeCode' => $e->employee_code,
                'fullName' => $e->full_name,
                'email' => $e->email,
                'employmentStatus' => $e->employment_status,
                'employmentType' => $e->employment_type,
                'joiningDate' => $e->joining_date,
                'department' => $e->department ? ['name' => $e->department->name] : null,
                'designation' => $e->designation ? ['title' => $e->designation->title] : null,
            ]);
    }

    public function todayAttendance(Request $request)
    {
        $organizationId = $request->attributes->get('apiOrganizationId');
        $date = Carbon::today();

        return Attendance::with('employee:id,employee_code,full_name')
            ->where('organization_id', $organizationId)
            ->whereDate('date', $date)
            ->get()
            ->map(fn (Attendance $a) => [
                'employee' => [
                    'employeeCode' => $a->employee->employee_code,
                    'fullName' => $a->employee->full_name,
                ],
                'status' => $a->status,
                'checkIn' => $a->check_in,
                'checkOut' => $a->check_out,
            ]);
    }
}
