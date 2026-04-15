<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;

class UpdateOfficeRequest extends FormRequest
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
        $office = $this->route('office');
        $officeId = $office ? $office->id : null;

        // Debug: Log the office ID and input values
        \Log::info('UpdateOfficeRequest - Office ID: ' . $officeId);
        \Log::info(
            'UpdateOfficeRequest - LGU Level ID: ' .
                $this->input('lgu_level_id'),
        );
        \Log::info(
            'UpdateOfficeRequest - Office Type ID: ' .
                $this->input('office_type_id'),
        );
        \Log::info('UpdateOfficeRequest - Code: ' . $this->input('code'));

        return [
            'parent_id' => 'nullable|exists:offices,id',
            'sector_id' => 'required|exists:sectors,id',
            'lgu_level_id' => 'required|exists:lgu_levels,id',
            'office_type_id' => 'required|exists:office_types,id',
            'name' => 'required|string|max:100',
            'acronym' => 'nullable|string|max:20',
            'is_lee' => 'boolean',
            'code' => 'required|string|max:3',
        ];
    }
}
