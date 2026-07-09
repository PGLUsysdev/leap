<?php

namespace Database\Seeders;

use App\Models\CcStrategicPriority;
use Illuminate\Database\Seeder; // Imported your Eloquent model

class CcStrategicPrioritySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $priorities = [
            ['id' => 1, 'code' => 1, 'name' => 'Food Security'],
            ['id' => 2, 'code' => 2, 'name' => 'Water Sufficiency'],
            [
                'id' => 3,
                'code' => 3,
                'name' => 'Ecological and Environmental Stability',
            ],
            ['id' => 4, 'code' => 4, 'name' => 'Human Security'],
            [
                'id' => 5,
                'code' => 5,
                'name' => 'Climate Smart Industries and Services',
            ],
            ['id' => 6, 'code' => 6, 'name' => 'Sustainable Energy'],
            [
                'id' => 7,
                'code' => 7,
                'name' => 'Knowledge and Capacity Development',
            ],
            ['id' => 8, 'code' => 8, 'name' => 'Finance'],
        ];

        // Loop through each item so Eloquent handles the timestamp lifecycle automatically
        foreach ($priorities as $priority) {
            CcStrategicPriority::create($priority);
        }
    }
}
