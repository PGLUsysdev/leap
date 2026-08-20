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
                ->foreignId('aip_output_id')
                ->nullable()
                ->after('aip_entry_id')
                ->constrained('aip_outputs')
                ->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ppa_funding_sources', function (Blueprint $table) {
            $table->dropConstrainedForeignId('aip_output_id');
        });
    }
};
