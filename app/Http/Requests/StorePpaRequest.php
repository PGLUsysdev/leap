<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePpaRequest extends FormRequest
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
            'office_id' => 'required|exists:offices,id',
            'parent_id' => 'nullable|exists:ppas,id',
            'name' => 'required|string',
            'type' => 'required|in:Program,Project,Activity,Sub-Activity',
            'code_suffix' => [
                'required',
                'string',
                'max:3',
                // This manually checks the database before the "Save" even happens
                Rule::unique('ppas')->where(function ($query) {
                    return $query
                        ->where('office_id', $this->office_id)
                        ->where('parent_id', $this->parent_id) // This handles NULL correctly in Laravel
                        ->where('type', $this->type);
                }),
            ],
            'is_active' => 'boolean',
        ];
    }
}
