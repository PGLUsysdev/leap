<?php

namespace App\Models;

use Database\Factories\PlantillaPositionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlantillaPosition extends Model
{
    /** @use HasFactory<PlantillaPositionFactory> */
    use HasFactory;

    protected $fillable = [
        'office_id',
        'fiscal_year_id',
        'item_number',
        'position_title',
        'incumbent_name',
        'position_type',
        'current_sg',
        'current_step',
        'current_annual_rate',
        'budget_sg',
        'budget_step',
        'budget_annual_rate',
        'remarks',
    ];

    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class);
    }

    public function fiscalYear(): BelongsTo
    {
        return $this->belongsTo(FiscalYear::class);
    }
}
