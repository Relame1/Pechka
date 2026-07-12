<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'city',
        'rating',
        'text',
        'is_verified',
    ];

    protected $casts = [
        'is_verified' => 'boolean',
        'rating' => 'integer',
    ];
}