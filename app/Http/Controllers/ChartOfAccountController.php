<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreChartOfAccountRequest;
use App\Http\Requests\UpdateChartOfAccountRequest;
use App\Models\ChartOfAccount;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class ChartOfAccountController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        Gate::authorize('viewAny', ChartOfAccount::class);

        return Inertia::render('chart-of-account/index', [
            'chartOfAccounts' => ChartOfAccount::all(),
            'can' => [
                'add' => request()
                    ->user()
                    ->can('create', ChartOfAccount::class),
                'edit' => request()
                    ->user()
                    ->can('update', new ChartOfAccount),
                'delete' => request()
                    ->user()
                    ->can('delete', new ChartOfAccount),
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
    public function store(StoreChartOfAccountRequest $request)
    {
        Gate::authorize('create', ChartOfAccount::class);

        $validated = $request->validated();

        ChartOfAccount::create($validated);
    }

    /**
     * Display the specified resource.
     */
    public function show(ChartOfAccount $chartOfAccount)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ChartOfAccount $chartOfAccount)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(
        UpdateChartOfAccountRequest $request,
        ChartOfAccount $chartOfAccount,
    ) {
        Gate::authorize('update', $chartOfAccount);

        $validated = $request->validated();

        $chartOfAccount->update($validated);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ChartOfAccount $chartOfAccount)
    {
        Gate::authorize('delete', $chartOfAccount);

        $chartOfAccount->delete();
    }
}
