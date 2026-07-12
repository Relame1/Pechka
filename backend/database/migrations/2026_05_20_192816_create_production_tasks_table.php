<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('production_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained();
            $table->decimal('quantity', 10, 2);
            $table->enum('status', [
                'pending', 'preparing', 'baking', 'cooling', 'packing', 'completed'
            ])->default('pending');
            $table->foreignId('assigned_oven_id')->nullable()->constrained('ovens');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->integer('baking_temperature')->nullable();
            $table->integer('baking_time_minutes')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('order_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('production_tasks');
    }
};