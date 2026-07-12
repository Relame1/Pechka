<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ingredient extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'category',
        'unit',
        'stock',
        'min_stock',
        'price_per_unit',
        'last_delivery',
        'notes',
    ];

    protected $casts = [
        'stock' => 'decimal:3',
        'min_stock' => 'decimal:3',
        'price_per_unit' => 'decimal:2',
        'last_delivery' => 'date',
    ];

    public function checkLowStockAndNotify(): void
    {
        if ($this->stock <= $this->min_stock) {
            $existing = Notification::where('ingredient_id', $this->id)
                ->where('read', false)
                ->where('type', 'warning')
                ->first();

            if (!$existing) {
                $message = "Заканчивается ингредиент: {$this->name}. Осталось: {$this->stock} {$this->unit}. Минимальный запас: {$this->min_stock} {$this->unit}.";
                Notification::create([
                    'type' => 'warning',
                    'message' => $message,
                    'ingredient_id' => $this->id,
                    'read' => false,
                ]);
            }
        } else {
            Notification::where('ingredient_id', $this->id)
                ->where('read', false)
                ->update(['read' => true]);
        }
    }
}