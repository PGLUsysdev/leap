<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PpmpCategory extends Model
{
    /** @use HasFactory<\Database\Factories\PpmpCategoryFactory> */
    use HasFactory;

    protected $fillable = ['name', 'is_non_procurement'];

    protected $casts = [
        'is_non_procurement' => 'boolean',
    ];

    // hasMany
    public function chartOfAccountPpmpCategories(): HasMany
    {
        return $this->hasMany(
            ChartOfAccountPpmpCategory::class,
            'ppmp_category_id',
        );
    }
}
