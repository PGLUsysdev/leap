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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'ps_amount' => ['nullable', 'numeric', 'min:0'],
            'fe_amount' => ['nullable', 'numeric', 'min:0'],
            'ccet_adaptation' => ['nullable', 'numeric', 'min:0'],
            'ccet_mitigation' => ['nullable', 'numeric', 'min:0'],
            'cc_typology_id' => ['nullable', 'integer', 'exists:cc_typologies,id'],
        ];
    }
}
