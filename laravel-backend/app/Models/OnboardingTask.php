<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OnboardingTask extends Model
{
    use CamelCasesAttributes, HasFactory, HasUuids;

    public $timestamps = false;

    protected $fillable = ['employee_id', 'title', 'is_done', 'created_at'];

    protected $casts = [
        'is_done' => 'boolean',
        'created_at' => 'datetime',
    ];

    protected $attributes = [
        'is_done' => false,
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
