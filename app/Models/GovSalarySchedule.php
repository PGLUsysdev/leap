<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GovSalarySchedule extends Model
{
    /** @use HasFactory<\Database\Factories\GovSalaryScheduleFactory> */
    use HasFactory;

    protected $fillable = [
        'fiscal_year_id',
        'tranche_id',
        'salary_grade',
        'step',
        'annual_rate',
    ];

    public function fiscalYear(): BelongsTo
    {
        return $this->belongsTo(FiscalYear::class);
    }
}
