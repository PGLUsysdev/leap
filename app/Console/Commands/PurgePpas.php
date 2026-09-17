<?php
// app/Console/Commands/PurgePpas.php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PurgePpas extends Command
{
    protected $signature = 'ppa:purge
                            {--dry-run : Show affected row counts without deleting}
                            {--force   : Skip the confirmation prompt}';

    protected $description = 'Delete all PPAs and dependent rows (AIP entries, AIP outputs, office pivots, funding sources, PS breakdowns, and PPMPs). Does NOT touch ppmp_categories or ppmp_price_lists.';

    public function handle(): int
    {
        $ppaCount     = DB::table('ppas')->count();
        $entryCount   = DB::table('aip_entries')->count();
        $outputCount  = DB::table('aip_outputs')->count();
        $pivotCount   = DB::table('aip_output_office')->count();
        $pfsCount     = DB::table('ppa_funding_sources')->count();
        $psCount      = DB::table('ps_breakdown_items')->count();
        $ppmpCount    = DB::table('ppmps')->count();

        $this->table(['Table', 'Rows affected'], [
            ['ppmps',                  $ppmpCount  . ' (deleted)'],
            ['ps_breakdown_items',     $psCount    . ' (deleted)'],
            ['ppa_funding_sources',    $pfsCount   . ' (deleted)'],
            ['aip_output_office',      $pivotCount . ' (deleted)'],
            ['aip_outputs',            $outputCount . ' (deleted)'],
            ['aip_entries',            $entryCount . ' (deleted)'],
            ['ppas',                   $ppaCount   . ' (deleted)'],
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
            // Bypass FK checks — the delete order below is already child-first,
            // but several constraints in this schema are RESTRICT and any single
            // mis-ordered statement would abort the whole transaction.
            DB::statement('SET FOREIGN_KEY_CHECKS = 0');

            try {
                // 1. PPMPs → ppa_funding_sources (RESTRICT). ppmps.ppa_funding_source_id
                //    is NOT NULL, so every row has to go.
                DB::table('ppmps')->delete();

                // 2. PS breakdown items → ppa_funding_sources (CASCADE), delete explicitly
                //    so row counts in the table above are accurate.
                DB::table('ps_breakdown_items')->delete();

                // 3. Funding sources → aip_outputs (RESTRICT).
                DB::table('ppa_funding_sources')->delete();

                // 4. Multi-office pivot for AIP outputs.
                DB::table('aip_output_office')->delete();

                // 5. AIP outputs → aip_entries (CASCADE).
                DB::table('aip_outputs')->delete();

                // 6. AIP entries → ppas (RESTRICT).
                DB::table('aip_entries')->delete();

                // 7. PPAs themselves (self-referencing parent_id, CASCADE).
                DB::table('ppas')->delete();
            } finally {
                DB::statement('SET FOREIGN_KEY_CHECKS = 1');
            }
        });

        $this->info('All PPAs purged.');
        return self::SUCCESS;
    }
}
