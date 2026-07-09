<?php

namespace App\Models;

use Database\Factories\CcSubSectorFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CcSubSector extends Model
{
    /** @use HasFactory<CcSubSectorFactory> */
    use HasFactory;

    protected $fillable = ['id', 'strategic_priority_id', 'code', 'name'];

    public function strategicPriority(): BelongsTo
    {
        return $this->belongsTo(
            CcStrategicPriority::class,
            'strategic_priority_id',
        );
    }

    public function typologies(): HasMany
    {
        return $this->hasMany(CcTypology::class, 'sub_sector_id');
    }
}
