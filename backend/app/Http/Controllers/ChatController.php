<?php

namespace App\Http\Controllers;

use App\Models\ChatMessage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ChatController extends Controller
{
    public function getMessages(Request $request)
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([]);
        }
        
        $messages = ChatMessage::where('user_email', $user->email)
            ->orderBy('created_at', 'asc')
            ->get();
        ChatMessage::where('user_email', $user->email)
            ->where('sender_type', 'admin')
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
        
        return response()->json($messages);
    }
    public function sendMessage(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
        ]);
        
        $user = $request->user();
        
        $message = ChatMessage::create([
            'user_id' => $user->id,
            'user_name' => $user->name,
            'user_email' => $user->email,
            'message' => $request->message,
            'sender_type' => 'client',
            'is_read' => false,
        ]);
        
        return response()->json([
            'success' => true,
            'message' => $message,
        ]);
    }
    public function sendGuestMessage(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'message' => 'required|string|max:1000',
        ]);
        
        $message = ChatMessage::create([
            'user_id' => null,
            'user_name' => $request->name,
            'user_email' => $request->email,
            'message' => $request->message,
            'sender_type' => 'client',
            'is_read' => false,
        ]);
        
        return response()->json([
            'success' => true,
            'message' => $message,
        ]);
    }
    public function sendAdminMessage(Request $request)
    {
        $request->validate([
            'user_email' => 'required|email',
            'message' => 'required|string|max:1000',
        ]);
        
        $admin = $request->user();
        if (!in_array($admin->role, ['admin', 'manager'])) {
            return response()->json([
                'success' => false,
                'message' => 'Нет прав для отправки сообщений'
            ], 403);
        }
        $user = User::where('email', $request->user_email)->first();
        $clientEmail = $request->user_email;
        $clientName = $user?->name ?? ($request->user_name ?? 'Клиент');
        
        \Log::info('Отправка сообщения от администратора', [
            'admin' => $admin->email,
            'to_client' => $clientEmail,
            'message' => $request->message
        ]);
        
        $message = ChatMessage::create([
            'user_id' => $user?->id,
            'user_name' => $admin->name, // Имя администратора
            'user_email' => $clientEmail, // Email КЛИЕНТА (важно!)
            'message' => $request->message,
            'sender_type' => 'admin',
            'is_read' => false,
        ]);
        
        return response()->json([
            'success' => true,
            'message' => $message,
        ]);
    }
    public function getAdminMessages(Request $request, $userEmail)
    {
        $admin = $request->user();
        if (!in_array($admin->role, ['admin', 'manager'])) {
            return response()->json([
                'success' => false,
                'message' => 'Нет прав для просмотра'
            ], 403);
        }
        $userEmail = urldecode($userEmail);
        
        \Log::info('Запрос сообщений для администратора', [
            'admin' => $admin->email,
            'userEmail' => $userEmail
        ]);
        $messages = ChatMessage::where('user_email', $userEmail)
            ->orderBy('created_at', 'asc')
            ->get();
        ChatMessage::where('user_email', $userEmail)
            ->where('sender_type', 'client')
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
        
        return response()->json($messages);
    }
    public function markAsRead(Request $request)
    {
        $request->validate([
            'message_ids' => 'required|array',
        ]);
        
        $user = $request->user();
        
        ChatMessage::whereIn('id', $request->message_ids)
            ->where('user_email', $user->email)
            ->where('sender_type', 'admin')
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
        
        return response()->json(['success' => true]);
    }
    public function getConversations(Request $request)
    {
        $admin = $request->user();
        if (!in_array($admin->role, ['admin', 'manager'])) {
            return response()->json([]);
        }
        $conversations = ChatMessage::select(
                'user_email', 
                'user_name', 
                DB::raw('MAX(created_at) as last_message_time'),
                DB::raw('COUNT(CASE WHEN sender_type = "client" AND is_read = 0 THEN 1 END) as unread_count')
            )
            ->where('user_email', '!=', $admin->email) // Исключаем самого администратора
            ->where('user_email', 'not like', '%admin%')
            ->where('user_email', 'not like', '%manager%')
            ->where('user_email', 'not like', '%support%')
            ->whereExists(function($query) {
                $query->select(DB::raw(1))
                      ->from('chat_messages as sub')
                      ->whereColumn('sub.user_email', 'chat_messages.user_email')
                      ->where('sub.sender_type', 'client');
            })
            ->groupBy('user_email', 'user_name')
            ->orderBy('last_message_time', 'desc')
            ->get()
            ->map(function($conv) {
                $lastMessage = ChatMessage::where('user_email', $conv->user_email)
                    ->orderBy('created_at', 'desc')
                    ->first();
                
                return [
                    'userEmail' => $conv->user_email,
                    'userName' => $conv->user_name,
                    'lastMessage' => $lastMessage?->message,
                    'lastMessageTime' => $conv->last_message_time,
                    'unreadCount' => (int) $conv->unread_count,
                ];
            });
        
        return response()->json($conversations);
    }
    public function deleteConversation(Request $request, $userEmail)
    {
        $admin = $request->user();
        if (!in_array($admin->role, ['admin', 'manager'])) {
            return response()->json([
                'success' => false,
                'message' => 'Нет прав для удаления'
            ], 403);
        }
        
        $userEmail = urldecode($userEmail);
        
        \Log::info('Удаление переписки', [
            'admin' => $admin->email,
            'userEmail' => $userEmail
        ]);
        $deleted = ChatMessage::where('user_email', $userEmail)->delete();
        
        return response()->json([
            'success' => true,
            'message' => "Удалено {$deleted} сообщений",
            'deleted_count' => $deleted
        ]);
    }
}