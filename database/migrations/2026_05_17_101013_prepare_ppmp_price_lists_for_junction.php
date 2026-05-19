<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. Unique constraint on junction table (fails if duplicates exist)
        Schema::table('chart_of_account_ppmp_categories', function (
            Blueprint $table,
        ) {
            $table->unique(
                ['chart_of_account_id', 'ppmp_category_id'],
                'coa_ppmp_cat_unique_pair',
            );
        });

        // 2. Add nullable FK column to price list
        Schema::table('ppmp_price_lists', function (Blueprint $table) {
            $table
                ->unsignedBigInteger('chart_of_account_ppmp_category_id')
                ->nullable()
                ->after('ppmp_category_id'); // place it logically after old columns
        });
    }

    public function down(): void
    {
        Schema::table('ppmp_price_lists', function (Blueprint $table) {
            $table->dropColumn('chart_of_account_ppmp_category_id');
        });

        Schema::table('chart_of_account_ppmp_categories', function (
            Blueprint $table,
        ) {
            $table->dropUnique('coa_ppmp_cat_unique_pair');
        });
    }
};

// do this Manual data script (SQL) before migrating the next migration

// -- ==========================================================================
// -- DATA MIGRATION SCRIPT
// -- Populates the new chart_of_account_ppmp_category_id column in ppmp_price_lists
// -- ==========================================================================

// -- 1. Insert any (chart_of_account_id, ppmp_category_id) pairs from price lists
// --    that are missing in the junction table
// INSERT INTO chart_of_account_ppmp_categories
//     (chart_of_account_id, ppmp_category_id, created_at, updated_at)
// SELECT
//     ppl.chart_of_account_id,
//     ppl.ppmp_category_id,
//     NOW(),
//     NOW()
// FROM ppmp_price_lists ppl
// LEFT JOIN chart_of_account_ppmp_categories j
//     ON j.chart_of_account_id = ppl.chart_of_account_id
//     AND j.ppmp_category_id = ppl.ppmp_category_id
// WHERE j.id IS NULL;

// -- 2. Populate the new column with the correct junction ID
// UPDATE ppmp_price_lists ppl
// JOIN chart_of_account_ppmp_categories j
//     ON j.chart_of_account_id = ppl.chart_of_account_id
//     AND j.ppmp_category_id = ppl.ppmp_category_id
// SET ppl.chart_of_account_ppmp_category_id = j.id;

// -- 3. Safety check – MUST return 0
// SELECT COUNT(*) AS null_count
// FROM ppmp_price_lists
// WHERE chart_of_account_ppmp_category_id IS NULL;
