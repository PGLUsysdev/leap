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
            // Increase length to handle temporary strings like 'TEMP22429'
            $table->string('code_suffix', 20)->change();

            // Change sort_order to decimal to support the -0.5 logic
            $table->decimal('sort_order', 10, 2)->default(0)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ppas', function (Blueprint $table) {
            // Revert to original typical lengths/types (adjust if yours were different)
            $table->string('code_suffix', 5)->change();
            $table->integer('sort_order')->default(0)->change();
        });
    }
};
