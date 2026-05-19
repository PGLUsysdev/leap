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
        // 1. Update 'ppas' table to cascadeOnDelete()
        Schema::table('ppas', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table
                ->foreign('parent_id')
                ->references('id')
                ->on('ppas')
                ->cascadeOnDelete();
        });

        // 2. Update 'aip_entries' table to restrict PPA deletes
        Schema::table('aip_entries', function (Blueprint $table) {
            $table->dropForeign(['ppa_id']);
            $table
                ->foreign('ppa_id')
                ->references('id')
                ->on('ppas')
                ->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert 'ppas' back to CASCADE
        Schema::table('ppas', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table
                ->foreign('parent_id')
                ->references('id')
                ->on('ppas')
                ->onDelete('cascade');
        });

        // Revert 'aip_entries' back to CASCADE
        Schema::table('aip_entries', function (Blueprint $table) {
            $table->dropForeign(['ppa_id']);
            $table
                ->foreign('ppa_id')
                ->references('id')
                ->on('ppas')
                ->onDelete('cascade');
        });
    }
};

// safe to migrate all in one go up to here - no conflicts
// before running next migration do this first

// SELECT aip_entry_id, funding_source_id, COUNT(*)
// FROM ppa_funding_sources
// GROUP BY aip_entry_id, funding_source_id
// HAVING COUNT(*) > 1;

// If it returns zero rows, you’re safe to migrate immediately.
// if not run this
// Deduplication SQL script

// -- 1. Drop temporary table if it exists (to avoid "already exists" error)
// DROP TEMPORARY TABLE IF EXISTS tmp_duplicates;

// -- 2. Create temporary table to hold keeper IDs and sums
// CREATE TEMPORARY TABLE tmp_duplicates (
//     keeper_id BIGINT UNSIGNED NOT NULL,
//     aip_entry_id BIGINT UNSIGNED NOT NULL,
//     funding_source_id BIGINT UNSIGNED NOT NULL,
//     sum_ps DECIMAL(19,2) DEFAULT 0,
//     sum_mooe DECIMAL(19,2) DEFAULT 0,
//     sum_fe DECIMAL(19,2) DEFAULT 0,
//     sum_co DECIMAL(19,2) DEFAULT 0,
//     sum_ccet_adapt DECIMAL(19,2) DEFAULT 0,
//     sum_ccet_miti DECIMAL(19,2) DEFAULT 0
// );

// -- 3. Insert the keeper ID and the aggregated sums from non‑keeper rows
// INSERT INTO tmp_duplicates
//     (keeper_id, aip_entry_id, funding_source_id,
//      sum_ps, sum_mooe, sum_fe, sum_co, sum_ccet_adapt, sum_ccet_miti)
// SELECT
//     keepers.keeper_id,
//     d.aip_entry_id,
//     d.funding_source_id,
//     SUM(d.ps_amount) AS sum_ps,
//     SUM(d.mooe_amount) AS sum_mooe,
//     SUM(d.fe_amount) AS sum_fe,
//     SUM(d.co_amount) AS sum_co,
//     SUM(d.ccet_adaptation) AS sum_ccet_adapt,
//     SUM(d.ccet_mitigation) AS sum_ccet_miti
// FROM ppa_funding_sources d
// JOIN (
//     -- Subquery: for each duplicate group, get the minimum id as keeper
//     SELECT aip_entry_id, funding_source_id, MIN(id) AS keeper_id
//     FROM ppa_funding_sources
//     GROUP BY aip_entry_id, funding_source_id
//     HAVING COUNT(*) > 1
// ) keepers
//     ON d.aip_entry_id = keepers.aip_entry_id
//     AND d.funding_source_id = keepers.funding_source_id
//     AND d.id != keepers.keeper_id   -- exclude the keeper row
// GROUP BY keepers.keeper_id, d.aip_entry_id, d.funding_source_id;

// -- 4. Update the keeper rows by adding the aggregated sums
// UPDATE ppa_funding_sources p
// JOIN tmp_duplicates t ON p.id = t.keeper_id
// SET
//     p.ps_amount = p.ps_amount + t.sum_ps,
//     p.mooe_amount = p.mooe_amount + t.sum_mooe,
//     p.fe_amount = p.fe_amount + t.sum_fe,
//     p.co_amount = p.co_amount + t.sum_co,
//     p.ccet_adaptation = p.ccet_adaptation + t.sum_ccet_adapt,
//     p.ccet_mitigation = p.ccet_mitigation + t.sum_ccet_miti;

// -- 5. Delete the non‑keeper duplicates
// DELETE p
// FROM ppa_funding_sources p
// JOIN tmp_duplicates t
//     ON p.aip_entry_id = t.aip_entry_id
//     AND p.funding_source_id = t.funding_source_id
//     AND p.id != t.keeper_id;

// -- 6. Clean up
// DROP TEMPORARY TABLE IF EXISTS tmp_duplicates;
