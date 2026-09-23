<?php

namespace App\Services;

use App\Models\AipEntry;
use App\Models\AipOutput;
use App\Models\PpaFundingSource;
use Illuminate\Support\Collection;

class AipCumulativeService
{
    /**
     * Merge entries across all documents for an office+year into one
     * entry per PPA, with amounts summed.
     *
     * Merge keys (deterministic, no text matching):
     *  - Entry: ppa_id
     *  - Output: coalesce(source_output_id, id)  (explicit lineage)
     *  - Funding: (funding_source_id, cc_typology_id) within merged output
     *
     * Outputs with no lineage (new in supplemental) group by own id,
     * so they appear as additions.
     *
     * Legacy rows without lineage fall back to own id — they will NOT
     * auto-merge by expected_output text. Backfill lineage via
     * AipCarryOverService for reliable cumulative totals.
     *
     * @param  Collection<int, AipEntry>  $entries  eager-loaded with outputs.fundingSources
     * @return Collection<int, AipEntry>
     */
    public function merge(Collection $entries): Collection
    {
        return $entries
            ->groupBy('ppa_id')
            ->map(function (Collection $group) {
                /** @var AipEntry $base */
                $base = $group->first();

                $mergedOutputs = $group
                    ->flatMap(fn (AipEntry $e) => $e->outputs ?? collect())
                    ->groupBy(fn (AipOutput $o) => (int) ($o->source_output_id ?? $o->id))
                    ->map(function (Collection $outputs) {
                        /** @var AipOutput $root */
                        $root = $outputs
                            ->sortBy(fn (AipOutput $o) => $o->source_output_id === null ? 0 : 1)
                            ->first();

                        $mergedFunding = $outputs
                            ->flatMap(fn (AipOutput $o) => $o->fundingSources ?? collect())
                            ->groupBy(fn (PpaFundingSource $fs) => $fs->funding_source_id.'|'.($fs->cc_typology_id ?? 'null'))
                            ->map(function (Collection $rows) {
                                /** @var PpaFundingSource $first */
                                $first = $rows->first();

                                return new PpaFundingSource([
                                    'funding_source_id' => $first->funding_source_id,
                                    'cc_typology_id' => $first->cc_typology_id,
                                    'ps_amount' => (string) $rows->sum(fn ($r) => (float) $r->ps_amount),
                                    'mooe_amount' => (string) $rows->sum(fn ($r) => (float) $r->mooe_amount),
                                    'fe_amount' => (string) $rows->sum(fn ($r) => (float) $r->fe_amount),
                                    'co_amount' => (string) $rows->sum(fn ($r) => (float) $r->co_amount),
                                    'ccet_adaptation' => (string) $rows->sum(fn ($r) => (float) $r->ccet_adaptation),
                                    'ccet_mitigation' => (string) $rows->sum(fn ($r) => (float) $r->ccet_mitigation),
                                    'funding_source' => $first->fundingSource,
                                    'cc_typology' => $first->ccTypology,
                                ]);
                            })
                            ->values();

                        $merged = new AipOutput([
                            'expected_output' => $root->expected_output,
                            'start_date' => $root->start_date,
                            'end_date' => $root->end_date,
                            'sort_order' => $root->sort_order ?? 0,
                        ]);
                        $merged->id = $root->id;
                        $merged->setRelation('fundingSources', $mergedFunding);
                        $merged->setRelation('offices', $root->offices ?? collect());

                        return $merged;
                    })
                    ->values();

                $base->setRelation('outputs', $mergedOutputs);
                $base->setRelation('aipDocument', null);

                return $base;
            })
            ->values();
    }

    /**
     * Normalize expected_output text for display/fallback only.
     * NOT used as a merge key (lineage is the key).
     */
    public static function normalizeKey(?string $text): string
    {
        return strtolower((string) preg_replace('/\s+/', '', trim((string) $text)));
    }
}
