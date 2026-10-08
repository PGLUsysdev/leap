<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PpmpPriceListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $junction = $this->chartOfAccountPpmpCategory;

        return [
            'id' => $this->id,
            'item_number' => $this->item_number,
            'sort_order' => $this->sort_order,
            'description' => $this->description,
            'unit_of_measurement' => $this->unit_of_measurement,
            'price' => (string) $this->price,
            'chart_of_account' => $junction?->chartOfAccount ? [
                'id' => $junction->chartOfAccount->id,
                'account_number' => $junction->chartOfAccount->account_number,
                'account_title' => $junction->chartOfAccount->account_title,
                'path' => $junction->chartOfAccount->path,
            ] : null,
            'ppmp_category' => $junction?->ppmpCategory ? [
                'id' => $junction->ppmpCategory->id,
                'name' => $junction->ppmpCategory->name,
                'is_non_procurement' => (bool) $junction->ppmpCategory->is_non_procurement,
                'is_additional' => (bool) $junction->ppmpCategory->is_additional,
            ] : null,
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
