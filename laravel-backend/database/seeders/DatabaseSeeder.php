<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'superadmin@hrms.local'],
            [
                'name' => 'Platform Super Admin',
                'password' => Hash::make('SuperAdmin@123'),
                'role' => 'SUPER_ADMIN',
            ],
        );
    }
}
