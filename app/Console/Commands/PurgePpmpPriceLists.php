<?php
// app/Console/Commands/PurgePpmpPriceLists.php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PurgePpmpPriceLists extends Command
{
    protected $signature = 'ppmp:purge-price-lists
                            {--dry-run : Show affected row counts without deleting}
                            {--force   : Skip the confirmation prompt}';

    protected $description = 'Delete all ppmps rows and all ppmp_price_lists rows.';

    public function handle(): int
    {
        $ppmpCount = DB::table('ppmps')->count();
        $listCount = DB::table('ppmp_price_lists')->count();

        $this->table(['Table', 'Rows affected'], [
            ['ppmps',            $ppmpCount . ' (deleted)'],
            ['ppmp_price_lists', $listCount . ' (deleted)'],
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
            // Manual cascade: children first, parent second.
            // No FK reliance — works regardless of SET NULL / CASCADE / RESTRICT.
            DB::table('ppmps')->delete();
            DB::table('ppmp_price_lists')->delete();
        });

        $this->info('All PPMP price lists and ppmps purged.');
        return self::SUCCESS;
    }
}
