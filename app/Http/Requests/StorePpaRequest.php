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
            'parent_id' => 'nullable|exists:ppas,id',
            'name' => 'required|string',
            'type' => 'required|in:Program,Project,Activity,Sub-Activity',
            'code_suffix' => 'nullable|string|max:10', // Increased to accommodate dynamic Sub-Activity
            'is_active' => 'boolean',
            'supplemental_aip_id' => 'nullable|exists:supplemental_aips,id',
            'is_supplemental' => 'boolean',
        ];
    }
}
