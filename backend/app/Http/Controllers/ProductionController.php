<?php

namespace App\Http\Controllers;

use App\Models\ProductionTask;
use App\Models\Oven;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductionController extends Controller
{
    public function tasks()
    {
        $tasks = ProductionTask::with(['product', 'order'])->get()->map(function ($task) {
            return [
                'id'          => $task->id,
                'productName' => $task->product->name,
                'productId'   => $task->product_id,
                'orderCode'   => $task->order->code,
                'orderDueDate' => $task->order->due_at,
                'orderProductionStatus' => $task->order->production_status,
                'quantity'    => $task->quantity,
                'unit'        => $task->product->unit,
                'status'      => $task->status,
                'assignedTo'  => null,
                'remainingSeconds' => $this->getRemainingSeconds($task),
                'bakingTemperature' => $task->baking_temperature,
                'bakingTimeMinutes' => $task->baking_time_minutes,
                'finishedAt' => $task->finished_at, 
                'createdAt' => $task->created_at,   
            ];
        });
        return response()->json($tasks);
    }
    public function ovens()
    {
        $ovens = Oven::with('currentTask')->get()->map(function ($oven) {
            $current = $oven->currentTask;
            $totalSeconds = null;
            $taskTemperature = null;
            if ($current) {
                $totalSeconds = $current->baking_time_minutes ? $current->baking_time_minutes * 60 : null;
                $taskTemperature = $current->baking_temperature;
            }
            return [
                'id'               => $oven->id,
                'name'             => $oven->name,
                'temperature'      => $taskTemperature ?? $oven->temperature,
                'currentTask'      => $current ? [
                    'productName' => $current->product->name,
                    'id'          => $current->id,
                ] : null,
                'remainingSeconds' => $current ? $this->getRemainingSeconds($current) : null,
                'totalSeconds'     => $totalSeconds,
                'nextTask'         => null,
            ];
        });
        return response()->json($ovens);
    }
    public function ingredientsRequirements()
    {
        $activeTasks = ProductionTask::whereNotIn('status', ['completed'])->get();
        $requirements = [];

        foreach ($activeTasks as $task) {
            $product = $task->product;
            foreach ($product->ingredients as $ingredient) {
                $needed = $ingredient->pivot->quantity * $task->quantity;
                if (!isset($requirements[$ingredient->id])) {
                    $requirements[$ingredient->id] = [
                        'ingredientId' => $ingredient->id,
                        'name'         => $ingredient->name,
                        'needed'       => 0,
                        'unit'         => $ingredient->unit,
                        'available'    => $ingredient->stock,
                    ];
                }
                $requirements[$ingredient->id]['needed'] += $needed;
            }
        }

        return response()->json(array_values($requirements));
    }
    public function notifications()
    {
        $notifications = \App\Models\Notification::orderBy('created_at', 'desc')->get()->map(function ($n) {
            return [
                'id' => $n->id,
                'type' => $n->type,
                'message' => $n->message,
                'timestamp' => $n->created_at,
                'read' => (bool) $n->read,
            ];
        });
        return response()->json($notifications);
    }
    public function updateTask(Request $request, $id)
    {
        $task = ProductionTask::findOrFail($id);
        $newStatus = $request->status;

        DB::beginTransaction();
        try {
            if ($newStatus === 'baking' && $task->status !== 'baking') {
                $freeOven = Oven::whereDoesntHave('currentTask')->first();
                if (!$freeOven) {
                    return response()->json(['error' => 'Нет свободных печей'], 422);
                }
                $task->assigned_oven_id = $freeOven->id;
                $task->started_at = now();
                if ($request->has('temperature')) {
                    $task->baking_temperature = $request->temperature;
                }
                if ($request->has('timeMinutes')) {
                    $task->baking_time_minutes = $request->timeMinutes;
                }
            }

            if ($newStatus === 'completed' && $task->status !== 'completed') {
                $product = $task->product;
                foreach ($product->ingredients as $ingredient) {
                    $needed = $ingredient->pivot->quantity * $task->quantity;
                    $ingredient->decrement('stock', $needed);
                    $ingredient->checkLowStockAndNotify();
                }
                $task->finished_at = now();
                if ($task->assigned_oven_id) {
                    $task->assigned_oven_id = null;
                }
                $remaining = ProductionTask::where('order_id', $task->order_id)
                            ->where('status', '!=', 'completed')
                            ->count();
                if ($remaining === 0) {
                    $order = $task->order;
                    $order->status = 'Завершён';
                    $order->save();
                }
            }

            $task->status = $newStatus;
            $task->save();
            DB::commit();

            $task->load('product', 'order');
            return response()->json(['success' => true, 'data' => $task]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    public function markNotificationRead($id)
    {
        $notification = \App\Models\Notification::find($id);
        if ($notification) {
            $notification->read = true;
            $notification->save();
            return response()->json(['success' => true]);
        }
        return response()->json(['success' => false], 404);
    }

    private function getRemainingSeconds($task)
    {
        if ($task->status !== 'baking' || !$task->started_at) return null;
        $endTime = $task->started_at->copy()->addMinutes($task->baking_time_minutes ?? 30);
        $remaining = max(0, now()->diffInSeconds($endTime, false));
        return $remaining > 0 ? (int) $remaining : 0;
    }
}