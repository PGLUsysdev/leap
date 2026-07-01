<?php

namespace App\Http\Controllers;

use App\Http\Controllers\PsBreakdownController;
use Illuminate\Support\Facades\Request;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;

use Inertia\Inertia;

use App\Models\Office;
use App\Models\Position;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $this->authorize('viewAny', User::class);

        $user = Auth::user();
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        $usersQuery = User::with(['office', 'role', 'position.ios']);

        if (!$permissions->contains('user.show.all')) {
            $usersQuery->where('office_id', $user->office_id);
        }

        return Inertia::render('users/index', [
            'users' => $usersQuery->get(),
            'roles' => Role::all(['id', 'name']),
            'offices' => Office::all(['id', 'name', 'acronym', 'parent_id']),
            'positions' => Position::with('ios:id,class,salary_grade')->get([
                'id',
                'item_number',
                'ios_id',
                'office_id',
                'status',
            ]),
            'can' => [
                'editAll' => $permissions->contains('user.edit.all'),
                'editOwn' => $permissions->contains('user.edit.own'),
                'editOfficeAll' => $permissions->contains(
                    'user.edit.office.all',
                ),
                'editOfficeOwn' => $permissions->contains(
                    'user.edit.office.own',
                ),
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
        $this->authorize('update', $user);

        $data = $request->validated();

        if (
            array_key_exists('office_id', $data) ||
            array_key_exists('role_id', $data)
        ) {
            $authUser = $request->user();
            $authUser->loadMissing('role.permissionRoles.permission');
            $permissions = $authUser->role->permissionRoles->pluck(
                'permission.name',
            );

            $canOffice =
                $permissions->contains('user.edit.office.all') ||
                ($permissions->contains('user.edit.office.own') &&
                    $authUser->office_id === $user->office_id);

            $canRole =
                $permissions->contains('user.edit.role.all') ||
                ($permissions->contains('user.edit.role.own') &&
                    $authUser->office_id === $user->office_id);

            $officeOk = !array_key_exists('office_id', $data) || $canOffice;
            $roleOk = !array_key_exists('role_id', $data) || $canRole;

            abort_unless($officeOk && $roleOk, 403);
        }

        $oldPositionId = $user->position_id;

        $user->update($data);

        $newPositionId = $user->position_id;

        if ($oldPositionId !== $newPositionId) {
            if ($oldPositionId) {
                Position::where('id', $oldPositionId)->update([
                    'status' => 'vacant',
                ]);
            }

            if ($newPositionId) {
                Position::where('id', $newPositionId)->update([
                    'status' => 'occupied',
                ]);
            }
        }

        // Recalculate PS amounts if position changed
        if ($oldPositionId !== $newPositionId) {
            if ($oldPositionId) {
                $oldPosition = Position::find($oldPositionId);
                if ($oldPosition) {
                    PsBreakdownController::recalculateOfficePsAmounts(
                        $oldPosition->office_id,
                    );
                }
            }
            if ($newPositionId) {
                $newPosition = Position::find($newPositionId);
                if ($newPosition) {
                    PsBreakdownController::recalculateOfficePsAmounts(
                        $newPosition->office_id,
                    );
                }
            }
        }

        // Also recalculate if step changed (same position, different step)
        if (array_key_exists('step', $data) && $user->position_id) {
            $pos = Position::find($user->position_id);
            if ($pos) {
                PsBreakdownController::recalculateOfficePsAmounts(
                    $pos->office_id,
                );
            }
        }

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
