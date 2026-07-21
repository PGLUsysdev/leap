<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreIosRequest;
use App\Http\Requests\UpdateIosRequest;
use App\Models\FiscalYear;
use App\Models\Ios;
use App\Models\SalaryStandard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class IosController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        Gate::authorize('viewAny', Ios::class);

        $activeYearId = session('active_fiscal_year_id');

        $salaryGrades = collect();
        if ($activeYearId) {
            $salaryGrades = SalaryStandard::where(
                'fiscal_year_id',
                $activeYearId,
            )
                ->selectRaw(
                    'salary_grade, MIN(monthly_rate) as min_rate, MAX(monthly_rate) as max_rate',
                )
                ->groupBy('salary_grade')
                ->orderBy('salary_grade')
                ->get();
        }

        $query = Ios::query();

        if ($request->filled('search')) {
            $searchTerm = $request->query('search');
            $query->where(function ($q) use ($searchTerm) {
                $q->where(
                    'occupational_service_code',
                    'like',
                    '%' . $searchTerm . '%',
                )
                    ->orWhere(
                        'occupational_group_code',
                        'like',
                        '%' . $searchTerm . '%',
                    )
                    ->orWhere('class_id', 'like', '%' . $searchTerm . '%')
                    ->orWhere('class', 'like', '%' . $searchTerm . '%');
            });
        }

        return Inertia::render('ios/index', [
            'ios' => $query->paginate(100)->withQueryString(),
            'salaryGrades' => $salaryGrades,
            'can' => [
                'add' => request()->user()->can('create', Ios::class),
                'edit' => request()->user()->can('update', new Ios()),
                'delete' => request()->user()->can('delete', new Ios()),
            ],
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
    public function store(StoreIosRequest $request)
    {
        Gate::authorize('create', Ios::class);

        Ios::create($request->validated());

        return redirect()->back();
    }

    /**
     * Display the specified resource.
     */
    public function show(Ios $ios)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Ios $ios)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateIosRequest $request, Ios $ios)
    {
        Gate::authorize('update', $ios);

        $ios->update($request->validated());

        return redirect()->back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Ios $ios)
    {
        Gate::authorize('delete', $ios);

        $ios->delete();

        return redirect()->back();
    }
}
