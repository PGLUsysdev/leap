<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\PpmpCategory;

class PpmpPriceList extends Model
{
    /** @use HasFactory<\Database\Factories\PpmpPriceListFactory> */
    use HasFactory;

    protected $fillable = [
        'item_number',
        'description',
        'unit_of_measurement',
        'price',
        'ppmp_category_id',
        'chart_of_account_id',
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    public function chartOfAccount()
    {
        return $this->belongsTo(ChartOfAccount::class);
    }

    public function category()
    {
        return $this->belongsTo(PpmpCategory::class, 'ppmp_category_id');
    }

    public function fundingSource()
    {
        return $this->belongsTo(FundingSource::class);
    }
}
