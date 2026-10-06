<?php

namespace App\Models;

use Database\Factories\FeBreakdownItemFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FeBreakdownItem extends Model
{
    /** @use HasFactory<FeBreakdownItemFactory> */
    use HasFactory;

    protected $fillable = [
        'ppa_funding_source_id',
        'chart_of_account_id',
        'amount',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    public function ppaFundingSource(): BelongsTo
    {
        return $this->belongsTo(PpaFundingSource::class);
    }

    public function chartOfAccount(): BelongsTo
    {
        return $this->belongsTo(ChartOfAccount::class);
    }
}
