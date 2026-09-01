<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('employee_code');
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUuid('user_id')->nullable()->unique()->constrained('users')->nullOnDelete();

            $table->string('full_name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('gender')->nullable();
            $table->string('address')->nullable();
            $table->string('emergency_contact')->nullable();

            $table->foreignUuid('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignUuid('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->foreignUuid('designation_id')->nullable()->constrained('designations')->nullOnDelete();
            $table->foreignUuid('manager_id')->nullable()->constrained('employees')->nullOnDelete();

            $table->date('joining_date')->nullable();
            $table->enum('employment_type', ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'])->default('FULL_TIME');
            $table->enum('employment_status', ['ACTIVE', 'ON_LEAVE', 'PROBATION', 'RESIGNED', 'TERMINATED', 'RETIRED'])
                ->default('ACTIVE');
            $table->string('work_location')->nullable();

            $table->timestamps();

            $table->unique(['organization_id', 'employee_code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
