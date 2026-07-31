<?php

namespace App\Http\Controllers;

use App\Models\ChartOfAccount;
use App\Models\ChartOfAccountPpmpCategory;
use App\Models\PpmpCategory;
use App\Models\PpmpPriceList;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class PriceListImportController extends Controller
{
    /**
     * Display the import page with reference data.
     */
    public function index()
    {
        $chartOfAccounts = ChartOfAccount::whereIn('expense_class', [
            'MOOE',
            'CO',
        ])
            ->select('id', 'account_number', 'account_title', 'expense_class')
            ->get();

        $ppmpCategories = PpmpCategory::get(['id', 'name']);

        $dbPairs = ChartOfAccountPpmpCategory::get([
            'chart_of_account_id',
            'ppmp_category_id',
        ]);

        $priceListItems = PpmpPriceList::get([
            'id',
            'description',
            'unit_of_measurement',
            'price',
        ]);

        return Inertia::render('price-list-import/index', [
            'chartOfAccounts' => $chartOfAccounts,
            'ppmpCategories' => $ppmpCategories,
            'dbPairs' => $dbPairs,
            'priceListItems' => $priceListItems,
        ]);
    }

    /**
     * Import resolved price list items.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.chart_of_account_id' => [
                'required',
                'integer',
                'exists:chart_of_accounts,id',
            ],
            'items.*.ppmp_category_id' => [
                'required',
                'integer',
                'exists:ppmp_categories,id',
            ],
            'items.*.description' => ['required', 'string'],
            // DB column is VARCHAR(20) NOT NULL
            'items.*.unit_of_measurement' => ['required', 'string', 'max:20'],
            // DB column is DECIMAL(19,2) NOT NULL
            'items.*.price' => ['required', 'numeric', 'min:0'],
        ]);

        Log::info(
            'PriceListImport: received ' .
                count($validated['items']) .
                ' items, validating',
        );

        $errors = [];
        $created = 0;
        $itemNumber = PpmpPriceList::max('item_number') ?? 0;

        foreach ($validated['items'] as $i => $data) {
            try {
                // The pair must already exist; unconfirmed pairs are skipped
                $junction = ChartOfAccountPpmpCategory::where([
                    'chart_of_account_id' => $data['chart_of_account_id'],
                    'ppmp_category_id' => $data['ppmp_category_id'],
                ])->first();

                if (!$junction) {
                    $errors[] =
                        'Row ' .
                        ($i + 1) .
                        ': category/COA pair not found in database';
                    continue;
                }

                $itemNumber++;

                PpmpPriceList::create([
                    'item_number' => $itemNumber,
                    'sort_order' => $itemNumber,
                    'description' => $data['description'],
                    'unit_of_measurement' => $data['unit_of_measurement'],
                    'price' => $data['price'],
                    'chart_of_account_ppmp_category_id' => $junction->id,
                ]);

                $created++;
            } catch (\Exception $e) {
                $errors[] = 'Row ' . ($i + 1) . ': ' . $e->getMessage();
            }
        }

        Log::info(
            "PriceListImport: created {$created}, errors " . count($errors),
        );

        if (!empty($errors)) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' =>
                    "Partially imported {$created} items with " .
                    count($errors) .
                    ' errors.',
            ]);

            return redirect()->back();
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Imported {$created} price list items successfully.",
        ]);

        return redirect()->back();
    }
}
