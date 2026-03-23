<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LguLevel extends Model
{
    /** @use HasFactory<\Database\Factories\LguLevelFactory> */
    use HasFactory;

    protected $fillable = ['code', 'level'];
}
