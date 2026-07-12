<?php

namespace App\Models;

use App\Models\Ingredient;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'article', 'name', 'category', 'price', 'unit',
        'in_stock', 'description', 'prep_time', 'calories', 'image', 'stock'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'in_stock' => 'boolean',
        'stock' => 'decimal:3',
    ];

    /**
     * Связь "многие ко многим" с таблицей ингредиентов
     */
    public function ingredients()
    {
        return $this->belongsToMany(Ingredient::class, 'product_ingredient')
                    ->withPivot('quantity', 'unit')
                    ->withTimestamps();
    }
}