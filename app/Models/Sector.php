<?php

namespace App\Models;

use Database\Factories\SectorFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sector extends Model
{
    /** @use HasFactory<SectorFactory> */
    use HasFactory;

    protected $fillable = ['code', 'name'];

    // hasMany
    public function offices(): HasMany
    {
        return $this->hasMany(Office::class, 'sector_id');
    }
}
