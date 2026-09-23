<?php

namespace App\Services;

use App\Models\AipDocument;
use App\Models\AipEntry;
use App\Models\AipOutput;
use Illuminate\Support\Facades\DB;

class AipCarryOverService
{
    /**
     * Carry a regular (or earlier) output into a supplemental document.
     *
     * Creates, if missing:
     *  - AipEntry for the same PPA in the target document
     *  - AipOutput in that entry with source_output_id = $source->id
     *  - Delta PpaFundingSource rows (zero amounts) for each funding
     *    source on the source output, matched by
     *    (funding_source_id, cc_typology_id)
     *
     * Supplemental rows store DELTAS, not copies: cumulative = sum.
     * Adding a pricelist (PPMP) or extra amount happens on the
     * supplemental funding row.
     *
     * @throws \Exception
     */
    public function carryOutputToDocument(AipOutput $source, AipDocument $target): AipOutput
    {
        $source->loadMissing('aipEntry.ppa', 'fundingSources', 'offices');

        $sourceEntry = $source->aipEntry;

        if (! $sourceEntry || ! $sourceEntry->ppa_id) {
            throw new \Exception('Source output has no AIP entry.');
        }

        if ($target->kind !== 'supplemental') {
            throw new \Exception('Carry-over target must be a supplemental document.');
        }

        if ((int) $target->fiscal_year_id !== (int) $sourceEntry->aipDocument?->fiscal_year_id
            && (int) $target->fiscal_year_id !== (int) $sourceEntry->ppa?->fiscal_year_id) {
            throw new \Exception('Target document must belong to the same fiscal year.');
        }

        return DB::transaction(function () use ($source, $sourceEntry, $target) {
            $targetEntry = AipEntry::firstOrCreate([
                'ppa_id' => $sourceEntry->ppa_id,
                'aip_document_id' => $target->id,
            ]);

            // One carried output per (entry, source). Reuse if already carried.
            $targetOutput = AipOutput::firstOrCreate([
                'aip_entry_id' => $targetEntry->id,
                'source_output_id' => $source->id,
            ], [
                'expected_output' => $source->expected_output,
                'start_date' => $source->start_date,
                'end_date' => $source->end_date,
                'sort_order' => $source->sort_order ?? 0,
            ]);

            // Keep offices in sync on first carry only (don't overwrite
            // user edits on subsequent calls).
            if ($targetOutput->wasRecentlyCreated && $source->offices->isNotEmpty()) {
                $targetOutput->offices()->sync($source->offices->pluck('id')->all());
            }

            // Delta funding rows: same (funding_source_id, cc_typology_id),
            // zero amounts. User then enters the additional amount / PPMPs.
            foreach ($source->fundingSources as $srcFs) {
                $targetOutput->fundingSources()->firstOrCreate([
                    'funding_source_id' => $srcFs->funding_source_id,
                    'cc_typology_id' => $srcFs->cc_typology_id,
                ], [
                    'ps_amount' => 0,
                    'mooe_amount' => 0,
                    'fe_amount' => 0,
                    'co_amount' => 0,
                    'ccet_adaptation' => 0,
                    'ccet_mitigation' => 0,
                ]);
            }

            return $targetOutput->fresh(['fundingSources', 'offices']);
        });
    }
}
