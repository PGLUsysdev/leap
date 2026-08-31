<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePpmpCategoryRequest;
use App\Http\Requests\UpdatePpmpCategoryRequest;
use App\Models\ChartOfAccountPpmpCategory;
use App\Models\PpmpCategory;
use App\Models\PpmpPriceList;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class PpmpCategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        Gate::authorize('viewAny', PpmpCategory::class);

        return Inertia::render('ppmp-category/index', [
            'ppmpCategories' => PpmpCategory::select([
                'id',
                'name',
                'is_non_procurement',
            ])->get(),

            'can' => [
                'add' => request()->user()->can('create', PpmpCategory::class),
                'edit' => request()->user()->can('update', new PpmpCategory()),
                'delete' => request()
                    ->user()
                    ->can('delete', new PpmpCategory()),
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
    public function store(StorePpmpCategoryRequest $request)
    {
        Gate::authorize('create', PpmpCategory::class);

        $validated = $request->validated();

        PpmpCategory::create([
            'name' => $validated['name'],
            'is_non_procurement' => $validated['is_non_procurement'],
        ]);
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
        Gate::authorize('update', $ppmpCategory);

        $validated = $request->validated();

        $ppmpCategory->update([
            'name' => $validated['name'],
            'is_non_procurement' => $validated['is_non_procurement'],
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PpmpCategory $ppmpCategory)
    {
        Gate::authorize('delete', $ppmpCategory);

        $hasDependents = $ppmpCategory
            ->chartOfAccountPpmpCategories()
            ->whereHas('ppmpPriceLists')
            ->exists();

        if ($hasDependents && !request('force')) {
            return back()->withErrors([
                'force_delete' =>
                    'This category has dependent PPMP price list items.',
            ]);
        }

        // Delete dependent price lists first, then pivot records, then category
        $pivotIds = $ppmpCategory->chartOfAccountPpmpCategories()->pluck('id');

        PpmpPriceList::whereIn(
            'chart_of_account_ppmp_category_id',
            $pivotIds,
        )->delete();

        $ppmpCategory->chartOfAccountPpmpCategories()->delete();
        $ppmpCategory->delete();

        return redirect()->back();
    }
}
