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
        $selectedAipEntry = AipEntry::with(['ppa', 'ppaFundingSources'])->find(
            $aipEntry->id,
        );

        $ppmps = Ppmp::whereHas('ppaFundingSource', function ($query) use (
            $aipEntry,
        ) {
            $query->where('aip_entry_id', $aipEntry->id);
        })
            ->with([
                'ppaFundingSource.fundingSource',
                'ppmpPriceList.chartOfAccount',
            ])
            ->get();

        $priceLists = PpmpPriceList::with('chartOfAccount', 'category')->get();

        $chartOfAccounts = ChartOfAccount::whereIn('expense_class', [
            'MOOE',
            'CO',
        ])->get();

        $ppmpCategories = PpmpCategory::with('chartOfAccounts')->get();

        $fundingSources = FundingSource::whereHas(
            'ppaFundingSources',
            function ($query) use ($aipEntry) {
                $query->where('aip_entry_id', $aipEntry->id);
            },
        )->get();

        return Inertia::render('ppmp/index', [
            'fiscalYear' => $fiscalYear,
            'aipEntry' => $selectedAipEntry,
            'ppmps' => $ppmps,
            'priceLists' => $priceLists,
            'chartOfAccounts' => $chartOfAccounts,
            'ppmpCategories' => $ppmpCategories,
            'fundingSources' => $fundingSources,
            'initialChoice' => $request->query('choice'),
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
        $validated = $request->validated();

        // Save using the normalized bridge ID
        $ppmp = Ppmp::create([
            'ppa_funding_source_id' => $validated['ppa_funding_source_id'],
            'ppmp_price_list_id' => $validated['ppmp_price_list_id'],
            // quantities default to 0 via DB schema
        ]);

        // Sync the total back to the ppa_funding_sources table
        $this->updatePpaFundingSourceTotals(
            $ppmp->ppaFundingSource,
            $ppmp->ppmpPriceList->chartOfAccount->expense_class,
        );
    }

    public function updateMonthlyQuantity(Request $request, Ppmp $ppmp)
    {
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
            $ppmp->ppmpPriceList->chartOfAccount->expense_class,
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
        $bridge = $ppmp->ppaFundingSource;
        $expenseClass = $ppmp->ppmpPriceList->chartOfAccount->expense_class;

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
                ->whereHas('ppmpPriceList.chartOfAccount', function (
                    $query,
                ) use ($expenseClass) {
                    $query->where('expense_class', $expenseClass);
                })
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
