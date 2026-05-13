<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. Merge duplicates before enforcing uniqueness
        $duplicates = DB::table('ppa_funding_sources')
            ->select('aip_entry_id', 'funding_source_id')
            ->groupBy('aip_entry_id', 'funding_source_id')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($duplicates as $dup) {
            // Get all records for this pair, ordered by ID
            $records = DB::table('ppa_funding_sources')
                ->where('aip_entry_id', $dup->aip_entry_id)
                ->where('funding_source_id', $dup->funding_source_id)
                ->orderBy('id', 'asc')
                ->get();

            $primary = $records->shift(); // The first one (lowest ID)

            foreach ($records as $extra) {
                // Sum the amounts into the primary record
                DB::table('ppa_funding_sources')
                    ->where('id', $primary->id)
                    ->update([
                        'ps_amount' => $primary->ps_amount + $extra->ps_amount,
                        'mooe_amount' =>
                            $primary->mooe_amount + $extra->mooe_amount,
                        'fe_amount' => $primary->fe_amount + $extra->fe_amount,
                        'co_amount' => $primary->co_amount + $extra->co_amount,
                        'ccet_adaptation' =>
                            $primary->ccet_adaptation + $extra->ccet_adaptation,
                        'ccet_mitigation' =>
                            $primary->ccet_mitigation + $extra->ccet_mitigation,
                    ]);

                // Delete the duplicate row
                DB::table('ppa_funding_sources')
                    ->where('id', $extra->id)
                    ->delete();
            }
        }

        // 2. Now it is safe to apply the unique constraint
        Schema::table('ppa_funding_sources', function (Blueprint $table) {
            $table->unique(
                ['aip_entry_id', 'funding_source_id'],
                'pfs_aip_funding_unique',
            );
        });
    }

    public function down(): void
    {
        Schema::table('ppa_funding_sources', function (Blueprint $table) {
            $table->dropUnique('pfs_aip_funding_unique');
        });
    }
};
