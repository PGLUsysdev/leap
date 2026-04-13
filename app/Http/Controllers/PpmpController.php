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
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class PpmpController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(FiscalYear $fiscalYear, AipEntry $aipEntry)
    {
        $ppmpItems = Ppmp::where('aip_entry_id', $aipEntry->id)
            ->with([
                'fundingSource', // Direct relationship
                'ppmpPriceList.category', // Nested relationships
                'ppmpPriceList.chartOfAccount',
            ])
            ->get();

        $chartOfAccounts = ChartOfAccount::whereIn('expense_class', [
            'MOOE',
            'CO',
        ])
            ->with(['ppmpPriceLists.category'])
            ->get();

        $ppmpCategories = PpmpCategory::all();

        $ppaFundingSources = PpaFundingSource::with('fundingSource')
            ->where('aip_entry_id', $aipEntry->id)
            ->get();

        $selectedAipEntry = AipEntry::with(['ppa'])->find($aipEntry->id);

        return Inertia::render('ppmp/index', [
            'fiscalYear' => $fiscalYear,
            'aipEntry' => $selectedAipEntry,
            'ppmpItems' => $ppmpItems,
            'chartOfAccounts' => $chartOfAccounts,
            'ppmpCategories' => $ppmpCategories,
            'fundingSources' => $ppaFundingSources,
            'initialChoice' => request()->query('choice'),
            'initialFund' => request()->query('fund'),
        ]);
    }

    private function updateAipAmount(
        $aipEntryId,
        $expenseClass,
        $fundingSourceId,
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

        try {
            // 1. Find the AIP Entry to get the PPA ID
            $aipEntry = \App\Models\AipEntry::find($aipEntryId);
            if (!$aipEntry) {
                return;
            }

            // 2. Calculate the sum from the PPMP items
            // filtered by this specific entry AND this specific funding source
            $totalForSource =
                Ppmp::where('aip_entry_id', $aipEntryId)
                    ->where('funding_source_id', $fundingSourceId)
                    ->whereHas('ppmpPriceList.chartOfAccount', function (
                        $query,
                    ) use ($expenseClass) {
                        $query->where('expense_class', $expenseClass);
                    })
                    ->selectRaw(
                        'SUM(jan_amount + feb_amount + mar_amount + apr_amount + may_amount + jun_amount + jul_amount + aug_amount + sep_amount + oct_amount + nov_amount + dec_amount) as total',
                    )
                    ->value('total') ?? 0;

            // 3. Update the ppa_funding_sources table (The new location of truth)
            \App\Models\PpaFundingSource::where('ppa_id', $aipEntry->ppa_id)
                ->where('funding_source_id', $fundingSourceId)
                ->update([
                    $targetColumn => $totalForSource,
                    'updated_at' => now(),
                ]);
        } catch (\Exception $e) {
            \Log::error('Failed to sync Funding totals: ' . $e->getMessage());
        }
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

        $ppmp = Ppmp::create([
            'aip_entry_id' => $validated['aip_entry_id'],
            'ppmp_price_list_id' => $validated['ppmp_price_list_id'],
            'funding_source_id' => $validated['fundingSource'],
            'jan_qty' => 0,
            'jan_amount' => 0,
            'feb_qty' => 0,
            'feb_amount' => 0,
            'mar_qty' => 0,
            'mar_amount' => 0,
            'apr_qty' => 0,
            'apr_amount' => 0,
            'may_qty' => 0,
            'may_amount' => 0,
            'jun_qty' => 0,
            'jun_amount' => 0,
            'jul_qty' => 0,
            'jul_amount' => 0,
            'aug_qty' => 0,
            'aug_amount' => 0,
            'sep_qty' => 0,
            'sep_amount' => 0,
            'oct_qty' => 0,
            'oct_amount' => 0,
            'nov_qty' => 0,
            'nov_amount' => 0,
            'dec_qty' => 0,
            'dec_amount' => 0,
        ]);

        $this->updatePpaFundingSourceTotals(
            $ppmp->aip_entry_id,
            $ppmp->funding_source_id,
            $ppmp->ppmpPriceList->chartOfAccount->expense_class,
        );
    }

    public function updateMonthlyQuantity(Request $request, Ppmp $ppmp)
    {
        $validated = $request->validate([
            'month' =>
                'required|in:jan_qty,feb_qty,mar_qty,apr_qty,may_qty,jun_qty,jul_qty,aug_qty,sep_qty,oct_qty,nov_qty,dec_qty',
            'quantity' => 'required|numeric|min:0',
        ]);

        $monthQty = $validated['month'];
        $monthAmount = str_replace('_qty', '_amount', $monthQty);
        $unitPrice = $ppmp->ppmpPriceList?->price ?? 0;

        $ppmp->update([
            $monthQty => $validated['quantity'],
            $monthAmount => $validated['quantity'] * $unitPrice,
        ]);

        $this->updatePpaFundingSourceTotals(
            $ppmp->aip_entry_id,
            $ppmp->funding_source_id,
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
        // Capture details before deletion
        $aipEntryId = $ppmp->aip_entry_id;
        $fsId = $ppmp->funding_source_id;
        $expenseClass = $ppmp->ppmpPriceList->chartOfAccount->expense_class;

        $ppmp->delete();

        // Re-calculate totals (the sum will now be smaller)
        $this->updatePpaFundingSourceTotals($aipEntryId, $fsId, $expenseClass);
    }

    private function updatePpaFundingSourceTotals(
        $aipEntryId,
        $fundingSourceId,
        $expenseClass,
    ) {
        // Map Expense Class to the actual column in ppa_funding_sources
        $columnMap = [
            'MOOE' => 'mooe_amount',
            'CO' => 'co_amount',
            'PS' => 'ps_amount', // Extension for future-proofing
            'FE' => 'fe_amount', // Extension for future-proofing
        ];

        $targetColumn = $columnMap[$expenseClass] ?? null;

        if (!$targetColumn) {
            return;
        }

        // 1. Calculate the grand total of all 12 months for this specific group
        // We sum every monthly amount column in the database
        $totalAmount =
            Ppmp::where('aip_entry_id', $aipEntryId)
                ->where('funding_source_id', $fundingSourceId)
                ->whereHas('ppmpPriceList.chartOfAccount', function (
                    $query,
                ) use ($expenseClass) {
                    $query->where('expense_class', $expenseClass);
                })
                ->selectRaw(
                    'SUM(
            jan_amount + feb_amount + mar_amount + apr_amount + 
            may_amount + jun_amount + jul_amount + aug_amount + 
            sep_amount + oct_amount + nov_amount + dec_amount
        ) as total',
                )
                ->value('total') ?? 0;

        // 2. Update the PpaFundingSource table
        // We use updateOrCreate in case a row doesn't exist yet for this funding source
        PpaFundingSource::updateOrCreate(
            [
                'aip_entry_id' => $aipEntryId,
                'funding_source_id' => $fundingSourceId,
            ],
            [
                $targetColumn => $totalAmount,
                'updated_at' => now(),
            ],
        );
    }
}
