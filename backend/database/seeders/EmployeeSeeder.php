<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Иван Петров',
            'email' => 'admin@pechka.ru',
            'login' => 'admin',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'phone' => '+7 (999) 123-45-67',
            'position' => 'Директор',
            'department' => 'Управление',
            'hire_date' => '2024-01-15',
            'salary' => 120000,
            'status' => 'active',
            'address' => 'г. Москва, ул. Ленина, д.10',
            'birth_date' => '1985-05-20',
            'emergency_contact' => 'Мария Петрова',
            'emergency_phone' => '+7 (999) 234-56-78',
            'notes' => 'Основатель компании',
        ]);
        User::create([
            'name' => 'Елена Смирнова',
            'email' => 'manager@pechka.ru',
            'login' => 'manager',
            'password' => Hash::make('manager123'),
            'role' => 'manager',
            'phone' => '+7 (999) 234-56-78',
            'position' => 'Шеф-повар',
            'department' => 'Производство',
            'hire_date' => '2024-02-01',
            'salary' => 85000,
            'status' => 'active',
            'address' => 'г. Москва, ул. Пушкина, д.25',
            'birth_date' => '1990-08-15',
            'emergency_contact' => 'Алексей Смирнов',
            'emergency_phone' => '+7 (999) 345-67-89',
            'notes' => 'Опыт работы 10 лет',
        ]);
        User::create([
            'name' => 'Михаил Иванов',
            'email' => 'baker@pechka.ru',
            'login' => 'baker',
            'password' => Hash::make('baker123'),
            'role' => 'baker',
            'phone' => '+7 (999) 345-67-89',
            'position' => 'Пекарь',
            'department' => 'Производство',
            'hire_date' => '2024-02-10',
            'salary' => 55000,
            'status' => 'active',
            'address' => 'г. Москва, ул. Садовая, д.5',
            'birth_date' => '1995-03-22',
            'emergency_contact' => 'Ольга Иванова',
            'emergency_phone' => '+7 (999) 456-78-90',
            'notes' => 'Специалист по хлебобулочным изделиям',
        ]);
    }
}