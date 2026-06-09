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
        Schema::table('ppa_funding_sources', function (Blueprint $table) {
            $table
                ->foreignId('cc_typology_id')
                ->nullable()
                ->constrained('cc_typologies')
                ->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ppa_funding_sources', function (Blueprint $table) {
            $table->dropConstrainedForeignId('cc_typology_id');
        });
    }
};
