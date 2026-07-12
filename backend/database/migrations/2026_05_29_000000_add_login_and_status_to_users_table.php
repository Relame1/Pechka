<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('login')->unique()->nullable()->after('name');
            $table->string('phone')->nullable()->after('email');
            $table->enum('status', ['active', 'inactive', 'on_vacation'])->default('active')->after('role');
            $table->string('position')->nullable()->after('status');
            $table->string('department')->nullable()->after('position');
            $table->date('hire_date')->nullable()->after('department');
            $table->decimal('salary', 12, 2)->nullable()->after('hire_date');
            $table->text('address')->nullable()->after('salary');
            $table->date('birth_date')->nullable()->after('address');
            $table->string('emergency_contact')->nullable()->after('birth_date');
            $table->string('emergency_phone')->nullable()->after('emergency_contact');
            $table->text('notes')->nullable()->after('emergency_phone');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'login', 'phone', 'status', 'position', 'department',
                'hire_date', 'salary', 'address', 'birth_date',
                'emergency_contact', 'emergency_phone', 'notes'
            ]);
        });
    }
};