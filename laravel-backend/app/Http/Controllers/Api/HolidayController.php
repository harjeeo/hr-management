<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Holiday;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class HolidayController extends Controller
{
    private const TYPES = ['PUBLIC', 'FESTIVAL', 'COMPANY', 'OPTIONAL'];

    public function index(Request $request)
    {
        return Holiday::where('organization_id', $request->user()->organization_id)
            ->orderBy('date')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2'],
            'date' => ['required', 'date'],
            'type' => ['sometimes', Rule::in(self::TYPES)],
            'branchId' => ['sometimes', 'nullable', 'string'],
        ]);

        $holiday = Holiday::create([
            'organization_id' => $request->user()->organization_id,
            'name' => $data['name'],
            'date' => $data['date'],
            'type' => $data['type'] ?? 'PUBLIC',
            'branch_id' => $data['branchId'] ?? null,
        ]);

        return response()->json($holiday, 201);
    }

    public function update(Request $request, string $id)
    {
        $holiday = Holiday::where('organization_id', $request->user()->organization_id)->findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'min:2'],
            'date' => ['sometimes', 'date'],
            'type' => ['sometimes', Rule::in(self::TYPES)],
            'branchId' => ['sometimes', 'nullable', 'string'],
        ]);

        $holiday->update([
            'name' => $data['name'] ?? $holiday->name,
            'date' => $data['date'] ?? $holiday->date,
            'type' => $data['type'] ?? $holiday->type,
            'branch_id' => array_key_exists('branchId', $data) ? $data['branchId'] : $holiday->branch_id,
        ]);

        return response()->json($holiday);
    }

    public function destroy(Request $request, string $id)
    {
        $holiday = Holiday::where('organization_id', $request->user()->organization_id)->findOrFail($id);
        $holiday->delete();

        return response()->json(['success' => true]);
    }
}
