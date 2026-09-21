<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAipOutputRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'office_id' => ['nullable', 'integer', 'exists:offices,id'],
            'office_ids' => ['nullable', 'array', 'min:1'],
            'office_ids.*' => ['integer', 'exists:offices,id'],
            'expected_output' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'sort_order' => 'nullable|integer|min:0',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $officeIds = array_filter((array) $this->input('office_ids', []));

            if (! $this->filled('office_id') && $officeIds === []) {
                $validator->errors()->add(
                    'office_ids',
                    'At least one office is required.',
                );
            }
        });
    }
}
