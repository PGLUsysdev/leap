<?php

namespace App\Services;

use App\Models\Ppa;
use App\Models\PpaFundingSource;
use Illuminate\Support\Facades\DB;

class PSPoolService
{
    /**
     * Mark a PPA as the PS pool for its fiscal year.
     * Unmarks any other PPA in the same fiscal year.
     */
    public function setPool(Ppa $ppa): void
    {
        DB::transaction(function () use ($ppa) {
            if ($ppa->type !== 'Program') {
                throw new \Exception('Only a Program can be designated as the PS pool.');
            }

            if ($ppa->is_supplemental) {
                throw new \Exception('Supplemental PPAs cannot be the PS pool.');
            }

            // Unset any existing pool for this fiscal year
            Ppa::where('fiscal_year_id', $ppa->fiscal_year_id)
                ->where('id', '!=', $ppa->id)
                ->where('is_ps_pool', true)
                ->update(['is_ps_pool' => null]);

            // Set the new pool
            $ppa->update(['is_ps_pool' => true]);
        });
    }

    /**
     * Get the current PS pool PPA for a given fiscal year.
     */
    public function getPoolForFiscalYear(int $fiscalYearId): ?Ppa
    {
        return Ppa::psPoolForFiscalYear($fiscalYearId)->first();
    }

    /**
     * One-time consolidation: move all PS amounts from funding sources
     * of non-pool PPAs into the designated pool Program.
     */
    public function consolidatePsToPool(int $fiscalYearId): array
    {
        $pool = $this->getPoolForFiscalYear($fiscalYearId);

        if (! $pool) {
            throw new \Exception('No PS pool designated for this fiscal year. Set a pool first.');
        }

        return DB::transaction(function () use ($fiscalYearId, $pool) {
            $poolAipEntryIds = $pool->aipEntries()
                ->whereNull('supplemental_aip_id')
                ->pluck('id');

            $nonPoolAipEntryIds = Ppa::where('fiscal_year_id', $fiscalYearId)
                ->where('id', '!=', $pool->id)
                ->whereHas('aipEntries', fn ($q) => $q->whereNull('supplemental_aip_id'))
                ->pluck('id');

            $totalPsToMove = PpaFundingSource::whereIn('aip_entry_id', $nonPoolAipEntryIds)
                ->whereNull('supplemental_aip_id')
                ->sum('ps_amount');

            if ($totalPsToMove > 0) {
                $poolFundingSources = PpaFundingSource::whereIn('aip_entry_id', $poolAipEntryIds)
                    ->whereNull('supplemental_aip_id')
                    ->get();

                if ($poolFundingSources->isNotEmpty()) {
                    $poolFundingSources->first()->increment('ps_amount', $totalPsToMove);
                }

                PpaFundingSource::whereIn('aip_entry_id', $nonPoolAipEntryIds)
                    ->whereNull('supplemental_aip_id')
                    ->where('ps_amount', '>', 0)
                    ->update(['ps_amount' => 0]);
            }

            return [
                'total_ps_moved' => $totalPsToMove,
                'pool_ppa_id' => $pool->id,
                'pool_name' => $pool->name,
            ];
        });
    }
}
