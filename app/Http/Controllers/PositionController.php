<?php

namespace App\Http\Controllers;

use App\Models\FiscalYear;
use App\Models\Ios;
use App\Models\Office;
use App\Models\Position;
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
        $currentFiscalYear = FiscalYear::where('status', 'open')->first();
        $budgetFiscalYear = FiscalYear::where('status', 'draft')->first();

        return Inertia::render('position/index', [
            'positions' => Position::with('office', 'ios', 'user')->get(),
            // ->paginate(100)
            // ->withQueryString(),
            'offices' => Office::all(['id', 'name', 'acronym']),
            'iosList' => Ios::all(['id', 'class', 'salary_grade']),
            'currentFiscalYear' => $currentFiscalYear,
            'budgetFiscalYear' => $budgetFiscalYear,
            'currentStandards' => $currentFiscalYear
                ? SalaryStandard::where(
                    'fiscal_year_id',
                    $currentFiscalYear->id,
                )->get()
                : [],
            'budgetStandards' => $budgetFiscalYear
                ? SalaryStandard::where(
                    'fiscal_year_id',
                    $budgetFiscalYear->id,
                )->get()
                : [],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePositionRequest $request)
    {
        Position::create($request->validated());

        return redirect()->back();
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePositionRequest $request, Position $position)
    {
        $position->update($request->validated());

        return redirect()->back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Position $position)
    {
        // Unassign any users before deleting
        $position->user()?->update([
            'position_id' => null,
            'step' => null,
        ]);

        $position->delete();

        return redirect()->back();
    }
}
