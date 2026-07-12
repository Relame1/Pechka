<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('ovens', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->integer('temperature')->default(0);
            $table->timestamps();
        });

        DB::table('ovens')->insert([
            ['name' => 'Печь №1', 'temperature' => 200],
            ['name' => 'Печь №2', 'temperature' => 200],
            ['name' => 'Печь №3', 'temperature' => 200],
            ['name' => 'Печь №4', 'temperature' => 200],
        ]);
    }

    public function down()
    {
        Schema::dropIfExists('ovens');
    }
};