<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Oven extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'temperature'];

    public function currentTask()
    {
        return $this->hasOne(ProductionTask::class, 'assigned_oven_id')
                    ->whereIn('status', ['baking']);
    }
}