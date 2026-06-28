<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PsRate extends Model
{
    protected $fillable = ['fiscal_year_id', 'rate_key', 'rate_value'];

    public function fiscalYear()
    {
        return $this->belongsTo(FiscalYear::class);
    }
}
