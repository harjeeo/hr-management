<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Holiday extends Model
{
    use CamelCasesAttributes, HasFactory, HasUuids;

    protected $fillable = ['organization_id', 'name', 'date', 'type', 'branch_id'];

    protected $casts = [
        'date' => 'date',
    ];

    protected $attributes = [
        'type' => 'PUBLIC',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
