<?php

namespace App\Http\Controllers;

use App\Models\PpmpCategory;
use App\Http\Requests\StorePpmpCategoryRequest;
use App\Http\Requests\UpdatePpmpCategoryRequest;
use App\Models\ChartOfAccount;
use App\Models\ChartOfAccountPpmpCategory;
use Inertia\Inertia;

class PpmpCategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $this->authorize('viewAny', PpmpCategory::class);

        $ppmpCategories = PpmpCategory::with(
            'chartOfAccountPpmpCategories',
        )->get();

        return Inertia::render('ppmp-category/index', [
            'ppmpCategories' => $ppmpCategories,
            'chartOfAccounts' => ChartOfAccount::all(),
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
        $this->authorize('create', PpmpCategory::class);

        $validated = $request->validated();

        $ppmpCategory = PpmpCategory::create([
            'name' => $validated['name'],
            'is_non_procurement' => $validated['is_non_procurement'],
        ]);

        foreach ($validated['chart_of_accounts'] ?? [] as $coaId) {
            ChartOfAccountPpmpCategory::create([
                'chart_of_account_id' => $coaId,
                'ppmp_category_id' => $ppmpCategory->id,
            ]);
        }
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
        $this->authorize('update', $ppmpCategory);

        $validated = $request->validated();

        $ppmpCategory->update([
            'name' => $validated['name'],
            'is_non_procurement' => $validated['is_non_procurement'],
        ]);

        $ppmpCategory->chartOfAccountPpmpCategories()->delete();
        foreach ($validated['chart_of_accounts'] ?? [] as $coaId) {
            ChartOfAccountPpmpCategory::create([
                'chart_of_account_id' => $coaId,
                'ppmp_category_id' => $ppmpCategory->id,
            ]);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PpmpCategory $ppmpCategory)
    {
        $this->authorize('delete', $ppmpCategory);

        $ppmpCategory->chartOfAccountPpmpCategories()->delete();
        $ppmpCategory->delete();
    }
}
