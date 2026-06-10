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
            // [
            //     'id' => 1,
            //     'name' => 'Super Admin',
            //     'email' => 'superadmin@mail.com',
            //     'password' => Hash::make('12345678'),
            //     'status' => 'active',
            //     'office_id' => null, // still unsure if we allow null here
            //     'role_id' => 1, // super admin
            //     'email_verified_at' => Carbon::now(),
            // ],
            // [
            //     'name' => 'Admin',
            //     'email' => 'admin@mail.com',
            //     'password' => Hash::make('12345678'),
            //     'status' => 'active',
            //     'office_id' => null,
            //     'role_id' => 1,
            //     'email_verified_at' => Carbon::now(),
            // ],
            // [
            //     'name' => 'OPG',
            //     'email' => 'opg@mail.com',
            //     'password' => Hash::make('12345678'),
            //     'status' => 'active',
            //     'office_id' => null,
            //     'role_id' => 1,
            //     'email_verified_at' => Carbon::now(),
            // ],
            // [
            //     'name' => 'BACSU',
            //     'email' => 'bacsu@mail.com',
            //     'password' => Hash::make('12345678'),
            //     'status' => 'active',
            //     'office_id' => 2,
            //     'role_id' => 1,
            //     'email_verified_at' => Carbon::now(),
            // ],
            // [
            //     'name' => 'PICTO',
            //     'email' => 'picto@mail.com',
            //     'password' => Hash::make('12345678'),
            //     'status' => 'active',
            //     'office_id' => 18,
            //     'role_id' => 1,
            //     'email_verified_at' => Carbon::now(),
            // ],
        ];

        foreach ($users as $userData) {
            // updateOrCreate ensures no duplicates based on email
            User::updateOrCreate(
                ['email' => $userData['email']], // Search criteria
                // ['id' => $userData['id']],
                $userData, // Data to update or insert
            );
        }
    }
}
