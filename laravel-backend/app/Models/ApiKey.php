<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApiKey extends Model
{
    use CamelCasesAttributes, HasFactory, HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'organization_id',
        'name',
        'key_prefix',
        'key_hash',
        'last_used_at',
        'revoked_at',
        'created_at',
    ];

    protected $hidden = ['key_hash'];

    protected $casts = [
        'last_used_at' => 'datetime',
        'revoked_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
