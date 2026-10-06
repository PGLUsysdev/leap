<?php

namespace App\Services;

use App\Http\Controllers\PsBreakdownController;

/**
 * Mock personnel dataset for the PS Breakdown feature.
 *
 * The `ios`, `positions` and `salary_standards` tables are deprecated — the
 * personnel data (including step) will arrive from an API. Until it does, this
 * service is the single source of truth so the PS Breakdown table and the
 * LBP Form 2 report cannot disagree: both read from here.
 *
 * Replace this service with the API client when the personnel endpoint lands;
 * no caller should need to change, only this file.
 *
 * @see PsBreakdownController
 */
class MockPersonnelData
{
    /**
     * Authorized monthly salary per position id.
     *
     * @var array<int, float>
     */
    private const MONTHLY_SALARY = [
        101 => 90000,
        102 => 50000,
        103 => 36000,
        104 => 26000,
        105 => 20000,
        106 => 26000,
        107 => 14634,
        108 => 19000,
    ];

    /**
     * Statutory PS rates, keyed as `PsRate::rate_key`.
     *
     * @var array<string, float>
     */
    private const RATES = [
        'pera_monthly' => 2000,
        'rata_sg_24_above' => 4000,
        'rata_sg_16_23' => 2000,
        'ta_sg_24_above' => 2000,
        'ta_sg_16_23' => 1000,
        'clothing_annual' => 8000,
        'laundry_monthly' => 150,
        'cash_gift' => 5000,
        'pei_max' => 5000,
        'gsis_percent' => 12,
        'ecip_percent' => 1,
    ];

    /**
     * Positions with their occupational class and incumbent.
     *
     * Shapes match the `Position`, `Ios` and `User` records the frontend
     * `Position` type expects, as plain arrays.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function positions(): array
    {
        return [
            [
                'id' => 101,
                'office_id' => 18,
                'item_number' => 'M-001',
                'employment_type' => 'permanent',
                'is_funded' => true,
                'status' => 'occupied',
                'ios' => [
                    'id' => 101,
                    'class' => 'Provincial Administrator',
                    'class_id' => 'PA-1',
                    'salary_grade' => 24,
                ],
                'user' => [
                    'id' => 1001,
                    'name' => 'Maria Santos',
                    'step' => 3,
                ],
            ],
            [
                'id' => 102,
                'office_id' => 18,
                'item_number' => 'M-002',
                'employment_type' => 'permanent',
                'is_funded' => true,
                'status' => 'occupied',
                'ios' => [
                    'id' => 102,
                    'class' => 'Engineer III',
                    'class_id' => 'E3-1',
                    'salary_grade' => 19,
                ],
                'user' => [
                    'id' => 1002,
                    'name' => 'Jose Reyes',
                    'step' => 2,
                ],
            ],
            [
                'id' => 103,
                'office_id' => 18,
                'item_number' => 'M-003',
                'employment_type' => 'permanent',
                'is_funded' => true,
                'status' => 'occupied',
                'ios' => [
                    'id' => 103,
                    'class' => 'Administrative Officer III',
                    'class_id' => 'AO3-1',
                    'salary_grade' => 15,
                ],
                'user' => [
                    'id' => 1003,
                    'name' => 'Ana Cruz',
                    'step' => 4,
                ],
            ],
            [
                'id' => 104,
                'office_id' => 18,
                'item_number' => 'M-004',
                'employment_type' => 'permanent',
                'is_funded' => true,
                'status' => 'occupied',
                'ios' => [
                    'id' => 104,
                    'class' => 'Administrative Officer I',
                    'class_id' => 'AO1-1',
                    'salary_grade' => 11,
                ],
                'user' => [
                    'id' => 1004,
                    'name' => 'Mark Dela Cruz',
                    'step' => 1,
                ],
            ],
            [
                'id' => 105,
                'office_id' => 18,
                'item_number' => 'M-005',
                'employment_type' => 'permanent',
                'is_funded' => true,
                'status' => 'vacant',
                'ios' => [
                    'id' => 105,
                    'class' => 'Administrative Assistant II',
                    'class_id' => 'AA2-1',
                    'salary_grade' => 8,
                ],
                'user' => null,
            ],
            [
                'id' => 106,
                'office_id' => 18,
                'item_number' => 'M-006',
                'employment_type' => 'casual',
                'is_funded' => true,
                'status' => 'occupied',
                'ios' => [
                    'id' => 106,
                    'class' => 'Project Assistant',
                    'class_id' => 'PAJ-1',
                    'salary_grade' => 11,
                ],
                'user' => [
                    'id' => 1006,
                    'name' => 'Liza Ramos',
                    'step' => 1,
                ],
            ],
            [
                'id' => 107,
                'office_id' => 18,
                'item_number' => 'M-007',
                'employment_type' => 'contractual',
                'is_funded' => true,
                'status' => 'vacant',
                'ios' => [
                    'id' => 107,
                    'class' => 'Administrative Aide I',
                    'class_id' => 'AA1-1',
                    'salary_grade' => 1,
                ],
                'user' => null,
            ],
            [
                'id' => 108,
                'office_id' => 18,
                'item_number' => 'M-008',
                'employment_type' => 'permanent',
                'is_funded' => true,
                'status' => 'occupied',
                'ios' => [
                    'id' => 108,
                    'class' => 'Clerk III',
                    'class_id' => 'C3-1',
                    'salary_grade' => 8,
                ],
                'user' => [
                    'id' => 1008,
                    'name' => 'Nilo Aquino',
                    'step' => 5,
                ],
            ],
        ];
    }

    /**
     * Statutory PS rates consumed by the per-position calculations.
     *
     * @return array<string, float>
     */
    public static function rates(): array
    {
        return self::RATES;
    }

    /**
     * Annual salary per position, keyed by position id.
     *
     * `current` is the prior-year figure and `budget` the proposed one.
     *
     * @return array<int, array{current: int, budget: float}>
     */
    public static function annualRateMap(): array
    {
        $map = [];

        foreach (self::MONTHLY_SALARY as $positionId => $monthly) {
            $map[$positionId] = [
                'current' => (int) round($monthly * 0.95 * 12),
                'budget' => $monthly * 12,
            ];
        }

        return $map;
    }

    /**
     * Months of service per position, keyed by position id.
     *
     * Absent positions are budgeted for a full year by the calculators.
     *
     * @return array<int, int>
     */
    public static function monthsOfService(): array
    {
        return [];
    }
}
