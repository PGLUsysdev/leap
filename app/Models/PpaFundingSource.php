<?php

namespace App\Models;

use Database\Factories\PpaFundingSourceFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PpaFundingSource extends Model
{
    /** @use HasFactory<PpaFundingSourceFactory> */
    use HasFactory;

    protected static function boot()
    {
        parent::boot();

        static::saving(function ($model) {
            // Only validate if ps_amount is being set to a non-zero value
            if ((float) $model->ps_amount > 0) {
                $model->loadMissing('aipEntry.ppa');
                $ppa = $model->aipEntry?->ppa;

                if (! $ppa || ! $ppa->is_ps_pool) {
                    throw new \Exception(
                        'Personal Services (PS) can only be allocated to the designated PS pool Program.',
                    );
                }
            }
        });
    }

    protected $fillable = [
        'aip_entry_id',
        'funding_source_id',
        'ps_amount',
        'mooe_amount',
        'fe_amount',
        'co_amount',
        'ccet_adaptation',
        'ccet_mitigation',
        'supplemental_aip_id',
        'is_supplemental',
        'cc_typology_id',
    ];

    // hasMany
    public function ppmps(): HasMany
    {
        return $this->hasMany(Ppmp::class, 'ppa_funding_source_id');
    }

    // belongsTo
    public function fundingSource(): BelongsTo
    {
        return $this->belongsTo(FundingSource::class, 'funding_source_id');
    }

    public function aipEntry(): BelongsTo
    {
        return $this->belongsTo(AipEntry::class, 'aip_entry_id');
    }

    public function supplementalAip(): BelongsTo
    {
        return $this->belongsTo(SupplementalAip::class, 'supplemental_aip_id');
    }

    public function ccTypology(): BelongsTo
    {
        return $this->belongsTo(CcTypology::class, 'cc_typology_id');
    }
}
