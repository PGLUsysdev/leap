<?php

namespace App\Http\Controllers;

use App\Models\AipEntry;
use App\Models\ChartOfAccount;
use App\Models\FiscalYear;
use App\Models\Office;
use App\Models\Ppa;
use App\Models\PpaFundingSource;
use App\Models\Ppmp;
use App\Models\PsBreakdownItem;
use App\Services\MockPersonnelData;
use App\Services\WorkspacePersonnel;
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
     *
     * @param  array<int, array<string, mixed>>  $positions
     * @param  array<string, float>  $rates
     * @param  array<int, array{current: float, budget: float}>  $annualRateMap
     * @param  array<int, int>  $monthsOfService
     * @return array<string, float>
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
     * Compute PS COA totals for one office from the personnel API.
     *
     * The office resolves to the PGLU Space department that carries its employees;
     * sub-units share their parent's department, so every caller must count a
     * department once. $budgetFyId is retained for signature compatibility and is
     * unused while personnel figures are not fiscal-year scoped.
     *
     * @param  array<int, int>  $monthsOfService
     * @return array<string, float>
     */
    public static function computePsCoaTotalsForOffice(
        int $officeId,
        int $budgetFyId,
        array $monthsOfService = [],
    ): array {
        return self::computePsCoaTotalsFromPersonnel(
            self::personnelForOffice($officeId),
            $monthsOfService,
        );
    }

    /**
     * PS COA totals from already-read personnel rows.
     *
     * A null personnel set — an office with no PGLU Space department — totals to
     * zero rather than raising, so report callers that iterate many offices can
     * carry on. Anything that *writes* the total must check for null first; see
     * syncPoolPsAmount.
     *
     * @param  array{positions: array<int, array<string, mixed>>, annualRateMap: array<int, array{current: float, budget: float}>}|null  $personnel
     * @param  array<int, int>  $monthsOfService
     * @return array<string, float>
     */
    private static function computePsCoaTotalsFromPersonnel(?array $personnel, array $monthsOfService): array
    {
        if ($personnel === null) {
            return self::computePsCoaTotals([], MockPersonnelData::rates(), []);
        }

        return self::computePsCoaTotals(
            $personnel['positions'],
            MockPersonnelData::rates(),
            $personnel['annualRateMap'],
            $monthsOfService,
        );
    }

    /**
     * Personnel rows for an office, or null when the office has no PGLU Space
     * department to read employees from.
     *
     * @return array{positions: array<int, array<string, mixed>>, annualRateMap: array<int, array{current: float, budget: float}>}|null
     */
    private static function personnelForOffice(int $officeId): ?array
    {
        $deptCode = Office::find($officeId)?->load('parent')->deptCode();

        if ($deptCode === null) {
            return null;
        }

        return app(WorkspacePersonnel::class)->forOffice($deptCode);
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
     *
     * @param  array{positions: array<int, array<string, mixed>>, annualRateMap: array<int, array{current: float, budget: float}>}|null  $personnel  Pre-read rows for the office, to avoid a second API round trip.
     */
    public static function syncPoolPsAmount(
        AipEntry $aipEntry,
        ?array $personnel = null,
    ): void {
        $ppa = $aipEntry->ppa;

        if (! $ppa || ! $ppa->is_ps_pool) {
            return;
        }

        // An office with no PGLU Space department has no personnel to read. Writing
        // the resulting zero total would erase a figure we cannot compute, so
        // the pool is left exactly as it is.
        $personnel ??= self::personnelForOffice($ppa->office_id);

        if ($personnel === null) {
            return;
        }

        $totalPs = array_sum(
            self::computePsCoaTotalsFromPersonnel($personnel, []),
        );

        // Resolve the primary output that carries the pool's funding sources.
        $output = $aipEntry
            ->outputs()
            ->orderBy('sort_order')
            ->first();

        if (! $output) {
            $output = $aipEntry->outputs()->create([
                'sort_order' => 0,
            ]);

            // Outputs link to offices through a pivot; there is no office_id
            // column on aip_outputs.
            $output->offices()->sync([$ppa->office_id]);
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
            ->get();

        if ($nonGfSources->isNotEmpty()) {
            Ppmp::whereIn(
                'ppa_funding_source_id',
                $nonGfSources->pluck('id'),
            )->delete();

            $nonGfSources->each->delete();
        }

        // Find or create the GF Proper funding source (id=1) with PS only.
        //
        // An output carries at most one row per funding source — the unique
        // index is (aip_output_id, funding_source_id) — so this keys on the
        // funding source alone. The `supplemental_aip_id` / `is_supplemental`
        // columns no longer exist on this table.
        $output->fundingSources()->updateOrCreate(
            ['funding_source_id' => 1],
            [
                'ps_amount' => $totalPs,
                'mooe_amount' => 0,
                'fe_amount' => 0,
                'co_amount' => 0,
                'ccet_adaptation' => 0,
                'ccet_mitigation' => 0,
                'cc_typology_id' => null,
            ],
        );
    }

    /**
     * The office ids that hold a PS pool in the given fiscal year.
     *
     * `PSPoolService::setPool` designates one pool per fiscal year, so this is
     * normally a single id. Callers aggregating many offices use it to sync only
     * the pools actually in view.
     *
     * @return array<int, int>
     */
    public static function poolOfficeIdsForFiscalYear(int $fiscalYearId): array
    {
        return Ppa::psPoolForFiscalYear($fiscalYearId)
            ->pluck('office_id')
            ->map(fn ($id): int => (int) $id)
            ->all();
    }

    /**
     * Sync the PS pool of one fiscal year to the PS breakdown total of its office.
     *
     * This is the entry point the page and the "set as PS pool" action both use. The
     * pool is resolved by fiscal year rather than by any one AIP entry's PPA, because
     * the entry being viewed is usually not itself the pool.
     *
     * Returns the total written, or null when there was nothing to sync — no pool
     * for the year, or an office with no PGLU Space department to read personnel
     * from (which is left untouched rather than zeroed).
     *
     * @param  int|null  $onlyOfficeId  Sync only when the pool belongs to this office.
     *                                  Report callers viewing a single office pass
     *                                  their selection, so a pool belonging to a
     *                                  different office is never written from the
     *                                  wrong department's personnel.
     */
    public static function syncPoolForFiscalYear(int $fiscalYearId, ?int $onlyOfficeId = null): ?float
    {
        $ppa = Ppa::psPoolForFiscalYear($fiscalYearId)->with('aipEntries')->first();

        if (! $ppa) {
            return null;
        }

        if ($onlyOfficeId !== null && (int) $ppa->office_id !== $onlyOfficeId) {
            return null;
        }

        $personnel = self::personnelForOffice($ppa->office_id);

        if ($personnel === null) {
            return null;
        }

        $totalPs = array_sum(self::computePsCoaTotalsFromPersonnel($personnel, []));

        foreach ($ppa->aipEntries as $entry) {
            if (self::poolAmountFor($entry) === $totalPs) {
                continue;
            }

            self::syncPoolPsAmount($entry, $personnel);
        }

        return $totalPs;
    }

    /**
     * Sync every PS pool's funding source to the PS breakdown total of its office.
     *
     * Personnel is read once per office and reused across that office's entries,
     * since several AIP entries can sit under one pool.
     *
     * @return array{synced: int, unchanged: int, skipped: int}
     */
    public static function syncAllPsPools(): array
    {
        $result = ['synced' => 0, 'unchanged' => 0, 'skipped' => 0];

        $pools = Ppa::where('is_ps_pool', true)->with('aipEntries')->get();

        foreach ($pools as $ppa) {
            $personnel = self::personnelForOffice($ppa->office_id);

            if ($personnel === null) {
                // No department to read employees from; leave these pools alone.
                $result['skipped'] += $ppa->aipEntries->count();

                continue;
            }

            $totalPs = array_sum(
                self::computePsCoaTotalsFromPersonnel($personnel, []),
            );

            foreach ($ppa->aipEntries as $entry) {
                if (self::poolAmountFor($entry) === $totalPs) {
                    $result['unchanged']++;

                    continue;
                }

                self::syncPoolPsAmount($entry, $personnel);

                $result['synced']++;
            }
        }

        return $result;
    }

    /**
     * The PS amount currently written on an entry's pool funding source, or null
     * when the entry has no output or no pool funding source yet.
     */
    private static function poolAmountFor(AipEntry $entry): ?float
    {
        $output = $entry->outputs()->orderBy('sort_order')->first();

        if (! $output) {
            return null;
        }

        $source = $output
            ->fundingSources()
            ->where('funding_source_id', 1)
            ->first();

        return $source ? round((float) $source->ps_amount, 2) : null;
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
     * The chart of accounts comes from the database; personnel comes from the
     * PGLU Space API, scoped to the signed-in user's office so the table matches
     * the personnel schedule page.
     *
     * Opening this page also syncs the fiscal year's PS pool to the same total, so
     * the PS figure the AIP summary shows cannot sit stale while anyone is working
     * through the breakdown.
     *
     * The `ios`, `positions` and `salary_standards` tables are deprecated and are
     * no longer queried here. `MockPersonnelData` still supplies the statutory PS
     * rates, which are not personnel data.
     */
    public function index($fiscalYear, $aipEntry, WorkspacePersonnel $personnel)
    {
        Gate::authorize('viewAny', PsBreakdownItem::class);

        AipEntry::findOrFail($aipEntry);
        $fy = FiscalYear::findOrFail($fiscalYear);

        // The pool belongs to the fiscal year, not to the entry being viewed.
        self::syncPoolForFiscalYear((int) $fy->id);

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

        // The table follows the signed-in user's office, not the PPA's — see the
        // prop comment below.
        $deptCode = request()->user()->office?->load('parent')->deptCode();

        $personnelRows = $personnel->forOffice($deptCode);

        return Inertia::render('ps-breakdown/index', [
            'chartOfAccounts' => $chartOfAccounts,
            'ppaFundingSourceId' => $ppaFundingSourceId
                ? (int) $ppaFundingSourceId
                : null,
            'fiscalYear' => [
                'id' => $fy->id,
                'year' => $fy->year,
            ],
            // The PPA's office, retained for callers that need it. The personnel
            // rows below are scoped to the signed-in user's office instead.
            'officeId' => $officeId,
            'positions' => $personnelRows['positions'],
            'rates' => MockPersonnelData::rates(),
            'annualRateMap' => $personnelRows['annualRateMap'],
            // PROVISIONAL — empty, so casual/contractual proration stays inert
            // and the column that showed it has been removed.
            'monthsOfService' => [],
        ]);
    }
}
