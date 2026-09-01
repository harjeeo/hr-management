<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\LeaveBalance;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\User;
use App\Support\Notifier;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class LeaveController extends Controller
{
    private function myEmployee(Request $request): Employee
    {
        $employee = Employee::where('user_id', $request->user()->id)->first();
        abort_if(! $employee, 400, 'No employee profile linked to this account');

        return $employee;
    }

    public function listTypes(Request $request)
    {
        return LeaveType::where('organization_id', $request->user()->organization_id)
            ->orderBy('name')
            ->get();
    }

    public function createType(Request $request)
    {
        $organizationId = $request->user()->organization_id;
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2'],
            'isPaid' => ['sometimes', 'boolean'],
            'defaultDaysPerYear' => ['sometimes', 'integer', 'min:0'],
        ]);

        $exists = LeaveType::where('organization_id', $organizationId)->where('name', $data['name'])->exists();
        if ($exists) {
            throw ValidationException::withMessages(['name' => 'Leave type already exists'])->status(409);
        }

        $type = LeaveType::create([
            'organization_id' => $organizationId,
            'name' => $data['name'],
            'is_paid' => $data['isPaid'] ?? true,
            'default_days_per_year' => $data['defaultDaysPerYear'] ?? 12,
        ]);

        return response()->json($type, 201);
    }

    public function updateType(Request $request, string $id)
    {
        $type = LeaveType::where('organization_id', $request->user()->organization_id)->findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'min:2'],
            'isPaid' => ['sometimes', 'boolean'],
            'defaultDaysPerYear' => ['sometimes', 'integer', 'min:0'],
        ]);

        $type->update([
            'name' => $data['name'] ?? $type->name,
            'is_paid' => $data['isPaid'] ?? $type->is_paid,
            'default_days_per_year' => $data['defaultDaysPerYear'] ?? $type->default_days_per_year,
        ]);

        return response()->json($type);
    }

    public function removeType(Request $request, string $id)
    {
        $type = LeaveType::where('organization_id', $request->user()->organization_id)->findOrFail($id);
        $type->delete();

        return response()->json(['success' => true]);
    }

    public function allocateBalance(Request $request)
    {
        $organizationId = $request->user()->organization_id;
        $data = $request->validate([
            'employeeId' => ['required', 'string'],
            'leaveTypeId' => ['required', 'string'],
            'year' => ['required', 'integer'],
            'allocated' => ['required', 'numeric', 'min:0'],
        ]);

        Employee::where('organization_id', $organizationId)->findOrFail($data['employeeId']);
        LeaveType::where('organization_id', $organizationId)->findOrFail($data['leaveTypeId']);

        $balance = LeaveBalance::updateOrCreate(
            ['employee_id' => $data['employeeId'], 'leave_type_id' => $data['leaveTypeId'], 'year' => $data['year']],
            ['allocated' => $data['allocated']],
        );

        return response()->json($balance);
    }

    public function myBalances(Request $request)
    {
        $employee = $this->myEmployee($request);
        $year = (int) date('Y');

        return LeaveBalance::with('leaveType')
            ->where('employee_id', $employee->id)
            ->where('year', $year)
            ->get();
    }

    public function employeeBalances(Request $request, string $employeeId)
    {
        $organizationId = $request->user()->organization_id;
        Employee::where('organization_id', $organizationId)->findOrFail($employeeId);
        $year = (int) date('Y');

        return LeaveBalance::with('leaveType')
            ->where('employee_id', $employeeId)
            ->where('year', $year)
            ->get();
    }

    public function apply(Request $request)
    {
        $employee = $this->myEmployee($request);

        $data = $request->validate([
            'leaveTypeId' => ['required', 'string'],
            'startDate' => ['required', 'date'],
            'endDate' => ['required', 'date'],
            'reason' => ['sometimes', 'nullable', 'string'],
        ]);

        $startDate = Carbon::parse($data['startDate'])->startOfDay();
        $endDate = Carbon::parse($data['endDate'])->startOfDay();
        if ($endDate->lt($startDate)) {
            throw ValidationException::withMessages(['endDate' => 'End date must be after start date'])->status(400);
        }

        $days = $startDate->diffInDays($endDate) + 1;
        $year = $startDate->year;

        $balance = LeaveBalance::where('employee_id', $employee->id)
            ->where('leave_type_id', $data['leaveTypeId'])
            ->where('year', $year)
            ->first();

        if ($balance && ($balance->allocated - $balance->used) < $days) {
            throw ValidationException::withMessages(['leaveTypeId' => 'Insufficient leave balance'])->status(400);
        }

        $leaveRequest = LeaveRequest::create([
            'organization_id' => $employee->organization_id,
            'employee_id' => $employee->id,
            'leave_type_id' => $data['leaveTypeId'],
            'start_date' => $startDate,
            'end_date' => $endDate,
            'days' => $days,
            'reason' => $data['reason'] ?? null,
        ]);
        $leaveRequest->load('leaveType');

        $approverIds = [];
        if ($employee->manager_id) {
            $manager = Employee::find($employee->manager_id);
            if ($manager?->user_id) {
                $approverIds[$manager->user_id] = true;
            }
        }
        $admins = User::where('organization_id', $employee->organization_id)
            ->whereIn('role', ['ORG_ADMIN', 'HR_MANAGER'])
            ->get();
        foreach ($admins as $admin) {
            $approverIds[$admin->id] = true;
        }

        $plural = $days > 1 ? 's' : '';
        foreach (array_keys($approverIds) as $uid) {
            Notifier::send(
                $employee->organization_id,
                $uid,
                'LEAVE_REQUESTED',
                "{$employee->full_name} applied for {$leaveRequest->leaveType->name} ({$days} day{$plural})",
            );
        }

        return response()->json($leaveRequest, 201);
    }

    public function myRequests(Request $request)
    {
        $employee = $this->myEmployee($request);

        return LeaveRequest::with('leaveType')
            ->where('employee_id', $employee->id)
            ->orderByDesc('created_at')
            ->get();
    }

    public function cancel(Request $request, string $id)
    {
        $employee = $this->myEmployee($request);
        $leaveRequest = LeaveRequest::where('employee_id', $employee->id)->findOrFail($id);

        if ($leaveRequest->status !== 'PENDING') {
            throw ValidationException::withMessages(['status' => 'Only pending requests can be cancelled'])->status(400);
        }

        $leaveRequest->update(['status' => 'CANCELLED']);

        return response()->json($leaveRequest);
    }

    public function listRequests(Request $request)
    {
        $query = LeaveRequest::with(['leaveType', 'employee:id,full_name,employee_code'])
            ->where('organization_id', $request->user()->organization_id);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        return $query->orderByDesc('created_at')->get();
    }

    public function review(Request $request, string $id)
    {
        $leaveRequest = LeaveRequest::with('employee')
            ->where('organization_id', $request->user()->organization_id)
            ->findOrFail($id);

        if ($leaveRequest->status !== 'PENDING') {
            throw ValidationException::withMessages(['status' => 'Already reviewed'])->status(400);
        }

        $data = $request->validate([
            'status' => ['required', Rule::in(['APPROVED', 'REJECTED'])],
            'reviewNote' => ['sometimes', 'nullable', 'string'],
        ]);

        $leaveRequest->update([
            'status' => $data['status'],
            'review_note' => $data['reviewNote'] ?? null,
        ]);

        if ($data['status'] === 'APPROVED') {
            $year = $leaveRequest->start_date->year;
            $existing = LeaveBalance::where('employee_id', $leaveRequest->employee_id)
                ->where('leave_type_id', $leaveRequest->leave_type_id)
                ->where('year', $year)
                ->first();

            if ($existing) {
                $existing->update(['used' => $existing->used + $leaveRequest->days]);
            } else {
                LeaveBalance::create([
                    'employee_id' => $leaveRequest->employee_id,
                    'leave_type_id' => $leaveRequest->leave_type_id,
                    'year' => $year,
                    'allocated' => 0,
                    'used' => $leaveRequest->days,
                ]);
            }
        }

        if ($leaveRequest->employee->user_id) {
            $plural = $leaveRequest->days > 1 ? 's' : '';
            Notifier::send(
                $leaveRequest->organization_id,
                $leaveRequest->employee->user_id,
                'LEAVE_REVIEWED',
                "Your leave request ({$leaveRequest->days} day{$plural}) was ".strtolower($data['status']),
            );
        }

        return response()->json($leaveRequest);
    }
}
