<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FundingSource extends Model
{
    /** @use HasFactory<\Database\Factories\FundingSourceFactory> */
    use HasFactory;

    protected $fillable = [
        'fund_type',
        'code',
        'title',
        'description',
        'allow_typhoon',
    ];
}
