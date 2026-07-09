<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSalaryStandardRequest;
use App\Http\Requests\UpdateSalaryStandardRequest;
use App\Models\FiscalYear;
use App\Models\SalaryStandard;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class SalaryStandardController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        Gate::authorize('viewAny', SalaryStandard::class);

        return Inertia::render('salary-standard/index', [
            'salaryStandtards' => SalaryStandard::get(),
            'fiscalYears' => FiscalYear::get(),
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
    public function store(StoreSalaryStandardRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(SalaryStandard $salaryStandard)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(SalaryStandard $salaryStandard)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(
        UpdateSalaryStandardRequest $request,
        SalaryStandard $salaryStandard,
    ) {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(SalaryStandard $salaryStandard)
    {
        //
    }
}
