<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
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
        'chart_of_account_ppmp_category_id',
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    // hasMany
    public function ppmps(): HasMany
    {
        return $this->hasMany(Ppmp::class, 'ppmp_price_list_id');
    }

    // belongsTo
    public function chartOfAccountPpmpCategory(): BelongsTo
    {
        return $this->belongsTo(
            ChartOfAccountPpmpCategory::class,
            'chart_of_account_ppmp_category_id',
        );
    }
}
