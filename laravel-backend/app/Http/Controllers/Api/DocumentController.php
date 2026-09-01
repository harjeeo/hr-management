<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class DocumentController extends Controller
{
    private const CATEGORIES = [
        'ID_PROOF', 'PAN', 'PASSPORT', 'DRIVING_LICENSE', 'EDUCATION_CERTIFICATE',
        'EXPERIENCE_LETTER', 'OFFER_LETTER', 'APPOINTMENT_LETTER', 'EMPLOYMENT_AGREEMENT',
        'SALARY_DOCUMENT', 'OTHER',
    ];

    private const ALLOWED_MIME = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

    private function assertAccess(Request $request, string $employeeId): Employee
    {
        $employee = Employee::where('id', $employeeId)
            ->where('organization_id', $request->user()->organization_id)
            ->first();
        abort_if(! $employee, 404, 'Employee not found');

        $isSelf = $employee->user_id === $request->user()->id;
        $isHr = in_array($request->user()->role, ['ORG_ADMIN', 'HR_MANAGER'], true);
        abort_if(! $isSelf && ! $isHr, 403, 'Not allowed to access these documents');

        return $employee;
    }

    public function index(Request $request)
    {
        $employeeId = $request->query('employeeId');
        abort_if(! $employeeId, 400, 'employeeId is required');
        $this->assertAccess($request, $employeeId);

        return Document::where('employee_id', $employeeId)->orderByDesc('created_at')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'employeeId' => ['required', 'string'],
            'category' => ['sometimes', Rule::in(self::CATEGORIES)],
            'expiryDate' => ['sometimes', 'nullable', 'date'],
            'file' => ['required', 'file', 'max:10240'],
        ]);

        $this->assertAccess($request, $data['employeeId']);

        $file = $request->file('file');
        $mimeType = $file->getMimeType();
        if (! in_array($mimeType, self::ALLOWED_MIME, true)) {
            throw ValidationException::withMessages(['file' => 'Unsupported file type'])->status(400);
        }

        $originalName = $file->getClientOriginalName();
        $fileSize = $file->getSize();
        $filename = Str::uuid().'.'.$file->getClientOriginalExtension();
        $file->move(public_path('uploads'), $filename);

        $document = Document::create([
            'organization_id' => $request->user()->organization_id,
            'employee_id' => $data['employeeId'],
            'category' => $data['category'] ?? 'OTHER',
            'file_name' => $originalName,
            'file_url' => "/uploads/{$filename}",
            'mime_type' => $mimeType,
            'file_size' => $fileSize,
            'expiry_date' => $data['expiryDate'] ?? null,
            'uploaded_by_id' => $request->user()->id,
            'created_at' => now(),
        ]);

        return response()->json($document, 201);
    }

    public function destroy(Request $request, string $id)
    {
        $document = Document::where('id', $id)
            ->where('organization_id', $request->user()->organization_id)
            ->first();
        abort_if(! $document, 404, 'Document not found');

        $this->assertAccess($request, $document->employee_id);

        $document->delete();

        $path = public_path('uploads/'.str_replace('/uploads/', '', $document->file_url));
        if (file_exists($path)) {
            @unlink($path);
        }

        return response()->json(['success' => true]);
    }
}
