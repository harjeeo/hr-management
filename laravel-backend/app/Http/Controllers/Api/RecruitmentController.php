<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\Employee;
use App\Models\JobOpening;
use App\Models\OnboardingTask;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class RecruitmentController extends Controller
{
    private const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'];

    private const CANDIDATE_STAGES = ['APPLIED', 'SCREENING', 'INTERVIEW', 'SHORTLISTED', 'SELECTED', 'REJECTED', 'HIRED'];

    private const DEFAULT_ONBOARDING_TASKS = [
        'Collect personal documents',
        'Verify ID proof',
        'Verify address proof',
        'Collect education certificates',
        'Sign offer letter',
        'Sign employment agreement',
        'Accept company policies',
        'Assign IT assets',
        'Complete joining formalities',
    ];

    // Job openings
    public function listJobs(Request $request)
    {
        return JobOpening::with(['department', 'designation'])
            ->withCount('candidates')
            ->where('organization_id', $request->user()->organization_id)
            ->orderByDesc('created_at')
            ->get()
            ->map(function (JobOpening $job) {
                $data = $job->toArray();
                unset($data['candidatesCount']);
                $data['_count'] = ['candidates' => $job->candidates_count];

                return $data;
            });
    }

    public function createJob(Request $request)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'min:2'],
            'departmentId' => ['sometimes', 'nullable', 'string'],
            'designationId' => ['sometimes', 'nullable', 'string'],
            'location' => ['sometimes', 'nullable', 'string'],
            'employmentType' => ['sometimes', Rule::in(self::EMPLOYMENT_TYPES)],
            'salaryMin' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'salaryMax' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'description' => ['sometimes', 'nullable', 'string'],
        ]);

        $job = JobOpening::create([
            'organization_id' => $request->user()->organization_id,
            'title' => $data['title'],
            'department_id' => $data['departmentId'] ?? null,
            'designation_id' => $data['designationId'] ?? null,
            'location' => $data['location'] ?? null,
            'employment_type' => $data['employmentType'] ?? 'FULL_TIME',
            'salary_min' => $data['salaryMin'] ?? null,
            'salary_max' => $data['salaryMax'] ?? null,
            'description' => $data['description'] ?? null,
        ]);

        return response()->json($job, 201);
    }

    public function updateJob(Request $request, string $id)
    {
        $job = JobOpening::where('organization_id', $request->user()->organization_id)->find($id);
        abort_if(! $job, 404, 'Job opening not found');

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'min:2'],
            'departmentId' => ['sometimes', 'nullable', 'string'],
            'designationId' => ['sometimes', 'nullable', 'string'],
            'location' => ['sometimes', 'nullable', 'string'],
            'employmentType' => ['sometimes', Rule::in(self::EMPLOYMENT_TYPES)],
            'salaryMin' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'salaryMax' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'description' => ['sometimes', 'nullable', 'string'],
            'status' => ['sometimes', Rule::in(['OPEN', 'CLOSED'])],
        ]);

        $job->fill([
            'title' => $data['title'] ?? $job->title,
            'department_id' => array_key_exists('departmentId', $data) ? $data['departmentId'] : $job->department_id,
            'designation_id' => array_key_exists('designationId', $data) ? $data['designationId'] : $job->designation_id,
            'location' => array_key_exists('location', $data) ? $data['location'] : $job->location,
            'employment_type' => $data['employmentType'] ?? $job->employment_type,
            'salary_min' => array_key_exists('salaryMin', $data) ? $data['salaryMin'] : $job->salary_min,
            'salary_max' => array_key_exists('salaryMax', $data) ? $data['salaryMax'] : $job->salary_max,
            'description' => array_key_exists('description', $data) ? $data['description'] : $job->description,
            'status' => $data['status'] ?? $job->status,
        ])->save();

        return response()->json($job);
    }

    public function removeJob(Request $request, string $id)
    {
        $job = JobOpening::where('organization_id', $request->user()->organization_id)->find($id);
        abort_if(! $job, 404, 'Job opening not found');
        $job->delete();

        return response()->json(['success' => true]);
    }

    // Candidates
    public function listCandidates(Request $request)
    {
        $query = Candidate::with('jobOpening:id,title')
            ->where('organization_id', $request->user()->organization_id);

        if ($jobOpeningId = $request->query('jobOpeningId')) {
            $query->where('job_opening_id', $jobOpeningId);
        }

        return $query->orderByDesc('created_at')->get();
    }

    public function createCandidate(Request $request)
    {
        $organizationId = $request->user()->organization_id;
        $data = $request->validate([
            'jobOpeningId' => ['required', 'string'],
            'fullName' => ['required', 'string', 'min:2'],
            'email' => ['required', 'email'],
            'phone' => ['sometimes', 'nullable', 'string'],
            'notes' => ['sometimes', 'nullable', 'string'],
        ]);

        $job = JobOpening::where('id', $data['jobOpeningId'])->where('organization_id', $organizationId)->first();
        abort_if(! $job, 404, 'Job opening not found');

        $candidate = Candidate::create([
            'organization_id' => $organizationId,
            'job_opening_id' => $data['jobOpeningId'],
            'full_name' => $data['fullName'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);

        return response()->json($candidate, 201);
    }

    public function updateCandidate(Request $request, string $id)
    {
        $candidate = Candidate::where('organization_id', $request->user()->organization_id)->find($id);
        abort_if(! $candidate, 404, 'Candidate not found');

        $data = $request->validate([
            'fullName' => ['sometimes', 'string', 'min:2'],
            'email' => ['sometimes', 'email'],
            'phone' => ['sometimes', 'nullable', 'string'],
            'notes' => ['sometimes', 'nullable', 'string'],
            'stage' => ['sometimes', Rule::in(self::CANDIDATE_STAGES)],
        ]);

        $candidate->fill([
            'full_name' => $data['fullName'] ?? $candidate->full_name,
            'email' => $data['email'] ?? $candidate->email,
            'phone' => array_key_exists('phone', $data) ? $data['phone'] : $candidate->phone,
            'notes' => array_key_exists('notes', $data) ? $data['notes'] : $candidate->notes,
            'stage' => $data['stage'] ?? $candidate->stage,
        ])->save();

        return response()->json($candidate);
    }

    public function removeCandidate(Request $request, string $id)
    {
        $candidate = Candidate::where('organization_id', $request->user()->organization_id)->find($id);
        abort_if(! $candidate, 404, 'Candidate not found');
        $candidate->delete();

        return response()->json(['success' => true]);
    }

    public function uploadResume(Request $request, string $id)
    {
        $candidate = Candidate::where('organization_id', $request->user()->organization_id)->find($id);
        abort_if(! $candidate, 404, 'Candidate not found');

        $request->validate(['file' => ['required', 'file', 'max:10240']]);

        $file = $request->file('file');
        if ($file->getMimeType() !== 'application/pdf') {
            throw ValidationException::withMessages(['file' => 'Only PDF resumes are supported'])->status(400);
        }

        $filename = Str::uuid().'.'.$file->getClientOriginalExtension();
        $file->move(public_path('uploads'), $filename);

        $candidate->update(['resume_url' => "/uploads/{$filename}"]);

        return response()->json($candidate);
    }

    public function hire(Request $request, string $id)
    {
        $organizationId = $request->user()->organization_id;
        $data = $request->validate(['employeeCode' => ['required', 'string']]);

        $candidate = Candidate::where('organization_id', $organizationId)->find($id);
        abort_if(! $candidate, 404, 'Candidate not found');

        $job = JobOpening::find($candidate->job_opening_id);

        $exists = Employee::where('organization_id', $organizationId)
            ->where('employee_code', $data['employeeCode'])
            ->exists();
        if ($exists) {
            throw ValidationException::withMessages(['employeeCode' => 'Employee code already in use'])->status(409);
        }

        $employee = DB::transaction(function () use ($organizationId, $data, $candidate, $job, $id) {
            $emp = Employee::create([
                'organization_id' => $organizationId,
                'employee_code' => $data['employeeCode'],
                'full_name' => $candidate->full_name,
                'email' => $candidate->email,
                'phone' => $candidate->phone,
                'department_id' => $job?->department_id,
                'designation_id' => $job?->designation_id,
                'joining_date' => now(),
            ]);

            foreach (self::DEFAULT_ONBOARDING_TASKS as $title) {
                OnboardingTask::create(['employee_id' => $emp->id, 'title' => $title, 'created_at' => now()]);
            }

            $candidate->update(['stage' => 'HIRED']);

            return $emp;
        });

        return response()->json($employee);
    }
}
