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
            // 1. Drop the old unique constraint that included aip_entry_id
            $table->dropUnique('pfs_aip_funding_supplemental_unique'); // Adjust name if yours differs

            // 2. Drop the old aip_entry_id foreign key and column
            $table->dropForeign(['aip_entry_id']);
            $table->dropColumn('aip_entry_id');

            // 3. Make the new aip_output_id required (data migration must be done first!)
            $table->foreignId('aip_output_id')->nullable(false)->change();

            // 4. Add new unique constraint: (output, fund, supplemental_aip)
            //    Note: supplemental_aip_id still lives on the parent aip_entries table.
            //    This ensures you can't double-fund the same output with the same source.
            $table->unique(
                ['aip_output_id', 'funding_source_id', 'supplemental_aip_id'],
                'pfs_output_funding_supplemental_unique',
            );
        });

        // 5. Drop the old columns from aip_entries (safe because data is migrated)
        Schema::table('aip_entries', function (Blueprint $table) {
            $table->dropColumn(['expected_output', 'start_date', 'end_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert: This is destructive; ensure you have backups.
        Schema::table('aip_entries', function (Blueprint $table) {
            $table->text('expected_output')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
        });

        Schema::table('ppa_funding_sources', function (Blueprint $table) {
            $table->dropUnique('pfs_output_funding_supplemental_unique');

            $table->dropForeign(['aip_output_id']);
            $table->foreignId('aip_output_id')->nullable()->change();

            $table->foreignId('aip_entry_id')->nullable();
            $table->unique(
                ['aip_entry_id', 'funding_source_id', 'supplemental_aip_id'],
                'pfs_aip_funding_supplemental_unique',
            );
        });
    }
};
