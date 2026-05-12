<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLguLevelRequest extends FormRequest
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
        $lguLevel = $this->route('lguLevel') ?? $this->route('lgu_level');

        return [
            'code' => [
                'required',
                'string',
                'digits:1',
                'unique:lgu_levels,code,' .
                ($lguLevel ? $lguLevel->id : 'NULL'),
            ],
            'name' => ['required', 'string', 'max:50'],
        ];
    }
}
