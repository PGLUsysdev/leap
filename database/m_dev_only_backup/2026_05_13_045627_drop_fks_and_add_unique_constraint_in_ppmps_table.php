<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // 1. DISABLE CHECKS
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // 2. RAW SQL: DROP CONSTRAINTS
        // We wrap these in try-catch. If they are already gone, the script continues.
        $constraints = [
            'ppmps_ppa_funding_source_id_foreign',
            'ppmps_aip_entry_id_foreign',
            'ppmps_funding_source_id_foreign',
        ];

        foreach ($constraints as $constraint) {
            try {
                DB::statement(
                    "ALTER TABLE ppmps DROP FOREIGN KEY `{$constraint}`",
                );
            } catch (\Exception $e) {
                /* Already gone, ignore */
            }
        }

        // 3. RAW SQL: DROP COLUMNS
        // We use Raw SQL because Laravel's Schema builder is failing its internal checks.
        $columns = [
            'ppa_funding_source_id',
            'aip_entry_id',
            'funding_source_id',
        ];

        foreach ($columns as $column) {
            try {
                DB::statement("ALTER TABLE ppmps DROP COLUMN `{$column}`");
            } catch (\Exception $e) {
                /* Already gone, ignore */
            }
        }

        // 4. RAW SQL: DROP THE OLD UNIQUE INDEX
        try {
            DB::statement(
                'ALTER TABLE ppmps DROP INDEX ppmps_aip_entry_id_ppmp_price_list_id_funding_source_id_unique',
            );
        } catch (\Exception $e) {
            /* Already gone, ignore */
        }

        // 5. RE-ENABLE CHECKS
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 6. BUILD FRESH USING LARAVEL SCHEMA
        // Now that the table is guaranteed to be clean, we can use the Schema builder safely.
        Schema::table('ppmps', function (Blueprint $table) {
            $table
                ->unsignedBigInteger('ppa_funding_source_id')
                ->nullable()
                ->after('id');

            $table
                ->foreign('ppa_funding_source_id')
                ->references('id')
                ->on('ppa_funding_sources')
                ->onDelete('restrict');

            $table->unique(
                ['ppa_funding_source_id', 'ppmp_price_list_id'],
                'ppmps_price_list_unique',
            );
        });
    }

    public function down(): void
    {
        // Down logic...
    }
};
