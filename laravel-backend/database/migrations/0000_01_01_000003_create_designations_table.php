<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('designations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['organization_id', 'title']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('designations');
    }
};
