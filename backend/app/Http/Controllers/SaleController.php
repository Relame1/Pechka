<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaleController extends Controller
{
    public function index()
    {
        $sales = Sale::with('items.product')->orderBy('created_at', 'desc')->get();
        return response()->json($sales);
    }

    public function store(Request $request)
    {
        $request->validate([
            'customer_name' => 'nullable|string|max:255',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.price' => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $total = 0;
            $itemsData = [];

            foreach ($request->items as $item) {
                $product = Product::find($item['product_id']);
                if (!$product) {
                    throw new \Exception("Продукт не найден");
                }
                if ($product->stock < $item['quantity']) {
                    throw new \Exception("Недостаточно товара '{$product->name}'. Доступно: {$product->stock}");
                }
                $itemTotal = $item['quantity'] * $item['price'];
                $total += $itemTotal;
                $itemsData[] = [
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'total' => $itemTotal,
                ];
            }

            $sale = Sale::create([
                'customer_name' => $request->customer_name,
                'total' => $total,
            ]);

            foreach ($itemsData as $data) {
                SaleItem::create(array_merge($data, ['sale_id' => $sale->id]));
                $product = Product::find($data['product_id']);
                $product->decrement('stock', $data['quantity']);
            }

            DB::commit();
            return response()->json($sale->load('items'), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            throw ValidationException::withMessages(['error' => $e->getMessage()]);
        }
    }

    public function show($id)
    {
        $sale = Sale::with('items.product')->find($id);
        if (!$sale) {
            return response()->json(['message' => 'Продажа не найдена'], 404);
        }
        return response()->json($sale);
    }

    public function destroy($id)
    {
        $sale = Sale::find($id);
        if (!$sale) {
            return response()->json(['message' => 'Продажа не найдена'], 404);
        }
        $sale->delete();
        return response()->json(['success' => true]);
    }
}