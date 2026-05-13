<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ppmp extends Model
{
    /** @use HasFactory<\Database\Factories\PpmpFactory> */
    use HasFactory;

    protected $fillable = [
        'ppa_funding_source_id',
        'ppmp_price_list_id',
        'jan_qty',
        'jan_amount',
        'feb_qty',
        'feb_amount',
        'mar_qty',
        'mar_amount',
        'apr_qty',
        'apr_amount',
        'may_qty',
        'may_amount',
        'jun_qty',
        'jun_amount',
        'jul_qty',
        'jul_amount',
        'aug_qty',
        'aug_amount',
        'sep_qty',
        'sep_amount',
        'oct_qty',
        'oct_amount',
        'nov_qty',
        'nov_amount',
        'dec_qty',
        'dec_amount',
    ];

    protected $casts = [
        'jan_qty' => 'integer',
        'jan_amount' => 'decimal:2',
        'feb_qty' => 'integer',
        'feb_amount' => 'decimal:2',
        'mar_qty' => 'integer',
        'mar_amount' => 'decimal:2',
        'apr_qty' => 'integer',
        'apr_amount' => 'decimal:2',
        'may_qty' => 'integer',
        'may_amount' => 'decimal:2',
        'jun_qty' => 'integer',
        'jun_amount' => 'decimal:2',
        'jul_qty' => 'integer',
        'jul_amount' => 'decimal:2',
        'aug_qty' => 'integer',
        'aug_amount' => 'decimal:2',
        'sep_qty' => 'integer',
        'sep_amount' => 'decimal:2',
        'oct_qty' => 'integer',
        'oct_amount' => 'decimal:2',
        'nov_qty' => 'integer',
        'nov_amount' => 'decimal:2',
        'dec_qty' => 'integer',
        'dec_amount' => 'decimal:2',
    ];

    // belongs
    public function ppaFundingSource(): BelongsTo
    {
        return $this->belongsTo(
            PpaFundingSource::class,
            'ppa_funding_source_id',
        );
    }

    public function ppmpPriceList(): BelongsTo
    {
        return $this->belongsTo(PpmpPriceList::class, 'ppmp_price_list_id');
    }
}
