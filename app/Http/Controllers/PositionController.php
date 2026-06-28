<?php

namespace App\Http\Controllers;

use App\Models\Office;
use App\Models\Position;
use App\Models\FiscalYear;
use App\Models\SalaryStandard;
use App\Http\Requests\StorePositionRequest;
use App\Http\Requests\UpdatePositionRequest;
use Inertia\Inertia;

class PositionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // The DB 'draft' fiscal year is the year being budgeted FOR (e.g. 2027).
        // LBP Form No. 3:
        //   Current Year (Appropriation) = draft year - 1  (e.g. 2026)
        //   Budget Year                  = draft year       (e.g. 2027)
        $budgetFiscalYear = FiscalYear::where('status', 'draft')->first();

        $currentFiscalYear = $budgetFiscalYear
            ? FiscalYear::where(
                'year',
                (int) $budgetFiscalYear->year - 1,
            )->first()
            : null;

        $currentStandards = $currentFiscalYear
            ? SalaryStandard::where(
                'fiscal_year_id',
                $currentFiscalYear->id,
            )->get()
            : collect();

        $budgetStandards = $budgetFiscalYear
            ? SalaryStandard::where(
                'fiscal_year_id',
                $budgetFiscalYear->id,
            )->get()
            : collect();

        return Inertia::render('position/index', [
            'positions' => Position::with('user')->get(),
            'offices' => Office::all(['id', 'name', 'acronym']),
            'currentStandards' => $currentStandards,
            'budgetStandards' => $budgetStandards,
            'currentFiscalYear' => $currentFiscalYear,
            'budgetFiscalYear' => $budgetFiscalYear,
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
    public function store(StorePositionRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Position $position)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Position $position)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePositionRequest $request, Position $position)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Position $position)
    {
        //
    }
}
