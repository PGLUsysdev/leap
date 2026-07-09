<?php

namespace App\Models;

use Database\Factories\LguLevelFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LguLevel extends Model
{
    /** @use HasFactory<LguLevelFactory> */
    use HasFactory;

    protected $fillable = ['code', 'name'];

    // hasMany
    public function offices(): HasMany
    {
        return $this->hasMany(Office::class, 'lgu_level_id');
    }
}
