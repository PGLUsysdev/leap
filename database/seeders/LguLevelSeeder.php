<?php

namespace Database\Seeders;

use App\Models\LguLevel;
use Illuminate\Database\Seeder;

class LguLevelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $lguLevels = [
            ['code' => '1', 'name' => 'Province'],
            ['code' => '2', 'name' => 'City'],
            ['code' => '3', 'name' => 'Minicipality'],
        ];

        foreach ($lguLevels as $lguLevel) {
            LguLevel::updateOrCreate($lguLevel);
        }
    }
}
