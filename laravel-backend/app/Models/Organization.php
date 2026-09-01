<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Organization extends Model
{
    use CamelCasesAttributes, HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'slug',
        'logo_url',
        'industry',
        'company_size',
        'timezone',
        'currency',
        'working_days',
        'status',
    ];

    protected $casts = [
        'working_days' => 'array',
    ];

    protected $attributes = [
        'timezone' => 'Asia/Kolkata',
        'currency' => 'INR',
        'status' => 'TRIAL',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }

    public function departments(): HasMany
    {
        return $this->hasMany(Department::class);
    }

    public function designations(): HasMany
    {
        return $this->hasMany(Designation::class);
    }

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }
}
