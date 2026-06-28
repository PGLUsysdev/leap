<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;
use App\Models\User;
use App\Models\Role;
use App\Models\Position;

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
        $superAdminRole = Role::where('name', 'super admin')->first();
        $adminRole = Role::where('name', 'admin')->first();
        $userRole = Role::where('name', 'user')->first();

        $pictoOfficeId = 18;

        $users = [
            [
                'name' => 'Super Admin',
                'email' => 'superadmin@mail.com',
                'password' => Hash::make('12345678'),
                'status' => 'active',
                'role_id' => $superAdminRole?->id,
                'office_id' => null,
                'position_id' => null,
                'step' => null,
                'email_verified_at' => Carbon::now(),
            ],
            [
                'name' => 'Admin',
                'email' => 'admin@mail.com',
                'password' => Hash::make('12345678'),
                'status' => 'active',
                'role_id' => $adminRole?->id,
                'office_id' => null,
                'position_id' => null,
                'step' => null,
                'email_verified_at' => Carbon::now(),
            ],
        ];

        // Create a user for every PICTO position
        $pictoPositions = Position::where('office_id', $pictoOfficeId)->get();

        foreach ($pictoPositions as $position) {
            $slug = str($position->title)
                ->lower()
                ->replaceMatches('/[^a-z0-9]+/', '-')
                ->toString();

            $users[] = [
                'name' => $position->title,
                'email' => "{$slug}@mail.com",
                'password' => Hash::make('12345678'),
                'status' => 'active',
                'role_id' => $userRole?->id,
                'office_id' => $pictoOfficeId,
                'position_id' => $position->id,
                'step' => 1,
                'email_verified_at' => Carbon::now(),
            ];
        }

        foreach ($users as $userData) {
            User::updateOrCreate(['email' => $userData['email']], $userData);
        }

        $this->command->info(
            'Seeded ' . count($users) . ' users successfully.',
        );
    }
}
