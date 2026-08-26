<?php

namespace App\Http\Controllers;

use App\Models\FiscalYear;
use App\Models\Office;
use App\Models\Ppa;
use App\Models\PpaFundingSource;
use App\Models\Ppmp;
use App\Models\PpmpPriceList;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $draftYear = FiscalYear::where('status', 'draft')->first();
        $officeId = $request->user()?->office_id;

        // Include sub-offices (children)
        $officeIds = [];
        if ($officeId) {
            $office = Office::with('children')->find($officeId);
            $officeIds = [$officeId];
            if ($office && $office->children->isNotEmpty()) {
                foreach ($office->children as $child) {
                    $officeIds[] = $child->id;
                }
            }
        }

        $totalBudget = 0;
        $totalPpas = 0;
        $expenseClassBudget = null;
        $fundingSourceBudget = collect();
        $ppaTypeDistribution = collect();
        $ccExpenditure = null;
        $coaBudget = collect();

        if ($draftYear) {
            $totalBudget = PpaFundingSource::where('is_supplemental', false)
                ->whereHas('aipEntry.ppa', function ($q) use (
                    $draftYear,
                    $officeIds,
                ) {
                    $q->where('fiscal_year_id', $draftYear->id)->when(
                        ! empty($officeIds),
                        fn ($q) => $q->whereIn('office_id', $officeIds),
                    );
                })
                ->selectRaw(
                    'COALESCE(SUM(ps_amount + mooe_amount + fe_amount + co_amount), 0) as total',
                )
                ->value('total');

            $totalPpas = Ppa::where('fiscal_year_id', $draftYear->id)
                ->when(
                    ! empty($officeIds),
                    fn ($q) => $q->whereIn('office_id', $officeIds),
                )
                ->count();

            // Compute PS total from declared PS amounts on funding sources
            $computedPsTotal = (float) PpaFundingSource::where(
                'is_supplemental',
                false,
            )
                ->whereHas('aipEntry.ppa', function ($q) use (
                    $draftYear,
                    $officeIds,
                ) {
                    $q->where('fiscal_year_id', $draftYear->id)->when(
                        ! empty($officeIds),
                        fn ($q) => $q->whereIn('office_id', $officeIds),
                    );
                })
                ->selectRaw('COALESCE(SUM(ps_amount), 0) as total')
                ->value('total');

            $expenseClassBudget = PpaFundingSource::where(
                'is_supplemental',
                false,
            )
                ->whereHas('aipEntry.ppa', function ($q) use (
                    $draftYear,
                    $officeIds,
                ) {
                    $q->where('fiscal_year_id', $draftYear->id)->when(
                        ! empty($officeIds),
                        fn ($q) => $q->whereIn('office_id', $officeIds),
                    );
                })
                ->selectRaw(
                    '
                    COALESCE(SUM(mooe_amount), 0) as mooe,
                    COALESCE(SUM(fe_amount), 0) as fe,
                    COALESCE(SUM(co_amount), 0) as co
                ',
                )
                ->first();

            $fundingSourceBudget = PpaFundingSource::where(
                'is_supplemental',
                false,
            )
                ->whereHas('aipEntry.ppa', function ($q) use (
                    $draftYear,
                    $officeIds,
                ) {
                    $q->where('fiscal_year_id', $draftYear->id)->when(
                        ! empty($officeIds),
                        fn ($q) => $q->whereIn('office_id', $officeIds),
                    );
                })
                ->selectRaw(
                    'funding_source_id, SUM(ps_amount + mooe_amount + fe_amount + co_amount) as total',
                )
                ->groupBy('funding_source_id')
                ->with('fundingSource:id,title,code')
                ->get();

            $ppaTypeDistribution = Ppa::where('fiscal_year_id', $draftYear->id)
                ->when(
                    ! empty($officeIds),
                    fn ($q) => $q->whereIn('office_id', $officeIds),
                )
                ->selectRaw('type, COUNT(*) as count')
                ->groupBy('type')
                ->get();

            $ccExpenditure = PpaFundingSource::where('is_supplemental', false)
                ->whereHas('aipEntry.ppa', function ($q) use (
                    $draftYear,
                    $officeIds,
                ) {
                    $q->where('fiscal_year_id', $draftYear->id)->when(
                        ! empty($officeIds),
                        fn ($q) => $q->whereIn('office_id', $officeIds),
                    );
                })
                ->selectRaw(
                    '
                    COALESCE(SUM(ccet_adaptation), 0) as adaptation,
                    COALESCE(SUM(ccet_mitigation), 0) as mitigation
                ',
                )
                ->first();

            // MOOE/CO/FE COA amounts from PPMP procurement data
            $coaBudget = collect();
            if ($draftYear && ! empty($officeIds)) {
                $ppmpTotals = Ppmp::whereHas(
                    'ppaFundingSource.aipEntry.ppa',
                    function ($q) use ($draftYear, $officeIds) {
                        $q->where('fiscal_year_id', $draftYear->id)->when(
                            ! empty($officeIds),
                            fn ($q) => $q->whereIn('office_id', $officeIds),
                        );
                    },
                )
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
                    ->whereIn('chart_of_accounts.expense_class', [
                        'MOOE',
                        'CO',
                        'FE',
                    ])
                    ->selectRaw(
                        '
                        chart_of_accounts.id,
                        chart_of_accounts.account_number,
                        chart_of_accounts.account_title,
                        chart_of_accounts.expense_class,
                        COALESCE(SUM(ppmps.jan_amount + ppmps.feb_amount + ppmps.mar_amount + ppmps.apr_amount + ppmps.may_amount + ppmps.jun_amount + ppmps.jul_amount + ppmps.aug_amount + ppmps.sep_amount + ppmps.oct_amount + ppmps.nov_amount + ppmps.dec_amount), 0) as total
                    ',
                    )
                    ->groupBy(
                        'chart_of_accounts.id',
                        'chart_of_accounts.account_number',
                        'chart_of_accounts.account_title',
                        'chart_of_accounts.expense_class',
                    )
                    ->get();

                foreach ($ppmpTotals as $item) {
                    if ((float) $item->total > 0) {
                        $coaBudget->push(
                            (object) [
                                'id' => $item->id,
                                'account_number' => $item->account_number,
                                'account_title' => $item->account_title,
                                'expense_class' => strtolower(
                                    $item->expense_class,
                                ),
                                'total' => (float) $item->total,
                            ],
                        );
                    }
                }
            }
        }

        $totalPriceListItems = PpmpPriceList::count();

        $totalProcurement = Ppmp::query()
            ->whereHas('ppaFundingSource.aipEntry.ppa', function ($q) use (
                $draftYear,
                $officeIds,
            ) {
                $q->when(
                    $draftYear,
                    fn ($q) => $q->where('fiscal_year_id', $draftYear->id),
                )->when(
                    ! empty($officeIds),
                    fn ($q) => $q->whereIn('office_id', $officeIds),
                );
            })
            ->selectRaw(
                '
                COALESCE(SUM(jan_amount), 0) +
                COALESCE(SUM(feb_amount), 0) +
                COALESCE(SUM(mar_amount), 0) +
                COALESCE(SUM(apr_amount), 0) +
                COALESCE(SUM(may_amount), 0) +
                COALESCE(SUM(jun_amount), 0) +
                COALESCE(SUM(jul_amount), 0) +
                COALESCE(SUM(aug_amount), 0) +
                COALESCE(SUM(sep_amount), 0) +
                COALESCE(SUM(oct_amount), 0) +
                COALESCE(SUM(nov_amount), 0) +
                COALESCE(SUM(dec_amount), 0) as total
            ',
            )
            ->value('total');

        $totalOffices = Office::count();
        $totalUsers = User::when(
            ! empty($officeIds),
            fn ($q) => $q->whereIn('office_id', $officeIds),
        )->count();

        return Inertia::render('dashboard', [
            'draftYear' => $draftYear,
            'stats' => [
                'totalBudget' => (float) $totalBudget,
                'totalPpas' => (int) $totalPpas,
                'totalPriceListItems' => (int) $totalPriceListItems,
                'totalProcurement' => (float) ($totalProcurement ?? 0),
                'totalOffices' => (int) $totalOffices,
                'totalUsers' => (int) $totalUsers,
            ],
            'expenseClassBudget' => $expenseClassBudget
                ? [
                    'ps' => (float) $computedPsTotal,
                    'mooe' => (float) $expenseClassBudget->mooe,
                    'fe' => (float) $expenseClassBudget->fe,
                    'co' => (float) $expenseClassBudget->co,
                ]
                : null,
            'fundingSourceBudget' => $fundingSourceBudget->map(
                fn ($item) => [
                    'label' => $item->fundingSource?->title ??
                        ($item->fundingSource?->code ??
                            "Source #{$item->funding_source_id}"),
                    'value' => (float) $item->total,
                ],
            ),
            'ppaTypeDistribution' => $ppaTypeDistribution->map(
                fn ($item) => [
                    'type' => $item->type,
                    'count' => (int) $item->count,
                ],
            ),
            'ccExpenditure' => $ccExpenditure
                ? [
                    'adaptation' => (float) $ccExpenditure->adaptation,
                    'mitigation' => (float) $ccExpenditure->mitigation,
                ]
                : null,
            'coaBudget' => $coaBudget->map(
                fn ($item) => [
                    'id' => $item->id,
                    'account_number' => $item->account_number,
                    'account_title' => $item->account_title,
                    'expense_class' => strtolower($item->expense_class),
                    'value' => (float) $item->total,
                ],
            ),
        ]);
    }
}
