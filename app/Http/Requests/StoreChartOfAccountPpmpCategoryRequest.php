<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreChartOfAccountPpmpCategoryRequest extends FormRequest
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
            'ppmp_category_id' => ['required', 'integer', 'exists:ppmp_categories,id'],
            'chart_of_account_id' => [
                'required',
                'integer',
                'exists:chart_of_accounts,id',
                Rule::unique('chart_of_account_ppmp_categories', 'chart_of_account_id')->where(
                    fn ($query) => $query->where('ppmp_category_id', $this->input('ppmp_category_id')),
                ),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'chart_of_account_id.unique' => 'This category-COA pairing already exists.',
        ];
    }
}
