<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StorePlantillaPositionRequest extends FormRequest
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
            'office_id' => ['required', 'exists:offices,id'],
            'fiscal_year_id' => ['required', 'exists:fiscal_years,id'],
            'item_number' => ['required', 'string', 'max:50'],
            'position_title' => ['required', 'string', 'max:255'],
            'incumbent_name' => ['nullable', 'string', 'max:255'],
            'position_type' => ['required', 'in:permanent,casual,contractual,coterminous'],
            'current_sg' => ['required', 'integer', 'min:1'],
            'current_step' => ['required', 'integer', 'min:1'],
            'current_annual_rate' => ['required', 'numeric', 'min:0'],
            'budget_sg' => ['required', 'integer', 'min:1'],
            'budget_step' => ['required', 'integer', 'min:1'],
            'budget_annual_rate' => ['required', 'numeric', 'min:0'],
            'remarks' => ['nullable', 'string'],
        ];
    }
}
