<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_runs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->integer('month');
            $table->integer('year');
            $table->enum('status', ['DRAFT', 'PROCESSED', 'PAID'])->default('DRAFT');
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->unique(['organization_id', 'month', 'year']);
            $table->index('organization_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_runs');
    }
};
