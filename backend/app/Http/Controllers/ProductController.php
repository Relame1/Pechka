<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::all();
        $products->each(function($product) {
            if ($product->image) {
                $product->image_url = asset('storage/' . $product->image);
            }
        });
        return response()->json($products);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'article'     => 'required|unique:products,article',
                'name'        => 'required|string|max:255',
                'category'    => 'required|string',
                'price'       => 'required|numeric|min:1',
                'unit'        => 'required|string',
                'in_stock'    => 'boolean',
                'description' => 'nullable|string',
                'prep_time'   => 'nullable|integer|min:1',
                'calories'    => 'nullable|integer|min:0',
                'ingredients' => 'nullable|array',
                'ingredients.*.ingredient_id' => 'required|exists:ingredients,id',
                'ingredients.*.quantity'      => 'required|numeric|min:0.1',
                'image'       => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
            ]);
            if ($request->hasFile('image')) {
                $imagePath = $request->file('image')->store('products', 'public');
                $validated['image'] = $imagePath;
            }

            $product = Product::create($validated);

            if ($request->has('ingredients')) {
                $ingredientsData = [];
                foreach ($request->ingredients as $ing) {
                    $ingredientsData[$ing['ingredient_id']] = [
                        'quantity' => $ing['quantity'],
                        'unit'     => 'кг',
                    ];
                }
                $product->ingredients()->attach($ingredientsData);
            }
            if ($product->image) {
                $product->image_url = asset('storage/' . $product->image);
            }

            return response()->json([
                'success' => true,
                'message' => 'Продукт успешно добавлен',
                'data'    => $product->load('ingredients')
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    public function show($id)
    {
        $product = Product::with('ingredients')->find($id);
        
        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Продукт не найден'
            ], 404);
        }

        if ($product->image) {
            $product->image_url = asset('storage/' . $product->image);
        }

        return response()->json([
            'success' => true,
            'data' => $product
        ]);
    }

    public function destroy($id)
    {
        $product = Product::find($id);
        if ($product) {
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }
            $product->delete();
        }
        return response()->json(['success' => true]);
    }

    public function updateStock(Request $request, $id)
    {
        $request->validate([
            'stock' => 'required|numeric|min:0'
        ]);

        $product = Product::find($id);
        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Продукт не найден'], 404);
        }

        $product->stock = $request->stock;
        $product->save();

        $product->in_stock = $product->stock > 0;
        $product->save();

        return response()->json([
            'success' => true,
            'message' => 'Количество обновлено',
            'data' => $product
        ]);
    }

    public function update(Request $request, $id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Продукт не найден'
            ], 404);
        }

        $validated = $request->validate([
            'article'     => 'required|unique:products,article,' . $id,
            'name'        => 'required|string|max:255',
            'category'    => 'required|string',
            'price'       => 'required|numeric|min:1',
            'unit'        => 'required|string',
            'in_stock'    => 'boolean',
            'description' => 'nullable|string',
            'prep_time'   => 'nullable|integer|min:1',
            'calories'    => 'nullable|integer|min:0',
            'image'       => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'ingredients' => 'nullable|array',
            'ingredients.*.ingredient_id' => 'required|exists:ingredients,id',
            'ingredients.*.quantity'      => 'required|numeric|min:0.1',
        ]);
        if ($request->hasFile('image')) {
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }
            $imagePath = $request->file('image')->store('products', 'public');
            $validated['image'] = $imagePath;
        }

        $product->update($validated);

        if ($request->has('ingredients')) {
            $ingredientsData = [];
            foreach ($request->ingredients as $ing) {
                $ingredientsData[$ing['ingredient_id']] = [
                    'quantity' => $ing['quantity'],
                    'unit'     => 'кг',
                ];
            }
            $product->ingredients()->sync($ingredientsData);
        }

        if ($request->has('stock')) {
            $product->stock = $request->stock;
            $product->in_stock = $request->stock > 0;
            $product->save();
        }

        if ($product->image) {
            $product->image_url = asset('storage/' . $product->image);
        }

        return response()->json([
            'success' => true,
            'message' => 'Продукт обновлён',
            'data'    => $product->load('ingredients')
        ]);
    }
}