<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('article')->unique();
            $table->string('name');
            $table->string('category');
            $table->decimal('price', 12, 2);
            $table->string('unit')->default('шт');
            $table->boolean('in_stock')->default(true);
            $table->text('description')->nullable();
            $table->integer('prep_time')->nullable();
            $table->integer('calories')->nullable();
            $table->string('image')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};