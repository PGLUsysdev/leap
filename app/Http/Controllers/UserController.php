<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\Office;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        Gate::authorize('viewAny', User::class);

        $user = Auth::user();
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        $isSuperAdmin = $user->role->name === 'super admin';

        $usersQuery = User::with(['office', 'role']);

        if (! $permissions->contains('user.show.all')) {
            $usersQuery->where('office_id', $user->office_id);
        }

        // Hide the logged-in user from the list — except super admin,
        // who sees everyone including themselves.
        if (! $isSuperAdmin) {
            $usersQuery->where('id', '!=', $user->id);
        }

        return Inertia::render('users/index', [
            'users' => $usersQuery->get(),
            'roles' => Role::all(['id', 'name']),
            'offices' => Office::all(['id', 'name', 'acronym', 'parent_id']),
            'can' => [
                'editAll' => $permissions->contains('user.edit.all'),
                'editOwn' => $permissions->contains('user.edit.own'),
                'editOfficeAll' => $permissions->contains('user.edit.office.all'),
                'editOfficeOwn' => $permissions->contains('user.edit.office.own'),
                'editRoleAll' => $permissions->contains('user.edit.role.all'),
                'editRoleOwn' => $permissions->contains('user.edit.role.own'),
                'userOfficeId' => $user->office_id,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreUserRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(User $user)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateUserRequest $request, User $user)
    {
        Gate::authorize('update', $user);

        $data = $request->validated();
        $authUser = $request->user();

        // Only check the office/role permissions when the value actually changes.
        // The form always posts both fields, so a naive array_key_exists() check
        // would reject every save — even a status-only edit.
        $officeChanged = array_key_exists('office_id', $data)
            && (int) $data['office_id'] !== (int) $user->office_id;

        $roleChanged = array_key_exists('role_id', $data)
            && (int) $data['role_id'] !== (int) $user->role_id;

        if ($officeChanged || $roleChanged) {
            $authUser->loadMissing('role.permissionRoles.permission');
            $permissions = $authUser->role->permissionRoles->pluck('permission.name');

            if ($officeChanged) {
                $canOffice = $permissions->contains('user.edit.office.all');
                abort_unless($canOffice, 403, 'You cannot change a user\'s office.');
            }

            if ($roleChanged) {
                $canRole =
                    $permissions->contains('user.edit.role.all') ||
                    ($permissions->contains('user.edit.role.own') &&
                        $authUser->office_id === $user->office_id);
                abort_unless($canRole, 403, 'You cannot change a user\'s role.');
            }
        }

        $user->update($data);

        return back()->with('status', 'User updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        //
    }
}
