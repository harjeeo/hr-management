<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceCorrection extends Model
{
    use CamelCasesAttributes, HasFactory, HasUuids;

    protected $fillable = [
        'organization_id',
        'employee_id',
        'attendance_id',
        'date',
        'requested_check_in',
        'requested_check_out',
        'reason',
        'status',
        'reviewed_by_id',
        'review_note',
    ];

    protected $casts = [
        'date' => 'date',
        'requested_check_in' => 'datetime',
        'requested_check_out' => 'datetime',
    ];

    protected $attributes = [
        'status' => 'PENDING',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function attendance(): BelongsTo
    {
        return $this->belongsTo(Attendance::class);
    }
}
