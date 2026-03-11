<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePpmpPriceListRequest extends FormRequest
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
            'expenseAccount' => 'required|integer|exists:chart_of_accounts,id',
            'category' => 'required_without:customCategory|nullable|integer',
            'customCategory' =>
                'required_without:category|nullable|string|max:255',
            'itemNo' => [
                'required',
                'integer',
                Rule::unique('ppmp_price_lists', 'item_number')->ignore(
                    $this->ppmpPriceList?->id,
                ),
            ],
            'description' => 'required|string|max:255',
            'unitOfMeasurement' => 'required|string|max:50',
            'price' => 'required|numeric|min:0',
        ];
    }
}
