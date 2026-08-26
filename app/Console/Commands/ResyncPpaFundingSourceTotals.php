<?php

namespace App\Console\Commands;

use App\Services\PpaFundingSourceTotalsService;
use Illuminate\Console\Command;

class ResyncPpaFundingSourceTotals extends Command
{
    protected $signature = 'ppmp:resync-totals
                            {--funding-source= : Only sync this ppa_funding_sources id}';

    protected $description =
        'Recompute MOOE and CO amounts on PPA funding sources from their PPMP line items';

    public function handle(PpaFundingSourceTotalsService $service): int
    {
        $fundingSourceId = $this->option('funding-source');

        $count = $service->syncAll(
            $fundingSourceId !== null ? (int) $fundingSourceId : null,
        );

        $this->info("Updated {$count} funding source record(s) that were out of sync.");

        return self::SUCCESS;
    }
}
