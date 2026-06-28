<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateIosRequest extends FormRequest
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
            'occupational_service_code' => ['required', 'string', 'max:255'],
            'occupational_group_code' => ['required', 'string', 'max:255'],
            'class_id' => ['required', 'string', 'max:255'],
            'class' => ['required', 'string', 'max:255'],
            'salary_grade' => ['required', 'integer', 'min:1', 'max:33'],
        ];
    }
}
