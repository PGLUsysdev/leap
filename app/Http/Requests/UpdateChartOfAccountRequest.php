<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateChartOfAccountRequest extends FormRequest
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
        $id = $this->route('chartOfAccount')?->id ?? $this->route('chart_of_account')?->id;

        return [
            'account_number' => 'required|string|max:20',
            'path' => ['required', 'string', 'max:255', 'regex:/^\d(-\d{2}){0,2}(-\d{3})?$/', 'unique:chart_of_accounts,path,' . $id],
            'parent_id' => ['nullable', 'exists:chart_of_accounts,id'],
            'level' => ['nullable', 'integer', 'min:1', 'max:5'],
            'account_title' => 'required|string|max:255',
            'account_type' => 'nullable|in:ASSET,LIABILITY,EQUITY,REVENUE,EXPENSE',
            'expense_class' => 'nullable|in:PS,MOOE,FE,CO',
            'account_series' => 'nullable|string|max:50',
            'is_postable' => 'required|boolean',
            'is_active' => 'required|boolean',
            'normal_balance' => 'nullable|in:DEBIT,CREDIT',
            'description' => 'nullable|string',
        ];
    }
}
