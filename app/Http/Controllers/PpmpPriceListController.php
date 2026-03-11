<?php

namespace App\Http\Controllers;

use App\Models\PpmpPriceList;
use App\Models\ChartOfAccount;
use App\Models\PpmpCategory;
use App\Http\Requests\StorePpmpPriceListRequest;
use App\Http\Requests\UpdatePpmpPriceListRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PpmpPriceListController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $priceList = PpmpPriceList::with(['chartOfAccount', 'category'])->get();
        $chartOfAccounts = ChartOfAccount::all();
        $ppmpCategory = PpmpCategory::all();

        return Inertia::render('price-list/index', [
            'priceList' => $priceList,
            'chartOfAccounts' => $chartOfAccounts,
            'ppmpCategory' => $ppmpCategory,
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
    public function store(StorePpmpPriceListRequest $request)
    {
        $validated = $request->validated();

        $validatedMapped = [
            'chart_of_account_id' => $validated['expenseAccount'],
            'ppmp_category_id' => $validated['category'],
            'item_number' => $validated['itemNo'],
            'description' => $validated['description'],
            'unit_of_measurement' => $validated['unitOfMeasurement'],
            'price' => $validated['price'],
        ];

        PpmpPriceList::create($validatedMapped);
    }

    /**
     * Display the specified resource.
     */
    public function show(PpmpPriceList $ppmpPriceList)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(PpmpPriceList $ppmpPriceList)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(
        UpdatePpmpPriceListRequest $request,
        PpmpPriceList $ppmpPriceList,
    ) {
        $validated = $request->validated();

        $validatedMapped = [
            'chart_of_account_id' => $validated['expenseAccount'],
            'ppmp_category_id' => $validated['category'],
            'item_number' => $validated['itemNo'],
            'description' => $validated['description'],
            'unit_of_measurement' => $validated['unitOfMeasurement'],
            'price' => $validated['price'],
        ];

        $ppmpPriceList->update($validatedMapped);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PpmpPriceList $ppmpPriceList)
    {
        $ppmpPriceList->delete();
    }
}
