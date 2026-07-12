<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('user_name');
            $table->string('user_email');
            $table->text('message');
            $table->enum('sender_type', ['client', 'admin'])->default('client');
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            
            $table->index('user_email');
            $table->index('is_read');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_messages');
    }
};