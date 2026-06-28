<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ios extends Model
{
    /** @use HasFactory<\Database\Factories\IosFactory> */
    use HasFactory;

    protected $fillable = [
        'occupational_service_code',
        'occupational_group_code',
        'class_id',
        'class',
        'salary_grade',
    ];
}
