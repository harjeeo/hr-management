<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organizations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('logo_url')->nullable();
            $table->string('industry')->nullable();
            $table->string('company_size')->nullable();
            $table->string('timezone')->default('Asia/Kolkata');
            $table->string('currency', 3)->default('INR');
            $table->json('working_days')->nullable();
            $table->enum('status', ['TRIAL', 'ACTIVE', 'SUSPENDED'])->default('TRIAL');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organizations');
    }
};
