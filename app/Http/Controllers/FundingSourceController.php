<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Http\Requests\StoreFundingSourceRequest;
use App\Http\Requests\UpdateFundingSourceRequest;

use App\Models\FundingSource;

class FundingSourceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $this->authorize('viewAny', FundingSource::class);

        return Inertia::render('funding-source/index', [
            'fundingSources' => FundingSource::all(),
            'can' => [
                'add' => request()->user()->can('create', FundingSource::class),
                'edit' => request()->user()->can('update', new FundingSource()),
                'delete' => request()
                    ->user()
                    ->can('delete', new FundingSource()),
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
    public function store(StoreFundingSourceRequest $request)
    {
        $this->authorize('create', FundingSource::class);

        $validated = $request->validated();

        FundingSource::create($validated);
    }

    /**
     * Display the specified resource.
     */
    public function show(FundingSource $fundingSource)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(FundingSource $fundingSource)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(
        UpdateFundingSourceRequest $request,
        FundingSource $fundingSource,
    ) {
        $this->authorize('update', $fundingSource);

        $validated = $request->validated();

        $fundingSource->update($validated);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(FundingSource $fundingSource)
    {
        $this->authorize('delete', $fundingSource);

        $fundingSource->delete();
    }
}
