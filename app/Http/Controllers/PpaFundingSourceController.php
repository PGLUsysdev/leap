<?php

namespace App\Http\Controllers;

use App\Models\AipEntry;
use App\Models\PpaFundingSource;
use App\Models\Ppmp;
use App\Http\Requests\StorePpaFundingSourceRequest;
use App\Http\Requests\UpdatePpaFundingSourceRequest;

class PpaFundingSourceController extends Controller
{
    public function store(StorePpaFundingSourceRequest $request, AipEntry $aipEntry)
    {
        $validated = $request->validated();

        $saipId = $validated['supplemental_aip_id'] ?? null;

        $source = $aipEntry->ppaFundingSources()->create([
            'funding_source_id' => $validated['funding_source_id'],
            'ps_amount' => $validated['ps_amount'],
            'mooe_amount' => $validated['mooe_amount'],
            'fe_amount' => $validated['fe_amount'],
            'co_amount' => $validated['co_amount'],
            'ccet_adaptation' => $validated['ccet_adaptation'] ?? 0,
            'ccet_mitigation' => $validated['ccet_mitigation'] ?? 0,
            'cc_typology_id' => $validated['cc_typology_id'] ?? null,
            'supplemental_aip_id' => $saipId ?: null,
            'is_supplemental' => (bool) $saipId,
        ]);

        return redirect()->back();
    }

    public function destroy(AipEntry $aipEntry, PpaFundingSource $ppaFundingSource)
    {
        $user = auth()->user();

        if (!$user->can('editFundingSources', $aipEntry)) {
            abort(403, 'You do not have permission to edit funding sources.');
        }

        Ppmp::where('ppa_funding_source_id', $ppaFundingSource->id)->delete();

        $ppaFundingSource->delete();

        return response()->json(['success' => true]);
    }
}
