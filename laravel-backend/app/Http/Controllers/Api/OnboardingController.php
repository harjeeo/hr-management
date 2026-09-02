<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\OnboardingTask;
use Illuminate\Http\Request;

class OnboardingController extends Controller
{
    private function findEmployeeOwned(Request $request, string $employeeId): Employee
    {
        $employee = Employee::where('id', $employeeId)
            ->where('organization_id', $request->user()->organization_id)
            ->first();
        abort_if(! $employee, 404, 'Employee not found');

        return $employee;
    }

    public function list(Request $request, string $employeeId)
    {
        $this->findEmployeeOwned($request, $employeeId);

        return OnboardingTask::where('employee_id', $employeeId)->orderBy('created_at')->get();
    }

    public function addTask(Request $request, string $employeeId)
    {
        $this->findEmployeeOwned($request, $employeeId);

        $data = $request->validate(['title' => ['required', 'string', 'min:2']]);

        $task = OnboardingTask::create([
            'employee_id' => $employeeId,
            'title' => $data['title'],
            'created_at' => now(),
        ]);

        return response()->json($task, 201);
    }

    public function updateTask(Request $request, string $id)
    {
        $task = OnboardingTask::whereHas('employee', function ($q) use ($request) {
            $q->where('organization_id', $request->user()->organization_id);
        })->find($id);
        abort_if(! $task, 404, 'Onboarding task not found');

        $data = $request->validate(['isDone' => ['sometimes', 'boolean']]);

        $task->update(['is_done' => $data['isDone'] ?? $task->is_done]);

        return response()->json($task);
    }

    public function removeTask(Request $request, string $id)
    {
        $task = OnboardingTask::whereHas('employee', function ($q) use ($request) {
            $q->where('organization_id', $request->user()->organization_id);
        })->find($id);
        abort_if(! $task, 404, 'Onboarding task not found');

        $task->delete();

        return response()->json(['success' => true]);
    }
}
