<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OfficeType extends Model
{
    /** @use HasFactory<\Database\Factories\OfficeTypeFactory> */
    use HasFactory;

    protected $fillable = ['code', 'name'];

    // hasMany
    public function offices(): HasMany
    {
        return $this->hasMany(Office::class, 'office_type_id');
    }
}
