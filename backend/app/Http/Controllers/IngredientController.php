<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class IngredientController extends Controller
{
    public function index()
    {
        return response()->json(Ingredient::all());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'            => 'required|string|max:255',
            'category'        => 'required|string',
            'unit'            => 'required|string',
            'stock'           => 'required|numeric|min:0',
            'min_stock'       => 'required|numeric|min:0',
            'price_per_unit'  => 'required|numeric|min:0.01',
            'last_delivery'   => 'nullable|date',
            'notes'           => 'nullable|string',
        ]);

        $ingredient = Ingredient::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Ингредиент успешно добавлен',
            'data'    => $ingredient
        ], 201);
    }

    public function show(Ingredient $ingredient)
    {
        return response()->json($ingredient);
    }

    public function update(Request $request, Ingredient $ingredient)
    {
        $data = $request->validate([
            'name'            => 'required|string|max:255',
            'category'        => 'required|string',
            'unit'            => 'required|string',
            'stock'           => 'required|numeric|min:0',
            'min_stock'       => 'required|numeric|min:0',
            'price_per_unit'  => 'required|numeric|min:0.01',
            'last_delivery'   => 'nullable|date',
            'notes'           => 'nullable|string',
        ]);

        $ingredient->update($data);
        $ingredient->checkLowStockAndNotify();

        return response()->json([
            'success' => true,
            'message' => 'Ингредиент обновлён',
            'data'    => $ingredient
        ]);
    }

    public function destroy($id)
    {
        $ingredient = Ingredient::find($id);

        if (!$ingredient) {
            return response()->json([
                'success' => false,
                'message' => 'Ингредиент не найден'
            ], 404);
        }

        $ingredient->delete();

        return response()->json([
            'success' => true,
            'message' => 'Ингредиент успешно удалён'
        ]);
    }
}