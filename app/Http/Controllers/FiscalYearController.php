<?php

namespace App\Http\Controllers;

use App\Models\FiscalYear;
use App\Models\AipEntry;
use App\Models\Ppa;
use App\Http\Requests\StoreFiscalYearRequest;
use App\Http\Requests\UpdateFiscalYearRequest;
use Inertia\Inertia;
use Illuminate\Http\Request;

class FiscalYearController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('aip/index', [
            'fiscalYears' => FiscalYear::all(),
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
    public function store(StoreFiscalYearRequest $request)
    {
        FiscalYear::create($request->validated());
    }

    /**
     * Display the specified resource.
     */
    public function show(FiscalYear $fiscalYear)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(FiscalYear $fiscalYear)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(
        UpdateFiscalYearRequest $request,
        FiscalYear $fiscal_year,
    ) {
        // $fiscal_year->update($request->validated());
    }

    // update fiscal year status
    public function updateStatus(Request $request, FiscalYear $fiscalYear)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:active,inactive,closed',
        ]);

        $fiscalYear->update($validated);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(FiscalYear $fiscalYear)
    {
        //
    }
}
