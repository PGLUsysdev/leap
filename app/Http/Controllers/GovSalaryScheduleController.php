<?php

namespace App\Http\Controllers;

use App\Models\GovSalarySchedule;
use App\Http\Requests\StoreGovSalaryScheduleRequest;
use App\Http\Requests\UpdateGovSalaryScheduleRequest;
use Inertia\Inertia;

class GovSalaryScheduleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $schedules = GovSalarySchedule::with('fiscalYear')->get();

        $maxStep = $schedules->max('step') ?? 8;

        $grouped = $schedules->groupBy(fn($item) => $item->fiscal_year_id . '-' . $item->salary_grade);

        $matrix = $grouped->map(function ($items, $key) use ($maxStep) {
            $first = $items->first();
            $parts = explode('-', $key);

            $row = [
                'id' => $key,
                'fiscal_year_id' => $first->fiscal_year_id,
                'fiscal_year' => $first->fiscalYear?->year,
                'salary_grade' => (int) $parts[1],
                'tranche_id' => $first->tranche_id,
            ];

            for ($step = 1; $step <= $maxStep; $step++) {
                $match = $items->firstWhere('step', $step);
                $row["step_{$step}"] = $match ? (float) $match->annual_rate : null;
            }

            return $row;
        })->values()->sortBy('salary_grade')->values();

        return Inertia::render('salary-schedule/index', [
            'salarySchedules' => $matrix,
            'maxStep' => $maxStep,
        ]);
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
    public function store(StoreGovSalaryScheduleRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(GovSalarySchedule $govSalarySchedule)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(GovSalarySchedule $govSalarySchedule)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(
        UpdateGovSalaryScheduleRequest $request,
        GovSalarySchedule $govSalarySchedule,
    ) {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(GovSalarySchedule $govSalarySchedule)
    {
        //
    }
}
