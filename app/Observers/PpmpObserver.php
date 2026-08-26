<?php

namespace App\Observers;

use App\Models\PpaFundingSource;
use App\Models\Ppmp;
use App\Services\PpaFundingSourceTotalsService;

class PpmpObserver
{
    public function __construct(
        private readonly PpaFundingSourceTotalsService $totalsService,
    ) {}

    public function created(Ppmp $ppmp): void
    {
        $this->syncBridge($ppmp);
    }

    public function updated(Ppmp $ppmp): void
    {
        $this->syncBridge($ppmp);
    }

    public function deleted(Ppmp $ppmp): void
    {
        $this->syncBridge($ppmp);
    }

    private function syncBridge(Ppmp $ppmp): void
    {
        if (! $ppmp->ppa_funding_source_id) {
            return;
        }

        $bridge = $ppmp->ppaFundingSource;

        if ($bridge instanceof PpaFundingSource) {
            $this->totalsService->syncOne($bridge);
        }
    }
}
