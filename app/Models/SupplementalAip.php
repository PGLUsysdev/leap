<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupplementalAip extends Model
{
    protected $fillable = ['fiscal_year_id', 'office_id', 'name'];

    // hasMany
    public function ppas(): HasMany
    {
        return $this->hasMany(Ppa::class, 'supplemental_aip_id');
    }

    public function aipEntries(): HasMany
    {
        return $this->hasMany(AipEntry::class, 'supplemental_aip_id');
    }

    public function ppaFundingSources(): HasMany
    {
        return $this->hasMany(PpaFundingSource::class, 'supplemental_aip_id');
    }

    // belongsTo
    public function fiscalYear(): BelongsTo
    {
        return $this->belongsTo(FiscalYear::class, 'fiscal_year_id');
    }

    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class, 'office_id');
    }
}
