<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    public function definition(): array
    {
        $categories = ['Хлеб', 'Выпечка', 'Кондитерские изделия', 'Слойки', 'Напитки'];
        $units = ['шт', 'кг', 'л'];

        return [
            'article'       => strtoupper($this->faker->lexify('??')) . '-' . $this->faker->numerify('####'),
            'name'          => $this->faker->words(2, true) . ' ' . $this->faker->word(),
            'category'      => $this->faker->randomElement($categories),
            'price'         => $this->faker->randomFloat(2, 50, 350),
            'unit'          => $this->faker->randomElement($units),
            'in_stock'      => $this->faker->boolean(80),
            'description'   => $this->faker->sentence(12),
            'prep_time'     => $this->faker->numberBetween(10, 45),
            'calories'      => $this->faker->numberBetween(80, 450),
            'image'         => null, // позже можно добавить
        ];
    }
}