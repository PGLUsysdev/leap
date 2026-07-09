<?php

namespace App\Http\Controllers;

use App\Models\Ppmp;
use App\Models\SupplementalAip;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class SupplementalAipController extends Controller
{
    public function store(Request $request)
    {
        Gate::authorize('create', SupplementalAip::class);

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

        $name = 'Supplemental AIP No. '.($count + 1);

        $saip = SupplementalAip::create([
            'fiscal_year_id' => $validated['fiscal_year_id'],
            'office_id' => $officeId,
            'name' => $name,
        ]);

        return back()->with('success', "{$name} created successfully.");
    }

    public function destroy(SupplementalAip $supplementalAip)
    {
        $fiscalYearId = $supplementalAip->fiscal_year_id;
        $officeId = $supplementalAip->office_id;

        Gate::authorize('delete', $supplementalAip);

        DB::transaction(function () use ($supplementalAip) {
            $fundingSourceIds = $supplementalAip
                ->ppaFundingSources()
                ->pluck('id');
            Ppmp::whereIn(
                'ppa_funding_source_id',
                $fundingSourceIds,
            )->delete();

            $supplementalAip->ppaFundingSources()->delete();
            $supplementalAip->aipEntries()->delete();
            $supplementalAip->ppas()->delete();
            $supplementalAip->delete();
        });

        $latestSaip = SupplementalAip::where('fiscal_year_id', $fiscalYearId)
            ->where('office_id', $officeId)
            ->latest('id')
            ->first();

        if ($latestSaip) {
            return redirect()
                ->route('aip.summary', [
                    'fiscalYear' => $fiscalYearId,
                    'scope' => 'supplemental',
                    'supplemental_aip_id' => $latestSaip->id,
                ])
                ->with('success', 'Supplemental AIP deleted successfully.');
        }

        return redirect()
            ->route('aip.summary', [
                'fiscalYear' => $fiscalYearId,
            ])
            ->with('success', 'Supplemental AIP deleted successfully.');
    }
}
