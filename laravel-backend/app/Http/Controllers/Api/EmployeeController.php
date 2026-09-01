<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class EmployeeController extends Controller
{
    private const WITH = ['branch', 'department', 'designation', 'manager:id,full_name'];

    public function index(Request $request)
    {
        $query = Employee::with(self::WITH)
            ->where('organization_id', $request->user()->organization_id);

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('employee_code', 'like', "%{$search}%");
            });
        }

        return $query->orderByDesc('created_at')->get();
    }

    public function mine(Request $request)
    {
        $employee = Employee::with(self::WITH)
            ->where('user_id', $request->user()->id)
            ->first();

        abort_if(! $employee, 404, 'No employee profile linked to this account');

        return response()->json($employee);
    }

    public function show(Request $request, string $id)
    {
        $employee = Employee::with(self::WITH)
            ->where('organization_id', $request->user()->organization_id)
            ->findOrFail($id);

        return response()->json($employee);
    }

    private function rules(bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';

        return [
            'employeeCode' => [$req, 'string'],
            'fullName' => [$req, 'string', 'min:2'],
            'email' => [$req, 'email'],
            'phone' => ['sometimes', 'nullable', 'string'],
            'dateOfBirth' => ['sometimes', 'nullable', 'date'],
            'gender' => ['sometimes', 'nullable', 'string'],
            'address' => ['sometimes', 'nullable', 'string'],
            'emergencyContact' => ['sometimes', 'nullable', 'string'],
            'branchId' => ['sometimes', 'nullable', 'string'],
            'departmentId' => ['sometimes', 'nullable', 'string'],
            'designationId' => ['sometimes', 'nullable', 'string'],
            'managerId' => ['sometimes', 'nullable', 'string'],
            'joiningDate' => ['sometimes', 'nullable', 'date'],
            'employmentType' => ['sometimes', 'in:FULL_TIME,PART_TIME,CONTRACT,INTERN'],
            'employmentStatus' => ['sometimes', 'in:ACTIVE,ON_LEAVE,PROBATION,RESIGNED,TERMINATED,RETIRED'],
            'workLocation' => ['sometimes', 'nullable', 'string'],
        ];
    }

    private function mapPayload(array $data): array
    {
        $map = [
            'employeeCode' => 'employee_code',
            'fullName' => 'full_name',
            'dateOfBirth' => 'date_of_birth',
            'emergencyContact' => 'emergency_contact',
            'branchId' => 'branch_id',
            'departmentId' => 'department_id',
            'designationId' => 'designation_id',
            'managerId' => 'manager_id',
            'joiningDate' => 'joining_date',
            'employmentType' => 'employment_type',
            'employmentStatus' => 'employment_status',
            'workLocation' => 'work_location',
        ];

        $mapped = [];
        foreach ($data as $key => $value) {
            $mapped[$map[$key] ?? $key] = $value;
        }

        return $mapped;
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->rules());
        $orgId = $request->user()->organization_id;

        if (Employee::where('organization_id', $orgId)->where('employee_code', $data['employeeCode'])->exists()) {
            throw ValidationException::withMessages(['employeeCode' => 'Employee code already in use'])->status(409);
        }

        $employee = Employee::create([
            ...$this->mapPayload($data),
            'organization_id' => $orgId,
        ]);

        return response()->json($employee->load(self::WITH), 201);
    }

    public function update(Request $request, string $id)
    {
        $orgId = $request->user()->organization_id;
        $employee = Employee::where('organization_id', $orgId)->findOrFail($id);

        $data = $request->validate($this->rules(true));
        $employee->update($this->mapPayload($data));

        return response()->json($employee->load(self::WITH));
    }

    public function destroy(Request $request, string $id)
    {
        $employee = Employee::where('organization_id', $request->user()->organization_id)->findOrFail($id);
        $employee->delete();

        return response()->json(['success' => true]);
    }

    public function createLogin(Request $request, string $id)
    {
        $orgId = $request->user()->organization_id;
        $employee = Employee::where('organization_id', $orgId)->findOrFail($id);

        if ($employee->user_id) {
            throw ValidationException::withMessages(['employee' => 'Employee already has a login'])->status(409);
        }

        if (User::where('email', $employee->email)->exists()) {
            throw ValidationException::withMessages(['email' => 'A user with this email already exists'])->status(409);
        }

        $tempPassword = Str::random(10);

        $user = User::create([
            'email' => $employee->email,
            'password' => Hash::make($tempPassword),
            'name' => $employee->full_name,
            'role' => 'EMPLOYEE',
            'organization_id' => $orgId,
        ]);

        $employee->update(['user_id' => $user->id]);

        return response()->json(['email' => $user->email, 'tempPassword' => $tempPassword]);
    }
}
