<?php

namespace App\Http\Controllers;

use App\Models\AipOutput;
use App\Models\ChartOfAccount;
use App\Models\ChartOfAccountPpmpCategory;
use App\Models\FiscalYear;
use App\Models\Office;
use App\Models\Ppa;
use App\Models\PpaFundingSource;
use App\Models\Ppmp;
use App\Models\PpmpCategory;
use App\Models\PpmpPriceList;
use App\Services\PpaFundingSourceTotalsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class PriceListQuantitiesImportController extends Controller
{
    public function index()
    {
        return Inertia::render('price-list-quantities-import/index', [
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
            'existingOffices' => Office::select(['id', 'name', 'acronym'])
                ->orderBy('name')
                ->get(),
            'fiscalYears' => FiscalYear::select(['id', 'year', 'status'])
                ->orderBy('year', 'desc')
                ->get(),
            'existingPpas' => Ppa::select(['id', 'office_id', 'parent_id', 'name', 'type', 'code_suffix', 'fiscal_year_id'])
                ->orderBy('id')
                ->get()
                ->map(
                    fn (Ppa $ppa) => [
                        'id' => $ppa->id,
                        'office_id' => $ppa->office_id,
                        'parent_id' => $ppa->parent_id,
                        'name' => $ppa->name,
                        'type' => $ppa->type,
                        'full_code' => $ppa->full_code,
                        'fiscal_year_id' => $ppa->fiscal_year_id,
                    ],
                ),
            'existingFundingSources' => PpaFundingSource::select(['id', 'aip_output_id', 'funding_source_id'])
                ->with([
                    'fundingSource:id,code,title',
                    'aipOutput:id,aip_entry_id,expected_output',
                    'aipOutput.aipEntry:id,ppa_id',
                ])
                ->orderBy('id')
                ->get()
                ->map(
                    fn (PpaFundingSource $fundingSource) => [
                        'id' => $fundingSource->id,
                        'aip_output_id' => $fundingSource->aip_output_id,
                        'funding_source_id' => $fundingSource->funding_source_id,
                        'funding_source_code' => $fundingSource->fundingSource?->code,
                        'funding_source_title' => $fundingSource->fundingSource?->title,
                        'expected_output' => $fundingSource->aipOutput?->expected_output,
                        'ppa_id' => $fundingSource->aipOutput?->aipEntry?->ppa_id,
                    ],
                ),
            'existingOutputs' => AipOutput::select(['id', 'aip_entry_id', 'expected_output', 'sort_order'])
                ->with(['aipEntry:id,ppa_id'])
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get()
                ->map(
                    fn (AipOutput $output) => [
                        'id' => $output->id,
                        'expected_output' => $output->expected_output,
                        'sort_order' => $output->sort_order,
                        'ppa_id' => $output->aipEntry?->ppa_id,
                    ],
                ),
        ]);
    }

    public function store(Request $request, PpaFundingSourceTotalsService $totalsService)
    {
        Gate::authorize('addPriceList', Ppmp::class);

        $validated = $request->validate([
            'ppa_id' => ['required', 'integer', 'exists:ppas,id'],
            'aip_output_id' => ['nullable', 'integer', 'exists:aip_outputs,id'],
            'ppa_funding_source_id' => ['nullable', 'integer', 'exists:ppa_funding_sources,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.ppmp_price_list_id' => ['required', 'integer', 'exists:ppmp_price_lists,id'],
            'items.*.qtys' => ['required', 'array', 'size:12'],
            'items.*.qtys.*' => ['integer', 'min:0', 'max:1000000000'],
        ]);

        $ppa = Ppa::findOrFail($validated['ppa_id']);

        $output = null;

        if (! empty($validated['aip_output_id'])) {
            $output = AipOutput::whereKey($validated['aip_output_id'])
                ->whereHas('aipEntry', function ($q) use ($ppa) {
                    $q->where('ppa_id', $ppa->id);
                })
                ->first();

            if (! $output) {
                return redirect()->back()->withErrors([
                    'aip_output_id' => 'Selected output does not belong to the selected PPA.',
                ]);
            }
        }

        $bridge = null;

        if (! empty($validated['ppa_funding_source_id'])) {
            $bridge = PpaFundingSource::whereKey($validated['ppa_funding_source_id'])
                ->whereHas('aipOutput.aipEntry', function ($q) use ($ppa) {
                    $q->where('ppa_id', $ppa->id);
                })
                ->first();

            if (! $bridge) {
                return redirect()->back()->withErrors([
                    'ppa_funding_source_id' => 'Selected funding source does not belong to the selected PPA.',
                ]);
            }

            if ($output && (int) $bridge->aip_output_id !== (int) $output->id) {
                return redirect()->back()->withErrors([
                    'ppa_funding_source_id' => 'Selected funding source does not belong to the selected output.',
                ]);
            }
        }

        $bridge ??= PpaFundingSource::whereHas('aipOutput.aipEntry', function ($q) use ($ppa) {
            $q->where('ppa_id', $ppa->id);
        })->orderBy('id')->first();

        if (! $bridge) {
            return redirect()->back()->withErrors([
                'ppa_id' => 'Selected PPA has no funding source yet — set up its AIP entry/output first.',
            ]);
        }

        $months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

        $priceIds = collect($validated['items'])->pluck('ppmp_price_list_id')->unique()->values()->all();
        $prices = PpmpPriceList::whereIn('id', $priceIds)->pluck('price', 'id');

        $counts = DB::transaction(function () use ($validated, $bridge, $months, $prices) {
            $lockedBridge = PpaFundingSource::whereKey($bridge->id)->lockForUpdate()->firstOrFail();

            $inserted = 0;
            $updated = 0;
            $skipped = 0;

            Ppmp::withoutEvents(function () use ($validated, $lockedBridge, $months, $prices, &$inserted, &$updated, &$skipped) {
                foreach ($validated['items'] as $item) {
                    if (array_sum($item['qtys']) === 0) {
                        $skipped++;

                        continue;
                    }

                    $unitPrice = (float) ($prices[$item['ppmp_price_list_id']] ?? 0);

                    $ppmp = Ppmp::firstOrNew([
                        'ppa_funding_source_id' => $lockedBridge->id,
                        'ppmp_price_list_id' => $item['ppmp_price_list_id'],
                    ]);
                    $isNew = ! $ppmp->exists;

                    $attrs = [];
                    foreach ($months as $i => $m) {
                        $qty = (int) ($item['qtys'][$i] ?? 0);
                        $attrs["{$m}_qty"] = $qty;
                        $attrs["{$m}_amount"] = $qty * $unitPrice;
                    }
                    $ppmp->fill($attrs)->save();

                    if ($isNew) {
                        $inserted++;
                    } else {
                        $updated++;
                    }
                }
            });

            return compact('inserted', 'updated', 'skipped');
        });

        $totalsService->syncOne($bridge->fresh());
        $bridge->refresh();
        $bridge->loadMissing(['fundingSource:id,code,title', 'aipOutput:id,expected_output']);

        $mooe = number_format((float) $bridge->mooe_amount, 2);
        $co = number_format((float) $bridge->co_amount, 2);
        $target = trim(collect([
            $bridge->fundingSource?->code ?? $bridge->fundingSource?->title,
            $bridge->aipOutput?->expected_output,
        ])->filter()->join(' · '));

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Imported {$counts['inserted']} new, updated {$counts['updated']} existing PPMP row(s)".($target !== '' ? " to {$target}" : '').". Totals now MOOE ₱{$mooe}, CO ₱{$co}.",
        ]);

        return redirect()->back();
    }
}
