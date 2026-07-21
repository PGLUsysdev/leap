<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePositionRequest;
use App\Http\Requests\UpdatePositionRequest;
use App\Models\FiscalYear;
use App\Models\Ios;
use App\Models\Office;
use App\Models\Position;
use App\Models\SalaryStandard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class PositionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        Gate::authorize('viewAny', Position::class);

        $currentFiscalYear = FiscalYear::where('status', 'open')->first();
        $budgetFiscalYear = FiscalYear::where('status', 'draft')->first();

        $iosQuery = Ios::select(['id', 'class', 'salary_grade', 'class_id']);

        if ($request->filled('search')) {
            $searchTerm = $request->query('search');
            $iosQuery->where(function ($q) use ($searchTerm) {
                $q->where('class_id', 'like', '%' . $searchTerm . '%')
                    ->orWhere('class', 'like', '%' . $searchTerm . '%');
            });
        }

        return Inertia::render('position/index', [
            'positions' => Position::with('office', 'ios', 'user')->get(),
            // ->paginate(100)
            // ->withQueryString(),
            'offices' => Office::all(['id', 'name', 'acronym']),
            'iosList' => $iosQuery->paginate(100)->withQueryString(),
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
            'can' => [
                'add' => request()->user()->can('create', Position::class),
                'edit' => request()->user()->can('update', new Position),
                'delete' => request()->user()->can('delete', new Position),
                'export' => request()->user()->can('export', Position::class),
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePositionRequest $request)
    {
        $position = Position::create($request->validated());

        $officeId = $request->validated()['office_id'] ?? null;
        if ($officeId) {
            PsBreakdownController::recalculateOfficePsAmounts((int) $officeId);
        }

        return redirect()->back();
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePositionRequest $request, Position $position)
    {
        $position->update($request->validated());

        PsBreakdownController::recalculateOfficePsAmounts($position->office_id);

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

        $officeId = $position->office_id;
        $position->delete();

        PsBreakdownController::recalculateOfficePsAmounts($officeId);

        return redirect()->back();
    }
}
