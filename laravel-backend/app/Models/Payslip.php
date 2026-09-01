<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payslip extends Model
{
    use CamelCasesAttributes, HasFactory, HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'organization_id',
        'payroll_run_id',
        'employee_id',
        'basic',
        'hra',
        'conveyance',
        'special_allowance',
        'other_allowance',
        'gross_salary',
        'provident_fund',
        'professional_tax',
        'other_deductions',
        'total_deductions',
        'net_salary',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function payrollRun(): BelongsTo
    {
        return $this->belongsTo(PayrollRun::class);
    }
}
