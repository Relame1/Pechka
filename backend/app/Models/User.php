<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'login',
        'phone',
        'status',
        'position',
        'department',
        'hire_date',
        'salary',
        'address',
        'birth_date',
        'emergency_contact',
        'emergency_phone',
        'notes',
        'yandex_id',
        'avatar',
        'email_verified_at', // ← ДОБАВЬТЕ ЭТУ СТРОКУ!
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'hire_date' => 'date',
            'birth_date' => 'date',
            'salary' => 'decimal:2',
        ];
    }
}