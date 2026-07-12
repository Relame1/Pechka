<?php

namespace App\Http\Controllers;

use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class ReviewController extends Controller
{
    public function index()
    {
        $reviews = Review::orderBy('created_at', 'desc')->get();
        
        return response()->json($reviews);
    }
    public function stats()
    {
        $reviews = Review::all();
        
        $total = $reviews->count();
        $averageRating = $total > 0 ? $reviews->avg('rating') : 0;
        
        $stats = [
            'totalReviews' => $total,
            'averageRating' => round($averageRating, 1),
            'fiveStar' => $reviews->where('rating', 5)->count(),
            'fourStar' => $reviews->where('rating', 4)->count(),
            'threeStar' => $reviews->where('rating', 3)->count(),
            'twoStar' => $reviews->where('rating', 2)->count(),
            'oneStar' => $reviews->where('rating', 1)->count(),
        ];
        
        return response()->json($stats);
    }
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'city' => 'nullable|string|max:255',
            'rating' => 'required|integer|min:1|max:5',
            'text' => 'required|string|min:3|max:5000',
        ]);
        
        if ($validator->fails()) {
            throw ValidationException::withMessages($validator->errors()->toArray());
        }
        $isVerified = $request->user() ? true : false;
        
        $review = Review::create([
            'name' => $request->name,
            'email' => $request->email,
            'city' => $request->city,
            'rating' => $request->rating,
            'text' => $request->text,
            'is_verified' => $isVerified,
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Спасибо за ваш отзыв!',
            'review' => $review
        ], 201);
    }
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        
        if (!in_array($user->role, ['admin', 'manager'])) {
            return response()->json(['message' => 'Нет прав'], 403);
        }
        
        $review = Review::findOrFail($id);
        $review->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Отзыв удалён'
        ]);
    }
}