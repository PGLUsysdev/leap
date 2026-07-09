<?php

namespace App\Http\Controllers;

use App\Models\User;

class AdminUserController extends Controller
{
    public function approve(User $user)
    {
        $user->update(['status' => 'active']);

        // Optional: Send an email notification to the user
        // $user->notify(new AccountApprovedNotification());

        return back()->with('success', 'User approved successfully.');
    }
}
