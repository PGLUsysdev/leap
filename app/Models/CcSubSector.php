<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CcSubSector extends Model
{
    /** @use HasFactory<\Database\Factories\CcSubSectorFactory> */
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
