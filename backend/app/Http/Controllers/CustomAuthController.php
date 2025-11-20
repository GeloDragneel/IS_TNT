<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Login;
use App\Models\Loc_language;
use Hash;
class CustomAuthController extends Controller
{
    public function login(Request $request){
        // Validate incoming request
        $request->validate([
            'username' => 'required',
            'password' => 'required|min:6|max:15'
        ]);

        // Find user by username
        $user = Login::where('username', '=', $request->username)->first();

        // Check if the user exists and password matches
        if ($user && Hash::check($request->password, $user->password)) {
            // Set session data (you can store more information here if needed)
            session()->put('user_id', $user->id);

            // Return success response with user details
            return response()->json([
                'success' => true,
                'user' => [
                    'username' => $user->username,
                    'language' => $user->user_language,
                    'user_id' => $user->id,
                ],
            ]);
        } else {
            // Invalid credentials response
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials',
            ]);
        }
    }
    public function checkAuth(Request $request) {
        $userId = session('user_id');
        
        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'Not authenticated'
            ], 401);
        }
        
        $user = Login::find($userId);
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'user' => [
                'username' => $user->username,
                'language' => $user->user_language,
                'user_id' => $user->id,
            ]
        ]);
    }
    public function logout(Request $request) {
        // Clear session
        session()->forget('user_id');
        // Or use: session()->flush(); to clear all session data
        
        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }
    // Helper method to get current user ID
    protected function getCurrentUserId() {
        return session('user_id');
    }

    // Helper method to get current user
    protected function getCurrentUser() {
        $userId = session('user_id');
        return $userId ? Login::find($userId) : null;
    }
    public function getTranslations($lang)  {
        $rows = Loc_language::all(); // Assuming this is your table

        $translations = [];

        foreach ($rows as $row) {
            $tag = $row->loc_tag;
            $value = $row->$lang ?? $tag; // fallback to tag if lang column is missing
            $translations[$tag] = $value;
        }

        return response()->json($translations);
    }
} 
