<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class DepartmentController extends Controller
{
    public function index(Request $request)
    {
        return Department::where('organization_id', $request->user()->organization_id)
            ->orderBy('name')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2'],
        ]);

        $orgId = $request->user()->organization_id;

        if (Department::where('organization_id', $orgId)->where('name', $data['name'])->exists()) {
            throw ValidationException::withMessages(['name' => 'Department already exists'])->status(409);
        }

        $department = Department::create([...$data, 'organization_id' => $orgId]);

        return response()->json($department, 201);
    }

    public function update(Request $request, string $id)
    {
        $department = Department::where('organization_id', $request->user()->organization_id)
            ->findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'min:2'],
        ]);

        $department->update($data);

        return response()->json($department);
    }

    public function destroy(Request $request, string $id)
    {
        $department = Department::where('organization_id', $request->user()->organization_id)
            ->findOrFail($id);

        $department->delete();

        return response()->json(['success' => true]);
    }
}
