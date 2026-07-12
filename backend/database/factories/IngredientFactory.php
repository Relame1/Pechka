<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Ingredient>
 */
class IngredientFactory extends Factory
{
    public function definition(): array
    {
        $units = ['кг', 'г', 'л', 'шт', 'уп'];
        $categories = ['Мука', 'Жиры', 'Сыпучие', 'Дрожжи', 'Яйца', 'Специи', 'Фрукты', 'Овощи', 'Молочные', 'Прочее'];

        return [
            'name'           => $this->faker->unique()->words(2, true),
            'category'       => $this->faker->randomElement($categories),
            'unit'           => $this->faker->randomElement($units),
            'stock'          => $this->faker->randomFloat(2, 0, 500),
            'min_stock'      => $this->faker->randomFloat(2, 5, 50),
            'price_per_unit' => $this->faker->randomFloat(2, 20, 1200),
            'last_delivery'  => $this->faker->dateTimeBetween('-30 days', 'now')->format('Y-m-d'),
            'notes'          => $this->faker->optional(0.3)->sentence(),
        ];
    }
}