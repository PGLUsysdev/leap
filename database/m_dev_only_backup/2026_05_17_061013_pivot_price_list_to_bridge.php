<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // 1. ADD COLUMN ONLY IF IT DOESN'T EXIST
        if (!Schema::hasColumn('ppmp_price_lists', 'coa_category_id')) {
            Schema::table('ppmp_price_lists', function (Blueprint $table) {
                $table
                    ->unsignedBigInteger('coa_category_id')
                    ->after('id')
                    ->nullable();
                $table
                    ->foreign('coa_category_id', 'pl_bridge_fk')
                    ->references('id')
                    ->on('chart_of_account_ppmp_categories')
                    ->restrictOnDelete();
            });
        }

        // 2. ONLY DO DATA MIGRATION IF THE OLD COLUMNS STILL EXIST
        // This prevents the error where we try to use columns we already deleted
        if (Schema::hasColumn('ppmp_price_lists', 'chart_of_account_id')) {
            // HEAL DATA: Insert missing bridge records
            DB::statement("
                INSERT INTO chart_of_account_ppmp_categories (chart_of_account_id, ppmp_category_id, created_at, updated_at)
                SELECT DISTINCT chart_of_account_id, ppmp_category_id, NOW(), NOW()
                FROM ppmp_price_lists pl
                WHERE NOT EXISTS (
                    SELECT 1 FROM chart_of_account_ppmp_categories bridge
                    WHERE bridge.chart_of_account_id = pl.chart_of_account_id
                    AND bridge.ppmp_category_id = pl.ppmp_category_id
                )
            ");

            // MAP IDs: Update the bridge FK
            DB::statement("
                UPDATE ppmp_price_lists pl
                JOIN chart_of_account_ppmp_categories bridge
                    ON bridge.chart_of_account_id = pl.chart_of_account_id
                    AND bridge.ppmp_category_id = pl.ppmp_category_id
                SET pl.coa_category_id = bridge.id
            ");

            // DROP OLD COLUMNS
            Schema::table('ppmp_price_lists', function (Blueprint $table) {
                // Check if FKs exist before dropping (prevents errors on partial failure)
                $table->dropForeign(['ppmp_category_id']);
                $table->dropForeign(['chart_of_account_id']);
                $table->dropColumn(['ppmp_category_id', 'chart_of_account_id']);
            });
        }

        // 3. FINALIZE: Set to NOT NULL now that everything is mapped
        Schema::table('ppmp_price_lists', function (Blueprint $table) {
            $table
                ->unsignedBigInteger('coa_category_id')
                ->nullable(false)
                ->change();
        });
    }

    public function down(): void
    {
        // ... reverse logic
    }
};
