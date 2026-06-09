<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCcSubSectorRequest extends FormRequest
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
            'strategic_priority_id' => [
                'required',
                'integer',
                'exists:cc_strategic_priorities,id',
            ],
            'code' => [
                'required',
                'integer',
                'min:1',
                'max:9',
                Rule::unique('cc_sub_sectors')
                    ->where('strategic_priority_id', $this->strategic_priority_id),
            ],
            'name' => ['required', 'string', 'max:255'],
        ];
    }
}
