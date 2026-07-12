<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Models\ProductionTask;
use Illuminate\Console\Command;
use Carbon\Carbon;

class CreateScheduledTasks extends Command
{
    protected $signature = 'orders:create-tasks';
    protected $description = 'Создаёт производственные задачи для запланированных заказов';

    public function handle()
    {
        $this->info('Планировщик запущен. Проверка заказов каждую минуту...');
        
        while (true) {
            $this->checkAndCreateTasks();
            sleep(60);
        }
    }

    private function checkAndCreateTasks()
    {
        $now = Carbon::now();

        $orders = Order::where('production_status', 'Запланирован')
            ->where('due_at', '<=', $now->copy()->addHours(2))
            ->where('due_at', '>=', $now)
            ->get();
        
        if ($orders->count() > 0) {
            $this->info("Найдено {$orders->count()} заказов для обработки в " . $now->format('H:i:s'));
        }
        
        $createdCount = 0;
        
        foreach ($orders as $order) {
            $dueTime = Carbon::parse($order->due_at);
            $minutesUntilDue = $now->diffInMinutes($dueTime);
            if ($minutesUntilDue <= 120) {
                foreach ($order->items as $item) {
                    ProductionTask::create([
                        'order_id'   => $order->id,
                        'product_id' => $item->product_id,
                        'quantity'   => $item->quantity,
                        'status'     => 'pending',
                    ]);
                }
                
                $order->production_status = 'Ожидает';
                $order->save();
                
                $createdCount++;
                $this->info("Созданы задачи для заказа {$order->code} (доставка через {$minutesUntilDue} минут)");
            }
        }
        
        if ($createdCount > 0) {
            $this->info("Всего создано задач: {$createdCount}");
        }
    }
}