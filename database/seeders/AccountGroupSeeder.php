<?php

namespace Database\Seeders;

use App\Models\AccountGroup;
use Illuminate\Database\Seeder;

class AccountGroupSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $groups = [
            [
                'uacs_digit' => '1',
                'name' => 'Assets',
                'normal_balance' => 'debit',
            ],
            [
                'uacs_digit' => '2',
                'name' => 'Liabilities',
                'normal_balance' => 'credit',
            ],
            [
                'uacs_digit' => '3',
                'name' => 'Equity',
                'normal_balance' => 'credit',
            ],
            [
                'uacs_digit' => '4',
                'name' => 'Income',
                'normal_balance' => 'credit',
            ],
            [
                'uacs_digit' => '5',
                'name' => 'Expenses',
                'normal_balance' => 'debit',
            ],
        ];

        foreach ($groups as $group) {
            // Using the Eloquent updateOrCreate method
            AccountGroup::updateOrCreate(
                ['uacs_digit' => $group['uacs_digit']], // Search criteria
                $group, // Data to update or insert
            );
        }
    }
}
