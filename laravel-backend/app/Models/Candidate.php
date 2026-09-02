<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Candidate extends Model
{
    use CamelCasesAttributes, HasFactory, HasUuids;

    protected $fillable = [
        'organization_id',
        'job_opening_id',
        'full_name',
        'email',
        'phone',
        'resume_url',
        'stage',
        'notes',
    ];

    protected $attributes = [
        'stage' => 'APPLIED',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function jobOpening(): BelongsTo
    {
        return $this->belongsTo(JobOpening::class);
    }
}
