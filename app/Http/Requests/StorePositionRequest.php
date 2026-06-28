<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StorePositionRequest extends FormRequest
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
            'item_number' => [
                'required',
                'string',
                'max:50',
                'unique:positions,item_number',
            ],
            'office_id' => ['required', 'integer', 'exists:offices,id'],
            'ios_id' => ['required', 'integer', 'exists:ios,id'],
            'employment_type' => [
                'required',
                'string',
                'in:permanent,casual,contractual,job_order',
            ],
            'is_funded' => ['required', 'boolean'],
            'status' => ['required', 'string', 'in:occupied,vacant,abolished'],
        ];
    }
}
