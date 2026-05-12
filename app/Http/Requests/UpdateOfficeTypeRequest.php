<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOfficeTypeRequest extends FormRequest
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
        $officeType = $this->route('officeType');

        return [
            'code' => [
                'required',
                'string',
                'max:2',
                // Ignore current ID so validation doesn't fail on the record being edited
                'unique:office_types,code,' .
                ($officeType ? $officeType->id : 'NULL'),
            ],
            'name' => ['required', 'string', 'max:50'],
        ];
    }
}
