<?php

namespace App\Http\Controllers;

use App\Models\AipEntry;
use App\Models\ChartOfAccount;
use App\Models\FiscalYear;
use App\Models\Position;
use App\Models\PpaFundingSource;
use App\Models\PsBreakdownItem;
use App\Models\PsRate;
use App\Models\SalaryStandard;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PsBreakdownController extends Controller
{
    /**
     * Core computation: given positions, rates, and annualRateMap,
     * return PS COA totals keyed by account_number.
     */
    public static function computePsCoaTotals(
        $positions,
        array $rates,
        array $annualRateMap,
    ): array {
        // Per-position computation matching the frontend getCellNumericValue.
        // Iterating per position ensures frontend and backend stay in sync.
        $totals = [
            '5-01-01-010' => 0,
            '5-01-01-020' => 0,
            '5-01-02-010' => 0,
            '5-01-02-040' => 0,
            '5-01-02-080' => 0,
            '5-01-02-140' => 0,
            '5-01-02-150' => 0,
            '5-01-02-990' => 0,
            '5-01-03-010' => 0,
            '5-01-03-020' => 0,
            '5-01-03-030' => 0,
        ];

        foreach ($positions as $pos) {
            $isRegular = $pos->employment_type === 'permanent';
            $budgetAnnual = (float) ($annualRateMap[$pos->id]['budget'] ?? 0);

            // 5-01-01-010 — Salaries & Wages - Regular
            if ($isRegular) {
                $totals['5-01-01-010'] += $budgetAnnual;
            }

            // 5-01-01-020 — Salaries & Wages - Casual/Contractual
            if (
                $pos->employment_type === 'casual' ||
                $pos->employment_type === 'contractual'
            ) {
                $totals['5-01-01-020'] += $budgetAnnual;
            }

            // 5-01-02-010 — PERA (all positions)
            $totals['5-01-02-010'] +=
                (float) ($rates['pera_monthly'] ?? 2000) * 12;

            // 5-01-02-040 — Clothing Allowance (all positions)
            $totals['5-01-02-040'] +=
                (float) ($rates['clothing_annual'] ?? 5000);

            // 5-01-02-080 — PEI (all positions)
            $totals['5-01-02-080'] += (float) ($rates['pei_max'] ?? 5000);

            // 5-01-02-140 — Year End Bonus (1 month salary, all positions)
            $totals['5-01-02-140'] += $budgetAnnual / 12;

            // 5-01-02-150 — Cash Gift (all positions)
            $totals['5-01-02-150'] += (float) ($rates['cash_gift'] ?? 5000);

            // 5-01-02-990 — Other Bonuses & Allowances (1 month salary, all positions)
            $totals['5-01-02-990'] += $budgetAnnual / 12;

            // 5-01-03-010 — GSIS (all positions)
            $totals['5-01-03-010'] +=
                $budgetAnnual * ((float) ($rates['gsis_percent'] ?? 12) / 100);

            // 5-01-03-020 — Pag-ibig (all positions)
            $totals['5-01-03-020'] +=
                (float) ($rates['pagibig_monthly'] ?? 100) * 12;

            // 5-01-03-030 — PhilHealth (all positions)
            $totals['5-01-03-030'] +=
                $budgetAnnual *
                ((float) ($rates['philhealth_percent'] ?? 2.5) / 100);
        }

        return $totals;
    }

    /**
     * Convenience: load data for an office and compute PS COA totals.
     */
    public static function computePsCoaTotalsForOffice(
        int $officeId,
        int $budgetFyId,
    ): array {
        $budgetFy = FiscalYear::find($budgetFyId);
        if (!$budgetFy) {
            return [];
        }

        $currentFy = FiscalYear::where('year', $budgetFy->year - 1)->first();

        $positions = Position::with('user', 'ios')
            ->where('office_id', $officeId)
            ->get();

        if ($positions->isEmpty()) {
            return [];
        }

        $rates = PsRate::where('fiscal_year_id', $budgetFyId)
            ->pluck('rate_value', 'rate_key')
            ->toArray();

        $fyIds = array_filter([$currentFy?->id, $budgetFyId]);
        $salaryStandards = SalaryStandard::whereIn(
            'fiscal_year_id',
            $fyIds,
        )->get();

        $annualRateMap = [];
        foreach ($positions as $pos) {
            $step = $pos->user?->step ?? 1;
            $sg = $pos->ios?->salary_grade;

            $currentStd = $salaryStandards->firstWhere(
                fn($s) => $s->fiscal_year_id == $currentFy?->id &&
                    $s->salary_grade == $sg &&
                    $s->step_increment == $step,
            );
            $budgetStd = $salaryStandards->firstWhere(
                fn($s) => $s->fiscal_year_id == $budgetFyId &&
                    $s->salary_grade == $sg &&
                    $s->step_increment == $step,
            );

            $annualRateMap[$pos->id] = [
                'current' => $currentStd
                    ? (float) $currentStd->monthly_rate * 12
                    : 0,
                'budget' => $budgetStd
                    ? (float) $budgetStd->monthly_rate * 12
                    : 0,
            ];
        }

        return self::computePsCoaTotals($positions, $rates, $annualRateMap);
    }

    /**
     * Sync the total PS amount onto the GF Proper (funding_source_id=1)
     * funding source for the given AIP entry — but only if its PPA is the PS pool.
     * All other funding sources on this AIP entry get ps_amount = 0.
     * If no GF Proper funding source exists, it will be created automatically.
     */
    public static function syncPoolPsAmount(
        AipEntry $aipEntry,
        $saipId = null,
    ): void {
        $ppa = $aipEntry->ppa;

        if (!$ppa || !$ppa->is_ps_pool) {
            return;
        }

        $psTotals = self::computePsCoaTotalsForOffice(
            $ppa->office_id,
            $ppa->fiscal_year_id,
        );
        $totalPs = array_sum($psTotals);

        // Find or create the GF Proper funding source (id=1)
        $gfSource = $aipEntry->ppaFundingSources()->updateOrCreate(
            [
                'funding_source_id' => 1,
                'supplemental_aip_id' => $saipId ?: null,
            ],
            [
                'ps_amount' => $totalPs,
                'mooe_amount' => 0,
                'fe_amount' => 0,
                'co_amount' => 0,
                'is_supplemental' => (bool) $saipId,
                'ccet_adaptation' => 0,
                'ccet_mitigation' => 0,
            ],
        );

        // Zero out PS on all other funding sources for this AIP entry
        $aipEntry
            ->ppaFundingSources()
            ->where('id', '!=', $gfSource->id)
            ->when(
                $saipId,
                fn($q) => $q->where('supplemental_aip_id', $saipId),
                fn($q) => $q->whereNull('supplemental_aip_id'),
            )
            ->update(['ps_amount' => 0]);
    }

    public function index($fiscalYear, $aipEntry)
    {
        AipEntry::findOrFail($aipEntry);
        $fy = FiscalYear::findOrFail($fiscalYear);

        $ppaFundingSourceId = request()->query('ppa_funding_source_id');

        $chartOfAccounts = ChartOfAccount::where('expense_class', 'PS')
            ->where('is_active', true)
            ->orderBy('account_number')
            ->get();

        $breakdownItems = collect();
        $autoValues = [];
        $rates = [];
        $positions = collect();
        $officeId = null;
        $annualRateMap = [];

        if ($ppaFundingSourceId) {
            $breakdownItems = PsBreakdownItem::where(
                'ppa_funding_source_id',
                $ppaFundingSourceId,
            )->get();

            $fundingSource = PpaFundingSource::with('aipEntry.ppa')->find(
                $ppaFundingSourceId,
            );
            if ($fundingSource) {
                $budgetFyId = $fundingSource->aipEntry->ppa->fiscal_year_id;
                $budgetFy = FiscalYear::find($budgetFyId);
                $currentFy = $budgetFy
                    ? FiscalYear::where('year', $budgetFy->year - 1)->first()
                    : null;

                $rates = PsRate::where('fiscal_year_id', $budgetFyId)
                    ->pluck('rate_value', 'rate_key')
                    ->toArray();

                $officeId = $fundingSource->aipEntry->ppa->office_id;
                $positions = Position::with('user', 'ios')
                    ->where('office_id', $officeId)
                    ->get();

                // Load salary standards for both years
                $fyIds = array_filter([$currentFy?->id, $budgetFyId]);
                $salaryStandards = SalaryStandard::whereIn(
                    'fiscal_year_id',
                    $fyIds,
                )->get();

                // Build annual rate map per position
                foreach ($positions as $pos) {
                    $step = $pos->user?->step ?? 1;
                    $sg = $pos->ios?->salary_grade;

                    $currentStd = $salaryStandards->firstWhere(
                        fn($s) => $s->fiscal_year_id == $currentFy?->id &&
                            $s->salary_grade == $sg &&
                            $s->step_increment == $step,
                    );
                    $budgetStd = $salaryStandards->firstWhere(
                        fn($s) => $s->fiscal_year_id == $budgetFyId &&
                            $s->salary_grade == $sg &&
                            $s->step_increment == $step,
                    );

                    $annualRateMap[$pos->id] = [
                        'current' => $currentStd
                            ? (float) $currentStd->monthly_rate * 12
                            : 0,
                        'budget' => $budgetStd
                            ? (float) $budgetStd->monthly_rate * 12
                            : 0,
                    ];
                }

                $autoValues = $this->computeAutoPsValues(
                    $ppaFundingSourceId,
                    $annualRateMap,
                );
            }
        }

        return Inertia::render('ps-breakdown/index', [
            'chartOfAccounts' => $chartOfAccounts,
            'breakdownItems' => $breakdownItems,
            'autoValues' => $autoValues,
            'rates' => $rates,
            'ppaFundingSourceId' => $ppaFundingSourceId
                ? (int) $ppaFundingSourceId
                : null,
            'fiscalYear' => [
                'id' => $fy->id,
                'year' => $fy->year,
            ],
            'positions' => $positions,
            'annualRateMap' => $annualRateMap,
            'officeId' => $officeId,
            'offices' => \App\Models\Office::all(['id', 'name', 'acronym']),
            'fiscalYears' => \App\Models\FiscalYear::all(['id', 'year']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'ppa_funding_source_id' => 'required|exists:ppa_funding_sources,id',
            'chart_of_account_id' => 'required|exists:chart_of_accounts,id',
            'amount' => 'required|numeric|min:0',
            'position_id' => 'nullable|exists:positions,id',
        ]);

        $coa = ChartOfAccount::findOrFail($validated['chart_of_account_id']);

        if (!$coa->is_manual) {
            $autoValues = $this->computeAutoPsValues(
                $validated['ppa_funding_source_id'],
                [],
            );
            $amount = $autoValues[$coa->account_number] ?? 0;
            $isManual = false;
            $positionId = null;
        } else {
            $amount = $validated['amount'];
            $isManual = true;
            $positionId = $validated['position_id'];
        }

        PsBreakdownItem::updateOrCreate(
            [
                'ppa_funding_source_id' => $validated['ppa_funding_source_id'],
                'chart_of_account_id' => $validated['chart_of_account_id'],
                'plantilla_position_id' => $positionId,
            ],
            [
                'amount' => $amount,
                'is_manual' => $isManual,
            ],
        );

        $this->syncPsAmount($validated['ppa_funding_source_id']);

        return redirect()->back();
    }

    public function destroy(PsBreakdownItem $psBreakdownItem)
    {
        $ppaFundingSourceId = $psBreakdownItem->ppa_funding_source_id;
        $psBreakdownItem->delete();
        $this->syncPsAmount($ppaFundingSourceId);
        return redirect()->back();
    }

    public function recalculate(Request $request)
    {
        $request->validate([
            'ppa_funding_source_id' => 'required|exists:ppa_funding_sources,id',
        ]);

        $ppaFundingSourceId = $request->input('ppa_funding_source_id');
        $annualRateMap = [];

        // Recompute annual rate map since we need it for auto values
        $fundingSource = PpaFundingSource::with('aipEntry.ppa')->find(
            $ppaFundingSourceId,
        );
        if ($fundingSource) {
            $budgetFyId = $fundingSource->aipEntry->ppa->fiscal_year_id;
            $budgetFy = FiscalYear::find($budgetFyId);
            $currentFy = $budgetFy
                ? FiscalYear::where('year', $budgetFy->year - 1)->first()
                : null;

            $officeId = $fundingSource->aipEntry->ppa->office_id;
            $positions = Position::with('user', 'ios')
                ->where('office_id', $officeId)
                ->get();

            $fyIds = array_filter([$currentFy?->id, $budgetFyId]);
            $salaryStandards = SalaryStandard::whereIn(
                'fiscal_year_id',
                $fyIds,
            )->get();

            foreach ($positions as $pos) {
                $step = $pos->user?->step ?? 1;
                $sg = $pos->ios?->salary_grade;
                $currentStd = $salaryStandards->firstWhere(
                    fn($s) => $s->fiscal_year_id == $currentFy?->id &&
                        $s->salary_grade == $sg &&
                        $s->step_increment == $step,
                );
                $budgetStd = $salaryStandards->firstWhere(
                    fn($s) => $s->fiscal_year_id == $budgetFyId &&
                        $s->salary_grade == $sg &&
                        $s->step_increment == $step,
                );
                $annualRateMap[$pos->id] = [
                    'current' => $currentStd
                        ? (float) $currentStd->monthly_rate * 12
                        : 0,
                    'budget' => $budgetStd
                        ? (float) $budgetStd->monthly_rate * 12
                        : 0,
                ];
            }
        }

        $autoValues = $this->computeAutoPsValues(
            $ppaFundingSourceId,
            $annualRateMap,
        );

        foreach ($autoValues as $accountNumber => $amount) {
            $coa = ChartOfAccount::where(
                'account_number',
                $accountNumber,
            )->first();
            if (!$coa) {
                continue;
            }
            PsBreakdownItem::updateOrCreate(
                [
                    'ppa_funding_source_id' => $ppaFundingSourceId,
                    'chart_of_account_id' => $coa->id,
                    'plantilla_position_id' => null,
                ],
                [
                    'amount' => $amount,
                    'is_manual' => false,
                ],
            );
        }

        $this->syncPsAmount($ppaFundingSourceId);
        return redirect()->back();
    }

    private function computeAutoPsValues(
        int $ppaFundingSourceId,
        array $annualRateMap,
    ): array {
        $fundingSource = PpaFundingSource::with('aipEntry.ppa')->findOrFail(
            $ppaFundingSourceId,
        );
        $officeId = $fundingSource->aipEntry->ppa->office_id;
        $budgetFyId = $fundingSource->aipEntry->ppa->fiscal_year_id;

        $rates = PsRate::where('fiscal_year_id', $budgetFyId)
            ->pluck('rate_value', 'rate_key')
            ->toArray();

        $positions = Position::with('user', 'ios')
            ->where('office_id', $officeId)
            ->get();

        return self::computePsCoaTotals($positions, $rates, $annualRateMap);
    }

    private function syncPsAmount(int $ppaFundingSourceId): void
    {
        $total = PsBreakdownItem::where(
            'ppa_funding_source_id',
            $ppaFundingSourceId,
        )->sum('amount');

        PpaFundingSource::where('id', $ppaFundingSourceId)->update([
            'ps_amount' => $total,
        ]);
    }
}
