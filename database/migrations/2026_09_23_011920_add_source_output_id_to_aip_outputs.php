<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('aip_outputs', function (Blueprint $table) {
            // Explicit lineage: supplemental output derived from a regular
            // (or earlier supplemental) output. Null = original output.
            // Cumulative merge groups by coalesce(source_output_id, id).
            $table->foreignId('source_output_id')
                ->nullable()
                ->after('aip_entry_id')
                ->constrained('aip_outputs')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('aip_outputs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('source_output_id');
        });
    }
};
