<?php

namespace App\Http\Controllers;

use App\Models\ChartOfAccount;
use App\Models\ChartOfAccountPpmpCategory;
use App\Models\FiscalYear;
use App\Models\FundingSource;
use App\Models\Ppa;
use App\Models\PpaFundingSource;
use App\Models\Ppmp;
use App\Models\PpmpCategory;
use App\Models\PpmpPriceList;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
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

        $fiscalYears = FiscalYear::orderByDesc('year')->get(['id', 'year']);

        $ppas = Ppa::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'fiscal_year_id']);

        $fundingSources = FundingSource::orderBy('code')->get([
            'id',
            'code',
            'title',
        ]);

        return Inertia::render('price-list-import/index', [
            'chartOfAccounts' => $chartOfAccounts,
            'ppmpCategories' => $ppmpCategories,
            'dbPairs' => $dbPairs,
            'priceListItems' => $priceListItems,
            'fiscalYears' => $fiscalYears,
            'ppas' => $ppas,
            'fundingSources' => $fundingSources,
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

    /**
     * Import monthly quantities into the ppmps table for the selected
     * PPA, funding source, and fiscal year.
     */
    public function importQuantities(Request $request)
    {
        Gate::authorize('addPriceList', Ppmp::class);

        $months = [
            'jan',
            'feb',
            'mar',
            'apr',
            'may',
            'jun',
            'jul',
            'aug',
            'sep',
            'oct',
            'nov',
            'dec',
        ];

        $qtyRules = [];

        foreach ($months as $month) {
            $qtyRules["rows.*.{$month}_qty"] = ['nullable', 'numeric', 'min:0'];
        }

        $validated = $request->validate([
            'fiscal_year_id' => ['required', 'integer', 'exists:fiscal_years,id'],
            'ppa_id' => ['required', 'integer', 'exists:ppas,id'],
            'funding_source_id' => [
                'required',
                'integer',
                'exists:funding_sources,id',
            ],
            'rows' => ['required', 'array', 'min:1'],
            'rows.*.ppmp_price_list_id' => [
                'required',
                'integer',
                'exists:ppmp_price_lists,id',
            ],
            ...$qtyRules,
        ]);

        Log::info(
            'PriceListImport.quantities: received ' .
                count($validated['rows']) .
                ' rows for ppa ' .
                $validated['ppa_id'] .
                ' / funding source ' .
                $validated['funding_source_id'],
        );

        $bridge = PpaFundingSource::where(
            'funding_source_id',
            $validated['funding_source_id'],
        )
            ->whereHas('aipEntry.ppa', function ($q) use ($validated) {
                $q->where('id', $validated['ppa_id'])->where(
                    'fiscal_year_id',
                    $validated['fiscal_year_id'],
                );
            })
            ->first();

        if (!$bridge) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' =>
                    'No funding source found for the selected PPA and fiscal year.',
            ]);

            return redirect()->back();
        }

        $priceListItems = PpmpPriceList::whereIn(
            'id',
            array_column($validated['rows'], 'ppmp_price_list_id'),
        )
            ->get()
            ->keyBy('id');

        $created = 0;
        $updated = 0;
        $skippedNoQty = 0;
        $errors = [];

        foreach ($validated['rows'] as $i => $data) {
            try {
                $attributes = [];
                $qtySum = 0;

                foreach ($months as $month) {
                    $qty = (int) round($data["{$month}_qty"] ?? 0);
                    $attributes["{$month}_qty"] = $qty;
                    $qtySum += $qty;
                }

                // Skip rows with no quantities at all
                if ($qtySum === 0) {
                    $skippedNoQty++;

                    continue;
                }

                $price = $priceListItems->get($data['ppmp_price_list_id'])?->price ?? 0;

                foreach ($months as $month) {
                    $qty = $attributes["{$month}_qty"];
                    $attributes["{$month}_amount"] = $qty * (float) $price;
                }

                $ppmp = Ppmp::updateOrCreate(
                    [
                        'ppa_funding_source_id' => $bridge->id,
                        'ppmp_price_list_id' => $data['ppmp_price_list_id'],
                    ],
                    $attributes,
                );

                $ppmp->wasRecentlyCreated ? $created++ : $updated++;
            } catch (\Exception $e) {
                $errors[] = 'Row ' . ($i + 1) . ': ' . $e->getMessage();
            }
        }

        $this->syncBridgeTotals($bridge);

        Log::info(
            "PriceListImport.quantities: created {$created}, updated {$updated}, skipped {$skippedNoQty}, errors " .
                count($errors),
        );

        if (!empty($errors)) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' =>
                    'Partially imported with ' .
                    count($errors) .
                    ' errors.',
            ]);

            return redirect()->back();
        }

        $message = "Imported {$created} new and updated {$updated} quantity row(s).";

        if ($skippedNoQty > 0) {
            $message .= " Skipped {$skippedNoQty} row(s) with no quantities.";
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $message,
        ]);

        return redirect()->back();
    }

    private function syncBridgeTotals(PpaFundingSource $bridge): void
    {
        $columnMap = [
            // 'PS' => 'ps_amount',
            'MOOE' => 'mooe_amount',
            // 'FE' => 'fe_amount',
            'CO' => 'co_amount',
        ];

        $totals = array_fill_keys(array_values($columnMap), 0);

        $ppmps = Ppmp::where('ppa_funding_source_id', $bridge->id)
            ->whereHas(
                'ppmpPriceList.chartOfAccountPpmpCategory.chartOfAccount',
            )
            ->with(
                'ppmpPriceList.chartOfAccountPpmpCategory.chartOfAccount:id,expense_class',
            )
            ->get();

        foreach ($ppmps as $ppmp) {
            $expenseClass =
                $ppmp->ppmpPriceList?->chartOfAccountPpmpCategory
                    ?->chartOfAccount?->expense_class;
            $target = $columnMap[$expenseClass] ?? null;

            if (!$target) {
                continue;
            }

            $totals[$target] +=
                (float) $ppmp->jan_amount +
                (float) $ppmp->feb_amount +
                (float) $ppmp->mar_amount +
                (float) $ppmp->apr_amount +
                (float) $ppmp->may_amount +
                (float) $ppmp->jun_amount +
                (float) $ppmp->jul_amount +
                (float) $ppmp->aug_amount +
                (float) $ppmp->sep_amount +
                (float) $ppmp->oct_amount +
                (float) $ppmp->nov_amount +
                (float) $ppmp->dec_amount;
        }

        $bridge->update([
            // 'ps_amount' => $totals['ps_amount'],
            'mooe_amount' => $totals['mooe_amount'],
            // 'fe_amount' => $totals['fe_amount'],
            'co_amount' => $totals['co_amount'],
            'updated_at' => now(),
        ]);
    }
}
