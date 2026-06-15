<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePpaFundingSourceRequest extends FormRequest
{
    public function authorize(): bool
    {
        $aipEntry = $this->route('aipEntry');

        return $aipEntry && $this->user()?->can('editFundingSources', $aipEntry);
    }

    public function rules(): array
    {
        return [
            'funding_source_id' => 'required|exists:funding_sources,id',
            'ps_amount' => 'required|numeric',
            'mooe_amount' => 'required|numeric',
            'fe_amount' => 'required|numeric',
            'co_amount' => 'required|numeric',
            'ccet_adaptation' => 'nullable|numeric',
            'ccet_mitigation' => 'nullable|numeric',
            'cc_typology_id' => 'nullable|exists:cc_typologies,id',
            'supplemental_aip_id' => 'nullable|exists:supplemental_aips,id',
        ];
    }
}
