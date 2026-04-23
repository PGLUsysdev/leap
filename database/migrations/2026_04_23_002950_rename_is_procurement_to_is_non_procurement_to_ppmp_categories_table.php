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
        Schema::table('ppmp_categories', function (Blueprint $table) {
            $table->renameColumn('is_procurement', 'is_non_procurement');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ppmp_categories', function (Blueprint $table) {
            $table->renameColumn('is_non_procurement', 'is_procurement');
        });
    }
};
