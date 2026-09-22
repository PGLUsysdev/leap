<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AipDocument extends Model
{
    protected $fillable = ['fiscal_year_id', 'office_id', 'kind', 'name'];

    // hasMany
    public function aipEntries(): HasMany
    {
        return $this->hasMany(AipEntry::class, 'aip_document_id');
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

    // scopes
    public function scopeRegular($query)
    {
        return $query->where('kind', 'regular');
    }

    public function scopeSupplemental($query)
    {
        return $query->where('kind', 'supplemental');
    }

    public static function regularFor(int $officeId, int $fiscalYearId): self
    {
        return static::firstOrCreate(
            [
                'office_id' => $officeId,
                'fiscal_year_id' => $fiscalYearId,
                'kind' => 'regular',
                'name' => 'Regular AIP',
            ],
        );
    }
}
