<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OfficeType extends Model
{
    /** @use HasFactory<\Database\Factories\OfficeTypeFactory> */
    use HasFactory;

    protected $fillable = ['code', 'type'];
}
