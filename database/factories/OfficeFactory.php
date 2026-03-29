<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Office>
 */
class OfficeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->company(),
            'code' => $this->faker->unique()->bothify('OFF-###'), // The missing NOT NULL column

            // Relationships you already fixed
            'lgu_level_id' => \App\Models\LguLevel::factory(),
            'sector_id' => \App\Models\Sector::factory(),
            'office_type_id' => \App\Models\OfficeType::factory(),
        ];
    }
}
