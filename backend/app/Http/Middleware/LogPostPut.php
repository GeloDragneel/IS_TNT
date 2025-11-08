<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http; // <-- THIS is important

use App\Events\SyncEvent;

class LogPostPut{
    
    public function handle(Request $request, Closure $next){
        if (in_array($request->method(), ['POST', 'PUT'])) {
            event(new SyncEvent( 'save'));
        }

        return $next($request);
    }
}
