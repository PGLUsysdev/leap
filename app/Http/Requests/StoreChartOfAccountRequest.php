<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreChartOfAccountRequest extends FormRequest
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
            'account_number' => 'required|string|max:255|unique:chart_of_accounts,account_number',
            'account_title' => 'required|string|max:255',
            'account_type' => 'required|in:ASSET,LIABILITY,EQUITY,REVENUE,EXPENSE',
            'expense_class' => 'nullable|in:PS,MOOE,FE,CO',
            'account_series' => 'nullable|string|max:50',
            'is_postable' => 'required|boolean',
            'is_active' => 'required|boolean',
            'normal_balance' => 'required|in:DEBIT,CREDIT',
            'description' => 'nullable|string',
        ];
    }
}
