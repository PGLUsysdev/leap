<?php

namespace App\Http\Controllers;

use App\Models\AipEntry;
use App\Models\AipOutput;
use App\Models\CcTypology;
use App\Models\FiscalYear;
use App\Models\FundingSource;
use App\Models\Office;
use App\Models\Ppa;
use App\Models\PpaFundingSource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AipSummaryImportController extends Controller
{
    public function index()
    {
        $fiscalYearId = session('active_fiscal_year_id');

        // All fiscal years (for the dropdown)
        $fiscalYears = FiscalYear::select(['id', 'year', 'status'])
            ->orderBy('year', 'desc')
            ->get();

        $offices = Office::with([
            'sector:id,code',
            'lguLevel:id,code',
            'officeType:id,code',
        ])
            ->orderBy('acronym')
            ->get([
                'id',
                'acronym',
                'name',
                'parent_id',
                'code',
                'sector_id',
                'lgu_level_id',
                'office_type_id',
            ])
            ->map(
                fn (Office $office) => [
                    'id' => $office->id,
                    'acronym' => $office->acronym,
                    'name' => $office->name,
                    'parent_id' => $office->parent_id,
                    'full_code' => $office->full_code,
                ],
            );

        // All PPAs (we'll filter by office + fiscal year on the frontend)
        $ppas = Ppa::with([
            'parent.parent.parent.parent',
            'office.sector',
            'office.lguLevel',
            'office.officeType',
        ])
            ->orderBy('id')
            ->get([
                'id',
                'office_id',
                'parent_id',
                'name',
                'type',
                'code_suffix',
                'fiscal_year_id',
            ])
            ->map(
                fn (Ppa $ppa) => [
                    'id' => $ppa->id,
                    'office_id' => $ppa->office_id,
                    'parent_id' => $ppa->parent_id,
                    'name' => $ppa->name,
                    'type' => $ppa->type,
                    'code_suffix' => $ppa->code_suffix,
                    'full_code' => $ppa->full_code,
                    'fiscal_year_id' => $ppa->fiscal_year_id,
                ],
            );

        $activeFiscalYear = $fiscalYearId
            ? FiscalYear::select(['id', 'year', 'status'])->find($fiscalYearId)
            : null;

        return Inertia::render('aip-summary-import/index', [
            'activeFiscalYear' => $activeFiscalYear,
            'fiscalYears' => $fiscalYears,
            'existingOffices' => $offices,
            'existingPpas' => $ppas,
            'existingOutputs' => AipOutput::join('aip_entries', 'aip_entries.id', '=', 'aip_outputs.aip_entry_id')
                ->join('ppas', 'ppas.id', '=', 'aip_entries.ppa_id')
                ->orderBy('aip_outputs.id')
                ->get([
                    'aip_outputs.id',
                    'aip_outputs.expected_output',
                    'aip_entries.ppa_id',
                    'ppas.office_id',
                    'ppas.fiscal_year_id',
                ])
                ->map(
                    fn ($row) => [
                        'id' => $row->id,
                        'ppa_id' => $row->ppa_id,
                        'office_id' => $row->office_id,
                        'fiscal_year_id' => $row->fiscal_year_id,
                        'expected_output' => $row->expected_output,
                    ],
                ),
            'fundingSources' => FundingSource::select(['id', 'fund_type', 'code', 'title'])
                ->orderBy('code')
                ->get(),
            'ccTypologies' => CcTypology::select(['id', 'code'])
                ->orderBy('code')
                ->get(),
            'existingFundLinks' => PpaFundingSource::join('aip_outputs', 'aip_outputs.id', '=', 'ppa_funding_sources.aip_output_id')
                ->join('aip_entries', 'aip_entries.id', '=', 'aip_outputs.aip_entry_id')
                ->join('ppas', 'ppas.id', '=', 'aip_entries.ppa_id')
                ->orderBy('ppa_funding_sources.id')
                ->get([
                    'ppa_funding_sources.id',
                    'ppa_funding_sources.aip_output_id',
                    'ppa_funding_sources.funding_source_id',
                    'aip_entries.ppa_id',
                    'ppas.office_id',
                    'ppas.fiscal_year_id',
                ])
                ->map(
                    fn ($row) => [
                        'id' => $row->id,
                        'output_id' => $row->aip_output_id,
                        'funding_source_id' => $row->funding_source_id,
                        'ppa_id' => $row->ppa_id,
                        'office_id' => $row->office_id,
                        'fiscal_year_id' => $row->fiscal_year_id,
                    ],
                ),
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('create', Ppa::class);

        $allowedTypes = array_keys(config('ppa.type_padding', []));

        $validated = $request->validate([
            'office_id' => ['required', 'exists:offices,id'],
            'fiscal_year_id' => ['required', 'exists:fiscal_years,id'],
            'blocks' => ['required', 'array', 'min:1'],
            'blocks.*.full_code' => ['required', 'string', 'max:255'],
            'blocks.*.name' => ['required', 'string', 'max:255'],
            'blocks.*.type' => ['required', 'string', Rule::in($allowedTypes)],
        ]);

        $officeId = (int) $validated['office_id'];
        $fiscalYearId = (int) $validated['fiscal_year_id'];

        // Sort parents before children (fewer segments first).
        $blocks = collect($validated['blocks'])
            ->sortBy(fn ($b) => count(explode('-', trim($b['full_code']))))
            ->values();

        // Map normalized full_code => Ppa id for this office + fiscal year
        // (includes rows created earlier in this same request).
        $normalize = fn (string $s): string => strtolower(
            (string) preg_replace("/\s+/", '', trim($s)),
        );
        $existingByCode = Ppa::where('office_id', $officeId)
            ->where('fiscal_year_id', $fiscalYearId)
            ->get()
            ->mapWithKeys(fn (Ppa $ppa) => [$normalize($ppa->full_code) => $ppa->id]);

        $inserted = 0;
        $skipped = 0;
        $details = [];

        DB::transaction(function () use (
            $blocks,
            $officeId,
            $fiscalYearId,
            $normalize,
            &$existingByCode,
            &$inserted,
            &$skipped,
            &$details,
        ) {
            foreach ($blocks as $block) {
                $fullCode = trim($block['full_code']);
                $key = $normalize($fullCode);

                if (isset($existingByCode[$key])) {
                    $skipped++;
                    $details[] = ['full_code' => $fullCode, 'status' => 'skipped: exists'];

                    continue;
                }

                $segments = explode('-', $fullCode);
                // Office prefix (4) + 1-5 PPA suffixes.
                if (count($segments) < 5 || count($segments) > 9) {
                    $skipped++;
                    $details[] = ['full_code' => $fullCode, 'status' => 'skipped: malformed ref code'];

                    continue;
                }

                $parentCode = implode('-', array_slice($segments, 0, -1));
                $parentId = null;
                if (count($segments) > 5) {
                    $parentId = $existingByCode[$normalize($parentCode)] ?? null;
                    if (! $parentId) {
                        $skipped++;
                        $details[] = [
                            'full_code' => $fullCode,
                            'status' => "skipped: parent {$parentCode} not found",
                        ];

                        continue;
                    }
                }

                $rawSuffix = (string) end($segments);
                $codeSuffix = ltrim($rawSuffix, '0');
                $codeSuffix = $codeSuffix === '' ? '0' : $codeSuffix;

                $stats = Ppa::where('office_id', $officeId)
                    ->where('parent_id', $parentId)
                    ->where('fiscal_year_id', $fiscalYearId)
                    ->selectRaw('MAX(sort_order) as max_sort')
                    ->first();

                $ppa = Ppa::create([
                    'office_id' => $officeId,
                    'parent_id' => $parentId,
                    'name' => trim($block['name']),
                    'type' => $block['type'],
                    'code_suffix' => $codeSuffix,
                    'is_active' => true,
                    'sort_order' => (($stats->max_sort ?? -1) + 1),
                    'fiscal_year_id' => $fiscalYearId,
                ]);

                $existingByCode[$key] = $ppa->id;
                // Index by actual full_code too (padding-normalized form).
                $existingByCode[$normalize($ppa->full_code)] = $ppa->id;
                $inserted++;
                $details[] = ['full_code' => $ppa->full_code, 'status' => 'inserted', 'id' => $ppa->id];
            }
        });

        Inertia::flash('importReport', [
            'total' => count($blocks),
            'inserted' => $inserted,
            'skipped' => $skipped,
            'details' => $details,
            'status' => $skipped > 0 && $inserted > 0
                ? 'partial_success'
                : ($inserted > 0 ? 'success' : 'failed'),
        ]);

        if ($skipped > 0 && $inserted > 0) {
            Inertia::flash('toast', ['type' => 'success', 'message' => "Imported {$inserted}, skipped {$skipped} existing."]);
        } elseif ($inserted > 0) {
            Inertia::flash('toast', ['type' => 'success', 'message' => "Imported {$inserted} PPAs."]);
        } else {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'No PPAs imported — all duplicates or invalid.']);
        }

        return redirect()->back();
    }

    public function storeOutputs(Request $request)
    {
        $validated = $request->validate([
            'office_id' => ['required', 'exists:offices,id'],
            'fiscal_year_id' => ['required', 'exists:fiscal_years,id'],
            'outputs' => ['required', 'array', 'min:1'],
            'outputs.*.full_code' => ['nullable', 'string', 'max:255'],
            'outputs.*.name' => ['required', 'string', 'max:255'],
            'outputs.*.expected_output' => ['nullable', 'string', 'max:65535'],
            'outputs.*.start_date' => ['nullable', 'date'],
            'outputs.*.end_date' => ['nullable', 'date'],
            'outputs.*.office_ids' => ['nullable', 'array'],
            'outputs.*.office_ids.*' => ['integer', 'exists:offices,id'],
        ]);

        $officeId = (int) $validated['office_id'];
        $fiscalYearId = (int) $validated['fiscal_year_id'];

        // Same normalization as the frontend `normalize` helper
        // (trim, collapse whitespace, lowercase) — PPAs match by name.
        $normalize = fn (string $s): string => strtolower(
            trim((string) preg_replace('/\s+/', ' ', $s) ?? $s),
        );

        // Index PPAs of this office + fiscal year by normalized name.
        // `type` is selected: `full_code` zero-pads by type for the
        // same-name tiebreak below.
        $ppasByName = Ppa::where('office_id', $officeId)
            ->where('fiscal_year_id', $fiscalYearId)
            ->orderBy('id')
            ->get(['id', 'name', 'type', 'code_suffix', 'parent_id', 'office_id', 'fiscal_year_id'])
            ->groupBy(fn (Ppa $ppa) => $normalize($ppa->name));

        $inserted = 0;
        $skipped = 0;
        $details = [];

        DB::transaction(function () use (
            $validated,
            $normalize,
            $ppasByName,
            &$inserted,
            &$skipped,
            &$details,
        ) {
            foreach ($validated['outputs'] as $i => $item) {
                $expectedRaw = $item['expected_output'] ?? null;
                $expected = $expectedRaw === null || trim($expectedRaw) === ''
                    ? null
                    : trim($expectedRaw);
                $label = trim($item['name']).' / '.($expected ?? '—');
                $skip = function (string $status) use (&$skipped, &$details, $label) {
                    $skipped++;
                    $details[] = ['output' => $label, 'status' => $status];
                };

                $candidates = $ppasByName[$normalize($item['name'])] ?? collect();

                if ($candidates->isEmpty()) {
                    $skip('skipped: no PPA matches name');

                    continue;
                }

                // Disambiguate same-name PPAs by ref code when provided.
                if ($candidates->count() > 1 && ! empty($item['full_code'])) {
                    $codeKey = $normalize($item['full_code']);
                    $byCode = $candidates->filter(
                        fn (Ppa $ppa) => $normalize($ppa->full_code) === $codeKey,
                    );
                    if ($byCode->count() === 1) {
                        $candidates = $byCode;
                    }
                }

                if ($candidates->count() > 1) {
                    $skip('skipped: PPA name is ambiguous');

                    continue;
                }

                /** @var Ppa $ppa */
                $ppa = $candidates->first();

                // Ensure the ancestor chain has bare header entries so the
                // summary tree always has roots to hang children off.
                // Ancestors carry no outputs of their own.
                $ancestorIds = [];
                $ancestor = $ppa->parent;
                while ($ancestor) {
                    $ancestorIds[] = $ancestor->id;
                    $ancestor = $ancestor->parent;
                }
                foreach (array_reverse($ancestorIds) as $ancestorId) {
                    $ancestorEntry = AipEntry::firstOrCreate(['ppa_id' => $ancestorId]);
                    Gate::authorize('update', $ancestorEntry);
                }

                $entry = AipEntry::firstOrCreate(['ppa_id' => $ppa->id]);
                Gate::authorize('update', $entry);

                // Offices are optional on import: a row with any one valid
                // column (office, schedule, or output) imports, attaching
                // whatever offices resolved (possibly none — added later
                // via the edit dialog).
                $officeIds = array_values(array_unique($item['office_ids'] ?? []));

                $start = $item['start_date'] ?? null;
                $end = $item['end_date'] ?? null;
                if ($start && $end && $end < $start) {
                    $skip('skipped: end date before start date');

                    continue;
                }

                $exists = $expected === null
                    ? $entry->outputs()->whereNull('expected_output')->exists()
                    : $entry->outputs()->where('expected_output', $expected)->exists();
                if ($exists) {
                    $skip('skipped: exists');

                    continue;
                }

                $output = $entry->outputs()->create([
                    'expected_output' => $expected,
                    'start_date' => $start,
                    'end_date' => $end,
                    'sort_order' => ((int) $entry->outputs()->max('sort_order')) + 1,
                ]);
                if ($officeIds !== []) {
                    $output->offices()->sync($officeIds);
                }

                $inserted++;
                $details[] = ['output' => $label, 'status' => 'inserted', 'id' => $output->id];
            }
        });

        Inertia::flash('importReport', [
            'total' => count($validated['outputs']),
            'inserted' => $inserted,
            'skipped' => $skipped,
            'details' => $details,
            'status' => $skipped > 0 && $inserted > 0
                ? 'partial_success'
                : ($inserted > 0 ? 'success' : 'failed'),
        ]);

        if ($skipped > 0 && $inserted > 0) {
            Inertia::flash('toast', ['type' => 'success', 'message' => "Imported {$inserted}, skipped {$skipped} outputs."]);
        } elseif ($inserted > 0) {
            Inertia::flash('toast', ['type' => 'success', 'message' => "Imported {$inserted} outputs."]);
        } else {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'No outputs imported — all duplicates or invalid.']);
        }

        return redirect()->back();
    }

    public function storeFundingSources(Request $request)
    {
        $validated = $request->validate([
            'office_id' => ['required', 'exists:offices,id'],
            'fiscal_year_id' => ['required', 'exists:fiscal_years,id'],
            'links' => ['required', 'array', 'min:1'],
            'links.*.full_code' => ['nullable', 'string', 'max:255'],
            'links.*.name' => ['required', 'string', 'max:255'],
            'links.*.expected_output' => ['nullable', 'string', 'max:65535'],
            'links.*.funding_source_id' => ['required', 'integer', 'exists:funding_sources,id'],
            'links.*.ccet_adaptation' => ['nullable', 'numeric', 'min:0'],
            'links.*.ccet_mitigation' => ['nullable', 'numeric', 'min:0'],
            'links.*.cc_typology_id' => ['nullable', 'integer', 'exists:cc_typologies,id'],
        ]);

        $officeId = (int) $validated['office_id'];
        $fiscalYearId = (int) $validated['fiscal_year_id'];

        // Same normalization as the frontend `normalize` helper
        // (trim, collapse whitespace, lowercase) — PPAs match by name.
        $normalize = fn (string $s): string => strtolower(
            trim((string) preg_replace('/\s+/', ' ', $s) ?? $s),
        );

        // Index PPAs of this office + fiscal year by normalized name.
        // `type` is selected: `full_code` zero-pads by type for the
        // same-name tiebreak below.
        $ppasByName = Ppa::where('office_id', $officeId)
            ->where('fiscal_year_id', $fiscalYearId)
            ->orderBy('id')
            ->get(['id', 'name', 'type', 'code_suffix', 'parent_id', 'office_id', 'fiscal_year_id'])
            ->groupBy(fn (Ppa $ppa) => $normalize($ppa->name));

        $inserted = 0;
        $skipped = 0;
        $details = [];

        DB::transaction(function () use (
            $validated,
            $normalize,
            $ppasByName,
            &$inserted,
            &$skipped,
            &$details,
        ) {
            foreach ($validated['links'] as $item) {
                $expectedRaw = $item['expected_output'] ?? null;
                $expected = $expectedRaw === null || trim($expectedRaw) === ''
                    ? null
                    : trim($expectedRaw);
                $label = trim($item['name']).' / '.($expected ?? '—');
                $skip = function (string $status) use (&$skipped, &$details, $label) {
                    $skipped++;
                    $details[] = ['output' => $label, 'status' => $status];
                };

                $candidates = $ppasByName[$normalize($item['name'])] ?? collect();

                if ($candidates->isEmpty()) {
                    $skip('skipped: no PPA matches name');

                    continue;
                }

                // Disambiguate same-name PPAs by ref code when provided.
                if ($candidates->count() > 1 && ! empty($item['full_code'])) {
                    $codeKey = $normalize($item['full_code']);
                    $byCode = $candidates->filter(
                        fn (Ppa $ppa) => $normalize($ppa->full_code) === $codeKey,
                    );
                    if ($byCode->count() === 1) {
                        $candidates = $byCode;
                    }
                }

                if ($candidates->count() > 1) {
                    $skip('skipped: PPA name is ambiguous');

                    continue;
                }

                /** @var Ppa $ppa */
                $ppa = $candidates->first();
                $entry = AipEntry::where('ppa_id', $ppa->id)->first();

                if (! $entry) {
                    $skip('skipped: no AIP entry for PPA (import outputs first)');

                    continue;
                }

                Gate::authorize('update', $entry);

                $outputQuery = $entry->outputs();
                if ($expected === null) {
                    $outputQuery->whereNull('expected_output');
                } else {
                    $outputQuery->where('expected_output', $expected);
                }
                $output = $outputQuery->orderBy('id')->first();

                if (! $output) {
                    $skip('skipped: no matching output (import outputs first)');

                    continue;
                }

                $duplicate = PpaFundingSource::where('aip_output_id', $output->id)
                    ->where('funding_source_id', $item['funding_source_id'])
                    ->whereNull('supplemental_aip_id')
                    ->exists();
                if ($duplicate) {
                    $skip('skipped: exists');

                    continue;
                }

                $link = PpaFundingSource::create([
                    'aip_output_id' => $output->id,
                    'funding_source_id' => $item['funding_source_id'],
                    'ps_amount' => 0,
                    'mooe_amount' => 0,
                    'fe_amount' => 0,
                    'co_amount' => 0,
                    'ccet_adaptation' => $item['ccet_adaptation'] ?? 0,
                    'ccet_mitigation' => $item['ccet_mitigation'] ?? 0,
                    'cc_typology_id' => $item['cc_typology_id'] ?? null,
                ]);

                $inserted++;
                $details[] = ['output' => $label, 'status' => 'inserted', 'id' => $link->id];
            }
        });

        Inertia::flash('importReport', [
            'total' => count($validated['links']),
            'inserted' => $inserted,
            'skipped' => $skipped,
            'details' => $details,
            'status' => $skipped > 0 && $inserted > 0
                ? 'partial_success'
                : ($inserted > 0 ? 'success' : 'failed'),
        ]);

        if ($skipped > 0 && $inserted > 0) {
            Inertia::flash('toast', ['type' => 'success', 'message' => "Imported {$inserted}, skipped {$skipped} fund links."]);
        } elseif ($inserted > 0) {
            Inertia::flash('toast', ['type' => 'success', 'message' => "Imported {$inserted} fund links."]);
        } else {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'No fund links imported — all duplicates or invalid.']);
        }

        return redirect()->back();
    }
}
