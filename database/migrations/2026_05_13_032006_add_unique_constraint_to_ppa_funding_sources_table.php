<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Check for duplicates; if any exist, abort with a clear message.
        $duplicateCount = DB::table('ppa_funding_sources')
            ->select('aip_entry_id', 'funding_source_id')
            ->groupBy('aip_entry_id', 'funding_source_id')
            ->havingRaw('COUNT(*) > 1')
            ->count();

        if ($duplicateCount > 0) {
            throw new RuntimeException(
                'Cannot add unique constraint to ppa_funding_sources: '.
                    "there are {$duplicateCount} groups of duplicates. ".
                    "Please resolve duplicates (e.g. run 'php artisan funding:deduplicate') and then re‑run this migration.",
            );
        }

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

// run this before migrating the next migration
// Verify: Is the ppmps table empty?

// SELECT COUNT(*) AS row_count FROM ppmps;
