<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Document extends Model
{
    use CamelCasesAttributes, HasFactory, HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'organization_id',
        'employee_id',
        'category',
        'file_name',
        'file_url',
        'mime_type',
        'file_size',
        'expiry_date',
        'uploaded_by_id',
        'created_at',
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'created_at' => 'datetime',
    ];

    protected $attributes = [
        'category' => 'OTHER',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
