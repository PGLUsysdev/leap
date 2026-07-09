<?php

namespace App\Models;

use Database\Factories\AllotmentClassFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AllotmentClass extends Model
{
    /** @use HasFactory<AllotmentClassFactory> */
    use HasFactory;

    protected $fillable = ['code', 'name'];
}
