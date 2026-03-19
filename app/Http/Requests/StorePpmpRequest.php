<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePpmpRequest extends FormRequest
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
            'aip_entry_id' => 'required|exists:aip_entries,id',
            'ppmp_price_list_id' => 'required|exists:ppmp_price_lists,id',
            'fundingSource' => 'required|integer|exists:funding_sources,id',
        ];
    }
}
