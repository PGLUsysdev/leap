<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Spec §5: Upsert uniqueness is (junction_id + normalized description + normalized UOM)
        // MySQL cannot create UNIQUE on TEXT without prefix, so we enforce uniqueness in
        // application layer (PriceListImportController::store) via normalized lookup.
        // This migration adds a non-unique composite index to speed up that lookup:
        //   WHERE chart_of_account_ppmp_category_id = ?  + prefix index on description
        // plus a unique hash for future strict enforcement without breaking existing TEXT data.
        Schema::table('ppmp_price_lists', function (Blueprint $table) {
            // Performance index for upsert query (junction + first 191 chars of description + UOM)
            // Use raw statement to support prefix length; Schema facade doesn't expose length easily.
            // Check if index already exists via Schema::hasIndex would need DB::select; just try/catch.
            try {
                DB::statement(
                    'CREATE INDEX ppmp_price_lists_upsert_lookup_idx ON ppmp_price_lists (chart_of_account_ppmp_category_id, unit_of_measurement, description(191))',
                );
            } catch (Throwable $e) {
                // index may already exist — ignore
            }
        });

        // Optional strict hash column for future DB-level uniqueness (virtual generated column)
        // MySQL 5.7+ supports SHA2; use try/catch in case MySQL version doesn't support.
        try {
            DB::statement(
                <<<'SQL'
                ALTER TABLE ppmp_price_lists
                  ADD COLUMN description_norm_hash CHAR(64) AS (SHA2(LOWER(TRIM(description)), 256)) VIRTUAL
                SQL
                ,
            );
        } catch (Throwable $e) {
            // ignore if not supported
        }
        // Note: UNIQUE constraint on (junction, description_norm_hash, LOWER(unit)) could be added
        // after backfilling duplicates are cleaned. Kept non-enforced to allow partial imports (Spec §8).
    }

    public function down(): void
    {
        try {
            DB::statement('DROP INDEX ppmp_price_lists_upsert_lookup_idx ON ppmp_price_lists');
        } catch (Throwable $e) {
        }
        try {
            Schema::table('ppmp_price_lists', function (Blueprint $table) {
                if (Schema::hasColumn('ppmp_price_lists', 'description_norm_hash')) {
                    $table->dropColumn('description_norm_hash');
                }
            });
        } catch (Throwable $e) {
        }
    }
};
