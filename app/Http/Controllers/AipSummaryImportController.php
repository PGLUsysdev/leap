<?php

namespace App\Http\Controllers;

use App\Models\FiscalYear;
use App\Models\Office;
use App\Models\Ppa;
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
}
