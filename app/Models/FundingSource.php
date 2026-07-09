<?php

namespace App\Models;

use Database\Factories\FundingSourceFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FundingSource extends Model
{
    /** @use HasFactory<FundingSourceFactory> */
    use HasFactory;

    protected $fillable = ['fund_type', 'code', 'title', 'description'];

    // hasMany
    public function ppaFundingSources(): HasMany
    {
        return $this->hasMany(PpaFundingSource::class, 'funding_source_id');
    }
}
