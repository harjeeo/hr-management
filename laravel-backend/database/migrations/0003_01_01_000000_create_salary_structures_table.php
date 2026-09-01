<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('salary_structures', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUuid('employee_id')->unique()->constrained('employees')->cascadeOnDelete();

            $table->float('basic')->default(0);
            $table->float('hra')->default(0);
            $table->float('conveyance')->default(0);
            $table->float('special_allowance')->default(0);
            $table->float('other_allowance')->default(0);

            $table->float('provident_fund')->default(0);
            $table->float('professional_tax')->default(0);
            $table->float('other_deductions')->default(0);

            $table->timestamps();

            $table->index('organization_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('salary_structures');
    }
};
