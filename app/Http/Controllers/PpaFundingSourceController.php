<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePpaFundingSourceRequest;
use App\Models\AipOutput;
use App\Models\PpaFundingSource;
use App\Models\Ppmp;

class PpaFundingSourceController extends Controller
{
    public function store(
        StorePpaFundingSourceRequest $request,
        AipOutput $aipOutput,
    ) {
        $validated = $request->validated();
        $saipId = $validated['supplemental_aip_id'] ?? null;

        $exists = $aipOutput
            ->fundingSources()
            ->where('funding_source_id', $validated['funding_source_id'])
            ->when(
                $saipId,
                function ($query) use ($saipId) {
                    return $query->where('supplemental_aip_id', $saipId);
                },
                function ($query) {
                    return $query->whereNull('supplemental_aip_id');
                },
            )
            ->exists();

        if ($exists) {
            // Return a validation error – Inertia will roll back the optimistic update
            return redirect()
                ->back()
                ->withErrors([
                    'funding_source_id' => 'This funding source is already assigned to this output.',
                ]);
        }

        $aipOutput->fundingSources()->create([
            'funding_source_id' => $validated['funding_source_id'],
        ]);

        // PS Pool sync: if the parent PPA is the PS pool,
        // auto-calculate ps_amount onto the GF Proper funding source (id=1),
        // creating it if needed.
        PsBreakdownController::syncPoolPsAmount(
            $aipOutput->aipEntry,
            $saipId,
        );
    }

    public function destroy(
        AipOutput $aipOutput,
        PpaFundingSource $ppaFundingSource,
    ) {
        if ($ppaFundingSource->aip_output_id !== $aipOutput->id) {
            abort(404, 'Funding source does not belong to this output.');
        }

        $user = auth()->user();

        if (! $user->can('editFundingSources', $aipOutput->aipEntry)) {
            abort(403, 'You do not have permission to edit funding sources.');
        }

        Ppmp::where('ppa_funding_source_id', $ppaFundingSource->id)->delete();

        $ppaFundingSource->delete();
    }
}
