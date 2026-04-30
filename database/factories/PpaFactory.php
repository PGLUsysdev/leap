<?php

namespace Database\Factories;

use App\Models\Ppa;
use Illuminate\Database\Eloquent\Factories\Factory;

class PpaFactory extends Factory
{
    protected $model = Ppa::class;

    public function definition(): array
    {
        return [
            'office_id' => 18, // Strictly enforced as 18
            'parent_id' => null,
            'name' => $this->faker->sentence(3),
            'type' => 'Program',
            'code_suffix' => $this->faker->unique()->numerify('####'),
            'is_active' => true,
            'sort_order' => 0,
        ];
    }

    public function project($parentId = null)
    {
        return $this->state(function (array $attributes) use ($parentId) {
            return [
                'type' => 'Project',
                'office_id' => 18,
                'code_suffix' => $this->faker->numerify('###'),
                // If $parentId is provided, use it. Otherwise, find or create a Program.
                'parent_id' => $parentId ?? $this->getOrCreateParent('Program'),
            ];
        });
    }

    public function activity($parentId = null)
    {
        return $this->state(function (array $attributes) use ($parentId) {
            return [
                'type' => 'Activity',
                'office_id' => 18,
                'code_suffix' => $this->faker->numerify('##'),
                'parent_id' => $parentId ?? $this->getOrCreateParent('Project'),
            ];
        });
    }

    public function subActivity($parentId = null)
    {
        return $this->state(function (array $attributes) use ($parentId) {
            return [
                'type' => 'Sub-Activity',
                'office_id' => 18,
                'code_suffix' => $this->faker->numerify('##'),
                'parent_id' =>
                    $parentId ?? $this->getOrCreateParent('Activity'),
            ];
        });
    }

    /**
     * Robust Parent Resolver
     */
    protected function getOrCreateParent(string $type)
    {
        // 1. Try to find an existing one
        $parent = Ppa::where('type', $type)->inRandomOrder()->first();

        if ($parent) {
            return $parent->id;
        }

        // 2. If none exists, create the required parent level
        // This will recurse up until it creates a Program
        return match ($type) {
            'Program' => Ppa::factory()->create([
                'type' => 'Program',
                'parent_id' => null,
                'office_id' => 18,
            ])->id,

            'Project' => Ppa::factory()
                ->project()
                ->create([
                    'office_id' => 18,
                ])->id,

            'Activity' => Ppa::factory()
                ->activity()
                ->create([
                    'office_id' => 18,
                ])->id,

            default => null,
        };
    }
}
