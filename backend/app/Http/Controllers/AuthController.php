<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\EmailVerificationCode;
use App\Mail\EmailVerificationMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->username)
                    ->orWhere('name', $request->username)
                    ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['Неверный логин или пароль.'],
            ]);
        }

        if (!$user->email_verified_at && $user->role === 'client') {
            throw ValidationException::withMessages([
                'username' => ['Подтвердите email перед входом.'],
            ]);
        }

        $user->tokens()->delete();
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone,
            ],
            'token' => $token,
            'message' => 'Успешный вход'
        ]);
    }
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6|confirmed',
        ]);

        try {
            $registrationData = [
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'client',
                'phone' => $request->phone ?? null,
                'address' => $request->address ?? null,
            ];
            
            cache()->put('registration_' . $request->email, $registrationData, now()->addMinutes(10));
            
            $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            
            EmailVerificationCode::where('email', $request->email)->delete();
            
            EmailVerificationCode::create([
                'email' => $request->email,
                'code' => $code,
                'expires_at' => Carbon::now()->addMinutes(10),
                'is_used' => false,
            ]);

            try {
                Mail::to($request->email)->send(new EmailVerificationMail($code, $request->name));
                \Log::info('Email sent to ' . $request->email . ' with code: ' . $code);
            } catch (\Exception $e) {
                \Log::error('Failed to send email: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Код подтверждения отправлен на email',
                'email' => $request->email,
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Register error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Ошибка при регистрации: ' . $e->getMessage()
            ], 500);
        }
    }

    public function verifyEmail(Request $request)
    {
    $request->validate([
        'email' => 'required|email',
        'code' => 'required|string|size:6',
    ]);

    $existingUser = User::where('email', $request->email)->first();
    if ($existingUser) {
        return response()->json([
            'success' => false,
            'message' => 'Пользователь с таким email уже зарегистрирован'
        ], 422);
    }

    $verificationCode = EmailVerificationCode::where('email', $request->email)
        ->where('code', $request->code)
        ->where('is_used', false)
        ->where('expires_at', '>', Carbon::now())
        ->first();

    if (!$verificationCode) {
        return response()->json([
            'success' => false,
            'message' => 'Неверный или просроченный код'
        ], 422);
    }

    $registrationData = cache()->get('registration_' . $request->email);
    
    if (!$registrationData) {
        return response()->json([
            'success' => false,
            'message' => 'Данные регистрации устарели. Пожалуйста, зарегистрируйтесь заново.'
        ], 422);
    }

    $verificationCode->update(['is_used' => true]);
    cache()->forget('registration_' . $request->email);

    $user = User::create([
        'name' => $registrationData['name'],
        'email' => $registrationData['email'],
        'password' => $registrationData['password'],
        'role' => 'client',
        'phone' => $registrationData['phone'] ?? null,
        'address' => $registrationData['address'] ?? null,
        'email_verified_at' => Carbon::now(),
    ]);

    $token = $user->createToken('auth-token')->plainTextToken;

    return response()->json([
        'success' => true,
        'message' => 'Регистрация успешно завершена!',
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'phone' => $user->phone,
        ],
        'token' => $token,
    ]);
    }

    public function resendVerificationCode(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $existingUser = User::where('email', $request->email)->first();
        if ($existingUser) {
            return response()->json([
                'success' => false,
                'message' => 'Пользователь с таким email уже зарегистрирован'
            ], 422);
        }

        $registrationData = cache()->get('registration_' . $request->email);
        if (!$registrationData) {
            return response()->json([
                'success' => false,
                'message' => 'Данные регистрации не найдены. Пожалуйста, зарегистрируйтесь заново.'
            ], 422);
        }

        EmailVerificationCode::where('email', $request->email)->delete();

        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        EmailVerificationCode::create([
            'email' => $request->email,
            'code' => $code,
            'expires_at' => Carbon::now()->addMinutes(10),
            'is_used' => false,
        ]);

        try {
            Mail::to($request->email)->send(new EmailVerificationMail($code, $registrationData['name']));
            \Log::info('Resent email to ' . $request->email . ' with code: ' . $code);
        } catch (\Exception $e) {
            \Log::error('Failed to resend email: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Новый код отправлен',
        ]);
    }

    public function user(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'phone' => $user->phone,
            'address' => $user->address,
            'created_at' => $user->created_at,
            'email_verified_at' => $user->email_verified_at,
            'yandex_id' => $user->yandex_id,
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        
        $rules = [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
        ];
        
        if ($request->has('password') && !empty($request->password)) {
            $rules['current_password'] = 'required|string';
            $rules['password'] = 'required|string|min:6|confirmed';
        }
        
        $request->validate($rules);
        if ($request->has('password') && !empty($request->password)) {
            if (!Hash::check($request->current_password, $user->password)) {
                throw ValidationException::withMessages([
                    'current_password' => ['Неверный текущий пароль'],
                ]);
            }
            $user->password = Hash::make($request->password);
        }
        
        $user->name = $request->name;
        $user->email = $request->email;
        $user->phone = $request->phone;
        $user->address = $request->address;
        $user->save();
        
        return response()->json([
            'success' => true,
            'message' => 'Профиль обновлён',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
            ]
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Вы вышли из аккаунта']);
    }
    
    public function redirectToYandex()
    {
        $params = [
            'response_type' => 'code',
            'client_id' => env('YANDEX_CLIENT_ID'),
            'redirect_uri' => env('YANDEX_REDIRECT_URI'),
        ];
        
        $url = 'https://oauth.yandex.ru/authorize?' . http_build_query($params);
        
        return redirect($url);
    }

    public function handleYandexCallback(Request $request)
    {
    $code = $request->code;
    
    if (!$code) {
        \Log::error('Yandex callback error: no code provided');
        return redirect('http://localhost:4200/login?error=yandex_auth_failed');
    }
    try {
        $tokenResponse = Http::asForm()->post('https://oauth.yandex.ru/token', [
            'grant_type' => 'authorization_code',
            'code' => $code,
            'client_id' => env('YANDEX_CLIENT_ID'),
            'client_secret' => env('YANDEX_CLIENT_SECRET'),
        ]);
        
        if (!$tokenResponse->successful()) {
            \Log::error('Yandex token error: ' . $tokenResponse->body());
            return redirect('http://localhost:4200/login?error=yandex_auth_failed');
        }
        
        $tokenData = $tokenResponse->json();
        $accessToken = $tokenData['access_token'];
        $userResponse = Http::withToken($accessToken)
            ->get('https://login.yandex.ru/info?format=json');
        
        if (!$userResponse->successful()) {
            \Log::error('Yandex user info error: ' . $userResponse->body());
            return redirect('http://localhost:4200/login?error=yandex_auth_failed');
        }
        
        $yandexUser = $userResponse->json();
        $user = User::where('yandex_id', $yandexUser['id'])
            ->orWhere('email', $yandexUser['default_email'])
            ->first();
        
        if (!$user) {
            $user = User::create([
                'name' => $yandexUser['real_name'] ?? $yandexUser['display_name'] ?? $yandexUser['login'],
                'email' => $yandexUser['default_email'],
                'password' => Hash::make(uniqid()),
                'role' => 'client',
                'yandex_id' => $yandexUser['id'],
                'phone' => null,
                'email_verified_at' => Carbon::now(),
            ]);
        } else if (!$user->yandex_id) {
            $user->update([
                'yandex_id' => $yandexUser['id'],
                'email_verified_at' => $user->email_verified_at ?? Carbon::now(),
            ]);
        } else if (!$user->email_verified_at) {
            $user->update([
                'email_verified_at' => Carbon::now(),
            ]);
        }
        
        $user->tokens()->delete();
        $token = $user->createToken('auth-token')->plainTextToken;
        
        return redirect('http://localhost:4200/client?token=' . urlencode($token));
        
    } catch (\Exception $e) {
        \Log::error('Yandex auth exception: ' . $e->getMessage());
        return redirect('http://localhost:4200/login?error=yandex_auth_failed');
    }
    }
}