<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class IsAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Check if the user is even logged in
        // 2. Check if the user has the 'admin' role
        // if (Auth::check() && Auth::user()->role === 'admin') {
        // if (Auth::user()->role?->name === 'admin') {
        //     return $next($request);
        // }

        // If not an admin, boot them out
        abort(403, 'Unauthorized action.');
    }
}
