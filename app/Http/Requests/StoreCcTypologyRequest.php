<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreCcTypologyRequest extends FormRequest
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
            'response_type' => 'required|in:A,M',
            'strategic_priority_id' => 'required|exists:cc_strategic_priorities,id',
            'sub_sector_id' => 'nullable|exists:cc_sub_sectors,id',
            'category_code' => 'required|in:1,2,3,4',
            'item_num' => 'required|integer|min:1|max:99',
            'description' => 'required|string',
            'is_nccap_activity' => 'boolean',
        ];
    }
}
