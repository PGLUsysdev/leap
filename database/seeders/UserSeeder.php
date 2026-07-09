<?php

namespace Database\Seeders;

use App\Models\Office;
use App\Models\Position;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Runs after OfficeSeeder and PositionSeeder, so
     * office and position records already exist.
     */
    public function run(): void
    {
        $users = [
            // BACSU
            [
                'name' => 'BACSU Viewer',
                'email' => 'viewer@bacsu.demo',
                'role_name' => 'viewer',
                'office_code' => 'BACSU',
            ],
            [
                'name' => 'BACSU User',
                'email' => 'user@bacsu.demo',
                'role_name' => 'user',
                'office_code' => 'BACSU',
            ],
            [
                'name' => 'BACSU Admin',
                'email' => 'admin@bacsu.demo',
                'role_name' => 'admin (bac)',
                'office_code' => 'BACSU',
            ],
            // PICTO
            [
                'name' => 'PICTO Viewer',
                'email' => 'viewer@picto.demo',
                'role_name' => 'viewer',
                'office_code' => 'PICTO',
            ],
            [
                'name' => 'PICTO User',
                'email' => 'user@picto.demo',
                'role_name' => 'user',
                'office_code' => 'PICTO',
            ],
            [
                'name' => 'PICTO Admin',
                'email' => 'admin@picto.demo',
                'role_name' => 'admin',
                'office_code' => 'PICTO',
            ],
            [
                'name' => 'PICTO Officer 1',
                'email' => 'officer1@picto.demo',
                'role_name' => 'user',
                'office_code' => 'PICTO',
            ],
            [
                'name' => 'PICTO Officer 2',
                'email' => 'officer2@picto.demo',
                'role_name' => 'user',
                'office_code' => 'PICTO',
            ],
            [
                'name' => 'PICTO Officer 3',
                'email' => 'officer3@picto.demo',
                'role_name' => 'user',
                'office_code' => 'PICTO',
            ],
        ];

        foreach ($users as $data) {
            if (User::where('email', $data['email'])->exists()) {
                continue;
            }

            $role = Role::where('name', $data['role_name'])->first();

            // Optional office lookup – adjust the column to match your schema
            $office = Office::where('acronym', $data['office_code'])->first();
            // If you don't have offices yet, simply set $office = null;

            User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'email_verified_at' => now(),
                'password' => Hash::make('12345678'), // set to 12345678
                'role_id' => $role ? $role->id : null,
                'office_id' => $office ? $office->id : null,
                'position_id' => null,
                'step' => null,
                'status' => 'active',
            ]);
        }
    }
}
