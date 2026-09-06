<?php

namespace App\Http\Controllers;

use App\Models\ChartOfAccount;
use App\Models\ChartOfAccountPpmpCategory;
use App\Models\PpmpCategory;
use App\Models\PpmpPriceList;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class PriceListImportController extends Controller
{
    private function normalize(string $value): string
    {
        $trimmed = trim($value);
        $collapsed = preg_replace('/\s+/', ' ', $trimmed);

        return strtolower($collapsed ?? $trimmed);
    }

    private function normalizedEquals(string $a, string $b): bool
    {
        return $this->normalize($a) === $this->normalize($b);
    }

    public function index()
    {
        return Inertia::render('price-list-import/index', [
            'existingCategories' => PpmpCategory::select(['id', 'name', 'is_non_procurement', 'is_additional'])
                ->orderBy('name')
                ->get(),
            'existingCoas' => ChartOfAccount::select(['id', 'account_number', 'path', 'account_title'])
                ->where('is_postable', true)
                ->orderBy('path')
                ->get(),
            'existingMappings' => ChartOfAccountPpmpCategory::select(['id', 'chart_of_account_id', 'ppmp_category_id'])
                ->get(),
            'existingPriceLists' => PpmpPriceList::select(['id', 'description', 'unit_of_measurement', 'price', 'chart_of_account_ppmp_category_id'])
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('create', PpmpPriceList::class);

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.chart_of_account_id' => ['required', 'integer', 'exists:chart_of_accounts,id'],
            'items.*.ppmp_category_id' => ['required', 'integer', 'exists:ppmp_categories,id'],
            'items.*.description' => ['required', 'string', 'max:1000'],
            'items.*.unit_of_measurement' => ['required', 'string', 'max:20'],
            'items.*.price' => ['required', 'numeric', 'min:0.01'],
        ]);

        Log::info('PriceListImport: received '.count($validated['items']).' items, validating');

        $inserted = 0;
        $updated = 0;
        $errors = [];
        $errorDetails = [];
        $itemNumber = PpmpPriceList::max('item_number') ?? 0;

        foreach ($validated['items'] as $i => $data) {
            $rowNum = $i + 1;
            try {
                $descRaw = trim((string) $data['description']);
                $uomRaw = trim((string) $data['unit_of_measurement']);
                $price = (float) $data['price'];

                if ($descRaw === '') {
                    $msg = "Row {$rowNum}: Description is empty";
                    $errors[] = $msg;
                    $errorDetails[] = ['row' => $rowNum, 'field' => 'description', 'message' => $msg];

                    continue;
                }
                if ($uomRaw === '' || mb_strlen($uomRaw) > 20) {
                    $msg = "Row {$rowNum}: Unit of measurement empty or >20 chars";
                    $errors[] = $msg;
                    $errorDetails[] = ['row' => $rowNum, 'field' => 'unit_of_measurement', 'message' => $msg];

                    continue;
                }
                if ($price <= 0) {
                    $msg = "Row {$rowNum}: Unit price must be >0 (got {$price})";
                    $errors[] = $msg;
                    $errorDetails[] = ['row' => $rowNum, 'field' => 'price', 'message' => $msg];

                    continue;
                }

                // Must have official mapping – connects to Category Import + Category-COA Mappings
                $junction = ChartOfAccountPpmpCategory::where([
                    'chart_of_account_id' => $data['chart_of_account_id'],
                    'ppmp_category_id' => $data['ppmp_category_id'],
                ])->first();

                if (! $junction) {
                    $msg = "Row {$rowNum}: Category/COA pair not found – create mapping via Category–COA Mappings first (chart_of_account_id={$data['chart_of_account_id']}, ppmp_category_id={$data['ppmp_category_id']})";
                    $errors[] = $msg;
                    $errorDetails[] = ['row' => $rowNum, 'field' => 'junction', 'message' => $msg, 'raw' => $data];

                    continue;
                }

                // Upsert: junction + normalized description + normalized UOM
                $existing = PpmpPriceList::where('chart_of_account_ppmp_category_id', $junction->id)
                    ->get()
                    ->first(function ($item) use ($descRaw, $uomRaw) {
                        return $this->normalizedEquals($item->description, $descRaw)
                            && $this->normalizedEquals($item->unit_of_measurement, $uomRaw);
                    });

                if ($existing) {
                    $needsUpdate = ((float) $existing->price !== $price);
                    if ($needsUpdate) {
                        $existing->update(['price' => $price]);
                    }
                    $updated++;
                    if ($needsUpdate) {
                        Log::info("PriceListImport: Row {$rowNum} updated price for existing id {$existing->id}");
                    }
                } else {
                    $itemNumber++;
                    PpmpPriceList::create([
                        'item_number' => $itemNumber,
                        'sort_order' => $itemNumber,
                        'description' => $descRaw,
                        'unit_of_measurement' => $uomRaw,
                        'price' => $price,
                        'chart_of_account_ppmp_category_id' => $junction->id,
                    ]);
                    $inserted++;
                }
            } catch (\Exception $e) {
                $msg = 'Row '.($i + 1).': '.$e->getMessage();
                $errors[] = $msg;
                $errorDetails[] = ['row' => $i + 1, 'message' => $msg, 'exception' => $e->getMessage()];
            }
        }

        $total = count($validated['items']);
        $errorsCount = count($errors);
        $hasErrors = $errorsCount > 0;

        Log::info("PriceListImport: inserted {$inserted}, updated {$updated}, errors {$errorsCount} / total {$total}");

        $report = [
            'total' => $total,
            'inserted' => $inserted,
            'updated' => $updated,
            'errors' => $errorsCount,
            'errorDetails' => $errorDetails,
            'status' => $hasErrors ? ($inserted + $updated > 0 ? 'partial_success' : 'failed') : 'success',
        ];

        Inertia::flash('importReport', $report);

        if ($hasErrors) {
            $msg = "Import completed: {$inserted} inserted, {$updated} updated, {$errorsCount} errors.";
            Inertia::flash('toast', ['type' => 'error', 'message' => $msg]);

            return redirect()->back();
        }

        $msg = "Imported {$inserted} new, updated {$updated} existing item(s).";
        Inertia::flash('toast', ['type' => 'success', 'message' => $msg]);

        return redirect()->back();
    }
}
