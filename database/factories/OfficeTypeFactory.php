<?php

namespace Database\Factories;

use App\Models\OfficeType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OfficeType>
 */
class OfficeTypeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            // Based on your previous tables, this is likely 'type' or 'office_type'
            'type' => $this->faker->word(),
            'code' => $this->faker->unique()->bothify('OT-##'), // The missing NOT NULL column
        ];
    }
}
