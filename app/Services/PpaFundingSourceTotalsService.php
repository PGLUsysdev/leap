<?php

namespace App\Services;

use App\Models\PpaFundingSource;
use App\Models\Ppmp;

class PpaFundingSourceTotalsService
{
    private const MONTH_AMOUNT_COLUMNS = [
        'jan_amount',
        'feb_amount',
        'mar_amount',
        'apr_amount',
        'may_amount',
        'jun_amount',
        'jul_amount',
        'aug_amount',
        'sep_amount',
        'oct_amount',
        'nov_amount',
        'dec_amount',
    ];

    /**
     * Recompute the MOOE and CO totals of a single funding source
     * bridge record from its PPMP line items.
     */
    public function syncOne(PpaFundingSource $ppaFundingSource): bool
    {
        $sumExpression = implode(
            ' + ',
            array_map(
                fn (string $column) => "ppmps.{$column}",
                self::MONTH_AMOUNT_COLUMNS,
            ),
        );

        $totals = Ppmp::query()
            ->where('ppmps.ppa_funding_source_id', $ppaFundingSource->id)
            ->join(
                'ppmp_price_lists',
                'ppmps.ppmp_price_list_id',
                '=',
                'ppmp_price_lists.id',
            )
            ->join(
                'chart_of_account_ppmp_categories',
                'ppmp_price_lists.chart_of_account_ppmp_category_id',
                '=',
                'chart_of_account_ppmp_categories.id',
            )
            ->join(
                'chart_of_accounts',
                'chart_of_account_ppmp_categories.chart_of_account_id',
                '=',
                'chart_of_accounts.id',
            )
            ->whereIn('chart_of_accounts.expense_class', ['MOOE', 'CO'])
            ->groupBy('chart_of_accounts.expense_class')
            ->selectRaw(
                "chart_of_accounts.expense_class as expense_class, SUM({$sumExpression}) as total",
            )
            ->pluck('total', 'expense_class');

        $mooe = round((float) ($totals['MOOE'] ?? 0), 2);
        $co = round((float) ($totals['CO'] ?? 0), 2);

        if ((float) $ppaFundingSource->mooe_amount === $mooe &&
            (float) $ppaFundingSource->co_amount === $co) {
            return false;
        }

        $ppaFundingSource->update([
            'mooe_amount' => $mooe,
            'co_amount' => $co,
        ]);

        return true;
    }

    /**
     * Recompute MOOE and CO totals for all bridge records,
     * optionally limited to a single ppa_funding_sources id.
     *
     * @return int Number of bridge records whose totals changed.
     */
    public function syncAll(?int $fundingSourceId = null): int
    {
        $query = PpaFundingSource::query();

        if ($fundingSourceId !== null) {
            $query->whereKey($fundingSourceId);
        }

        $changed = 0;

        $query->each(function (PpaFundingSource $ppaFundingSource) use (
            &$changed,
        ) {
            if ($this->syncOne($ppaFundingSource)) {
                $changed++;
            }
        });

        return $changed;
    }
}
