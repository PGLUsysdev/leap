<?php

namespace App\Http\Controllers;

use App\Models\AipEntry;
use App\Models\ChartOfAccount;
use App\Models\FiscalYear;
use App\Models\Ppa;
use App\Models\PpaFundingSource;
use App\Models\Ppmp;
use App\Models\PsBreakdownItem;
use App\Services\MockPersonnelData;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class PsBreakdownController extends Controller
{
    /** Working days per month for daily-rate items (monthly rate / 22). */
    private const WORKING_DAYS_PER_MONTH = 22;

    /** Months of service budgeted when a position has no recorded service. */
    private const DEFAULT_MONTHS_OF_SERVICE = 12;

    /**
     * Core computation: given positions, rates, and annualRateMap,
     * return PS COA totals keyed by account_number.
     *
     * Hardcoded per-position rules mirroring the frontend
     * getCellNumericValue. COAs without a deterministic rule
     * (subsistence, quarters, overseas, honoraria, longevity,
     * overtime, provident, pension/gratuity/terminal-leave, other
     * personnel benefits) contribute zero until manual inputs exist.
     *
     * Casual and contractual pay follows the daily-rate formula
     * (monthly rate / 22 * days worked), so it prorates against
     * $monthsOfService — keyed by position id. Positions absent from
     * that map are budgeted for a full year.
     */
    public static function computePsCoaTotals(
        $positions,
        array $rates,
        array $annualRateMap,
        array $monthsOfService = [],
    ): array {
        // Per-position computation matching the frontend getCellNumericValue.
        // Iterating per position ensures frontend and backend stay in sync.
        $totals = [
            '5-01-01-010' => 0,
            '5-01-01-020' => 0,
            '5-01-02-010' => 0,
            '5-01-02-020' => 0,
            '5-01-02-030' => 0,
            '5-01-02-040' => 0,
            '5-01-02-060' => 0,
            '5-01-02-080' => 0,
            '5-01-02-110' => 0,
            '5-01-02-140' => 0,
            '5-01-02-150' => 0,
            '5-01-02-990' => 0,
            '5-01-03-010' => 0,
            '5-01-03-020' => 0,
            '5-01-03-030' => 0,
            '5-01-03-040' => 0,
        ];

        foreach ($positions as $pos) {
            $budgetAnnual = (float) ($annualRateMap[$pos['id']]['budget'] ?? 0);
            $monthly = $budgetAnnual / 12;
            $sg = $pos['ios']['salary_grade'] ?? null;

            $budgeted = $pos['status'] !== 'abolished' && (bool) $pos['is_funded'];
            $occupied = $budgeted && $pos['status'] === 'occupied';
            $isRegular = $pos['employment_type'] === 'permanent';

            if (! $budgeted) {
                continue;
            }

            // 5-01-01-010 — Salaries & Wages - Regular
            if ($isRegular) {
                $totals['5-01-01-010'] += $budgetAnnual;
            }

            // 5-01-01-020 — Salaries & Wages - Casual/Contractual
            // Daily Wage Rate = Authorized Monthly Salary / 22 days
            // Actual Pay     = Daily Wage Rate * Days Actually Worked
            if (
                $pos['employment_type'] === 'casual' ||
                $pos['employment_type'] === 'contractual'
            ) {
                $months = min(
                    max($monthsOfService[$pos['id']] ?? self::DEFAULT_MONTHS_OF_SERVICE, 1),
                    12,
                );

                $dailyRate = $monthly / self::WORKING_DAYS_PER_MONTH;
                $daysWorked = $months * self::WORKING_DAYS_PER_MONTH;

                $totals['5-01-01-020'] += $dailyRate * $daysWorked;
            }

            // 5-01-02-140 — Year End Bonus (1 month basic pay)
            $totals['5-01-02-140'] += $monthly;

            // 5-01-02-990 — Other Bonuses & Allowances placeholder
            $totals['5-01-02-990'] += $monthly;

            // 5-01-03-010 — GSIS employer share
            $totals['5-01-03-010'] +=
                $budgetAnnual * ((float) ($rates['gsis_percent'] ?? 12) / 100);

            // 5-01-03-020 — Pag-IBIG employer share (2%, MFS 10,000/mo)
            $totals['5-01-03-020'] += min($monthly, 10000) * 0.02 * 12;

            // 5-01-03-030 — PhilHealth employer share (2.5%, floor 250 / ceiling 2,500 mo)
            $totals['5-01-03-030'] += min(max($monthly * 0.025, 250), 2500) * 12;

            // 5-01-03-040 — ECIP (1% capped at 1,200)
            $totals['5-01-03-040'] += min(
                $budgetAnnual * ((float) ($rates['ecip_percent'] ?? 1) / 100),
                1200,
            );

            if (! $occupied) {
                continue;
            }

            // 5-01-02-010 — PERA (flat monthly x 12)
            $totals['5-01-02-010'] +=
                (float) ($rates['pera_monthly'] ?? 2000) * 12;

            // 5-01-02-020 — RA (SG-banded monthly x 12, permanent only)
            // 5-01-02-030 — TA (SG-banded monthly x 12, permanent only)
            if ($isRegular && $sg !== null) {
                if ($sg >= 24) {
                    $totals['5-01-02-020'] +=
                        (float) ($rates['rata_sg_24_above'] ?? 4000) * 12;
                    $totals['5-01-02-030'] +=
                        (float) ($rates['ta_sg_24_above'] ?? 2000) * 12;
                } elseif ($sg >= 16) {
                    $totals['5-01-02-020'] +=
                        (float) ($rates['rata_sg_16_23'] ?? 2000) * 12;
                    $totals['5-01-02-030'] +=
                        (float) ($rates['ta_sg_16_23'] ?? 1000) * 12;
                }
            }

            // 5-01-02-040 — Clothing Allowance (flat annual)
            $totals['5-01-02-040'] +=
                (float) ($rates['clothing_annual'] ?? 8000);

            // 5-01-02-060 — Laundry Allowance (flat monthly x 12)
            $totals['5-01-02-060'] +=
                (float) ($rates['laundry_monthly'] ?? 150) * 12;

            // 5-01-02-080 — PEI (flat annual ceiling)
            $totals['5-01-02-080'] += (float) ($rates['pei_max'] ?? 5000);

            // 5-01-02-110 — Hazard Pay (SG-banded % of monthly x 12)
            if ($sg !== null) {
                $totals['5-01-02-110'] +=
                    ($sg <= 19 ? $monthly * 0.25 : $monthly * 0.05) * 12;
            }

            // 5-01-02-150 — Cash Gift (flat annual)
            $totals['5-01-02-150'] += (float) ($rates['cash_gift'] ?? 5000);
        }

        return $totals;
    }

    /**
     * Convenience: compute PS COA totals from the mock personnel dataset.
     *
     * The `ios`, `positions` and `salary_standards` tables are deprecated and
     * are no longer queried; $officeId and $budgetFyId are retained for
     * signature compatibility with existing callers and are unused until the
     * personnel API supplies office- and year-scoped data.
     */
    public static function computePsCoaTotalsForOffice(
        int $officeId,
        int $budgetFyId,
        array $monthsOfService = [],
    ): array {
        return self::computePsCoaTotals(
            MockPersonnelData::positions(),
            MockPersonnelData::rates(),
            MockPersonnelData::annualRateMap(),
            $monthsOfService ?: MockPersonnelData::monthsOfService(),
        );
    }

    /**
     * Sync the total PS amount onto the GF Proper (funding_source_id=1)
     * funding source for the given AIP entry — but only if its PPA is the PS pool.
     *
     * Funding sources attach to AIP outputs, so the entry's primary output
     * (lowest sort_order) is used as the carrier. It is created automatically
     * when the entry has none yet.
     *
     * The primary output of a PS pool entry is structurally restricted to a
     * single funding source:
     *   - Only one PPA funding source is allowed (GF Proper, id=1).
     *   - It carries PS only; MOOE, FE, CO (and CCET) are always 0.
     * Any other funding source on this output is deleted (along with its PPMPs).
     */
    public static function syncPoolPsAmount(
        AipEntry $aipEntry,
        $saipId = null,
    ): void {
        $ppa = $aipEntry->ppa;

        if (! $ppa || ! $ppa->is_ps_pool) {
            return;
        }

        $psTotals = self::computePsCoaTotalsForOffice(
            $ppa->office_id,
            $ppa->fiscal_year_id,
        );
        $totalPs = array_sum($psTotals);

        // Resolve the primary output that carries the pool's funding sources.
        $output = $aipEntry
            ->outputs()
            ->orderBy('sort_order')
            ->first();

        if (! $output) {
            $output = $aipEntry->outputs()->create([
                'office_id' => $ppa->office_id,
                'sort_order' => 0,
            ]);
        }

        // Remove any non-GF-Proper funding source on this output,
        // cleaning up their PPMPs first (mirrors PpaFundingSourceController::destroy).
        $nonGfSources = $output
            ->fundingSources()
            ->where(function ($q) {
                $q->where('funding_source_id', '!=', 1)->orWhereNull(
                    'funding_source_id',
                );
            })
            ->when(
                $saipId,
                fn ($q) => $q->where('supplemental_aip_id', $saipId),
                fn ($q) => $q->whereNull('supplemental_aip_id'),
            )
            ->get();

        if ($nonGfSources->isNotEmpty()) {
            Ppmp::whereIn(
                'ppa_funding_source_id',
                $nonGfSources->pluck('id'),
            )->delete();

            $nonGfSources->each->delete();
        }

        // Find or create the GF Proper funding source (id=1) with PS only.
        $output->fundingSources()->updateOrCreate(
            [
                'funding_source_id' => 1,
                'supplemental_aip_id' => $saipId ?: null,
            ],
            [
                'ps_amount' => $totalPs,
                'mooe_amount' => 0,
                'fe_amount' => 0,
                'co_amount' => 0,
                'ccet_adaptation' => 0,
                'ccet_mitigation' => 0,
                'cc_typology_id' => null,
                'is_supplemental' => (bool) $saipId,
            ],
        );
    }

    /**
     * Recalculate PS amounts for all PS Pool PPAs in the given office.
     * Called automatically when positions or user assignments change.
     */
    public static function recalculateOfficePsAmounts(int $officeId): void
    {
        $draftYear = FiscalYear::where('status', 'draft')->first();
        if (! $draftYear) {
            return;
        }

        $psPoolPpa = Ppa::where('office_id', $officeId)
            ->where('fiscal_year_id', $draftYear->id)
            ->where('is_ps_pool', true)
            ->first();

        if (! $psPoolPpa) {
            return;
        }

        foreach ($psPoolPpa->aipEntries as $entry) {
            self::syncPoolPsAmount($entry);
        }
    }

    /**
     * Page props for the PS Breakdown table.
     *
     * Only the chart of accounts comes from the database. Positions, salary
     * rates and the annual rate map come from the mock personnel dataset while
     * the personnel API lands; the `ios`, `positions` and `salary_standards`
     * tables are deprecated and are no longer queried here.
     */
    public function index($fiscalYear, $aipEntry)
    {
        Gate::authorize('viewAny', PsBreakdownItem::class);

        AipEntry::findOrFail($aipEntry);
        $fy = FiscalYear::findOrFail($fiscalYear);

        $ppaFundingSourceId = request()->query('ppa_funding_source_id');

        $chartOfAccounts = ChartOfAccount::where('expense_class', 'PS')
            ->where('is_active', true)
            ->orderBy('path')
            ->get();

        $officeId = null;

        if ($ppaFundingSourceId) {
            $fundingSource = PpaFundingSource::with('aipEntry.ppa')->find(
                $ppaFundingSourceId,
            );

            $officeId = $fundingSource?->aipEntry?->ppa?->office_id;
        }

        return Inertia::render('ps-breakdown/index', [
            'chartOfAccounts' => $chartOfAccounts,
            'ppaFundingSourceId' => $ppaFundingSourceId
                ? (int) $ppaFundingSourceId
                : null,
            'fiscalYear' => [
                'id' => $fy->id,
                'year' => $fy->year,
            ],
            'officeId' => $officeId,
            'positions' => MockPersonnelData::positions(),
            'rates' => MockPersonnelData::rates(),
            'annualRateMap' => MockPersonnelData::annualRateMap(),
            'monthsOfService' => MockPersonnelData::monthsOfService(),
        ]);
    }
}
