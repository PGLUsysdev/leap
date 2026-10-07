<?php

namespace App\Services;

use App\Http\Controllers\PersonnelScheduleController;
use Illuminate\Support\LazyCollection;

/**
 * Personnel rows for the PS Breakdown table, read from the PGLU Space API.
 *
 * The API exposes people, not plantilla items: there is no item number, no
 * funding flag and no notion of a vacancy. The rows are shaped like the `Position`
 * records the PS Breakdown calculations already consume, so
 * `PsBreakdownController::computePsCoaTotals` and
 * `resources/js/lib/ps-calculations.ts` need no changes.
 *
 * @see PersonnelScheduleController for the personnel
 *      schedule page, which draws from the same endpoint and the same allowlist
 */
class WorkspacePersonnel
{
    /**
     * The only appointments that reach a personnel-driven table.
     *
     * Shared with the personnel schedule page so the two cannot drift apart; the
     * API reports values outside this set that belong on neither LBP Form 3 nor
     * 3A. `null` is absent from the list by design, so rows with no recorded
     * appointment are dropped.
     *
     * @var array<int, string>
     */
    public const LISTED_APPOINTMENT_STATUSES = [
        'PERMANENT',
        'TEMPORARY',
        'COTERMINOUS',
        'ELECTED',
        'CASUAL',
        'CONTRACTUAL',
    ];

    /**
     * Salary grades the API uses as employment-type markers rather than payable
     * grades (35/36/37 job-order-adjacent, 40 an orphan). They carry no rate.
     *
     * @see docs/pgluspace-data-exploration.md §6
     */
    private const MIN_PAYABLE_GRADE = 1;

    private const MAX_PAYABLE_GRADE = 33;

    public function __construct(
        private readonly WorkspaceApiClient $workspace,
        private readonly WorkspacePositionCatalog $positions,
        private readonly WorkspaceSalarySchedule $schedule,
    ) {}

    /**
     * Employees of one PGLU Space department, shaped for the PS Breakdown table.
     *
     * @return array{positions: array<int, array<string, mixed>>, annualRateMap: array<int, array{current: float, budget: float}>}
     */
    public function forOffice(?string $deptCode): array
    {
        if ($deptCode === null) {
            return ['positions' => [], 'annualRateMap' => []];
        }

        $positions = [];
        $annualRateMap = [];

        foreach ($this->listedEmployees($deptCode) as $employee) {
            $id = (int) ($employee['pers_id'] ?? 0);

            if ($id === 0) {
                continue;
            }

            $grade = $this->payableGrade($employee);
            $step = $this->payableStep($employee);
            $monthly = $grade === null
                ? null
                : $this->schedule->monthlyRate($grade, $step);

            $annual = $monthly === null ? null : $monthly * 12;

            $positions[] = [
                'id' => $id,
                // The API reports no office key the table needs; the office is
                // already the scoping filter on the request.
                'office_id' => null,
                // The API exposes no item number. Unused by the PS columns.
                'item_number' => null,
                // PROVISIONAL — every listed appointment is currently booked as
                // permanent, which routes all of them to the 5-01-01-010 salary
                // line. Revisit once CASUAL/CONTRACTUAL are separated out.
                'employment_type' => 'permanent',
                'is_funded' => true,
                // The API has no vacancy concept, so every row is an incumbent.
                'status' => 'occupied',
                'appointment_status' => $employee['appointment_status'] ?? null,
                'ios' => [
                    'id' => null,
                    // The occupational class the PS columns label as "Position".
                    'class' => $this->positions->titleFor(
                        $employee['pos_code'] ?? null,
                    ),
                    'class_id' => $employee['pos_code'] ?? null,
                    'salary_grade' => $grade,
                ],
                'user' => [
                    'id' => $id,
                    'name' => $employee['full_name'] ?? null,
                    'step' => $step,
                ],
            ];

            if ($annual === null) {
                continue;
            }

            // Current year mirrors the proposed year; the personnel schedule
            // page does the same until a fiscal year drives the budget side.
            $annualRateMap[$id] = [
                'current' => (float) $annual,
                'budget' => (float) $annual,
            ];
        }

        return ['positions' => $positions, 'annualRateMap' => $annualRateMap];
    }

    /**
     * The office's employees that carry a listed appointment status.
     *
     * @return LazyCollection<int, array<string, mixed>>
     */
    private function listedEmployees(string $deptCode): LazyCollection
    {
        return $this->workspace
            ->employees(['dept_code' => $deptCode])
            ->filter(fn (array $employee): bool => $this->isListed($employee))
            ->values();
    }

    /**
     * Whether an employee's appointment belongs on a personnel-driven table.
     *
     * Matching is case-insensitive because the API's own filter is case-sensitive;
     * a differently-cased row would otherwise be dropped silently.
     *
     * @param  array<string, mixed>  $employee
     */
    private function isListed(array $employee): bool
    {
        $status = $employee['appointment_status'] ?? null;

        return is_string($status)
            && in_array(
                strtoupper(trim($status)),
                self::LISTED_APPOINTMENT_STATUSES,
                true,
            );
    }

    /**
     * An employee's salary grade, or null when the grade is an employment-type
     * marker or the field is missing.
     *
     * @param  array<string, mixed>  $employee
     */
    private function payableGrade(array $employee): ?int
    {
        $grade = $employee['salary_grade'] ?? null;

        if (! is_int($grade) || $grade < self::MIN_PAYABLE_GRADE || $grade > self::MAX_PAYABLE_GRADE) {
            return null;
        }

        return $grade;
    }

    /**
     * An employee's step, or null when absent. The salary schedule has no rate
     * without one.
     *
     * @param  array<string, mixed>  $employee
     */
    private function payableStep(array $employee): ?int
    {
        $step = $employee['step'] ?? null;

        return is_int($step) && $step >= 1 ? $step : null;
    }
}
