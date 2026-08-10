<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePpaFundingSourceRequest;
use App\Models\AipEntry;
use App\Models\PpaFundingSource;
use App\Models\Ppmp;
use Illuminate\Support\Facades\Log;

class PpaFundingSourceController extends Controller
{
    public function store(
        StorePpaFundingSourceRequest $request,
        AipEntry $aipEntry,
    ) {
        $validated = $request->validated();
        $saipId = $validated['supplemental_aip_id'] ?? null;

        $exists = $aipEntry
            ->ppaFundingSources()
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
            Log::warning('Duplicate funding source assignment attempted.', [
                'aip_entry_id' => $aipEntry->id,
                'funding_source_id' => $request->funding_source_id,
            ]);

            // Return a validation error – Inertia will roll back the optimistic update
            return redirect()
                ->back()
                ->withErrors([
                    'funding_source_id' =>
                        'This funding source is already assigned to this AIP entry.',
                ]);
        }

        $aipEntry->ppaFundingSources()->create([
            'funding_source_id' => $validated['funding_source_id'],
            // 'supplemental_aip_id' => $saipId ?: null,
            // 'is_supplemental' => (bool) $saipId,
        ]);

        // PS Pool sync: if the parent PPA is the PS pool,
        // auto-calculate ps_amount onto the GF Proper funding source (id=1),
        // creating it if needed.
        PsBreakdownController::syncPoolPsAmount($aipEntry, $saipId);
    }

    public function destroy(
        AipEntry $aipEntry,
        PpaFundingSource $ppaFundingSource,
    ) {
        $user = auth()->user();

        if (!$user->can('editFundingSources', $aipEntry)) {
            abort(403, 'You do not have permission to edit funding sources.');
        }

        Ppmp::where('ppa_funding_source_id', $ppaFundingSource->id)->delete();

        $ppaFundingSource->delete();
    }
}
