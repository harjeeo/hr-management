<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice extends Model
{
    use CamelCasesAttributes, HasFactory, HasUuids;

    public $timestamps = false;

    protected $fillable = ['subscription_id', 'amount', 'status', 'issued_at', 'paid_at'];

    protected $casts = [
        'issued_at' => 'datetime',
        'paid_at' => 'datetime',
    ];

    protected $attributes = [
        'status' => 'PENDING',
    ];

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }
}
