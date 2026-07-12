<?php

namespace App\Services;

use YooKassa\Client;

class YookassaService
{
    protected $client;

    public function __construct()
    {
        $this->client = new Client();
        
        $shopId = env('YOOKASSA_SHOP_ID');
        $secretKey = env('YOOKASSA_SECRET_KEY');

        if (empty($shopId) || empty($secretKey)) {
            throw new \Exception('YooKassa credentials not set in .env');
        }

        $this->client->setAuth($shopId, $secretKey);
    }

    public function createPayment($order, string $returnUrl): array
    {
        $idempotenceKey = uniqid('payment_', true);

        $payment = $this->client->createPayment([
            'amount' => [
                'value' => number_format($order->amount, 2, '.', ''),
                'currency' => 'RUB',
            ],
            'confirmation' => [
                'type' => 'redirect',
                'return_url' => $returnUrl,
            ],
            'capture' => true,
            'description' => 'Заказ №' . $order->id,
            'metadata' => [
                'order_id' => $order->id,
            ],
        ], $idempotenceKey);

        return [
            'payment_id' => $payment->getId(),
            'confirmation_url' => $payment->getConfirmation()->getConfirmationUrl(),
        ];
    }
}