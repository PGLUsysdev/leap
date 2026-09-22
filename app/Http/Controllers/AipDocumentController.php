<?php

namespace App\Http\Controllers;

use App\Models\AipDocument;
use App\Models\Ppmp;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class AipDocumentController extends Controller
{
    public function store(Request $request)
    {
        Gate::authorize('create', AipDocument::class);

        $validated = $request->validate([
            'fiscal_year_id' => 'required|exists:fiscal_years,id',
            'office_id' => 'nullable|exists:offices,id',
            'name' => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        $officeId = $user->office_id;

        // If admin or control office, allow overriding the office_id
        if ($user->office_id === 2 && isset($validated['office_id'])) {
            $officeId = $validated['office_id'];
        }

        // Generate sequential name: Supplemental AIP No. X
        $count = AipDocument::where('fiscal_year_id', $validated['fiscal_year_id'])
            ->where('office_id', $officeId)
            ->supplemental()
            ->count();

        $document = AipDocument::create([
            'fiscal_year_id' => $validated['fiscal_year_id'],
            'office_id' => $officeId,
            'kind' => 'supplemental',
            'name' => $validated['name'] ?: 'Supplemental AIP No.'.($count + 1),
        ]);

        return redirect()
            ->route('aip.summary', [
                'fiscalYear' => $validated['fiscal_year_id'],
                'aip_document_id' => $document->id,
            ])
            ->with('success', "{$document->name} created successfully.");
    }

    public function destroy(AipDocument $aipDocument)
    {
        $fiscalYearId = $aipDocument->fiscal_year_id;

        Gate::authorize('delete', $aipDocument);

        DB::transaction(function () use ($aipDocument) {
            $entryIds = $aipDocument->aipEntries()->pluck('id');

            $outputIds = DB::table('aip_outputs')
                ->whereIn('aip_entry_id', $entryIds)
                ->pluck('id');

            $fundingSourceIds = DB::table('ppa_funding_sources')
                ->whereIn('aip_output_id', $outputIds)
                ->pluck('id');

            Ppmp::whereIn('ppa_funding_source_id', $fundingSourceIds)->delete();

            DB::table('ppa_funding_sources')
                ->whereIn('id', $fundingSourceIds)
                ->delete();

            DB::table('aip_output_office')
                ->whereIn('aip_output_id', $outputIds)
                ->delete();

            DB::table('aip_outputs')->whereIn('id', $outputIds)->delete();

            $aipDocument->aipEntries()->delete();
            $aipDocument->delete();
        });

        $regular = AipDocument::where('fiscal_year_id', $fiscalYearId)
            ->where('office_id', $aipDocument->office_id)
            ->regular()
            ->first();

        return redirect()
            ->route('aip.summary', array_filter([
                'fiscalYear' => $fiscalYearId,
                'aip_document_id' => $regular?->id,
            ]))
            ->with('success', 'Supplemental AIP deleted successfully.');
    }
}
