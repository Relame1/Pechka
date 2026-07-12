<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductionTask;
use App\Models\Product;
use App\Services\YookassaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class OrderController extends Controller
{
    public function index()
    {
        $orders = Order::with('items')->orderBy('created_at', 'desc')->get();
        return response()->json($orders);
    }

    public function show($id)
    {
        $order = Order::with('items')->find($id);
        if (!$order) {
            return response()->json(['message' => 'Заказ не найден'], 404);
        }
        return response()->json($order);
    }

    public function store(Request $request)
    {
        $request->validate([
            'customer_name'     => 'required|string|max:255',
            'customer_phone'    => 'nullable|string|max:20',
            'customer_email'    => 'nullable|email',
            'address'           => 'nullable|string',
            'delivery_type'     => 'required|in:Доставка,Самовывоз',
            'due_at'            => 'required|date',
            'comment'           => 'nullable|string',
            'source'            => 'nullable|string',
            'items'             => 'required|array|min:1',
            'items.*.product_id'=> 'required|exists:products,id',
            'items.*.quantity'  => 'required|numeric|min:0.5',
            'items.*.price'     => 'required|numeric|min:0',
            'items.*.total'     => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            if (auth()->check() && !$request->customer_email) {
                $request->merge(['customer_email' => auth()->user()->email]);
            }
            
            $totalAmount = collect($request->items)->sum('total');
            
            $dueDate = Carbon::parse($request->due_at);
            $now = Carbon::now();
            $hoursDiff = $now->diffInHours($dueDate);
            if ($hoursDiff <= 2) {
                $productionStatus = 'Ожидает';
                $createTasksNow = true;
            } else {
                $productionStatus = 'Запланирован';
                $createTasksNow = false;
            }

            $order = Order::create([
                'customer_name'   => $request->customer_name,
                'customer_email'  => $request->customer_email ?? null,
                'customer_phone'  => $request->customer_phone,
                'address'         => $request->address,
                'delivery_type'   => $request->delivery_type,
                'due_at'          => $request->due_at,
                'comment'         => $request->comment,
                'amount'          => $totalAmount,
                'source'          => $request->source ?? 'Сайт',
                'status'          => 'Новый',
                'production_status' => $productionStatus,
                'payment_status'  => 'pending',
            ]);

            foreach ($request->items as $item) {
                $product = Product::find($item['product_id']);
                $productName = $product ? $product->name : ($item['product_name'] ?? 'Неизвестный продукт');

                OrderItem::create([
                    'order_id'    => $order->id,
                    'product_id'  => $item['product_id'],
                    'product_name'=> $productName,
                    'quantity'    => $item['quantity'],
                    'price'       => $item['price'],
                    'total'       => $item['total'],
                ]);

                if ($createTasksNow) {
                    ProductionTask::create([
                        'order_id'   => $order->id,
                        'product_id' => $item['product_id'],
                        'quantity'   => $item['quantity'],
                        'status'     => 'pending',
                    ]);
                }
            }

            $source = trim($request->source ?? '');
            $lowerSource = mb_strtolower($source, 'UTF-8');
            $isFromClientSite = str_contains($lowerSource, 'сайт') || 
                               str_contains($lowerSource, 'client') || 
                               str_contains($lowerSource, 'website');

            \Log::info('Order creation debug', [
                'source' => $source,
                'lowerSource' => $lowerSource,
                'isFromClientSite' => $isFromClientSite,
                'totalAmount' => $totalAmount,
                'order_id' => $order->id
            ]);

            $paymentUrl = null;

            if ($isFromClientSite && $totalAmount > 0) {
                try {
                    $yookassaService = app(YookassaService::class);
                    $returnUrl = 'http://localhost:4200/client?order_id=' . $order->id . '&payment_status=success';
                    
                    $paymentData = $yookassaService->createPayment($order, $returnUrl);
                    
                    $order->update([
                        'payment_id'     => $paymentData['payment_id'],
                        'payment_status' => 'pending',
                    ]);

                    $paymentUrl = $paymentData['confirmation_url'];

                    \Log::info('✅ YooKassa payment created SUCCESS', [
                        'order_id' => $order->id,
                        'payment_url' => $paymentUrl
                    ]);
                    
                } catch (\Exception $e) {
                    \Log::error('❌ YooKassa error', [
                        'order_id' => $order->id,
                        'error' => $e->getMessage()
                    ]);
                }
            } else {
                \Log::info('Payment skipped', ['reason' => 'condition_not_met']);
            }

            DB::commit();

            $response = [
                'success' => true,
                'order'   => $order->load('items'),
                'message' => 'Заказ успешно создан',
            ];
            if ($paymentUrl) {
                $response['payment_url'] = $paymentUrl;
                $response['message'] = 'Переходим к оплате...';
            }

            return response()->json($response, 201);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Ошибка создания заказа: ' . $e->getMessage(), [
                'request_data' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            throw ValidationException::withMessages(['error' => 'Не удалось создать заказ: ' . $e->getMessage()]);
        }
    }

    public function destroy($id)
    {
        $order = Order::find($id);
        if (!$order) {
            return response()->json(['message' => 'Заказ не найден'], 404);
        }
        $order->delete();
        return response()->json(['success' => true]);
    }

    public function update(Request $request, $id)
    {
        $order = Order::find($id);
        if (!$order) {
            return response()->json(['message' => 'Заказ не найден'], 404);
        }

        $order->update($request->only([
            'customer_name', 'customer_phone', 'address', 
            'delivery_type', 'due_at', 'comment', 'status'
        ]));

        if ($order->status === 'Завершён') {
            ProductionTask::where('order_id', $order->id)->delete();
            $order->notifyCompleted();
        }

        if ($request->has('items')) {
            $oldItems = $order->items;
            foreach ($oldItems as $oldItem) {
                ProductionTask::where('order_id', $order->id)
                    ->where('product_id', $oldItem->product_id)
                    ->delete();
            }
            $order->items()->delete();

            $totalAmount = 0;
            foreach ($request->items as $item) {
                $product = Product::find($item['product_id']);
                $productName = $product ? $product->name : $item['product_name'];
                
                $orderItem = OrderItem::create([
                    'order_id'    => $order->id,
                    'product_id'  => $item['product_id'],
                    'product_name'=> $productName,
                    'quantity'    => $item['quantity'],
                    'price'       => $item['price'],
                    'total'       => $item['total'],
                ]);
                $totalAmount += $item['total'];

                ProductionTask::create([
                    'order_id'   => $order->id,
                    'product_id' => $item['product_id'],
                    'quantity'   => $item['quantity'],
                    'status'     => 'pending',
                ]);
            }
            $order->amount = $totalAmount;
            $order->save();
        }

        return response()->json($order->load('items'));
    }

    /**
     * Получить заказы текущего авторизованного пользователя
     */
    public function myOrders(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([]);
        }
        if (!$user->email) {
            return response()->json([]);
        }
        
        $orders = Order::where('customer_email', $user->email)
            ->with('items')
            ->orderBy('created_at', 'desc')
            ->get();
        
        return response()->json($orders);
    }
}