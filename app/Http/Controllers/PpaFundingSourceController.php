<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePpaFundingSourceRequest;
use App\Http\Requests\UpdatePpaFundingSourceRequest;
use App\Models\AipOutput;
use App\Models\PpaFundingSource;
use App\Models\Ppmp;
use Illuminate\Validation\ValidationException;

class PpaFundingSourceController extends Controller
{
    public function store(StorePpaFundingSourceRequest $request, AipOutput $aipOutput)
    {
        $validated = $request->validated();

        // Uniqueness is (aip_output_id, funding_source_id); document
        // scoping flows through output -> entry -> document.
        $exists = $aipOutput
            ->fundingSources()
            ->where('funding_source_id', $validated['funding_source_id'])
            ->exists();

        if ($exists) {
            return redirect()
                ->back()
                ->withErrors([
                    'funding_source_id' => 'This funding source is already assigned to this output.',
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

        if (! $user->can('editFundingSources', $aipOutput->aipEntry)) {
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
        $validated = $request->validated();

        // A PS pool holds only a ps_amount — reject every other amount.
        if ($ppaFundingSource->aipOutput?->aipEntry?->ppa?->is_ps_pool) {
            foreach (['fe_amount', 'ccet_adaptation', 'ccet_mitigation'] as $field) {
                if (array_key_exists($field, $validated) && (float) $validated[$field] !== 0.0) {
                    throw ValidationException::withMessages([
                        $field => 'A PS Pool can only hold Personal Services (PS) amounts.',
                    ]);
                }
            }
        }

        $ppaFundingSource->update($validated);
    }
}
