<?php

namespace App\Models;

use Database\Factories\ChartOfAccountFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChartOfAccount extends Model
{
    /** @use HasFactory<ChartOfAccountFactory> */
    use HasFactory;

    protected $fillable = [
        'account_number',
        'account_title',
        'parent_id',
        'path',
        'is_postable',
        'is_active',
        'normal_balance',
        'description',
    ];

    protected $casts = [
        'is_postable' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function children(): HasMany
    {
        return $this->hasMany(ChartOfAccount::class, 'parent_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(ChartOfAccount::class, 'parent_id');
    }

    public function chartOfAccountPpmpCategories(): HasMany
    {
        return $this->hasMany(ChartOfAccountPpmpCategory::class, 'chart_of_account_id');
    }
}
