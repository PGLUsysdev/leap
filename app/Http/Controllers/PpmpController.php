<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePpmpRequest;
use App\Http\Requests\UpdatePpmpRequest;
use App\Models\AipEntry;
use App\Models\ChartOfAccount;
use App\Models\FiscalYear;
use App\Models\PpaFundingSource;
use App\Models\Ppmp;
use App\Models\PpmpCategory;
use App\Models\PpmpPriceList;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class PpmpController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(
        Request $request,
        FiscalYear $fiscalYear,
        AipEntry $aipEntry,
        PpaFundingSource $ppaFundingSource,
    ) {
        Gate::authorize('viewAny', [Ppmp::class, $aipEntry]);

        if ($ppaFundingSource->aip_entry_id !== $aipEntry->id) {
            abort(404);
        }

        // === Filter parameters ===
        $coaFilter = $request->input('coa_id');
        $categoryFilter = $request->input('category_id');

        // === Price Lists (filtered by COA and/or Category) ===
        $priceListsQuery = PpmpPriceList::with(
            'chartOfAccountPpmpCategory.chartOfAccount',
            'chartOfAccountPpmpCategory.ppmpCategory',
        );

        if ($coaFilter) {
            $priceListsQuery->whereHas('chartOfAccountPpmpCategory', function (
                $q,
            ) use ($coaFilter) {
                $q->where('chart_of_account_id', $coaFilter);
            });
        }
        if ($categoryFilter) {
            $priceListsQuery->whereHas('chartOfAccountPpmpCategory', function (
                $q,
            ) use ($categoryFilter) {
                $q->where('ppmp_category_id', $categoryFilter);
            });
        }
        if ($search = $request->input('price_list_search')) {
            $priceListsQuery->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")->orWhere(
                    'item_number',
                    'like',
                    "%{$search}%",
                );
            });
        }

        $usedPriceListIds = Ppmp::where(
            'ppa_funding_source_id',
            $ppaFundingSource->id,
        )
            ->whereNotNull('ppmp_price_list_id')
            ->pluck('ppmp_price_list_id');

        $priceListsQuery->whereNotIn('id', $usedPriceListIds);

        $priceLists = $priceListsQuery->paginate(100, ['*'], 'price_list_page');

        // === Chart of Accounts (filtered by Category) ===
        $coaQuery = ChartOfAccount::whereIn('expense_class', ['MOOE', 'CO']);

        if ($categoryFilter) {
            $coaQuery->whereHas('chartOfAccountPpmpCategories', function (
                $q,
            ) use ($categoryFilter) {
                $q->where('ppmp_category_id', $categoryFilter);
            });
        }

        if ($search = $request->input('coa_search')) {
            $coaQuery->where(function ($q) use ($search) {
                $q->where('account_number', 'like', "%{$search}%")->orWhere(
                    'account_title',
                    'like',
                    "%{$search}%",
                );
            });
        }
        $chartOfAccounts = $coaQuery->paginate(100, ['*'], 'coa_page');

        // === Categories (filtered by COA) ===
        $categoryQuery = PpmpCategory::query();

        if ($coaFilter) {
            $categoryQuery->whereHas('chartOfAccountPpmpCategories', function (
                $q,
            ) use ($coaFilter) {
                $q->where('chart_of_account_id', $coaFilter);
            });
        }

        if ($search = $request->input('category_search')) {
            $categoryQuery->where('name', 'like', "%{$search}%");
        }

        $categories = $categoryQuery->paginate(100, ['*'], 'category_page');

        return Inertia::render('ppmp/index', [
            'aipEntry' => $aipEntry->load('ppa.office'),
            'categories' => $categories,
            'chartOfAccounts' => $chartOfAccounts,
            'fiscalYear' => $fiscalYear,
            'ppaFundingSource' => $ppaFundingSource->load('fundingSource'),
            'ppmpItems' => Ppmp::with([
                'ppmpPriceList.chartOfAccountPpmpCategory.chartOfAccount',
                'ppmpPriceList.chartOfAccountPpmpCategory.ppmpCategory',
            ])
                ->where('ppa_funding_source_id', $ppaFundingSource->id)
                ->get()
                ->sortBy('ppmpPriceList.item_number')
                ->values(),
            'priceLists' => $priceLists,
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
    public function store(StorePpmpRequest $request)
    {
        Gate::authorize('addPriceList', Ppmp::class);

        $validated = $request->validated();

        $ppmp = Ppmp::firstOrCreate([
            'ppa_funding_source_id' => $validated['ppa_funding_source_id'],
            'ppmp_price_list_id' => $validated['ppmp_price_list_id'],
        ]);

        if ($request->filled('month') && $request->filled('quantity')) {
            $monthQty = $validated['month'] . '_qty';
            $monthAmount = $validated['month'] . '_amount';
            $unitPrice = $ppmp->ppmpPriceList?->price ?? 0;
            $newQty = (int) round($validated['quantity']);

            $ppmp->update([
                $monthQty => $newQty,
                $monthAmount => $newQty * $unitPrice,
            ]);
        }
    }

    public function updateMonthlyQuantity(Request $request, Ppmp $ppmp)
    {
        Gate::authorize('editPriceListQuantity', $ppmp);

        $validated = $request->validate([
            'month' => 'required|string',
            'quantity' => 'required|numeric|min:0',
        ]);

        $monthQty = $validated['month'];
        $monthAmount = str_replace('_qty', '_amount', $monthQty);
        $unitPrice = $ppmp->ppmpPriceList?->price ?? 0;

        $roundedQuantity = (int) round($validated['quantity']);

        $ppmp->update([
            $monthQty => $roundedQuantity,
            $monthAmount => $roundedQuantity * $unitPrice,
        ]);

        $this->updatePpaFundingSourceTotals(
            $ppmp->ppaFundingSource,
            $ppmp->ppmpPriceList->chartOfAccountPpmpCategory->chartOfAccount
                ->expense_class,
        );
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Ppmp $ppmp)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePpmpRequest $request, Ppmp $ppmp)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Ppmp $ppmp)
    {
        Gate::authorize('deletePriceList', $ppmp);

        $bridge = $ppmp->ppaFundingSource;
        $expenseClass =
            $ppmp->ppmpPriceList->chartOfAccountPpmpCategory->chartOfAccount
                ->expense_class;

        $ppmp->delete();

        $this->updatePpaFundingSourceTotals($bridge, $expenseClass);
    }

    private function updatePpaFundingSourceTotals(
        PpaFundingSource $bridge,
        $expenseClass,
    ) {
        $columnMap = [
            'MOOE' => 'mooe_amount',
            'CO' => 'co_amount',
            'PS' => 'ps_amount',
            'FE' => 'fe_amount',
        ];

        $targetColumn = $columnMap[$expenseClass] ?? null;

        if (!$targetColumn) {
            return;
        }

        // Sum every month for this specific Bridge Record
        $totalAmount =
            Ppmp::where('ppa_funding_source_id', $bridge->id)
                ->whereHas(
                    'ppmpPriceList.chartOfAccountPpmpCategory.chartOfAccount',
                    function ($query) use ($expenseClass) {
                        $query->where('expense_class', $expenseClass);
                    },
                )
                ->selectRaw(
                    'SUM(jan_amount + feb_amount + mar_amount + apr_amount + may_amount + jun_amount + jul_amount + aug_amount + sep_amount + oct_amount + nov_amount + dec_amount) as total',
                )
                ->value('total') ?? 0;

        // Update the bridge record directly
        $bridge->update([
            $targetColumn => $totalAmount,
            'updated_at' => now(),
        ]);
    }
}
