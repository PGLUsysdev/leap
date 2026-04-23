<?php

namespace App\Http\Controllers;

use App\Models\PpmpCategory;
use App\Http\Requests\StorePpmpCategoryRequest;
use App\Http\Requests\UpdatePpmpCategoryRequest;
use App\Models\ChartOfAccount;
use Inertia\Inertia;

class PpmpCategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('ppmp-category/index', [
            'ppmpCategories' => PpmpCategory::all(),
            'chartOfAccounts' => ChartOfAccount::all(),
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
    public function store(StorePpmpCategoryRequest $request)
    {
        $validated = $request->validated();

        PpmpCategory::create($validated);
    }

    /**
     * Display the specified resource.
     */
    public function show(PpmpCategory $ppmpCategory)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(PpmpCategory $ppmpCategory)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(
        UpdatePpmpCategoryRequest $request,
        PpmpCategory $ppmpCategory,
    ) {
        $validated = $request->validated();

        $ppmpCategory->update($validated);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PpmpCategory $ppmpCategory)
    {
        $ppmpCategory->delete();
    }
}
