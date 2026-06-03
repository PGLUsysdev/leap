<?php

namespace App\Http\Controllers;

use App\Models\SupplementalAip;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SupplementalAipController extends Controller
{
    public function store(Request $request)
    {
        $this->authorize('create', SupplementalAip::class);

        $validated = $request->validate([
            'fiscal_year_id' => 'required|exists:fiscal_years,id',
            'office_id' => 'nullable|exists:offices,id',
        ]);

        $user = $request->user();
        $officeId = $user->office_id;

        // If admin or control office, allow overriding the office_id
        // if (($user->role === 'admin' || $user->office_id === 2) && isset($validated['office_id'])) {
        //     $officeId = $validated['office_id'];
        // }
        if ($user->office_id === 2 && isset($validated['office_id'])) {
            $officeId = $validated['office_id'];
        }

        // Generate sequential name: Supplemental AIP No. X
        $count = SupplementalAip::where(
            'fiscal_year_id',
            $validated['fiscal_year_id'],
        )
            ->where('office_id', $officeId)
            ->count();

        $name = 'Supplemental AIP No. ' . ($count + 1);

        $saip = SupplementalAip::create([
            'fiscal_year_id' => $validated['fiscal_year_id'],
            'office_id' => $officeId,
            'name' => $name,
        ]);

        return back()->with('success', "{$name} created successfully.");
    }

    public function destroy(SupplementalAip $supplementalAip)
    {
        $this->authorize('delete', $supplementalAip);

        DB::transaction(function () use ($supplementalAip) {
            // Delete PPMPs linked to the funding sources of this SAIP
            $fundingSourceIds = $supplementalAip
                ->ppaFundingSources()
                ->pluck('id');
            \App\Models\Ppmp::whereIn(
                'ppa_funding_source_id',
                $fundingSourceIds,
            )->delete();

            // Delete funding sources
            $supplementalAip->ppaFundingSources()->delete();

            // Delete AIP entries
            $supplementalAip->aipEntries()->delete();

            // Delete PPAs
            $supplementalAip->ppas()->delete();

            // Delete the SAIP itself
            $supplementalAip->delete();
        });

        return back()->with(
            'success',
            'Supplemental AIP deleted successfully.',
        );
    }
}
