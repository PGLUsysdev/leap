<?php

namespace Database\Seeders;

use App\Models\FundingSource;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => 'password',
                'email_verified_at' => now(),
            ],
        );

        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        $this->call([
            UserSeeder::class,

            FiscalYearSeeder::class,

            SectorSeeder::class,
            LguLevelSeeder::class,
            OfficeTypeSeeder::class,

            FundingSourceSeeder::class,

            OfficeSeeder::class,

            AllotmentClassSeeder::class,
            AccountGroupSeeder::class,
            ChartOfAccountSeeder::class,
            PpaSeeder::class,
            AipEntrySeeder::class,
            PpmpCategorySeeder::class,
            PpmpPriceListSeeder::class,
            PpmpSeeder::class,
            PpaFundingSourceSeeder::class,
        ]);

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
    }
}
