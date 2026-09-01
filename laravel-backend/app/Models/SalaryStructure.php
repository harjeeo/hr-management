<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalaryStructure extends Model
{
    use CamelCasesAttributes, HasFactory, HasUuids;

    protected $fillable = [
        'organization_id',
        'employee_id',
        'basic',
        'hra',
        'conveyance',
        'special_allowance',
        'other_allowance',
        'provident_fund',
        'professional_tax',
        'other_deductions',
    ];

    protected $attributes = [
        'basic' => 0,
        'hra' => 0,
        'conveyance' => 0,
        'special_allowance' => 0,
        'other_allowance' => 0,
        'provident_fund' => 0,
        'professional_tax' => 0,
        'other_deductions' => 0,
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
