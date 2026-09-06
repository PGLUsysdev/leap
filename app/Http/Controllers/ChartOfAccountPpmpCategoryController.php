<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreChartOfAccountPpmpCategoryRequest;
use App\Models\ChartOfAccount;
use App\Models\ChartOfAccountPpmpCategory;
use App\Models\PpmpCategory;
use App\Models\PpmpPriceList;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class ChartOfAccountPpmpCategoryController extends Controller
{
    /**
     * Display a listing of the mappings.
     */
    public function index()
    {
        Gate::authorize('viewAny', PpmpCategory::class);

        return Inertia::render('ppmp-category-mappings/index', [
            'mappings' => ChartOfAccountPpmpCategory::with([
                'ppmpCategory:id,name,is_non_procurement,is_additional',
                'chartOfAccount:id,account_number,path,account_title,expense_class,description',
            ])
                ->withCount('ppmpPriceLists')
                ->orderBy('id')
                ->get(),
            'categories' => PpmpCategory::select(['id', 'name', 'is_non_procurement', 'is_additional'])
                ->orderBy('name')
                ->get(),
            'chartOfAccounts' => ChartOfAccount::select([
                'id',
                'account_number',
                'path',
                'account_title',
                'expense_class',
                'description',
            ])
                ->where('is_postable', true)
                ->orderBy('path')
                ->get(),
            'can' => [
                'add' => request()->user()->can('create', PpmpCategory::class),
                'delete' => request()->user()->can('delete', new PpmpCategory),
            ],
        ]);
    }

    /**
     * Store a newly created mapping.
     */
    public function store(StoreChartOfAccountPpmpCategoryRequest $request)
    {
        Gate::authorize('create', PpmpCategory::class);

        $validated = $request->validated();

        ChartOfAccountPpmpCategory::create($validated);
    }

    /**
     * Remove the specified mapping.
     */
    public function destroy(ChartOfAccountPpmpCategory $chartOfAccountPpmpCategory)
    {
        Gate::authorize('delete', $chartOfAccountPpmpCategory->ppmpCategory);

        $hasDependents = $chartOfAccountPpmpCategory->ppmpPriceLists()->exists();

        if ($hasDependents && ! request('force')) {
            return back()->withErrors([
                'force_delete' => 'This mapping has dependent PPMP price list items. Continuing will delete all price list items associated with this mapping.',
            ]);
        }

        if ($hasDependents) {
            PpmpPriceList::where(
                'chart_of_account_ppmp_category_id',
                $chartOfAccountPpmpCategory->id,
            )->delete();
        }

        $chartOfAccountPpmpCategory->delete();

        return redirect()->back();
    }
}
