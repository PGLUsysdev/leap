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
        Schema::table('sectors', function (Blueprint $table) {
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
        Schema::table('sectors', function (Blueprint $table) {
            // Revert back to original lengths
            $table->string('code', 4)->change();
            $table->string('name', 255)->change(); // Default string length is usually 255
        });
    }
};
