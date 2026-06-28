<?php

namespace App\Http\Controllers;

use App\Models\PlantillaPosition;
use App\Http\Requests\StorePlantillaPositionRequest;
use App\Http\Requests\UpdatePlantillaPositionRequest;
use Inertia\Inertia;

class PlantillaPositionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('plantilla-position/index', [
            'plantillaPositions' => PlantillaPosition::with(['office', 'fiscalYear'])->get(),
            'offices' => \App\Models\Office::all(['id', 'name', 'acronym']),
            'fiscalYears' => \App\Models\FiscalYear::all(['id', 'year']),
            'govSalarySchedules' => \App\Models\GovSalarySchedule::all(['fiscal_year_id', 'salary_grade', 'step', 'annual_rate']),
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
    public function store(StorePlantillaPositionRequest $request)
    {
        PlantillaPosition::create($request->validated());

        return redirect()->back();
    }

    /**
     * Display the specified resource.
     */
    public function show(PlantillaPosition $plantillaPosition)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(PlantillaPosition $plantillaPosition)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(
        UpdatePlantillaPositionRequest $request,
        PlantillaPosition $plantillaPosition,
    ) {
        $plantillaPosition->update($request->validated());

        return redirect()->back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PlantillaPosition $plantillaPosition)
    {
        $plantillaPosition->delete();

        return redirect()->back();
    }
}
