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
            'ppa_funding_source_id' => 'required|exists:ppa_funding_sources,id',
            'ppmp_price_list_id' => 'required|exists:ppmp_price_lists,id',
        ];
    }
}
