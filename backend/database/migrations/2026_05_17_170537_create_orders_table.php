<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();               // B-0101
            $table->string('customer_name');
            $table->string('customer_phone')->nullable();
            $table->text('address')->nullable();
            $table->enum('delivery_type', ['Доставка', 'Самовывоз'])->default('Доставка');
            $table->enum('status', ['Новый', 'Готовится', 'Доставляется', 'Завершён'])->default('Новый');
            $table->string('production_status')->nullable();  // Ожидает, Печь, Готов, Выдан
            $table->dateTime('due_at');                        // срок выполнения
            $table->text('comment')->nullable();
            $table->decimal('amount', 12, 2)->default(0);
            $table->string('source')->default('Сайт');         // Сайт, Телефон, Приложение
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};