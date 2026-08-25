<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePpaFundingSourceRequest;
use App\Http\Requests\UpdatePpaFundingSourceRequest;
use App\Models\AipOutput;
use App\Models\PpaFundingSource;
use App\Models\Ppmp;

class PpaFundingSourceController extends Controller
{
    public function store(StorePpaFundingSourceRequest $request, AipOutput $aipOutput)
    {
        $validated = $request->validated();
        $saipId = $validated['supplemental_aip_id'] ?? null;

        $exists = $aipOutput
            ->fundingSources()
            ->where('funding_source_id', $validated['funding_source_id'])
            ->when(
                $saipId,
                fn($query) => $query->where('supplemental_aip_id', $saipId),
                fn($query) => $query->whereNull('supplemental_aip_id'),
            )
            ->exists();

        if ($exists) {
            return redirect()
                ->back()
                ->withErrors([
                    'funding_source_id' =>
                        'This funding source is already assigned to this output.',
                ]);
        }

        $aipOutput->fundingSources()->create([
            'funding_source_id' => $validated['funding_source_id'],
        ]);
    }

    public function destroy(AipOutput $aipOutput, PpaFundingSource $ppaFundingSource)
    {
        if ($ppaFundingSource->aip_output_id !== $aipOutput->id) {
            abort(404, 'Funding source does not belong to this output.');
        }

        $user = auth()->user();

        if (!$user->can('editFundingSources', $aipOutput->aipEntry)) {
            abort(403, 'You do not have permission to edit funding sources.');
        }

        Ppmp::where('ppa_funding_source_id', $ppaFundingSource->id)->delete();

        $ppaFundingSource->delete();
    }

    /**
     * Update PS and FE amounts (manual only).
     */
    public function update(
        UpdatePpaFundingSourceRequest $request,
        PpaFundingSource $ppaFundingSource,
    ) {
        // $user = auth()->user();
        // if (!$user->can('editFundingSources', $ppaFundingSource->aipEntry)) {
        //     abort(403, 'You do not have permission to edit funding sources.');
        // }

        $validated = $request->validated();

        // // Optional: enforce PS‑pool rule (only if you want to keep it)
        // if (isset($validated['ps_amount']) && (float) $validated['ps_amount'] > 0) {
        //     $ppa = $ppaFundingSource->aipEntry?->ppa;
        //     if (!$ppa || !$ppa->is_ps_pool) {
        //         return back()->withErrors([
        //             'ps_amount' =>
        //                 'Personal Services (PS) can only be allocated to the designated PS pool Program.',
        //         ]);
        //     }
        // }

        $ppaFundingSource->update($validated);
    }
}
