<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'coaId' => 'required|integer|exists:chart_of_accounts,id',
            'categoryId' => 'required|integer|exists:ppmp_categories,id',
            'itemDescription' => 'required|string|max:255',
            'uom' => 'required|string|max:50',
            'price' => 'required|numeric|min:0',
        ];
    }
}
