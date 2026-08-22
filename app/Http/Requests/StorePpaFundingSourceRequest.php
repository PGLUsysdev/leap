<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePpaFundingSourceRequest extends FormRequest
{
    public function authorize(): bool
    {
        $aipOutput = $this->route('aipOutput');

        if (! $aipOutput instanceof \App\Models\AipOutput) {
            return false;
        }

        return (bool) $this->user()?->can(
            'editFundingSources',
            $aipOutput->aipEntry,
        );
    }

    public function rules(): array
    {
        return [
            'funding_source_id' => 'required|exists:funding_sources,id',
            // 'supplemental_aip_id' => 'nullable|exists:supplemental_aips,id',
        ];
    }
}
