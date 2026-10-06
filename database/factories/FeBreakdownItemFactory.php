<?php

namespace Database\Factories;

use App\Models\ChartOfAccount;
use App\Models\FeBreakdownItem;
use App\Models\PpaFundingSource;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FeBreakdownItem>
 */
class FeBreakdownItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'ppa_funding_source_id' => PpaFundingSource::factory(),
            'chart_of_account_id' => ChartOfAccount::factory(),
            'amount' => 0,
        ];
    }
}
