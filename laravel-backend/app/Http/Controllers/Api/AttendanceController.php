<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\AttendanceCorrection;
use App\Models\Employee;
use App\Support\Notifier;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AttendanceController extends Controller
{
    private function myEmployee(Request $request): Employee
    {
        $employee = Employee::where('user_id', $request->user()->id)->first();
        abort_if(! $employee, 400, 'No employee profile linked to this account');

        return $employee;
    }

    public function checkIn(Request $request)
    {
        $employee = $this->myEmployee($request);
        $today = Carbon::today();

        $existing = Attendance::where('employee_id', $employee->id)->whereDate('date', $today)->first();
        if ($existing?->check_in) {
            throw ValidationException::withMessages(['checkIn' => 'Already checked in today'])->status(400);
        }

        $attendance = Attendance::updateOrCreate(
            ['employee_id' => $employee->id, 'date' => $today],
            ['organization_id' => $employee->organization_id, 'check_in' => now(), 'status' => 'PRESENT'],
        );

        return response()->json($attendance);
    }

    public function checkOut(Request $request)
    {
        $employee = $this->myEmployee($request);
        $today = Carbon::today();

        $existing = Attendance::where('employee_id', $employee->id)->whereDate('date', $today)->first();
        if (! $existing?->check_in) {
            throw ValidationException::withMessages(['checkOut' => 'You have not checked in today'])->status(400);
        }
        if ($existing->check_out) {
            throw ValidationException::withMessages(['checkOut' => 'Already checked out today'])->status(400);
        }

        $existing->update(['check_out' => now()]);

        return response()->json($existing);
    }

    public function myToday(Request $request)
    {
        $employee = $this->myEmployee($request);
        $attendance = Attendance::where('employee_id', $employee->id)
            ->whereDate('date', Carbon::today())
            ->first();

        return response()->json($attendance);
    }

    public function myHistory(Request $request)
    {
        $employee = $this->myEmployee($request);

        return Attendance::where('employee_id', $employee->id)
            ->orderByDesc('date')
            ->limit(60)
            ->get();
    }

    public function orgAttendance(Request $request)
    {
        $day = $request->query('date') ? Carbon::parse($request->query('date')) : Carbon::today();

        return Attendance::with('employee:id,full_name,employee_code')
            ->where('organization_id', $request->user()->organization_id)
            ->whereDate('date', $day)
            ->get()
            ->sortBy('employee.full_name')
            ->values();
    }

    public function requestCorrection(Request $request)
    {
        $employee = $this->myEmployee($request);

        $data = $request->validate([
            'date' => ['required', 'date'],
            'requestedCheckIn' => ['sometimes', 'nullable', 'date'],
            'requestedCheckOut' => ['sometimes', 'nullable', 'date'],
            'reason' => ['required', 'string'],
        ]);

        $date = Carbon::parse($data['date'])->startOfDay();
        $attendance = Attendance::where('employee_id', $employee->id)->whereDate('date', $date)->first();

        $correction = AttendanceCorrection::create([
            'organization_id' => $employee->organization_id,
            'employee_id' => $employee->id,
            'attendance_id' => $attendance?->id,
            'date' => $date,
            'requested_check_in' => $data['requestedCheckIn'] ?? null,
            'requested_check_out' => $data['requestedCheckOut'] ?? null,
            'reason' => $data['reason'],
        ]);

        $admins = \App\Models\User::where('organization_id', $employee->organization_id)
            ->whereIn('role', ['ORG_ADMIN', 'HR_MANAGER'])
            ->get();

        foreach ($admins as $admin) {
            Notifier::send(
                $employee->organization_id,
                $admin->id,
                'ATTENDANCE_CORRECTION_REQUESTED',
                "{$employee->full_name} requested an attendance correction for {$data['date']}",
            );
        }

        return response()->json($correction, 201);
    }

    public function listCorrections(Request $request)
    {
        $query = AttendanceCorrection::with('employee:id,full_name,employee_code')
            ->where('organization_id', $request->user()->organization_id);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        return $query->orderByDesc('created_at')->get();
    }

    public function reviewCorrection(Request $request, string $id)
    {
        $correction = AttendanceCorrection::with('employee')
            ->where('organization_id', $request->user()->organization_id)
            ->findOrFail($id);

        if ($correction->status !== 'PENDING') {
            abort(403, 'Already reviewed');
        }

        $data = $request->validate([
            'status' => ['required', Rule::in(['APPROVED', 'REJECTED'])],
            'reviewNote' => ['sometimes', 'nullable', 'string'],
        ]);

        $correction->update([
            'status' => $data['status'],
            'review_note' => $data['reviewNote'] ?? null,
            'reviewed_by_id' => $request->user()->id,
        ]);

        if ($data['status'] === 'APPROVED') {
            Attendance::updateOrCreate(
                ['employee_id' => $correction->employee_id, 'date' => $correction->date],
                [
                    'organization_id' => $correction->organization_id,
                    'check_in' => $correction->requested_check_in ?? null,
                    'check_out' => $correction->requested_check_out ?? null,
                    'status' => 'PRESENT',
                ],
            );
        }

        if ($correction->employee->user_id) {
            Notifier::send(
                $correction->organization_id,
                $correction->employee->user_id,
                'ATTENDANCE_CORRECTION_REVIEWED',
                "Your attendance correction for {$correction->date->toDateString()} was ".strtolower($data['status']),
            );
        }

        return response()->json($correction);
    }
}
