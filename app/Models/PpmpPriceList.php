<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\PpmpCategory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PpmpPriceList extends Model
{
    /** @use HasFactory<\Database\Factories\PpmpPriceListFactory> */
    use HasFactory;

    protected $fillable = [
        'item_number',
        'sort_order',
        'description',
        'unit_of_measurement',
        'price',
        'ppmp_category_id',
        'chart_of_account_id',
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    // has
    public function ppmps()
    {
        return $this->hasMany(Ppmp::class, 'ppmp_price_list_id');
    }

    // belongs
    public function chartOfAccount(): BelongsTo
    {
        return $this->belongsTo(ChartOfAccount::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(PpmpCategory::class, 'ppmp_category_id');
    }

    // public function fundingSource()
    // {
    //     return $this->belongsTo(FundingSource::class);
    // }
}
