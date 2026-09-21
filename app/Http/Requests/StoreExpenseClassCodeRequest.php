<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExpenseClassCodeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('create', 'expense-class-code') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $postable = Rule::exists('chart_of_accounts', 'id')->where('is_postable', true);

        return [
            'chart_of_account_id' => ['required_without:chart_of_account_ids', 'integer', $postable],
            'chart_of_account_ids' => ['array', 'min:1'],
            'chart_of_account_ids.*' => ['integer', $postable],
            'expense_class' => ['required', 'in:PS,MOOE,CO'],
        ];
    }
}
