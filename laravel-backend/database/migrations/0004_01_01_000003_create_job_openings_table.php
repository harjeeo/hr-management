<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_openings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('title');
            $table->foreignUuid('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->foreignUuid('designation_id')->nullable()->constrained('designations')->nullOnDelete();
            $table->string('location')->nullable();
            $table->enum('employment_type', ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'])->default('FULL_TIME');
            $table->float('salary_min')->nullable();
            $table->float('salary_max')->nullable();
            $table->text('description')->nullable();
            $table->enum('status', ['OPEN', 'CLOSED'])->default('OPEN');
            $table->timestamps();

            $table->index('organization_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_openings');
    }
};
