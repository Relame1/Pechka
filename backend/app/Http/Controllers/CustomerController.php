<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    /**
     * Получить список всех клиентов
     */
    public function index()
    {
        $this->syncCustomersFromUsersAndOrders();
        
        $customers = Customer::orderBy('total_spent', 'desc')->get();
        $customersArray = $customers->map(function ($customer) {
            return $this->convertToCamelCase($customer);
        });
        
        return response()->json($customersArray);
    }

    /**
     * Получить статистику по клиентам
     */
    public function stats()
    {
        $this->syncCustomersFromUsersAndOrders();
        
        $total = Customer::count();
        
        $currentMonth = now()->startOfMonth();
        $activeThisMonth = Customer::where('last_order_date', '>=', $currentMonth)->count();
        
        $newThisMonth = Customer::where('created_at', '>=', $currentMonth)
            ->orWhere('total_orders', 1)
            ->count();
        
        $avgCheck = Customer::avg('total_spent') ?? 0;
        
        return response()->json([
            'total' => $total,
            'activeThisMonth' => $activeThisMonth,
            'newThisMonth' => $newThisMonth,
            'avgCheck' => round($avgCheck),
        ]);
    }

    /**
     * Синхронизация клиентов из users (регистрации) и orders (заказы)
     */
    private function syncCustomersFromUsersAndOrders(): void
    {
        DB::beginTransaction();
        try {
            $users = User::where('role', 'client')->get();
            
            foreach ($users as $user) {
                Customer::updateOrCreate(
                    ['email' => $user->email],
                    [
                        'name' => $user->name,
                        'phone' => $user->phone,
                        'address' => $user->address,
                    ]
                );
            }
            $orders = Order::all();
            $customerStats = [];
            
            foreach ($orders as $order) {
                $customerName = $order->customer_name;
                if (!isset($customerStats[$customerName])) {
                    $customerStats[$customerName] = [
                        'total_orders' => 0,
                        'total_spent' => 0,
                        'last_order_date' => null,
                        'phone' => $order->customer_phone,
                        'email' => null,
                        'address' => $order->address,
                        'name' => $customerName,
                    ];
                }
                
                $customerStats[$customerName]['total_orders']++;
                $customerStats[$customerName]['total_spent'] += $order->amount;
                
                $orderDate = $order->created_at ? $order->created_at->toDateString() : null;
                if ($orderDate && (!$customerStats[$customerName]['last_order_date'] || $orderDate > $customerStats[$customerName]['last_order_date'])) {
                    $customerStats[$customerName]['last_order_date'] = $orderDate;
                }
            }
            foreach ($customerStats as $customerData) {
                Customer::updateOrCreate(
                    ['name' => $customerData['name']],
                    [
                        'phone' => $customerData['phone'],
                        'address' => $customerData['address'],
                        'total_orders' => $customerData['total_orders'],
                        'total_spent' => $customerData['total_spent'],
                        'last_order_date' => $customerData['last_order_date'],
                    ]
                );
            }
            
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Ошибка синхронизации клиентов: ' . $e->getMessage());
        }
    }

    /**
     * Преобразует snake_case поля модели в camelCase для ответа
     */
    private function convertToCamelCase(Customer $customer): array
    {
        return [
            'id' => $customer->id,
            'name' => $customer->name,
            'phone' => $customer->phone,
            'email' => $customer->email,
            'address' => $customer->address,
            'totalOrders' => $customer->total_orders,
            'totalSpent' => (float) $customer->total_spent,
            'lastOrderDate' => $customer->last_order_date ? $customer->last_order_date->toDateString() : null,
            'created_at' => $customer->created_at,
            'updated_at' => $customer->updated_at,
        ];
    }
}