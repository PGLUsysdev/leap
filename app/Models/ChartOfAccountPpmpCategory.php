<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChartOfAccountPpmpCategory extends Model
{
    /** @use HasFactory<\Database\Factories\ChartOfAccountPpmpCategoryFactory> */
    use HasFactory;

    protected $fillable = ['chart_of_account_id', 'ppmp_category_id'];

    public function chartOfAccount(): BelongsTo
    {
        return $this->belongsTo(ChartOfAccount::class, 'chart_of_account_id');
    }

    public function ppmpCategory(): BelongsTo
    {
        return $this->belongsTo(PpmpCategory::class, 'ppmp_category_id');
    }

    public function ppmpPriceLists(): HasMany
    {
        return $this->hasMany(
            PpmpPriceList::class,
            'chart_of_account_ppmp_category_id',
        );
    }
}
