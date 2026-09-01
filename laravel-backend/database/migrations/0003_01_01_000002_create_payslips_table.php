<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payslips', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUuid('payroll_run_id')->constrained('payroll_runs')->cascadeOnDelete();
            $table->foreignUuid('employee_id')->constrained('employees')->cascadeOnDelete();

            $table->float('basic');
            $table->float('hra');
            $table->float('conveyance');
            $table->float('special_allowance');
            $table->float('other_allowance');
            $table->float('gross_salary');

            $table->float('provident_fund');
            $table->float('professional_tax');
            $table->float('other_deductions');
            $table->float('total_deductions');

            $table->float('net_salary');

            $table->timestamp('created_at')->nullable();

            $table->unique(['payroll_run_id', 'employee_id']);
            $table->index(['organization_id', 'employee_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payslips');
    }
};
