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
use App\Services\PpaFundingSourceTotalsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class PriceListImportController extends Controller
{
    // ------------------------------------------------------------------
    // Normalization helpers (Spec §4 - 2-Layer Matching)
    // ------------------------------------------------------------------
    private function normalize(string $value): string
    {
        $trimmed = trim($value);
        $collapsed = preg_replace('/\s+/', ' ', $trimmed);
        return strtolower($collapsed ?? $trimmed);
    }

    private function sanitizeCoa(string $value): string
    {
        return str_replace(['-', '.', '/'], '', $this->normalize($value));
    }

    private function sanitizeCategory(string $value): string
    {
        return $this->normalize(str_replace('-', ' ', $value));
    }

    /**
     * Attempt 2-layer resolution for COA raw string against DB maps.
     * Returns [id, layer] where layer is 'strict'|'sanitized'|null
     */
    private function resolveCoaId(string $raw, array $strictMap, array $sanitizedMap): array
    {
        $n = $this->normalize($raw);
        if (isset($strictMap[$n])) {
            return [$strictMap[$n], 'strict'];
        }
        $s = $this->sanitizeCoa($raw);
        if (isset($sanitizedMap[$s])) {
            return [$sanitizedMap[$s], 'sanitized'];
        }
        return [null, null];
    }

    private function resolveCategoryId(string $raw, array $strictMap, array $sanitizedMap): array
    {
        $n = $this->normalize($raw);
        if (isset($strictMap[$n])) {
            return [$strictMap[$n], 'strict'];
        }
        $s = $this->sanitizeCategory($raw);
        if (isset($sanitizedMap[$s])) {
            return [$sanitizedMap[$s], 'sanitized'];
        }
        return [null, null];
    }

    /**
     * Normalized equality for description/UOM (trim + collapse + lower)
     */
    private function normalizedEquals(string $a, string $b): bool
    {
        return $this->normalize($a) === $this->normalize($b);
    }

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
            'id',
            'chart_of_account_id',
            'ppmp_category_id',
        ]);

        $priceListItems = PpmpPriceList::get([
            'id',
            'description',
            'unit_of_measurement',
            'price',
            'chart_of_account_ppmp_category_id',
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
     * Spec §5 Upsert: (junction_id + description + UOM) = uniqueness, update price if exists.
     * Spec §8 Reporting: inserted/updated/warnings/errors with per-row details.
     * Spec §9 Validation: description, UOM, price>0, COA/CAT + junction.
     */
    public function store(Request $request)
    {
        Gate::authorize('create', PpmpPriceList::class);

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
            // Spec §9: price must be >0 (was min:0)
            'items.*.price' => ['required', 'numeric', 'min:0.01'],
            // Optional raw strings for 2-layer warning tracking (forward-compat)
            'items.*.chart_of_account_raw' => ['nullable', 'string'],
            'items.*.ppmp_category_raw' => ['nullable', 'string'],
        ]);

        Log::info(
            'PriceListImport: received '.
                count($validated['items']).
                ' items, validating',
        );

        $inserted = 0;
        $updated = 0;
        $warnings = [];
        $errors = [];
        $errorDetails = [];
        $warningDetails = [];
        $itemNumber = PpmpPriceList::max('item_number') ?? 0;

        // Build strict/sanitized maps for warning detection when raw provided
        $strictCoaMap = [];
        $sanitizedCoaMap = [];
        foreach (ChartOfAccount::whereIn('expense_class', ['MOOE', 'CO'])->get(['id','account_number','account_title']) as $coa) {
            // account_number strict
            $strictCoaMap[$this->normalize($coa->account_number)] = $coa->id;
            $strictCoaMap[$this->normalize($coa->account_title)] = $coa->id;
            $sanitizedCoaMap[$this->sanitizeCoa($coa->account_number)] = $coa->id;
            $sanitizedCoaMap[$this->sanitizeCoa($coa->account_title)] = $coa->id;
        }
        $strictCatMap = [];
        $sanitizedCatMap = [];
        foreach (PpmpCategory::get(['id','name']) as $cat) {
            $strictCatMap[$this->normalize($cat->name)] = $cat->id;
            $sanitizedCatMap[$this->sanitizeCategory($cat->name)] = $cat->id;
        }

        foreach ($validated['items'] as $i => $data) {
            $rowNum = $i + 1;
            try {
                $descRaw = trim((string) $data['description']);
                $uomRaw = trim((string) $data['unit_of_measurement']);
                $price = (float) $data['price'];

                // Spec §9 per-row validations (beyond Laravel rules which already checked)
                if ($descRaw === '') {
                    $msg = "Row {$rowNum}: Description is empty";
                    $errors[] = $msg;
                    $errorDetails[] = ['row' => $rowNum, 'field' => 'description', 'message' => $msg, 'raw' => $data];
                    continue;
                }
                if ($uomRaw === '' || mb_strlen($uomRaw) > 20) {
                    $msg = "Row {$rowNum}: Unit of measurement empty or >20 chars";
                    $errors[] = $msg;
                    $errorDetails[] = ['row' => $rowNum, 'field' => 'unit_of_measurement', 'message' => $msg, 'raw' => $data];
                    continue;
                }
                if ($price <= 0) {
                    $msg = "Row {$rowNum}: Unit price must be >0 (got {$price})";
                    $errors[] = $msg;
                    $errorDetails[] = ['row' => $rowNum, 'field' => 'price', 'message' => $msg, 'raw' => $data];
                    continue;
                }

                // Optional 2-layer warning tracking when raw strings supplied
                if (!empty($data['chart_of_account_raw'])) {
                    [, $coaLayer] = $this->resolveCoaId($data['chart_of_account_raw'], $strictCoaMap, $sanitizedCoaMap);
                    if ($coaLayer === 'sanitized') {
                        $warningDetails[] = ['row' => $rowNum, 'field' => 'chart_of_account', 'raw' => $data['chart_of_account_raw'], 'resolved' => $data['chart_of_account_id'], 'message' => "COA auto-corrected (removed -./)"];
                    } elseif ($coaLayer === null) {
                        // Should not happen because id validated, but log inconsistency
                        $warningDetails[] = ['row' => $rowNum, 'field' => 'chart_of_account', 'raw' => $data['chart_of_account_raw'], 'message' => 'COA raw did not match resolved id'];
                    }
                }
                if (!empty($data['ppmp_category_raw'])) {
                    [, $catLayer] = $this->resolveCategoryId($data['ppmp_category_raw'], $strictCatMap, $sanitizedCatMap);
                    if ($catLayer === 'sanitized') {
                        $warningDetails[] = ['row' => $rowNum, 'field' => 'ppmp_category', 'raw' => $data['ppmp_category_raw'], 'resolved' => $data['ppmp_category_id'], 'message' => "Category auto-corrected (replaced - with space)"];
                    }
                }

                // The pair must already exist; unconfirmed pairs are skipped
                $junction = ChartOfAccountPpmpCategory::where([
                    'chart_of_account_id' => $data['chart_of_account_id'],
                    'ppmp_category_id' => $data['ppmp_category_id'],
                ])->first();

                if (! $junction) {
                    $msg = "Row {$rowNum}: category/COA pair not found in database (chart_of_account_id={$data['chart_of_account_id']}, ppmp_category_id={$data['ppmp_category_id']})";
                    $errors[] = $msg;
                    $errorDetails[] = ['row' => $rowNum, 'field' => 'junction', 'message' => $msg, 'raw' => $data];
                    continue;
                }

                // Spec §5 Upsert: lookup existing by junction + normalized description + normalized UOM
                $existing = PpmpPriceList::where('chart_of_account_ppmp_category_id', $junction->id)
                    ->get()
                    ->first(function ($item) use ($descRaw, $uomRaw) {
                        return $this->normalizedEquals($item->description, $descRaw)
                            && $this->normalizedEquals($item->unit_of_measurement, $uomRaw);
                    });

                if ($existing) {
                    // Update price (and optionally item_number/sort_order if needed)
                    $needsUpdate = ((float)$existing->price !== $price);
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
                $errorDetails[] = ['row' => $i+1, 'message' => $msg, 'exception' => $e->getMessage()];
            }
        }

        $total = count($validated['items']);
        $warningsCount = count($warningDetails);
        $errorsCount = count($errors);
        $hasErrors = $errorsCount > 0;
        $hasWarnings = $warningsCount > 0;

        Log::info(
            "PriceListImport: inserted {$inserted}, updated {$updated}, warnings {$warningsCount}, errors {$errorsCount} / total {$total}",
        );

        $report = [
            'total' => $total,
            'inserted' => $inserted,
            'updated' => $updated,
            'warnings' => $warningsCount,
            'errors' => $errorsCount,
            'warningDetails' => $warningDetails,
            'errorDetails' => $errorDetails,
            'status' => $hasErrors ? ($inserted + $updated > 0 ? 'partial_success' : 'failed') : ($hasWarnings ? 'success_with_warnings' : 'success'),
        ];

        Inertia::flash('importReport', $report);

        if ($hasErrors) {
            $msg = "Import completed: {$inserted} inserted, {$updated} updated, {$warningsCount} warnings, {$errorsCount} errors.";
            if ($warningsCount > 0) $msg .= " {$warningsCount} auto-corrected.";
            Inertia::flash('toast', ['type' => 'error', 'message' => $msg]);
            return redirect()->back();
        }

        $msg = "Imported {$inserted} new, updated {$updated} existing item(s).";
        if ($warningsCount > 0) $msg .= " {$warningsCount} auto-corrected.";
        Inertia::flash('toast', ['type' => 'success', 'message' => $msg]);
        return redirect()->back();
    }

    /**
     * Import monthly quantities into the ppmps table for the selected
     * PPA, funding source, and fiscal year.
     */
    public function importQuantities(
        Request $request,
        PpaFundingSourceTotalsService $totalsService,
    ) {
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
            'PriceListImport.quantities: received '.
                count($validated['rows']).
                ' rows for ppa '.
                $validated['ppa_id'].
                ' / funding source '.
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

        if (! $bridge) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'No funding source found for the selected PPA and fiscal year.',
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
        $errorDetails = [];

        // Suppress the PpmpObserver during the bulk write; totals are
        // synced once for the whole batch below.
        Ppmp::withoutEvents(function () use (
            &$created,
            &$updated,
            &$skippedNoQty,
            &$errors,
            &$errorDetails,
            $validated,
            $months,
            $priceListItems,
        ) {
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

                    $price =
                        $priceListItems->get($data['ppmp_price_list_id'])
                            ?->price ?? 0;

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
                    $msg = 'Row '.($i + 1).': '.$e->getMessage();
                    $errors[] = $msg;
                    $errorDetails[] = ['row' => $i+1, 'message' => $msg];
                }
            }
        });

        $totalsService->syncOne($bridge);

        Log::info(
            "PriceListImport.quantities: created {$created}, updated {$updated}, skipped {$skippedNoQty}, errors ".
                count($errors),
        );

        $report = [
            'total' => count($validated['rows']),
            'inserted' => $created,
            'updated' => $updated,
            'skippedNoQty' => $skippedNoQty,
            'errors' => count($errors),
            'errorDetails' => $errorDetails,
            'status' => !empty($errors) ? 'partial_success' : 'success',
        ];
        Inertia::flash('importReport', $report);

        if (! empty($errors)) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Partially imported with '.
                    count($errors).
                    ' errors. Created '.$created.', updated '.$updated.'.',
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
}
