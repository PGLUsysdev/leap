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
        'level',
        'is_postable',
        'is_active',
        'normal_balance',
        'description',
    ];

    public function chartOfAccountPpmpCategories()
    {
        return $this->hasMany(
            ChartOfAccountPpmpCategory::class,
            'chart_of_account_id',
        );
    }

    public function parent()
    {
        return $this->belongsTo(
            ChartOfAccount::class,
            'parent_id',
        );
    }

    public function children()
    {
        return $this->hasMany(
            ChartOfAccount::class,
            'parent_id',
        );
    }
}
