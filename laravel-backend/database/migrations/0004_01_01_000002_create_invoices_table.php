<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('subscription_id')->constrained('subscriptions')->cascadeOnDelete();
            $table->float('amount');
            $table->enum('status', ['PENDING', 'PAID', 'FAILED'])->default('PENDING');
            $table->timestamp('issued_at')->useCurrent();
            $table->timestamp('paid_at')->nullable();

            $table->index('subscription_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
