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
        // 'id',
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
                $suffix = (string) ($this->code_suffix ?? '');

                $paddedSuffix = match ($this->type) {
                    'Program', 'Project' => str_pad(
                        $suffix,
                        3,
                        '0',
                        STR_PAD_LEFT,
                    ),
                    'Activity' => str_pad($suffix, 2, '0', STR_PAD_LEFT),
                    'Sub-Activity' => $suffix,
                    default => $suffix,
                };

                // Recursively build parent code
                if ($this->parent_id) {
                    $parent = $this->parent; // Assuming relation is eager-loaded
                    if ($parent) {
                        return $parent->full_code . '-' . $paddedSuffix;
                    }

                    // Handle missing parent explicitly
                    return 'ORPHAN-' . $paddedSuffix;
                }

                $officePrefix =
                    $this->office?->full_code ??
                    str_repeat('0', 10) .
                        '-' .
                        str_repeat('0', 10) .
                        '-' .
                        str_repeat('0', 10) .
                        '-000';

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
