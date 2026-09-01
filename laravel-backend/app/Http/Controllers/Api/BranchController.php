<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\Request;

class BranchController extends Controller
{
    public function index(Request $request)
    {
        return Branch::where('organization_id', $request->user()->organization_id)
            ->orderBy('name')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2'],
            'address' => ['sometimes', 'nullable', 'string'],
            'city' => ['sometimes', 'nullable', 'string'],
        ]);

        $branch = Branch::create([
            ...$data,
            'organization_id' => $request->user()->organization_id,
        ]);

        return response()->json($branch, 201);
    }

    public function update(Request $request, string $id)
    {
        $branch = Branch::where('organization_id', $request->user()->organization_id)
            ->findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'min:2'],
            'address' => ['sometimes', 'nullable', 'string'],
            'city' => ['sometimes', 'nullable', 'string'],
        ]);

        $branch->update($data);

        return response()->json($branch);
    }

    public function destroy(Request $request, string $id)
    {
        $branch = Branch::where('organization_id', $request->user()->organization_id)
            ->findOrFail($id);

        $branch->delete();

        return response()->json(['success' => true]);
    }
}
