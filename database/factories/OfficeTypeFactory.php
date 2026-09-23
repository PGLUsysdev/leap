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
            'code' => $this->faker->unique()->bothify('OT-##'),
            'name' => $this->faker->word(),
        ];
    }
}
