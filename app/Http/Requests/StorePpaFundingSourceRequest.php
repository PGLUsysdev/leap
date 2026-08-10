<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePpaFundingSourceRequest extends FormRequest
{
    public function authorize(): bool
    {
        $aipEntry = $this->route('aipEntry');

        return $aipEntry &&
            $this->user()?->can('editFundingSources', $aipEntry);
    }

    public function rules(): array
    {
        return [
            'funding_source_id' => 'required|exists:funding_sources,id',
            // 'supplemental_aip_id' => 'nullable|exists:supplemental_aips,id',
        ];
    }
}
