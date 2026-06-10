<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\FundingSource;
use App\Models\CcTypology;
use App\Models\Ppmp;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PpaFundingSource extends Model
{
    /** @use HasFactory<\Database\Factories\PpaFundingSourceFactory> */
    use HasFactory;

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
