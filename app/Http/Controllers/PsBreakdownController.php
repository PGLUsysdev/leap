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
        $regular = $positions->whereIn('employment_type', [
            'permanent',
            'coterminous',
        ]);
        $casualContractual = $positions->whereIn('employment_type', [
            'casual',
            'contractual',
        ]);

        $totalBasicSalary = collect($annualRateMap)->sum('budget');
        $regularCount = $regular->count();
        $totalCount = $positions->count();

        $rataEligible = $regular
            ->filter(fn($p) => ($p->salary_grade ?? 0) >= 24)
            ->count();
        $rataEligibleMid = $regular
            ->filter(
                fn($p) => ($p->salary_grade ?? 0) >= 16 &&
                    ($p->salary_grade ?? 0) <= 23,
            )
            ->count();

        return [
            '5-01-01-010' => $regular->sum(
                fn($p) => $annualRateMap[$p->id]['budget'] ?? 0,
            ),
            '5-01-01-020' => $casualContractual->sum(
                fn($p) => $annualRateMap[$p->id]['budget'] ?? 0,
            ),
            '5-01-02-010' =>
                $regularCount * (float) ($rates['pera_monthly'] ?? 2000) * 12,
            '5-01-02-040' =>
                $totalCount * (float) ($rates['clothing_annual'] ?? 5000),
            '5-01-02-050' =>
                $regularCount *
                    (float) ($rates['subsistence_daily_fulltime'] ?? 50) *
                    (float) ($rates['num_days_annual'] ?? 264) +
                $casualContractual->count() *
                    (float) ($rates['subsistence_daily_parttime'] ?? 25) *
                    (float) ($rates['num_days_annual'] ?? 264),
            '5-01-02-060' =>
                $regularCount * (float) ($rates['laundry_monthly'] ?? 300) * 12,
            '5-01-02-080' => $totalCount * (float) ($rates['pei_max'] ?? 5000),
            '5-01-02-140' => $totalBasicSalary,
            '5-01-02-150' =>
                $totalCount * (float) ($rates['cash_gift'] ?? 5000),
            '5-01-03-010' =>
                $totalBasicSalary *
                ((float) ($rates['gsis_percent'] ?? 12) / 100),
            '5-01-03-020' =>
                $totalCount * (float) ($rates['pagibig_monthly'] ?? 100) * 12,
            '5-01-03-030' =>
                $totalBasicSalary *
                ((float) ($rates['philhealth_percent'] ?? 2.5) / 100),
            '5-01-03-040' =>
                $totalBasicSalary *
                ((float) ($rates['ecip_percent'] ?? 1) / 100),
        ];
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

        $positions = Position::with('user')
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
            $sg = $pos->salary_grade;

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
                $positions = Position::with('user')
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
                    $sg = $pos->salary_grade;

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
            $positions = Position::with('user')
                ->where('office_id', $officeId)
                ->get();

            $fyIds = array_filter([$currentFy?->id, $budgetFyId]);
            $salaryStandards = SalaryStandard::whereIn(
                'fiscal_year_id',
                $fyIds,
            )->get();

            foreach ($positions as $pos) {
                $step = $pos->user?->step ?? 1;
                $sg = $pos->salary_grade;
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

        $positions = Position::with('user')
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
