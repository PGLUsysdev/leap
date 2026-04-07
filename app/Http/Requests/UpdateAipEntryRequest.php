<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAipEntryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'office_id' => 'required|exists:offices,id',
            'expected_output' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
            'ppa_funding_sources' => 'nullable|array',
            'ppa_funding_sources.*.funding_source_id' =>
                'required|exists:funding_sources,id',
            // Validate amounts are numeric even if sent as strings
            'ppa_funding_sources.*.ps_amount' => 'required|numeric',
            'ppa_funding_sources.*.mooe_amount' => 'required|numeric',
            'ppa_funding_sources.*.fe_amount' => 'required|numeric',
            'ppa_funding_sources.*.co_amount' => 'required|numeric',
            'ppa_funding_sources.*.ccet_adaptation' => 'nullable|numeric',
            'ppa_funding_sources.*.ccet_mitigation' => 'nullable|numeric',
            'ppa_funding_sources.*.cc_typology_code' => 'nullable|string',
        ];
    }
}
