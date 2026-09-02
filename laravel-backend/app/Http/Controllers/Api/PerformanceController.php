<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Goal;
use App\Models\PerformanceCycle;
use App\Models\PerformanceReview;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PerformanceController extends Controller
{
    private function myEmployee(Request $request): Employee
    {
        $employee = Employee::where('user_id', $request->user()->id)->first();
        abort_if(! $employee, 400, 'No employee profile linked to this account');

        return $employee;
    }

    // Cycles
    public function listCycles(Request $request)
    {
        return PerformanceCycle::where('organization_id', $request->user()->organization_id)
            ->orderByDesc('start_date')
            ->get();
    }

    public function createCycle(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2'],
            'startDate' => ['required', 'date'],
            'endDate' => ['required', 'date'],
        ]);

        $cycle = PerformanceCycle::create([
            'organization_id' => $request->user()->organization_id,
            'name' => $data['name'],
            'start_date' => $data['startDate'],
            'end_date' => $data['endDate'],
            'created_at' => now(),
        ]);

        return response()->json($cycle, 201);
    }

    public function updateCycle(Request $request, string $id)
    {
        $cycle = PerformanceCycle::where('organization_id', $request->user()->organization_id)->find($id);
        abort_if(! $cycle, 404, 'Performance cycle not found');

        $data = $request->validate(['status' => ['sometimes', Rule::in(['ACTIVE', 'CLOSED'])]]);

        $cycle->update(['status' => $data['status'] ?? $cycle->status]);

        return response()->json($cycle);
    }

    // Goals
    public function listGoals(Request $request, string $cycleId)
    {
        $cycle = PerformanceCycle::where('id', $cycleId)
            ->where('organization_id', $request->user()->organization_id)
            ->first();
        abort_if(! $cycle, 404, 'Performance cycle not found');

        $query = Goal::with('employee:id,full_name,employee_code')->where('cycle_id', $cycleId);
        if ($employeeId = $request->query('employeeId')) {
            $query->where('employee_id', $employeeId);
        }

        return $query->orderByDesc('created_at')->get();
    }

    public function myGoals(Request $request, string $cycleId)
    {
        $employee = $this->myEmployee($request);

        return Goal::where('cycle_id', $cycleId)
            ->where('employee_id', $employee->id)
            ->orderByDesc('created_at')
            ->get();
    }

    public function createGoal(Request $request, string $cycleId)
    {
        $organizationId = $request->user()->organization_id;
        $cycle = PerformanceCycle::where('id', $cycleId)->where('organization_id', $organizationId)->first();
        abort_if(! $cycle, 404, 'Performance cycle not found');

        $data = $request->validate([
            'employeeId' => ['required', 'string'],
            'title' => ['required', 'string', 'min:2'],
            'description' => ['sometimes', 'nullable', 'string'],
        ]);

        $employee = Employee::where('id', $data['employeeId'])->where('organization_id', $organizationId)->first();
        abort_if(! $employee, 404, 'Employee not found');

        $goal = Goal::create([
            'cycle_id' => $cycleId,
            'employee_id' => $data['employeeId'],
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
        ]);

        return response()->json($goal, 201);
    }

    public function updateGoal(Request $request, string $id)
    {
        $goal = Goal::whereHas('cycle', function ($q) use ($request) {
            $q->where('organization_id', $request->user()->organization_id);
        })->find($id);
        abort_if(! $goal, 404, 'Goal not found');

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'min:2'],
            'description' => ['sometimes', 'nullable', 'string'],
            'status' => ['sometimes', Rule::in(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'])],
        ]);

        $goal->fill([
            'title' => $data['title'] ?? $goal->title,
            'description' => array_key_exists('description', $data) ? $data['description'] : $goal->description,
            'status' => $data['status'] ?? $goal->status,
        ])->save();

        return response()->json($goal);
    }

    public function removeGoal(Request $request, string $id)
    {
        $goal = Goal::whereHas('cycle', function ($q) use ($request) {
            $q->where('organization_id', $request->user()->organization_id);
        })->find($id);
        abort_if(! $goal, 404, 'Goal not found');
        $goal->delete();

        return response()->json(['success' => true]);
    }

    // Reviews
    public function listReviews(Request $request, string $cycleId)
    {
        $cycle = PerformanceCycle::where('id', $cycleId)
            ->where('organization_id', $request->user()->organization_id)
            ->first();
        abort_if(! $cycle, 404, 'Performance cycle not found');

        return PerformanceReview::with(['employee:id,full_name,employee_code', 'manager:id,full_name'])
            ->where('cycle_id', $cycleId)
            ->orderByDesc('created_at')
            ->get();
    }

    public function myReview(Request $request, string $cycleId)
    {
        $employee = $this->myEmployee($request);

        return response()->json(
            PerformanceReview::where('cycle_id', $cycleId)->where('employee_id', $employee->id)->first()
        );
    }

    public function submitSelfReview(Request $request, string $cycleId)
    {
        $employee = $this->myEmployee($request);
        $cycle = PerformanceCycle::find($cycleId);
        abort_if(! $cycle, 404, 'Performance cycle not found');

        $data = $request->validate([
            'selfRating' => ['required', 'integer', 'min:1', 'max:5'],
            'selfFeedback' => ['sometimes', 'nullable', 'string'],
        ]);

        $review = PerformanceReview::updateOrCreate(
            ['cycle_id' => $cycleId, 'employee_id' => $employee->id],
            [
                'manager_id' => $employee->manager_id,
                'self_rating' => $data['selfRating'],
                'self_feedback' => $data['selfFeedback'] ?? null,
            ],
        );

        return response()->json($review);
    }

    public function submitManagerReview(Request $request, string $cycleId, string $employeeId)
    {
        $organizationId = $request->user()->organization_id;
        $cycle = PerformanceCycle::where('id', $cycleId)->where('organization_id', $organizationId)->first();
        abort_if(! $cycle, 404, 'Performance cycle not found');

        $employee = Employee::where('id', $employeeId)->where('organization_id', $organizationId)->first();
        abort_if(! $employee, 404, 'Employee not found');

        $data = $request->validate([
            'managerRating' => ['required', 'integer', 'min:1', 'max:5'],
            'managerFeedback' => ['sometimes', 'nullable', 'string'],
            'finalRating' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:5'],
        ]);

        $review = PerformanceReview::updateOrCreate(
            ['cycle_id' => $cycleId, 'employee_id' => $employeeId],
            [
                'manager_id' => $employee->manager_id,
                'manager_rating' => $data['managerRating'],
                'manager_feedback' => $data['managerFeedback'] ?? null,
                'final_rating' => $data['finalRating'] ?? null,
            ],
        );

        return response()->json($review);
    }
}
