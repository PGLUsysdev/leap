<?php

namespace Database\Factories;

use App\Models\LguLevel;
use App\Models\Office;
use App\Models\OfficeType;
use App\Models\Sector;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Office>
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
            'lgu_level_id' => LguLevel::factory(),
            'sector_id' => Sector::factory(),
            'office_type_id' => OfficeType::factory(),
        ];
    }
}
