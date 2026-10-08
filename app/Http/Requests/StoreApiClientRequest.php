<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreApiClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'abilities' => ['required', 'array', 'min:1'],
            'abilities.*' => ['string', 'in:read:procurement'],
            'expires_at' => ['nullable', 'date', 'after:now'],
        ];
    }
}
