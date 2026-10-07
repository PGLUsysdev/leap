<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePpaFundingSourceRequest extends FormRequest
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
     * `ps_amount` is never accepted. Personal Services is derived from the
     * personnel schedule and written by
     * PsBreakdownController::syncPoolForFiscalYear(); it is not a manual field.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'ps_amount' => ['prohibited'],
            'fe_amount' => ['nullable', 'numeric', 'min:0'],
            'ccet_adaptation' => ['nullable', 'numeric', 'min:0'],
            'ccet_mitigation' => ['nullable', 'numeric', 'min:0'],
            'cc_typology_id' => ['nullable', 'integer', 'exists:cc_typologies,id'],
        ];
    }

    /**
     * The messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'ps_amount.prohibited' => 'Personal Services is computed from the personnel schedule and cannot be entered manually.',
        ];
    }
}
