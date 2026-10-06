<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

/**
 * The PGLU Space salary schedule, indexed by salary grade.
 *
 * `/salary-grades` returns one row per grade with a `steps` object keyed by step
 * number, so a rate resolves without a request. Grades above 33 are employment-type
 * markers rather than payable schedules — see docs/pgluspace-data-exploration.md §6.
 *
 * Like {@see WorkspacePositionCatalog} this is reference data, so it is fetched once
 * and cached rather than asked for per employee.
 */
class WorkspaceSalarySchedule
{
    private const CACHE_KEY = 'workspace.salary-grades.by-grade';

    /**
     * @var array<int, array<int, int|float>>|null
     */
    private ?array $stepsByGrade = null;

    public function __construct(private readonly WorkspaceApiClient $workspace) {}

    /**
     * The monthly rate for one grade and step, or null when the schedule has no
     * rate for that combination.
     */
    public function monthlyRate(int $salaryGrade, ?int $step): int|float|null
    {
        if ($step === null || $salaryGrade < 1 || $salaryGrade > 33) {
            return null;
        }

        return $this->stepsByGrade()[$salaryGrade][$step] ?? null;
    }

    /**
     * @return array<int, array<int, int|float>>
     */
    private function stepsByGrade(): array
    {
        if ($this->stepsByGrade !== null) {
            return $this->stepsByGrade;
        }

        return $this->stepsByGrade = Cache::remember(
            self::CACHE_KEY,
            now()->addDay(),
            fn (): array => $this->workspace->salaryGrades()
                ->filter(fn (array $row): bool => is_int($row['salary_grade'] ?? null))
                ->mapWithKeys(fn (array $row): array => [
                    $row['salary_grade'] => collect($row['steps'] ?? [])
                        ->map(fn (mixed $rate): int|float => (int) $rate === $rate ? (int) $rate : (float) $rate)
                        ->all(),
                ])
                ->all(),
        );
    }
}
