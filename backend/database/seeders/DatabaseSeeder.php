<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Ingredient;
use App\Models\Product;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call([
            IngredientSeeder::class,
            ProductSeeder::class,
        ]);

        User::create([
            'name' => 'Администратор',
            'email' => 'admin@pechka.ru',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'login' => 'admin',
            'phone' => '+7 (999) 123-45-67',
            'status' => 'active',
            'position' => 'Директор',
            'department' => 'Управление',
            'hire_date' => '2024-01-15',
            'salary' => 120000,
            'address' => 'г. Москва, ул. Ленина, д.10',
            'birth_date' => '1985-05-20',
            'emergency_contact' => 'Мария Петрова',
            'emergency_phone' => '+7 (999) 234-56-78',
            'notes' => 'Основатель компании',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Елена Смирнова',
            'email' => 'manager@pechka.ru',
            'password' => Hash::make('manager123'),
            'role' => 'manager',
            'login' => 'manager',
            'phone' => '+7 (999) 234-56-78',
            'status' => 'active',
            'position' => 'Шеф-повар',
            'department' => 'Производство',
            'hire_date' => '2024-02-01',
            'salary' => 85000,
            'address' => 'г. Москва, ул. Пушкина, д.25',
            'birth_date' => '1990-08-15',
            'emergency_contact' => 'Алексей Смирнов',
            'emergency_phone' => '+7 (999) 345-67-89',
            'notes' => 'Опыт работы 10 лет',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Михаил Иванов',
            'email' => 'baker@pechka.ru',
            'password' => Hash::make('baker123'),
            'role' => 'baker',
            'login' => 'baker',
            'phone' => '+7 (999) 345-67-89',
            'status' => 'active',
            'position' => 'Пекарь',
            'department' => 'Производство',
            'hire_date' => '2024-02-10',
            'salary' => 55000,
            'address' => 'г. Москва, ул. Садовая, д.5',
            'birth_date' => '1995-03-22',
            'emergency_contact' => 'Ольга Иванова',
            'emergency_phone' => '+7 (999) 456-78-90',
            'notes' => 'Специалист по хлебобулочным изделиям',
            'email_verified_at' => now(),
        ]);
        User::create([
            'name' => 'Тестовый Клиент',
            'email' => 'client@test.com',
            'password' => Hash::make('client123'),
            'role' => 'client',
            'login' => 'client',
            'phone' => '+7 (999) 999-99-99',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);
    }
}