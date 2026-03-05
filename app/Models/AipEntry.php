<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
// Make sure this specific line is here:
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 */
class AipEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'fiscal_year_id',
        'ppa_id',
        'start_date',
        'end_date',
        'expected_output',
        'ps_amount',
        'mooe_amount',
        'fe_amount',
        'co_amount',
        'total_amount',
    ];

    protected $casts = [
        'ps_amount' => 'decimal:2',
        'mooe_amount' => 'decimal:2',
        'fe_amount' => 'decimal:2',
        'co_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    public function ppa(): BelongsTo
    {
        return $this->belongsTo(Ppa::class);
    }

    public function fundingSource(): BelongsTo
    {
        return $this->belongsTo(FundingSource::class);
    }

    public function itemizedCosts()
    {
        return $this->hasMany(PpaItemizedCost::class, 'aip_entry_id');
    }

    public function calculateTotals()
    {
        // Important: Use the relationship to get the breakdown
        $costs = $this->itemizedCosts()
            ->join(
                'chart_of_accounts',
                'ppa_itemized_costs.account_code',
                '=',
                'chart_of_accounts.account_code',
            )
            ->selectRaw(
                'expense_class, SUM(ppa_itemized_costs.amount) as total',
            )
            ->groupBy('expense_class')
            ->pluck('total', 'expense_class');

        // We use floatval to ensure it's a number
        $this->ps_amount = $costs['PS'] ?? 0;
        $this->mooe_amount = $costs['MOOE'] ?? 0;
        $this->fe_amount = $costs['FE'] ?? 0;
        $this->co_amount = $costs['CO'] ?? 0;

        $this->total_amount =
            $this->ps_amount +
            $this->mooe_amount +
            $this->fe_amount +
            $this->co_amount;

        $this->save();
    }
}
