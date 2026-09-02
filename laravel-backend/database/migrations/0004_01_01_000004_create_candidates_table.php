<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('candidates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUuid('job_opening_id')->constrained('job_openings')->cascadeOnDelete();
            $table->string('full_name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->string('resume_url')->nullable();
            $table->enum('stage', ['APPLIED', 'SCREENING', 'INTERVIEW', 'SHORTLISTED', 'SELECTED', 'REJECTED', 'HIRED'])->default('APPLIED');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'job_opening_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('candidates');
    }
};
