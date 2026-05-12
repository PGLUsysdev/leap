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
        Schema::table('lgu_levels', function (Blueprint $table) {
            // Increase code to 10 and name to 100
            $table->string('code', 10)->change();
            $table->string('name', 100)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lgu_levels', function (Blueprint $table) {
            // Revert back to original lengths
            $table->string('code', 1)->change();
            $table->string('name', 20)->change();
        });
    }
};
