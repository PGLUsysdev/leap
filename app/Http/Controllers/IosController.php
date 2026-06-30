<?php

namespace App\Http\Controllers;

use App\Models\Ios;
use App\Models\SalaryStandard;
use App\Http\Requests\StoreIosRequest;
use App\Http\Requests\UpdateIosRequest;
use Inertia\Inertia;

class IosController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $this->authorize('viewAny', Ios::class);

        $activeYear = \App\Models\FiscalYear::find(
            request()->session()->get('active_fiscal_year_id'),
        );

        $salaryGrades = collect();
        if ($activeYear) {
            $salaryGrades = SalaryStandard::where(
                'fiscal_year_id',
                $activeYear->id,
            )
                ->selectRaw(
                    'salary_grade, MIN(monthly_rate) as min_rate, MAX(monthly_rate) as max_rate',
                )
                ->groupBy('salary_grade')
                ->orderBy('salary_grade')
                ->get();
        }

        return Inertia::render('ios/index', [
            'ios' => Ios::query()->paginate(100)->withQueryString(),
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
        $this->authorize('create', Ios::class);

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
        $this->authorize('update', $ios);

        $ios->update($request->validated());

        return redirect()->back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Ios $ios)
    {
        $this->authorize('delete', $ios);

        $ios->delete();

        return redirect()->back();
    }
}
