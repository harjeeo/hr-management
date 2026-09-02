<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('performance_cycles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('name');
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('status', ['ACTIVE', 'CLOSED'])->default('ACTIVE');
            $table->timestamp('created_at')->nullable();

            $table->index('organization_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('performance_cycles');
    }
};
