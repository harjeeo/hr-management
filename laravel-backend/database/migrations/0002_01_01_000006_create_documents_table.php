<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUuid('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->enum('category', [
                'ID_PROOF', 'PAN', 'PASSPORT', 'DRIVING_LICENSE', 'EDUCATION_CERTIFICATE',
                'EXPERIENCE_LETTER', 'OFFER_LETTER', 'APPOINTMENT_LETTER', 'EMPLOYMENT_AGREEMENT',
                'SALARY_DOCUMENT', 'OTHER',
            ])->default('OTHER');
            $table->string('file_name');
            $table->string('file_url');
            $table->string('mime_type')->nullable();
            $table->integer('file_size')->nullable();
            $table->date('expiry_date')->nullable();
            $table->uuid('uploaded_by_id');
            $table->timestamp('created_at')->useCurrent();

            $table->index(['organization_id', 'employee_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
