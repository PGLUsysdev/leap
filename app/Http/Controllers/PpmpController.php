<?php

namespace App\Http\Controllers;

use App\Models\FiscalYear;
use App\Models\AipEntry;
use App\Models\Ppmp;
use App\Models\PpmpCategory;
use App\Models\ChartOfAccount;
use App\Models\PpmpPriceList;
use App\Models\FundingSource;
use App\Models\PpaFundingSource;
use App\Http\Requests\StorePpmpRequest;
use App\Http\Requests\UpdatePpmpRequest;
use Illuminate\Http\Request;
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
    ) {
        $this->authorize('viewAny', [Ppmp::class, $aipEntry]);

        $selectedAipEntry = AipEntry::with(['ppa', 'ppaFundingSources'])->find(
            $aipEntry->id,
        );

        $tab = $request->query('tab');

        if ($tab && str_starts_with($tab, 'supplemental_')) {
            $this->authorize('viewSupplemental', Ppmp::class);
        }

        $isSupplemental = !is_null($selectedAipEntry->supplemental_aip_id);

        // Fetch all AIP entries for this PPA to find all SAIPs and the original AIP
        $allAipEntries = AipEntry::where('ppa_id', $selectedAipEntry->ppa_id)
            ->with(['supplementalAip', 'ppaFundingSources', 'ppa'])
            ->get();

        $aipEntryIds = $allAipEntries->pluck('id');

        $ppmps = Ppmp::whereHas('ppaFundingSource', function ($query) use (
            $aipEntryIds,
        ) {
            $query->whereIn('aip_entry_id', $aipEntryIds);
        })
            ->with([
                'ppaFundingSource' => function ($query) {
                    $query->select(
                        'id',
                        'funding_source_id',
                        'supplemental_aip_id',
                        'aip_entry_id',
                    );
                },
                'ppaFundingSource.fundingSource' => function ($query) {
                    $query->select('id', 'code', 'title'); // only 'code' is needed for display
                },
                'ppmpPriceList' => function ($query) {
                    $query->select(
                        'id',
                        'item_number',
                        'description',
                        'unit_of_measurement',
                        'price',
                        'chart_of_account_ppmp_category_id',
                    );
                },
                'ppmpPriceList.chartOfAccountPpmpCategory' => function (
                    $query,
                ) {
                    $query->select(
                        'id',
                        'chart_of_account_id',
                        'ppmp_category_id',
                    );
                },
                'ppmpPriceList.chartOfAccountPpmpCategory.chartOfAccount' => function (
                    $query,
                ) {
                    $query->select(
                        'id',
                        'account_number',
                        'account_title',
                        'expense_class',
                    );
                },
                'ppmpPriceList.chartOfAccountPpmpCategory.ppmpCategory' => function (
                    $query,
                ) {
                    $query->select('id', 'name', 'is_non_procurement');
                },
            ])
            ->get();

        $priceLists = PpmpPriceList::with(
            'chartOfAccountPpmpCategory.chartOfAccount',
            'chartOfAccountPpmpCategory.ppmpCategory',
        )->get();

        $chartOfAccounts = ChartOfAccount::whereIn('expense_class', [
            'MOOE',
            'CO',
        ])->get();

        $ppmpCategories = PpmpCategory::with(
            'chartOfAccountPpmpCategories.chartOfAccount',
        )->get();

        $fundingSources = FundingSource::whereHas(
            'ppaFundingSources',
            function ($query) use ($aipEntryIds) {
                $query->whereIn('aip_entry_id', $aipEntryIds);
            },
        )->get();

        return Inertia::render('ppmp/index', [
            'fiscalYear' => $fiscalYear,
            'aipEntry' => $selectedAipEntry,
            'allAipEntries' => $allAipEntries,
            'ppmps' => $ppmps,
            'isSupplemental' => $isSupplemental,
            'priceLists' => $priceLists,
            'chartOfAccounts' => $chartOfAccounts,
            'ppmpCategories' => $ppmpCategories,
            'fundingSources' => $fundingSources,
            'currentTab' => $tab ?: ($selectedAipEntry->supplemental_aip_id ? "supplemental_{$selectedAipEntry->id}" : 'original'),
            'initialChoice' => $request->query('choice', 'MOOE'),
            'initialPpaFundingSourceId' => $request->query(
                'ppa_funding_source_id',
            ),
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
        $this->authorize('addPriceList', Ppmp::class);

        $validated = $request->validated();

        // Save using the normalized bridge ID
        $ppmp = Ppmp::firstOrCreate([
            'ppa_funding_source_id' => $validated['ppa_funding_source_id'],
            'ppmp_price_list_id' => $validated['ppmp_price_list_id'],
            // quantities default to 0 via DB schema
        ]);

        // Sync the total back to the ppa_funding_sources table
        $this->updatePpaFundingSourceTotals(
            $ppmp->ppaFundingSource,
            $ppmp->ppmpPriceList->chartOfAccountPpmpCategory->chartOfAccount
                ->expense_class,
        );
    }

    public function updateMonthlyQuantity(Request $request, Ppmp $ppmp)
    {
        $this->authorize('editPriceListQuantity', $ppmp);

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

        return back();
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
        $this->authorize('deletePriceList', $ppmp);

        $bridge = $ppmp->ppaFundingSource;
        $expenseClass =
            $ppmp->ppmpPriceList->chartOfAccountPpmpCategory->chartOfAccount
                ->expense_class;

        $ppmp->delete();

        // Recalculate totals after deletion
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
