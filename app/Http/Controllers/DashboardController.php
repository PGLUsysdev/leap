<?php

namespace App\Http\Controllers;

use App\Models\ChartOfAccount;
use App\Models\FeBreakdownItem;
use App\Models\FiscalYear;
use App\Models\Office;
use App\Models\Ppa;
use App\Models\PpaFundingSource;
use App\Models\Ppmp;
use App\Models\PpmpPriceList;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('viewAny', 'dashboard');

        $draftYear = FiscalYear::where('status', 'draft')->first();
        $user = $request->user();
        $user->loadMissing('role');
        $isSuperAdmin = $user->role?->name === 'super admin';
        $officeId = $user?->office_id;

        // Super admin defaults to consolidated data across all offices and
        // may narrow to one office via ?selected_office_id=.
        // All other roles are scoped to their own office hierarchy.
        $selectedOfficeId = $isSuperAdmin
            ? $request->query('selected_office_id') ?: null
            : null;
        $officeIds = [];
        if ($isSuperAdmin && $selectedOfficeId) {
            $officeIds = $this->getOfficeHierarchyIds($selectedOfficeId);
        } elseif (! $isSuperAdmin && $officeId) {
            $officeIds = $this->getOfficeHierarchyIds($officeId);
        }

        $totalBudget = 0;
        $totalPpas = 0;
        $expenseClassBudget = null;
        $fundingSourceBudget = collect();
        $ppaTypeDistribution = collect();
        $ccExpenditure = null;
        $coaBudget = collect();

        if ($draftYear) {
            // The dashboard aggregates the stored ps_amount, so refresh the
            // pools it is about to read. Scoped to the offices in view; the
            // consolidated super-admin view reads whatever is already stored.
            $this->syncPsPoolsInScope($draftYear, $officeIds);

            $coaBudget = $this->coaBudgetFor($draftYear, $officeIds);

            // Regular documents only; supplemental totals live in their own
            // aip_documents rows (kind = supplemental).
            $totalBudget = PpaFundingSource::regular()
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
            $computedPsTotal = (float) PpaFundingSource::regular()
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

            $expenseClassBudget = PpaFundingSource::regular()
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

            $fundingSourceBudget = PpaFundingSource::regular()
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

            $ccExpenditure = PpaFundingSource::regular()
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

            $totalPriceListItems = PpmpPriceList::count();

            $totalProcurement = 0;
            if ($draftYear) {
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
            }

            $totalOffices = Office::count();
            $totalUsers = User::when(
                ! empty($officeIds),
                fn ($q) => $q->whereIn('office_id', $officeIds),
            )->count();

            return Inertia::render('dashboard', [
                'draftYear' => $draftYear,
                'canScopeOffices' => $isSuperAdmin,
                'selectedOfficeId' => $selectedOfficeId ? (int) $selectedOfficeId : null,
                'offices' => $isSuperAdmin ? Office::whereNull('parent_id')->get() : [],
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
                'coaBudget' => $coaBudget,
            ]);
        }
    }

    /**
     * Refresh the PS pool of each office in scope before it is aggregated.
     *
     * An empty scope means the consolidated super-admin view, which spans every
     * office. Writing from a GET across all of them would be far too many
     * personnel reads, so that view shows whatever is already stored.
     *
     * @param  array<int>  $officeIds
     */
    private function syncPsPoolsInScope(FiscalYear $fiscalYear, array $officeIds): void
    {
        if ($officeIds === []) {
            return;
        }

        $poolOfficeIds = PsBreakdownController::poolOfficeIdsForFiscalYear(
            (int) $fiscalYear->id,
        );

        foreach (array_intersect($poolOfficeIds, $officeIds) as $officeId) {
            try {
                PsBreakdownController::syncPoolForFiscalYear(
                    (int) $fiscalYear->id,
                    (int) $officeId,
                );
            } catch (\Exception $e) {
                // The dashboard reads whatever is stored; a personnel API
                // failure only means the figure is left stale.
                report($e);
            }
        }
    }

    /**
     * Per-account budget across all four expense classes, keyed by COA
     * path so the three sources merge onto one row each.
     *
     * PS comes from the personnel API (per office), MOOE and CO from
     * PPMP procurement, FE from the FE breakdown page. Accounts with no
     * amount are left out entirely rather than listed at zero.
     *
     * @param  array<int>  $officeIds
     * @return Collection<int, stdClass>
     */
    private function coaBudgetFor(FiscalYear $draftYear, array $officeIds): Collection
    {
        $amounts = [];

        // PS — the same computation the LBP Form 2 report uses, summed
        // one office per department so sub-units are not counted twice.
        //
        // Personnel is an external API. If it is unreachable the PS rows are
        // left out rather than failing the dashboard; MOOE, CO and FE still
        // render from the database.
        try {
            foreach (Office::onePerDepartment($officeIds) as $oid) {
                foreach (
                    PsBreakdownController::computePsCoaTotalsForOffice(
                        $oid,
                        (int) $draftYear->id,
                    ) as $path => $amount
                ) {
                    $amounts[$path] = ($amounts[$path] ?? 0) + (float) $amount;
                }
            }
        } catch (\Exception $e) {
            report($e);
        }

        // MOOE and CO — PPMP line items, grouped by account.
        $ppmpQuery = Ppmp::whereHas(
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
            ->whereIn('chart_of_accounts.expense_class', ['MOOE', 'CO'])
            ->select(
                'chart_of_accounts.path',
                'chart_of_accounts.account_number',
                'chart_of_accounts.account_title',
                'chart_of_accounts.expense_class',
            )
            ->selectRaw(
                'COALESCE(SUM(ppmps.jan_amount + ppmps.feb_amount + ppmps.mar_amount
                    + ppmps.apr_amount + ppmps.may_amount + ppmps.jun_amount
                    + ppmps.jul_amount + ppmps.aug_amount + ppmps.sep_amount
                    + ppmps.oct_amount + ppmps.nov_amount + ppmps.dec_amount), 0) as total',
            )
            ->groupBy(
                'chart_of_accounts.path',
                'chart_of_accounts.account_number',
                'chart_of_accounts.account_title',
                'chart_of_accounts.expense_class',
            );

        foreach ($ppmpQuery->get() as $row) {
            $amounts[$row->path] =
                ($amounts[$row->path] ?? 0) + (float) $row->total;
        }

        // FE — maintained by hand on the FE breakdown page.
        $feQuery = FeBreakdownItem::whereHas(
            'ppaFundingSource.aipEntry.ppa',
            function ($q) use ($draftYear, $officeIds) {
                $q->where('fiscal_year_id', $draftYear->id)->when(
                    ! empty($officeIds),
                    fn ($q) => $q->whereIn('office_id', $officeIds),
                );
            },
        )
            ->whereHas('chartOfAccount', function ($q) {
                $q->where('expense_class', 'FE')
                    ->where('is_active', true)
                    ->where('is_postable', true);
            });

        foreach ($feQuery->with('chartOfAccount')->get() as $item) {
            $path = $item->chartOfAccount?->path;

            if ($path === null) {
                continue;
            }

            $amounts[$path] = ($amounts[$path] ?? 0) + (float) $item->amount;
        }

        // An account with no amount is not shown at all.
        $amounts = array_filter(
            $amounts,
            fn ($amount): bool => round((float) $amount, 2) > 0,
        );

        if ($amounts === []) {
            return collect();
        }

        // Only accounts that actually exist can be labelled. PS codes
        // come from the computation, not the chart, so an unrecognised
        // path is skipped rather than shown as a bare code.
        return ChartOfAccount::whereIn('path', array_keys($amounts))
            ->get()
            ->map(fn (ChartOfAccount $coa): object => (object) [
                'id' => $coa->id,
                'path' => $coa->path,
                'account_number' => $coa->account_number,
                'account_title' => $coa->account_title,
                'expense_class' => strtolower((string) $coa->expense_class),
                'value' => round((float) $amounts[$coa->path], 2),
            ])
            ->sortByDesc('value')
            ->values();
    }

    /**
     * Get all office IDs in the hierarchy (office + all descendants).
     */
    private function getOfficeHierarchyIds($officeId): array
    {
        if (! $officeId) {
            return [];
        }

        return array_merge([(int) $officeId], $this->getChildOfficeIds((int) $officeId));
    }

    /**
     * Recursively get child office IDs.
     */
    private function getChildOfficeIds($parentId): array
    {
        $children = Office::where('parent_id', $parentId)->pluck('id')->toArray();
        $descendants = $children;
        foreach ($children as $childId) {
            $descendants = array_merge($descendants, $this->getChildOfficeIds($childId));
        }

        return $descendants;
    }
}
