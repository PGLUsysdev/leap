<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CcTypology extends Model
{
    /** @use HasFactory<\Database\Factories\CcTypologyFactory> */
    use HasFactory;

    protected $fillable = [
        'code',
        'description',
        'response_type',
        'strategic_priority_id',
        'sub_sector_id',
        'category_code',
        'item_num',
        'is_nccap_activity',
    ];

    protected $casts = [
        'is_nccap_activity' => 'boolean',
    ];

    public function strategicPriority(): BelongsTo
    {
        return $this->belongsTo(
            CcStrategicPriority::class,
            'strategic_priority_id',
        );
    }

    public function subSector(): BelongsTo
    {
        return $this->belongsTo(CcSubSector::class, 'sub_sector_id');
    }
}
