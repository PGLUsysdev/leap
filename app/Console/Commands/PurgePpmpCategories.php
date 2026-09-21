<?php
// app/Console/Commands/PurgePpmpCategories.php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PurgePpmpCategories extends Command
{
    protected $signature = 'ppmp:purge-categories
                            {--dry-run : Show affected row counts without deleting}
                            {--force   : Skip the confirmation prompt}';

    protected $description = 'Delete all PPMP categories and dependent rows (pivot + price lists; nulls ppmps links).';

    public function handle(): int
    {
        $catCount   = DB::table('ppmp_categories')->count();
        $pivotCount = DB::table('chart_of_account_ppmp_categories')->count();
        $listCount  = DB::table('ppmp_price_lists')->count();
        $ppmpCount  = DB::table('ppmps')->whereNotNull('ppmp_price_list_id')->count();

        $this->table(['Table', 'Rows affected'], [
            ['ppmp_categories',                  $catCount . ' (deleted)'],
            ['chart_of_account_ppmp_categories', $pivotCount . ' (deleted)'],
            ['ppmp_price_lists',                 $listCount . ' (deleted)'],
            ['ppmps.ppmp_price_list_id',         $ppmpCount . ' (set NULL)'],
        ]);

        if ($this->option('dry-run')) {
            $this->warn('Dry run — nothing deleted.');
            return self::SUCCESS;
        }

        if (! $this->option('force') && ! $this->confirm('Proceed with deletion?', false)) {
            $this->info('Aborted.');
            return self::SUCCESS;
        }

        DB::transaction(function () {
            // 1. Unlink ppmps from price lists first so the deletes below are clean.
            DB::table('ppmps')
                ->whereNotNull('ppmp_price_list_id')
                ->update(['ppmp_price_list_id' => null]);

            // 2. Bypass FK checks — delete order is already correct, but some
            //    constraints on this schema are RESTRICT and would otherwise
            //    block the parent delete mid-statement.
            DB::statement('SET FOREIGN_KEY_CHECKS = 0');

            try {
                DB::table('ppmp_price_lists')->delete();
                DB::table('chart_of_account_ppmp_categories')->delete();
                DB::table('ppmp_categories')->delete();
            } finally {
                DB::statement('SET FOREIGN_KEY_CHECKS = 1');
            }
        });

        $this->info('All PPMP categories purged.');
        return self::SUCCESS;
    }
}
