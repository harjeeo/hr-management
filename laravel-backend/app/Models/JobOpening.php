<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JobOpening extends Model
{
    use CamelCasesAttributes, HasFactory, HasUuids;

    protected $fillable = [
        'organization_id',
        'title',
        'department_id',
        'designation_id',
        'location',
        'employment_type',
        'salary_min',
        'salary_max',
        'description',
        'status',
    ];

    protected $attributes = [
        'employment_type' => 'FULL_TIME',
        'status' => 'OPEN',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function designation(): BelongsTo
    {
        return $this->belongsTo(Designation::class);
    }

    public function candidates(): HasMany
    {
        return $this->hasMany(Candidate::class);
    }
}
