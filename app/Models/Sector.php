<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Sector extends Model
{
    /** @use HasFactory<\Database\Factories\SectorFactory> */
    use HasFactory;

    protected $fillable = ['code', 'sector'];

    protected function fullCode(): Attribute
    {
        return Attribute::make(get: fn() => $this->code ?? '0000');
    }
}
