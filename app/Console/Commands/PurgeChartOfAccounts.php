<?php

// app/Console/Commands/PurgeChartOfAccounts.php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PurgeChartOfAccounts extends Command
{
    protected $signature = 'coa:purge
                            {--dry-run           : Show affected row counts without deleting}
                            {--force             : Skip the confirmation prompt}
                            {--keep-orphan-ppmps : Keep ppmps rows that have no price-list link}';

    protected $description = 'Delete all chart of accounts and dependent rows (junction, price lists, ppmps, PS breakdowns).';

    public function handle(): int
    {
        $coaCount = DB::table('chart_of_accounts')->count();
        $pivotCount = DB::table('chart_of_account_ppmp_categories')->count();
        $listCount = DB::table('ppmp_price_lists')->count();
        $psCount = DB::table('ps_breakdown_items')->count();
        $ppmpLinked = DB::table('ppmps')->whereNotNull('ppmp_price_list_id')->count();
        $ppmpOrphan = DB::table('ppmps')->whereNull('ppmp_price_list_id')->count();

        $keepOrphans = (bool) $this->option('keep-orphan-ppmps');

        $rows = [
            ['chart_of_accounts',                $coaCount.' (deleted)'],
            ['chart_of_account_ppmp_categories', $pivotCount.' (deleted)'],
            ['ppmp_price_lists',                 $listCount.' (deleted)'],
            ['ps_breakdown_items',               $psCount.' (deleted)'],
            ['ppmps (linked to price list)',     $ppmpLinked.' (deleted)'],
            ['ppmps (no price list)',            $ppmpOrphan.($keepOrphans ? ' (kept)' : ' (deleted)')],
        ];

        $this->table(['Table', 'Rows affected'], $rows);

        if ($this->option('dry-run')) {
            $this->warn('Dry run — nothing deleted.');

            return self::SUCCESS;
        }

        if (! $this->option('force') && ! $this->confirm('Proceed with deletion?', false)) {
            $this->info('Aborted.');

            return self::SUCCESS;
        }

        DB::transaction(function () use ($keepOrphans) {
            // 1. ppmps first — its FK to ppmp_price_lists is SET NULL, so
            //    deleting the price lists would leave these rows orphaned
            //    with a NULL link. Delete them outright instead.
            if ($keepOrphans) {
                DB::table('ppmps')->whereNotNull('ppmp_price_list_id')->delete();
            } else {
                DB::table('ppmps')->delete();
            }

            // 2. Bypass FK checks — delete order is already correct, but
            //    chart_of_account_ppmp_categories and ppmp_price_lists both
            //    use RESTRICT, so this keeps things robust if the schema
            //    order ever shifts.
            DB::statement('SET FOREIGN_KEY_CHECKS = 0');

            try {
                DB::table('ppmp_price_lists')->delete();
                DB::table('chart_of_account_ppmp_categories')->delete();
                DB::table('ps_breakdown_items')->delete();
                DB::table('chart_of_accounts')->delete();
            } finally {
                DB::statement('SET FOREIGN_KEY_CHECKS = 1');
            }
        });

        $this->info('All chart of accounts purged.');

        return self::SUCCESS;
    }
}
