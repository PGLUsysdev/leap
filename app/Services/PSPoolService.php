<?php

namespace App\Services;

use App\Models\AipOutput;
use App\Models\Ppa;
use App\Models\PpaFundingSource;
use App\Models\Ppmp;
use Illuminate\Support\Facades\DB;

class PSPoolService
{
    /** Funding source used exclusively by the PS pool. */
    public const POOL_FUNDING_SOURCE_ID = 1;

    /**
     * Mark a PPA as the PS pool for its fiscal year.
     * Unmarks any other PPA in the same fiscal year.
     */
    public function setPool(Ppa $ppa): void
    {
        DB::transaction(function () use ($ppa) {
            // Only Programs or root PPAs can be designated as the PS pool.
            if ($ppa->type !== 'Program' && $ppa->parent_id !== null) {
                throw new \Exception(
                    'Only Programs or root PPAs can be designated as the PS pool.',
                );
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
     * Hand over the PS pool role: move the previous pool's manually-entered
     * ps_amount onto the new pool, whose own funding sources are wiped and
     * replaced by a single PS-only funding source row.
     *
     * A PS pool holds exactly one funding source and only a ps_amount.
     */
    public function handoff(?Ppa $oldPool, Ppa $newPool): float
    {
        return (float) DB::transaction(function () use ($oldPool, $newPool) {
            $newEntry = $newPool->aipEntries()
                ->whereNull('supplemental_aip_id')
                ->orderBy('id')
                ->first();

            if (! $newEntry) {
                throw new \Exception(
                    'The selected Program has no AIP entry to attach the PS funding source to.',
                );
            }

            // Sum the previous pool's PS (nothing else moves), then remove
            // ALL of its funding sources — it reverts to a normal entry.
            $psToMove = 0.0;

            if ($oldPool && $oldPool->id !== $newPool->id) {
                $oldOutputIds = AipOutput::whereIn(
                    'aip_entry_id',
                    $this->entryIds($oldPool),
                )->pluck('id');

                $psToMove = (float) PpaFundingSource::whereIn('aip_output_id', $oldOutputIds)
                    ->sum('ps_amount');

                $oldBridgeIds = PpaFundingSource::whereIn(
                    'aip_output_id',
                    AipOutput::whereIn('aip_entry_id', $this->entryIds($oldPool))->select('id'),
                )->pluck('id');

                if ($oldBridgeIds->isNotEmpty()) {
                    Ppmp::whereIn('ppa_funding_source_id', $oldBridgeIds)->delete();
                    PpaFundingSource::whereIn('id', $oldBridgeIds)->delete();
                }
            }

            // Remove the new pool's existing funding sources entirely —
            // a PS pool can never carry MOOE, FE, CO or CCET amounts.
            $bridgeIds = PpaFundingSource::whereIn(
                'aip_output_id',
                AipOutput::whereIn('aip_entry_id', $this->entryIds($newPool))->select('id'),
            )->pluck('id');

            if ($bridgeIds->isNotEmpty()) {
                Ppmp::whereIn('ppa_funding_source_id', $bridgeIds)->delete();
                PpaFundingSource::whereIn('id', $bridgeIds)->delete();
            }

            // Recreate as a single PS-only funding source row on the
            // new pool's first output.
            $targetOutput = $newEntry->outputs()->orderBy('sort_order')->orderBy('id')->first();

            if (! $targetOutput) {
                throw new \Exception(
                    'The selected Program has no output yet. Add an output first, then set it as the PS pool.',
                );
            }

            PpaFundingSource::create([
                'aip_output_id' => $targetOutput->id,
                'funding_source_id' => self::POOL_FUNDING_SOURCE_ID,
                'ps_amount' => $psToMove,
            ]);

            return $psToMove;
        });
    }

    /**
     * All (non-supplemental) aip_entry ids belonging to a PPA.
     */
    private function entryIds(Ppa $ppa): array
    {
        return $ppa->aipEntries()
            ->whereNull('supplemental_aip_id')
            ->pluck('id')
            ->all();
    }
}
