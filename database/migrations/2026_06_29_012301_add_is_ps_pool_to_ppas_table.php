<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('ppas', function (Blueprint $table) {
            $table->boolean('is_ps_pool')->nullable()->after('is_supplemental');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ppas', function (Blueprint $table) {
            $table->dropColumn('is_ps_pool');
        });
    }
};
