<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Safety net: abort if there are existing PPMP records that would be lost
        if (Schema::hasTable('ppmps') && DB::table('ppmps')->count() > 0) {
            $count = DB::table('ppmps')->count();
            throw new RuntimeException(
                "The 'ppmps' table contains {$count} records. " .
                    'This migration drops and recreates the table with a new structure. ' .
                    'Please back up and manually migrate the data, then empty the table before re-running.',
            );
        }

        // 1. Force drop the current messy table
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        Schema::dropIfExists('ppmps');
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 2. Create the clean, normalized table
        Schema::create('ppmps', function (Blueprint $table) {
            $table->id();

            // This is now the ONLY link to the Activity and the Fund
            $table
                ->foreignId('ppa_funding_source_id')
                ->constrained('ppa_funding_sources')
                ->restrictOnDelete();

            $table
                ->foreignId('ppmp_price_list_id')
                ->nullable()
                ->constrained('ppmp_price_lists')
                ->nullOnDelete();

            // Monthly breakdown
            $months = [
                'jan',
                'feb',
                'mar',
                'apr',
                'may',
                'jun',
                'jul',
                'aug',
                'sep',
                'oct',
                'nov',
                'dec',
            ];
            foreach ($months as $month) {
                $table->integer("{$month}_qty")->default(0);
                $table->decimal("{$month}_amount", 15, 2)->default(0);
            }

            $table->timestamps();

            // Prevent duplicate items for the same activity/fund link
            $table->unique(
                ['ppa_funding_source_id', 'ppmp_price_list_id'],
                'ppmps_price_list_unique',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ppmps');
    }
};

// Run this query to see if any (chart_of_account_id, ppmp_category_id) appears more than once:

// SELECT
//     chart_of_account_id,
//     ppmp_category_id,
//     COUNT(*) AS duplicate_count
// FROM chart_of_account_ppmp_categories
// GROUP BY chart_of_account_id, ppmp_category_id
// HAVING COUNT(*) > 1;

// No rows returned → skip run the migration directly.
// Rows returned → proceed to deduplicate.

// -- ==========================================================================
// -- DEDUPLICATION SCRIPT for chart_of_account_ppmp_categories
// -- Keeps the row with the lowest `id` per unique (chart_of_account_id, ppmp_category_id) pair.
// -- ==========================================================================

// -- 2a. Delete duplicates, keeping the smallest ID
// DELETE t1
// FROM chart_of_account_ppmp_categories t1
// INNER JOIN chart_of_account_ppmp_categories t2
//     ON t1.chart_of_account_id = t2.chart_of_account_id
//     AND t1.ppmp_category_id = t2.ppmp_category_id
//     AND t1.id > t2.id;   -- keep the smaller id

// -- 2b. Verify all duplicates are gone (should return 0 rows)
// SELECT chart_of_account_id, ppmp_category_id, COUNT(*) AS remaining_count
// FROM chart_of_account_ppmp_categories
// GROUP BY chart_of_account_id, ppmp_category_id
// HAVING COUNT(*) > 1;
