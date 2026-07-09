<?php

namespace App\Models;

use Database\Factories\PositionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Position extends Model
{
    /** @use HasFactory<PositionFactory> */
    use HasFactory;

    protected $fillable = [
        'item_number',
        'office_id',
        'ios_id',
        'employment_type',
        'is_funded',
        'status',
    ];

    public function user(): HasOne
    {
        return $this->hasOne(User::class, 'position_id');
    }

    public function ios(): BelongsTo
    {
        return $this->belongsTo(Ios::class);
    }

    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class);
    }
}
