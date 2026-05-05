<?php

namespace App\Http\Controllers;

use App\Models\Ppmp;
use App\Models\FiscalYear;
use App\Models\PpmpPriceList;
use Inertia\Inertia;

class PpmpSummaryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(FiscalYear $fiscalYear)
    {
        $priceLists = PpmpPriceList::query()
            ->whereHas('ppmps.aipEntry.ppa', function ($query) use (
                $fiscalYear,
            ) {
                $query->where('fiscal_year_id', $fiscalYear->id);
            })
            ->with([
                'category',
                'chartOfAccount',
                'ppmps' => function ($query) use ($fiscalYear) {
                    $query
                        ->whereHas('aipEntry.ppa', function ($q) use (
                            $fiscalYear,
                        ) {
                            $q->where('fiscal_year_id', $fiscalYear->id);
                        })
                        ->with(['aipEntry.ppa.office', 'fundingSource']);
                },
            ])
            ->get()
            ->map(function ($item) {
                // Map through each PPMP entry for this specific item
                $item->ppmps = collect($item->ppmps)->map(function ($ppmp) {
                    // Calculate Quarterly Quantities
                    $ppmp->q1_qty =
                        $ppmp->jan_qty + $ppmp->feb_qty + $ppmp->mar_qty;
                    $ppmp->q2_qty =
                        $ppmp->apr_qty + $ppmp->may_qty + $ppmp->jun_qty;
                    $ppmp->q3_qty =
                        $ppmp->jul_qty + $ppmp->aug_qty + $ppmp->sep_qty;
                    $ppmp->q4_qty =
                        $ppmp->oct_qty + $ppmp->nov_qty + $ppmp->dec_qty;

                    // Calculate Quarterly Amounts
                    $ppmp->q1_amount =
                        $ppmp->jan_amount +
                        $ppmp->feb_amount +
                        $ppmp->mar_amount;
                    $ppmp->q2_amount =
                        $ppmp->apr_amount +
                        $ppmp->may_amount +
                        $ppmp->jun_amount;
                    $ppmp->q3_amount =
                        $ppmp->jul_amount +
                        $ppmp->aug_amount +
                        $ppmp->sep_amount;
                    $ppmp->q4_amount =
                        $ppmp->oct_amount +
                        $ppmp->nov_amount +
                        $ppmp->dec_amount;

                    // Grand Totals for this specific PPMP record
                    $ppmp->total_qty =
                        $ppmp->q1_qty +
                        $ppmp->q2_qty +
                        $ppmp->q3_qty +
                        $ppmp->q4_qty;
                    $ppmp->total_amount =
                        $ppmp->q1_amount +
                        $ppmp->q2_amount +
                        $ppmp->q3_amount +
                        $ppmp->q4_amount;

                    return $ppmp;
                });

                return $item;
            });

        return Inertia::render('ppmp-summary/index', [
            'priceLists' => $priceLists,
            'fiscalYear' => $fiscalYear,
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
    public function store(StorePpmpSummaryRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(PpmpSummary $ppmpSummary)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(PpmpSummary $ppmpSummary)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(
        UpdatePpmpSummaryRequest $request,
        PpmpSummary $ppmpSummary,
    ) {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PpmpSummary $ppmpSummary)
    {
        //
    }
}
