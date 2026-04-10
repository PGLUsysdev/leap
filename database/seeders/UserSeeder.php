<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;
use App\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            [
                'name' => 'Admin',
                'email' => 'admin@mail.com',
                'password' => Hash::make('12345678'),
                'role' => 'admin',
                'status' => 'active',
            ],
            [
                'name' => 'OPG',
                'email' => 'opg@mail.com',
                'password' => Hash::make('12345678'),
                'email_verified_at' => Carbon::now(),
                'office_id' => 1,
            ],
            [
                'name' => 'BACSU',
                'email' => 'bacsu@mail.com',
                'password' => Hash::make('12345678'),
                'email_verified_at' => Carbon::now(),
                'office_id' => 2,

            ],
            [
                'name' => 'PICTO',
                'email' => 'picto@mail.com',
                'password' => Hash::make('12345678'),
                'email_verified_at' => Carbon::now(),
                'office_id' => 18,

            ],
        ];

        foreach ($users as $userData) {
            // updateOrCreate ensures no duplicates based on email
            User::updateOrCreate(
                ['email' => $userData['email']], // Search criteria
                $userData, // Data to update or insert
            );
        }
    }
}
