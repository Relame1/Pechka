<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\IngredientController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductionController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ReviewController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
Route::post('/resend-verification', [AuthController::class, 'resendVerificationCode']);
Route::get('/auth/yandex', [AuthController::class, 'redirectToYandex']);
Route::get('/auth/yandex/callback', [AuthController::class, 'handleYandexCallback']);
Route::post('/chat/guest-send', [ChatController::class, 'sendGuestMessage']);
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/chat/messages', [ChatController::class, 'getMessages']);
    Route::post('/chat/send', [ChatController::class, 'sendMessage']);
    Route::post('/chat/mark-read', [ChatController::class, 'markAsRead']);
    Route::get('/chat/conversations', [ChatController::class, 'getConversations']);
    Route::post('/chat/admin/send', [ChatController::class, 'sendAdminMessage']);
    Route::get('/chat/admin/messages/{userEmail}', [ChatController::class, 'getAdminMessages']);
    Route::delete('/chat/conversation/{userEmail}', [ChatController::class, 'deleteConversation']);
});
Route::get('/reviews', [ReviewController::class, 'index']);
Route::get('/reviews/stats', [ReviewController::class, 'stats']);
Route::post('/reviews', [ReviewController::class, 'store']);
Route::middleware('auth:sanctum')->group(function () {
    Route::delete('/admin/reviews/{id}', [ReviewController::class, 'destroy']);
});
Route::post('/employee-login', function (Request $request) {
    $login = $request->login;
    $password = $request->password;
    
    $user = User::where('login', $login)
        ->orWhere('email', $login)
        ->whereIn('role', ['admin', 'manager', 'baker'])
        ->first();
    
    if ($user && Hash::check($password, $user->password) && $user->status === 'active') {
        $token = $user->createToken('employee-token')->plainTextToken;
        
        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'token' => $token,
            'message' => 'Успешный вход'
        ]);
    }
    
    return response()->json([
        'success' => false,
        'message' => 'Неверный логин или пароль'
    ], 401);
});
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/employees', [EmployeeController::class, 'index']);
    Route::get('/employees/stats', [EmployeeController::class, 'stats']);
    Route::get('/employees/{id}', [EmployeeController::class, 'show']);
    Route::post('/employees', [EmployeeController::class, 'store']);
    Route::put('/employees/{id}', [EmployeeController::class, 'update']);
    Route::delete('/employees/{id}', [EmployeeController::class, 'destroy']);
    Route::post('/employees/{id}/reset-password', [EmployeeController::class, 'resetPassword']);
});
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::get('/customers/stats', [CustomerController::class, 'stats']);
    Route::get('/orders/my', [OrderController::class, 'myOrders']);
});
Route::middleware('auth:sanctum')->group(function () {
    Route::put('/user/profile', [AuthController::class, 'updateProfile']);
});
Route::apiResource('ingredients', IngredientController::class);
Route::apiResource('products', ProductController::class);
Route::apiResource('orders', OrderController::class);
Route::apiResource('sales', SaleController::class);
Route::patch('/products/{id}/update-stock', [ProductController::class, 'updateStock']);
Route::prefix('production')->group(function () {
    Route::get('/tasks', [ProductionController::class, 'tasks']);
    Route::get('/ovens', [ProductionController::class, 'ovens']);
    Route::get('/ingredients-requirements', [ProductionController::class, 'ingredientsRequirements']);
    Route::get('/notifications', [ProductionController::class, 'notifications']);
    Route::put('/tasks/{id}', [ProductionController::class, 'updateTask']);
    Route::put('/notifications/{id}/read', [ProductionController::class, 'markNotificationRead']);
});
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
});