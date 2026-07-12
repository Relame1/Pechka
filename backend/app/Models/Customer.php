<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'phone',
        'email',
        'address',
        'total_orders',
        'total_spent',
        'last_order_date',
    ];

    protected $casts = [
        'total_spent' => 'decimal:2',
        'last_order_date' => 'date',
    ];

    /**
     * Получить заказы клиента по имени или email
     */
    public function getOrders()
    {
        if ($this->email) {
            return Order::where('customer_email', $this->email)->get();
        } else {
            return Order::where('customer_name', $this->name)->get();
        }
    }

    /**
     * Обновить статистику клиента на основе заказов
     */
    public function updateStatsFromOrders(): void
    {
        $orders = $this->getOrders();
        
        $totalOrders = $orders->count();
        $totalSpent = $orders->sum('amount');
        $lastOrderDate = $orders->max('created_at');
        
        $this->update([
            'total_orders' => $totalOrders,
            'total_spent' => $totalSpent,
            'last_order_date' => $lastOrderDate,
        ]);
    }
}