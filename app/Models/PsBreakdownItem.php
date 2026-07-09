<?php

namespace App\Models;

use Database\Factories\PsBreakdownItemFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PsBreakdownItem extends Model
{
    /** @use HasFactory<PsBreakdownItemFactory> */
    use HasFactory;

    protected $fillable = [
        'ppa_funding_source_id',
        'chart_of_account_id',
        'amount',
        'is_manual',
        'plantilla_position_id',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'is_manual' => 'boolean',
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
