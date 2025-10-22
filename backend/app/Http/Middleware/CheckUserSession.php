<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckUserSession
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next){
        if (!session()->has('user_id')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Please login.'
            ], 401);
        }
        
        return $next($request);
    }
}