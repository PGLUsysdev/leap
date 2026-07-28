<?php

namespace App\Models;

use Database\Factories\PpaFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ppa extends Model
{
    /** @use HasFactory<PpaFactory> */
    use HasFactory;

    protected $fillable = [
        'id',
        'office_id',
        'parent_id',
        'name',
        'type',
        'code_suffix',
        'is_active',
        'sort_order',
        'fiscal_year_id',
        'supplemental_aip_id',
        'is_supplemental',
        'is_ps_pool',
    ];

    protected $appends = ['full_code'];

    protected function fullCode(): Attribute
    {
        return Attribute::make(
            get: function () {
                $suffix = $this->code_suffix ?? '0000';

                // Pad suffix based on PPA type
                $paddedSuffix = match ($this->type) {
                    'Program' => str_pad($suffix, 3, '0', STR_PAD_LEFT),
                    'Project' => str_pad($suffix, 3, '0', STR_PAD_LEFT),
                    'Activity' => str_pad($suffix, 2, '0', STR_PAD_LEFT),
                    'Sub-Activity' => $suffix,
                    default => $suffix,
                };

                if ($this->parent_id) {
                    $parent = $this->relationLoaded('parent')
                        ? $this->parent
                        : $this->parent()->first();
                    if ($parent) {
                        return $parent->full_code . '-' . $paddedSuffix;
                    }
                }

                $office = $this->relationLoaded('office')
                    ? $this->office
                    : $this->office()->first();
                $officePrefix = $office?->full_code ?? '0000-0-00-000';

                return $officePrefix . '-' . $paddedSuffix;
            },
        );
    }

    // hasMany
    public function children(): HasMany
    {
        return $this->hasMany(Ppa::class, 'parent_id');
    }

    public function aipEntries(): HasMany
    {
        return $this->hasMany(AipEntry::class, 'ppa_id');
    }

    // belongsTo
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Ppa::class, 'parent_id');
    }

    public function fiscalYear(): BelongsTo
    {
        return $this->belongsTo(FiscalYear::class, 'fiscal_year_id');
    }

    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class, 'office_id');
    }

    public function supplementalAip(): BelongsTo
    {
        return $this->belongsTo(SupplementalAip::class, 'supplemental_aip_id');
    }

    public function scopePsPoolForFiscalYear($query, int $fiscalYearId)
    {
        return $query
            ->where('is_ps_pool', true)
            ->where('fiscal_year_id', $fiscalYearId);
    }
}
