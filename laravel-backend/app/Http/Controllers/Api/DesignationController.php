<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Designation;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class DesignationController extends Controller
{
    public function index(Request $request)
    {
        return Designation::where('organization_id', $request->user()->organization_id)
            ->orderBy('title')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'min:2'],
        ]);

        $orgId = $request->user()->organization_id;

        if (Designation::where('organization_id', $orgId)->where('title', $data['title'])->exists()) {
            throw ValidationException::withMessages(['title' => 'Designation already exists'])->status(409);
        }

        $designation = Designation::create([...$data, 'organization_id' => $orgId]);

        return response()->json($designation, 201);
    }

    public function update(Request $request, string $id)
    {
        $designation = Designation::where('organization_id', $request->user()->organization_id)
            ->findOrFail($id);

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'min:2'],
        ]);

        $designation->update($data);

        return response()->json($designation);
    }

    public function destroy(Request $request, string $id)
    {
        $designation = Designation::where('organization_id', $request->user()->organization_id)
            ->findOrFail($id);

        $designation->delete();

        return response()->json(['success' => true]);
    }
}
