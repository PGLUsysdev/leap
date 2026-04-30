<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\FundingSource;

class PpaFundingSource extends Model
{
    /** @use HasFactory<\Database\Factories\PpaFundingSourceFactory> */
    use HasFactory;

    protected $fillable = [
        // 'ppa_id',
        'aip_entry_id',
        'funding_source_id',
        'ps_amount',
        'mooe_amount',
        'fe_amount',
        'co_amount',
        'ccet_adaptation',
        'ccet_mitigation',
        // 'cc_typology_code',
    ];

    public function fundingSource()
    {
        return $this->belongsTo(FundingSource::class, 'funding_source_id');
    }
}
