<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChartOfAccount extends Model
{
    /** @use HasFactory<\Database\Factories\ChartOfAccountFactory> */
    use HasFactory;

    protected $fillable = [
        'account_number',
        'account_title',
        'account_type',
        'expense_class',
        'account_series',
        'parent_id',
        'is_postable',
        'is_active',
        'normal_balance',
        'description',
    ];

    public function ppmpPriceLists()
    {
        return $this->hasMany(PpmpPriceList::class);
    }
}
