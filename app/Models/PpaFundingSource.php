<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\FundingSource;
use App\Models\Ppmp;

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
    ];

    // has
    public function ppmps()
    {
        return $this->hasMany(Ppmp::class, 'ppa_funding_source_id');
    }

    // belong
    public function aipEntry()
    {
        return $this->belongsTo(AipEntry::class, 'aip_entry_id');
    }

    public function fundingSource()
    {
        return $this->belongsTo(FundingSource::class, 'funding_source_id');
    }

    public function supplementalAip()
    {
        return $this->belongsTo(SupplementalAip::class, 'supplemental_aip_id');
    }
}
