<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 */
class AipEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'ppa_id',
        'start_date',
        'end_date',
        'expected_output',
        'supplemental_aip_id',
        'is_supplemental',
    ];

    // hasMany
    public function ppaFundingSources(): HasMany
    {
        return $this->hasMany(PpaFundingSource::class, 'aip_entry_id');
    }

    // belongsTo
    public function ppa(): BelongsTo
    {
        return $this->belongsTo(Ppa::class, 'ppa_id');
    }

    public function supplementalAip(): BelongsTo
    {
        return $this->belongsTo(SupplementalAip::class, 'supplemental_aip_id');
    }
}
