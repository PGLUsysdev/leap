<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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

    protected $casts = [
        'is_manual' => 'boolean',
    ];

    // hasMany
    public function children(): HasMany
    {
        return $this->hasMany(ChartOfAccount::class, 'parent_id');
    }

    public function chartOfAccountPpmpCategories(): HasMany
    {
        return $this->hasMany(
            ChartOfAccountPpmpCategory::class,
            'chart_of_account_id',
        );
    }

    // belongsTo
    public function parent(): BelongsTo
    {
        return $this->belongsTo(ChartOfAccount::class, 'parent_id');
    }
}
