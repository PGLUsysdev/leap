<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FiscalYear extends Model
{
    /** @use HasFactory<\Database\Factories\FiscalYearFactory> */
    use HasFactory;

    protected $fillable = ['year', 'status'];

    protected $attributes = [
        'status' => 'Open',
    ];

    public function aipEntries()
    {
        return $this->hasMany(AipEntry::class, 'fiscal_year_id');
    }
}
