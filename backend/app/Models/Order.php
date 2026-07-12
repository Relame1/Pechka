<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'code', 'customer_name', 'customer_email', 'customer_phone', 'address',
        'delivery_type', 'status', 'production_status', 'due_at',
        'comment', 'amount', 'source'
    ];

    protected $casts = [
        'due_at' => 'datetime',
        'amount' => 'decimal:2',
    ];
    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($order) {
            if (!$order->code) {
                $lastOrder = static::orderBy('id', 'desc')->first();
                $nextId = $lastOrder ? $lastOrder->id + 1 : 1;
                $order->code = 'B-' . str_pad($nextId, 4, '0', STR_PAD_LEFT);
            }
        });
    }

    /**
     * Создаёт уведомление о выполнении заказа
     */
    public function notifyCompleted(): void
    {
        $message = "Заказ {$this->code} выполнен и готов к выдаче.";
        
        $existing = Notification::where('message', 'like', "%{$this->code}%")
            ->where('read', false)
            ->where('type', 'success')
            ->first();
        
        if (!$existing) {
            Notification::create([
                'type' => 'success',
                'message' => $message,
                'ingredient_id' => null,
                'read' => false,
            ]);
        }
    }
}