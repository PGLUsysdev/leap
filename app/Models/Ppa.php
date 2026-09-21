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

    public function getPaddingLength(): int
    {
        return config('ppa.type_padding.'.$this->type, 0);
    }

    protected static function booted(): void
    {
        static::saving(function (Ppa $ppa) {
            $ppa->path = $ppa->computePath();
        });

        static::saved(function (Ppa $ppa) {
            if ($ppa->wasChanged('path')) {
                $ppa->refreshDescendantPaths();
            }
        });
    }

    /**
     * Materialized hierarchy code segments (e.g. "002-001-01"), without the
     * office prefix. full_code is office prefix + path.
     */
    public function computePath(): string
    {
        $suffix = $this->code_suffix ?? '';
        $padding = $this->getPaddingLength();
        $segment = $padding > 0
            ? str_pad($suffix, $padding, '0', STR_PAD_LEFT)
            : $suffix;

        if ($this->parent_id) {
            $parent = static::find($this->parent_id);

            if ($parent && $parent->path) {
                return $parent->path.'-'.$segment;
            }
        }

        return $segment;
    }

    /**
     * Rewrite descendant paths after this PPA's own path changed.
     * Each child save cascades further down via the saved hook.
     */
    public function refreshDescendantPaths(): void
    {
        $children = static::where('parent_id', $this->id)->get();

        foreach ($children as $child) {
            $newPath = $child->computePath();

            if ($child->path !== $newPath) {
                $child->path = $newPath;
                $child->save();
            }
        }
    }

    protected function fullCode(): Attribute
    {
        return Attribute::make(
            get: function () {
                $officePrefix = $this->office?->full_code ?? '0000-0-00-000';

                if ($this->path) {
                    return $officePrefix.'-'.$this->path;
                }

                $suffix = (string) ($this->code_suffix ?? '');
                $padding = $this->getPaddingLength();

                $paddedSuffix =
                    $padding > 0
                        ? str_pad($suffix, $padding, '0', STR_PAD_LEFT)
                        : $suffix;

                if ($this->parent_id) {
                    $parent = $this->parent;
                    if ($parent) {
                        return $parent->full_code.'-'.$paddedSuffix;
                    }

                    return 'ORPHAN-'.$paddedSuffix;
                }

                return $officePrefix.'-'.$paddedSuffix;
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
