<?php

namespace Database\Factories;

use App\Models\Office;
use App\Models\FiscalYear;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Ppa>
 */
class PpaFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => $this->faker->sentence(),
            'type' => 'Program',
            'code_suffix' => $this->faker->unique()->numerify('###'), // Generates '001', '542', etc.
            'office_id' => Office::factory(),
            'parent_id' => null,
        ];
    }
}
