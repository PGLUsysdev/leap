<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FiscalYear extends Model
{
    /** @use HasFactory<\Database\Factories\FiscalYearFactory> */
    use HasFactory;

    protected $fillable = ['year', 'status'];

    protected $attributes = [
        'status' => 'active',
    ];

    // hasMany
    public function ppas(): HasMany
    {
        return $this->hasMany(Ppa::class, 'fiscal_year_id');
    }

    public function supplementalAips(): HasMany
    {
        return $this->hasMany(SupplementalAip::class, 'fiscal_year_id');
    }
}
