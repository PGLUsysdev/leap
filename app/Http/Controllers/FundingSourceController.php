<?php

namespace App\Http\Controllers;

use App\Models\FundingSource;
use App\Http\Requests\StoreFundingSourceRequest;
use App\Http\Requests\UpdateFundingSourceRequest;
use Inertia\Inertia;

class FundingSourceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('funding-source/index', [
            'fundingSources' => FundingSource::all(),
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
        $validated = $request->validated();

        $fundingSource->update($validated);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(FundingSource $fundingSource)
    {
        $fundingSource->delete();
    }
}
