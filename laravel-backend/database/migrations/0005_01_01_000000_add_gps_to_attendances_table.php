<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->float('check_in_lat')->nullable()->after('check_in');
            $table->float('check_in_lng')->nullable()->after('check_in_lat');
            $table->float('check_out_lat')->nullable()->after('check_out');
            $table->float('check_out_lng')->nullable()->after('check_out_lat');
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn(['check_in_lat', 'check_in_lng', 'check_out_lat', 'check_out_lng']);
        });
    }
};
