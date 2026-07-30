<?php

namespace App\Http\Controllers;

use App\Models\AipEntry;
use App\Models\FiscalYear;
use App\Models\FundingSource;
use App\Models\Office;
use App\Models\Ppa;
use App\Models\PpaFundingSource;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AipSummaryImportController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('aip-summary-import/index', [
            'years' => FiscalYear::orderBy('year', 'desc')->get(),
            'offices' => Office::orderBy('name')->get(),
            'fundingSources' => FundingSource::all(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'fiscal_year_id' => 'required|exists:fiscal_years,id',
            'office_id' => 'required|exists:offices,id',
            'ps_pool_temp_id' => 'required|integer',
            'ppas' => 'required|array',
            'ppas.*.tempId' => 'required|integer',
            'ppas.*.parentTempId' => 'nullable|integer',
            'ppas.*.name' => 'required|string',
            'ppas.*.type' =>
                'required|in:Program,Project,Activity,Sub-Activity',
            'aip_entries' => 'required|array',
            'aip_entries.*.ppaTempId' => 'required|integer',
            'aip_entries.*.start_date' => 'nullable|string',
            'aip_entries.*.end_date' => 'nullable|string',
            'aip_entries.*.expected_output' => 'nullable|string',
            'funding_sources' => 'required|array',
            'funding_sources.*.ppaTempId' => 'required|integer',
            'funding_sources.*.funding_source_id' => 'nullable|string',
            'funding_sources.*.ps_amount' => 'nullable|numeric',
            'funding_sources.*.mooe_amount' => 'nullable|numeric',
            'funding_sources.*.fe_amount' => 'nullable|numeric',
            'funding_sources.*.co_amount' => 'nullable|numeric',
            'funding_sources.*.ccet_adaptation' => 'nullable|numeric',
            'funding_sources.*.ccet_mitigation' => 'nullable|numeric',
            'funding_sources.*.cc_typology_id' => 'nullable|integer',
            'funding_code_mappings' => 'nullable|array',
            'funding_code_mappings.*' => 'string',
        ]);

        DB::transaction(function () use ($validated) {
            $tempToRealPpaId = [];
            $tempToRealAipEntryId = [];

            // 1. Insert PPAs, resolve parent_id from temp IDs
            foreach ($validated['ppas'] as $ppa) {
                $realParentId = $ppa['parentTempId']
                    ? $tempToRealPpaId[$ppa['parentTempId']] ?? null
                    : null;

                $model = Ppa::create([
                    'office_id' => $validated['office_id'],
                    'fiscal_year_id' => $validated['fiscal_year_id'],
                    'parent_id' => $realParentId,
                    'name' => $ppa['name'],
                    'type' => $ppa['type'],
                    'code_suffix' =>
                        Ppa::where('parent_id', $realParentId)
                            ->where('type', $ppa['type'])
                            ->count() + 1,
                    'is_active' => true,
                    'is_ps_pool' =>
                        $ppa['tempId'] === $validated['ps_pool_temp_id'],
                ]);

                $tempToRealPpaId[$ppa['tempId']] = $model->id;
            }

            // 2. Insert AIP entries using resolved ppa_id
            foreach ($validated['aip_entries'] as $entry) {
                $realPpaId = $tempToRealPpaId[$entry['ppaTempId']] ?? null;

                if ($realPpaId) {
                    $model = AipEntry::create([
                        'ppa_id' => $realPpaId,
                        'start_date' => $entry['start_date']
                            ? Carbon::createFromFormat(
                                'M-y',
                                $entry['start_date'],
                            )
                                ->startOfMonth()
                                ->format('Y-m-d')
                            : null,
                        'end_date' => $entry['end_date']
                            ? Carbon::createFromFormat(
                                'M-y',
                                $entry['end_date'],
                            )
                                ->startOfMonth()
                                ->format('Y-m-d')
                            : null,
                        'expected_output' => $entry['expected_output'],
                        'is_supplemental' => false,
                    ]);

                    $tempToRealAipEntryId[$entry['ppaTempId']] = $model->id;
                }
            }

            // 3. Insert funding sources using resolved aip_entry_id
            $codeMappings = $validated['funding_code_mappings'] ?? [];

            // Build case-insensitive lookup from user's mappings
            $ciCodeMappings = [];
            foreach ($codeMappings as $key => $value) {
                $ciCodeMappings[strtolower($key)] = $value;
            }

            $fundingSourceLookup = FundingSource::pluck('id', 'code');

            foreach ($validated['funding_sources'] as $fs) {
                $realAipEntryId =
                    $tempToRealAipEntryId[$fs['ppaTempId']] ?? null;

                if (!$realAipEntryId) {
                    continue;
                }

                // Resolve funding_source_id:
                // 1. Get Excel code from the row
                // 2. Map it via user's code mappings (with case-insensitive fallback)
                // 3. Look up the DB code in funding_sources table to get the ID
                $excelCode = $fs['funding_source_id'];
                $resolvedFundingSourceId = null;

                if ($excelCode) {
                    $dbCode =
                        $codeMappings[$excelCode] ??
                        ($ciCodeMappings[strtolower($excelCode)] ?? $excelCode);
                    $resolvedFundingSourceId =
                        $fundingSourceLookup[$dbCode] ?? null;
                }

                PpaFundingSource::create([
                    'aip_entry_id' => $realAipEntryId,
                    'funding_source_id' => $resolvedFundingSourceId,
                    'ps_amount' => $fs['ps_amount'],
                    'mooe_amount' => $fs['mooe_amount'],
                    'fe_amount' => $fs['fe_amount'],
                    'co_amount' => $fs['co_amount'],
                    'ccet_adaptation' => $fs['ccet_adaptation'],
                    'ccet_mitigation' => $fs['ccet_mitigation'],
                    'cc_typology_id' => $fs['cc_typology_id'],
                ]);
            }
        });

        return redirect()
            ->back()
            ->with('success', 'Import completed successfully.');
    }
}
