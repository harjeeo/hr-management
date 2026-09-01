<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\PayrollRun;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ReportsController extends Controller
{
    private function respond(array $rows, string $filename, ?string $format)
    {
        if ($format === 'csv') {
            return response(self::toCsv($rows), 200, [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            ]);
        }

        return response()->json($rows);
    }

    private static function toCsv(array $rows): string
    {
        if (count($rows) === 0) {
            return '';
        }

        $headers = array_keys($rows[0]);
        $escape = function ($value) {
            $str = $value === null ? '' : (string) $value;

            return preg_match('/["\,\n]/', $str) ? '"'.str_replace('"', '""', $str).'"' : $str;
        };

        $lines = [implode(',', $headers)];
        foreach ($rows as $row) {
            $lines[] = implode(',', array_map(fn ($h) => $escape($row[$h] ?? null), $headers));
        }

        return implode("\n", $lines);
    }

    private function dateRange(?string $from, ?string $to): array
    {
        $fromDate = $from ? Carbon::parse($from)->startOfDay() : Carbon::now()->startOfMonth()->startOfDay();
        $toDate = $to ? Carbon::parse($to)->endOfDay() : Carbon::now()->endOfDay();

        return [$fromDate, $toDate];
    }

    public function employees(Request $request)
    {
        $employees = Employee::with(['branch', 'department', 'designation', 'manager:id,full_name'])
            ->where('organization_id', $request->user()->organization_id)
            ->orderBy('full_name')
            ->get();

        $rows = $employees->map(fn (Employee $e) => [
            'employeeCode' => $e->employee_code,
            'fullName' => $e->full_name,
            'email' => $e->email,
            'branch' => $e->branch->name ?? '',
            'department' => $e->department->name ?? '',
            'designation' => $e->designation->title ?? '',
            'manager' => $e->manager->full_name ?? '',
            'employmentType' => $e->employment_type,
            'employmentStatus' => $e->employment_status,
            'joiningDate' => $e->joining_date ? $e->joining_date->format('Y-m-d') : '',
        ])->all();

        return $this->respond($rows, 'employees.csv', $request->query('format'));
    }

    public function attendance(Request $request)
    {
        [$fromDate, $toDate] = $this->dateRange($request->query('from'), $request->query('to'));

        $records = Attendance::with('employee:id,full_name,employee_code')
            ->where('organization_id', $request->user()->organization_id)
            ->whereBetween('date', [$fromDate, $toDate])
            ->orderBy('date')
            ->get();

        $rows = $records->map(fn (Attendance $r) => [
            'date' => $r->date->format('Y-m-d'),
            'employeeCode' => $r->employee->employee_code,
            'fullName' => $r->employee->full_name,
            'status' => $r->status,
            'checkIn' => $r->check_in ? $r->check_in->toIso8601String() : '',
            'checkOut' => $r->check_out ? $r->check_out->toIso8601String() : '',
        ])->all();

        return $this->respond($rows, 'attendance.csv', $request->query('format'));
    }

    public function leave(Request $request)
    {
        [$fromDate, $toDate] = $this->dateRange($request->query('from'), $request->query('to'));

        $records = LeaveRequest::with(['employee:id,full_name,employee_code', 'leaveType'])
            ->where('organization_id', $request->user()->organization_id)
            ->whereBetween('start_date', [$fromDate, $toDate])
            ->orderBy('start_date')
            ->get();

        $rows = $records->map(fn (LeaveRequest $r) => [
            'employeeCode' => $r->employee->employee_code,
            'fullName' => $r->employee->full_name,
            'leaveType' => $r->leaveType->name,
            'startDate' => $r->start_date->format('Y-m-d'),
            'endDate' => $r->end_date->format('Y-m-d'),
            'days' => $r->days,
            'status' => $r->status,
        ])->all();

        return $this->respond($rows, 'leave.csv', $request->query('format'));
    }

    public function payroll(Request $request)
    {
        $month = $request->query('month') ? (int) $request->query('month') : (int) now()->format('n');
        $year = $request->query('year') ? (int) $request->query('year') : (int) now()->format('Y');

        $run = PayrollRun::with('payslips.employee:id,full_name,employee_code')
            ->where('organization_id', $request->user()->organization_id)
            ->where('month', $month)
            ->where('year', $year)
            ->first();

        $rows = $run
            ? $run->payslips->map(fn ($p) => [
                'employeeCode' => $p->employee->employee_code,
                'fullName' => $p->employee->full_name,
                'grossSalary' => $p->gross_salary,
                'totalDeductions' => $p->total_deductions,
                'netSalary' => $p->net_salary,
            ])->all()
            : [];

        return $this->respond($rows, 'payroll.csv', $request->query('format'));
    }
}
