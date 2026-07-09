<?php

namespace App\Models;

use Database\Factories\OfficeTypeFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OfficeType extends Model
{
    /** @use HasFactory<OfficeTypeFactory> */
    use HasFactory;

    protected $fillable = ['code', 'name'];

    // hasMany
    public function offices(): HasMany
    {
        return $this->hasMany(Office::class, 'office_type_id');
    }
}
