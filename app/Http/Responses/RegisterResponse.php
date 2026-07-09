<?php

namespace App\Http\Responses;

use Illuminate\Support\Facades\Auth;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;

class RegisterResponse implements RegisterResponseContract
{
    public function toResponse($request)
    {
        Auth::logout();

        // Redirect back to the register page with a flash message
        return redirect()
            ->route('register')
            ->with('status', 'awaiting-approval');
    }
}
