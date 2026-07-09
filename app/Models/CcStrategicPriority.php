<?php

namespace App\Models;

use Database\Factories\CcStrategicPriorityFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CcStrategicPriority extends Model
{
    /** @use HasFactory<CcStrategicPriorityFactory> */
    use HasFactory;

    protected $fillable = ['id', 'code', 'name'];

    public function subSectors(): HasMany
    {
        return $this->hasMany(CcSubSector::class, 'strategic_priority_id');
    }

    public function typologies(): HasMany
    {
        return $this->hasMany(CcTypology::class, 'strategic_priority_id');
    }
}
