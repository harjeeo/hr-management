<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\PayrollRun;
use App\Models\Payslip;
use App\Models\SalaryStructure;
use App\Support\Notifier;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PayrollController extends Controller
{
    public function getSalaryStructure(Request $request, string $employeeId)
    {
        Employee::where('id', $employeeId)
            ->where('organization_id', $request->user()->organization_id)
            ->firstOrFail();

        return response()->json(
            SalaryStructure::where('employee_id', $employeeId)->first()
        );
    }

    public function upsertSalaryStructure(Request $request, string $employeeId)
    {
        $organizationId = $request->user()->organization_id;
        Employee::where('id', $employeeId)->where('organization_id', $organizationId)->firstOrFail();

        $data = $request->validate([
            'basic' => ['required', 'numeric', 'min:0'],
            'hra' => ['sometimes', 'numeric', 'min:0'],
            'conveyance' => ['sometimes', 'numeric', 'min:0'],
            'specialAllowance' => ['sometimes', 'numeric', 'min:0'],
            'otherAllowance' => ['sometimes', 'numeric', 'min:0'],
            'providentFund' => ['sometimes', 'numeric', 'min:0'],
            'professionalTax' => ['sometimes', 'numeric', 'min:0'],
            'otherDeductions' => ['sometimes', 'numeric', 'min:0'],
        ]);

        $structure = SalaryStructure::updateOrCreate(
            ['employee_id' => $employeeId],
            [
                'organization_id' => $organizationId,
                'basic' => $data['basic'],
                'hra' => $data['hra'] ?? 0,
                'conveyance' => $data['conveyance'] ?? 0,
                'special_allowance' => $data['specialAllowance'] ?? 0,
                'other_allowance' => $data['otherAllowance'] ?? 0,
                'provident_fund' => $data['providentFund'] ?? 0,
                'professional_tax' => $data['professionalTax'] ?? 0,
                'other_deductions' => $data['otherDeductions'] ?? 0,
            ],
        );

        return response()->json($structure);
    }

    public function listRuns(Request $request)
    {
        return PayrollRun::where('organization_id', $request->user()->organization_id)
            ->orderByDesc('year')
            ->orderByDesc('month')
            ->get();
    }

    private function runDetail(string $organizationId, string $id): PayrollRun
    {
        $run = PayrollRun::with('payslips.employee:id,full_name,employee_code')
            ->where('organization_id', $organizationId)
            ->find($id);

        abort_if(! $run, 404, 'Payroll run not found');

        $run->setRelation('payslips', $run->payslips->sortBy('employee.full_name')->values());

        return $run;
    }

    public function runDetailAction(Request $request, string $id)
    {
        return response()->json($this->runDetail($request->user()->organization_id, $id));
    }

    public function process(Request $request)
    {
        $organizationId = $request->user()->organization_id;
        $data = $request->validate([
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'year' => ['required', 'integer', 'min:2000'],
        ]);

        $existing = PayrollRun::where('organization_id', $organizationId)
            ->where('month', $data['month'])
            ->where('year', $data['year'])
            ->first();
        if ($existing) {
            throw ValidationException::withMessages(['month' => 'Payroll already processed for this month'])->status(409);
        }

        $employees = Employee::with('salaryStructure')
            ->where('organization_id', $organizationId)
            ->whereIn('employment_status', ['ACTIVE', 'ON_LEAVE', 'PROBATION'])
            ->get();
        $withStructure = $employees->filter(fn ($e) => $e->salaryStructure !== null);

        if ($withStructure->isEmpty()) {
            throw ValidationException::withMessages(['month' => 'No employees have a salary structure configured'])->status(400);
        }

        $run = PayrollRun::create([
            'organization_id' => $organizationId,
            'month' => $data['month'],
            'year' => $data['year'],
            'status' => 'PROCESSED',
            'processed_at' => now(),
        ]);

        foreach ($withStructure as $employee) {
            $s = $employee->salaryStructure;
            $grossSalary = $s->basic + $s->hra + $s->conveyance + $s->special_allowance + $s->other_allowance;
            $totalDeductions = $s->provident_fund + $s->professional_tax + $s->other_deductions;

            Payslip::create([
                'organization_id' => $organizationId,
                'payroll_run_id' => $run->id,
                'employee_id' => $employee->id,
                'basic' => $s->basic,
                'hra' => $s->hra,
                'conveyance' => $s->conveyance,
                'special_allowance' => $s->special_allowance,
                'other_allowance' => $s->other_allowance,
                'gross_salary' => $grossSalary,
                'provident_fund' => $s->provident_fund,
                'professional_tax' => $s->professional_tax,
                'other_deductions' => $s->other_deductions,
                'total_deductions' => $totalDeductions,
                'net_salary' => $grossSalary - $totalDeductions,
                'created_at' => now(),
            ]);

            if ($employee->user_id) {
                Notifier::send(
                    $organizationId,
                    $employee->user_id,
                    'PAYSLIP_GENERATED',
                    "Your payslip for {$data['month']}/{$data['year']} is ready",
                );
            }
        }

        return response()->json($this->runDetail($organizationId, $run->id), 201);
    }

    public function myPayslips(Request $request)
    {
        $employee = Employee::where('user_id', $request->user()->id)->first();
        abort_if(! $employee, 400, 'No employee profile linked to this account');

        return Payslip::with('payrollRun:id,month,year,status')
            ->where('employee_id', $employee->id)
            ->orderByDesc('created_at')
            ->get();
    }

    public function payslipDetail(Request $request, string $id)
    {
        $payslip = Payslip::with(['employee:id,full_name,employee_code,user_id', 'payrollRun'])
            ->where('organization_id', $request->user()->organization_id)
            ->find($id);
        abort_if(! $payslip, 404, 'Payslip not found');

        $isSelf = $payslip->employee->user_id === $request->user()->id;
        $isHr = in_array($request->user()->role, ['ORG_ADMIN', 'HR_MANAGER'], true);
        abort_if(! $isSelf && ! $isHr, 403, 'Not allowed to view this payslip');

        return response()->json($payslip);
    }
}
