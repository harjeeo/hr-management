<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('performance_reviews', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('cycle_id')->constrained('performance_cycles')->cascadeOnDelete();
            $table->foreignUuid('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignUuid('manager_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->integer('self_rating')->nullable();
            $table->integer('manager_rating')->nullable();
            $table->text('self_feedback')->nullable();
            $table->text('manager_feedback')->nullable();
            $table->integer('final_rating')->nullable();
            $table->timestamps();

            $table->unique(['cycle_id', 'employee_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('performance_reviews');
    }
};
