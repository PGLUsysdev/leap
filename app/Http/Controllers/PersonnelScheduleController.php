<?php

namespace App\Http\Controllers;

use App\Services\WorkspaceApiClient;
use App\Services\WorkspacePositionCatalog;
use App\Services\WorkspaceSalarySchedule;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PersonnelScheduleController extends Controller
{
    /**
     * Appointments that never appear on a personnel schedule.
     *
     * PROVISIONAL — not a finalized rule. Interns, job orders, volunteers and
     * unrecorded appointments are currently kept off the LBP Form 3, but the
     * list is expected to change once the open questions are settled: 60 active
     * rows have no appointment status at all, and `TEMPORARY` is listed despite
     * being almost entirely inactive. See the "Personnel schedule: which
     * appointments are listed" section in docs/pgluspace-data-exploration.md
     * before changing anything here.
     *
     * Values are matched case-insensitively because the filter is case-sensitive
     * on the API side — one differently-cased row would otherwise slip through.
     *
     * @var array<int, string|null>
     */
    private const EXCLUDED_APPOINTMENT_STATUSES = [
        null,
        'CONTRACT OF SERVICE',
        'ITAX',
        'JOB ORDER',
        'OJT',
        'VOLUNTEER',
    ];

    /**
     * Display a listing of the resource.
     *
     * The rows come from the active employees of the signed-in user's office,
     * read from the PGLU Space API. The incumbent name, position title,
     * grade/step and annualized rate are filled in; the effectivity column needs
     * data the API does not expose.
     */
    public function index(
        Request $request,
        WorkspaceApiClient $workspace,
        WorkspacePositionCatalog $positions,
        WorkspaceSalarySchedule $schedule,
    ) {
        $deptCode = $request->user()->office?->load('parent')->deptCode();

        return Inertia::render('personnel-schedule/index', [
            'items' => $this->itemsFor($deptCode, $workspace, $positions, $schedule),
        ]);
    }

    /**
     * Employees of one PGLU Space department as personnel schedule rows.
     *
     * @return array<int, array<string, mixed>>
     */
    private function itemsFor(
        ?string $deptCode,
        WorkspaceApiClient $workspace,
        WorkspacePositionCatalog $positions,
        WorkspaceSalarySchedule $schedule,
    ): array {
        if ($deptCode === null) {
            return [];
        }

        return $workspace->employees(['dept_code' => $deptCode])
            ->reject(fn (array $employee): bool => $this->isExcluded($employee))
            ->map(function (array $employee) use ($positions, $schedule): array {
                // Grade/step and rate stand in for both years until a fiscal
                // year drives the budget side.
                $sgStep = $this->sgStepFor($employee);
                $currentYearAmount = $this->annualAmountFor($employee, $schedule);
                $proposedAmount = $currentYearAmount;

                return [
                    'id' => (int) ($employee['pers_id'] ?? 0),
                    'item_number' => null,
                    'old' => null,
                    'new' => null,
                    'position_title' => $positions->titleFor($employee['pos_code'] ?? null),
                    'incumbent_name' => $employee['full_name'] ?? null,
                    'current_year_sg_step' => $sgStep,
                    'current_year_amount' => $currentYearAmount,
                    'proposed_sg_step' => $sgStep,
                    'proposed_amount' => $proposedAmount,
                    'increase_decrease' => $this->difference($currentYearAmount, $proposedAmount),
                    'step_increment_effectivity' => null,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * An employee's monthly rate annualized, or null when the schedule has none.
     *
     * @param  array<string, mixed>  $employee
     */
    private function annualAmountFor(array $employee, WorkspaceSalarySchedule $schedule): ?string
    {
        $grade = $employee['salary_grade'] ?? null;
        $step = $employee['step'] ?? null;

        if (! is_int($grade) || ! is_int($step)) {
            return null;
        }

        $monthly = $schedule->monthlyRate($grade, $step);

        if ($monthly === null) {
            return null;
        }

        // The schedule publishes a monthly rate; the columns are per annum.
        return number_format(round($monthly * 12, 2), 2, '.', '');
    }

    /**
     * The proposed amount less the current one, or null when either is unknown.
     *
     * A zero difference is a real figure and is kept; the column renders it as a
     * dash. A row whose rate could not be resolved has no difference to report.
     */
    private function difference(?string $currentYearAmount, ?string $proposedAmount): ?string
    {
        if ($currentYearAmount === null || $proposedAmount === null) {
            return null;
        }

        return number_format((float) $proposedAmount - (float) $currentYearAmount, 2, '.', '');
    }

    /**
     * An employee's grade/step as `12/1`, or just `12` when they have no step.
     *
     * Grades outside 1–33 are employment-type markers that the source system
     * stores in the grade column (35 job-order-adjacent, 36 part-time medical,
     * 37 job order, 40 an orphan), so they are not rendered as a salary grade
     * here. See docs/pgluspace-data-exploration.md §6.
     *
     * @param  array<string, mixed>  $employee
     */
    private function sgStepFor(array $employee): ?string
    {
        $grade = $employee['salary_grade'] ?? null;

        if (! is_int($grade) || $grade < 1 || $grade > 33) {
            return null;
        }

        $step = $employee['step'] ?? null;

        if (! is_int($step) || $step < 1) {
            return (string) $grade;
        }

        return sprintf('%d/%d', $grade, $step);
    }

    /**
     * Whether an employee's appointment keeps them off the schedule.
     *
     * @param  array<string, mixed>  $employee
     */
    private function isExcluded(array $employee): bool
    {
        $status = $employee['appointment_status'] ?? null;

        return in_array(
            is_string($status) ? strtoupper(trim($status)) : null,
            self::EXCLUDED_APPOINTMENT_STATUSES,
            true,
        );
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
