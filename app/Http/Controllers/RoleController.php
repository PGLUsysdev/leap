<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRoleRequest;
use App\Http\Requests\UpdateRolePermissionsRequest;
use App\Http\Requests\UpdateRoleRequest;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class RoleController extends Controller
{
    public function index()
    {
        Gate::authorize('viewAny', Role::class);

        return Inertia::render('role/index', [
            'roles' => Role::all(),
            'can' => [
                'add' => request()->user()->can('create', Role::class),
                'edit' => request()->user()->can('update', new Role),
                'delete' => request()->user()->can('delete', new Role),
                'managePermissions' => request()
                    ->user()
                    ->can('updatePermissions', new Role),
            ],
        ]);
    }

    public function create()
    {
        //
    }

    public function store(StoreRoleRequest $request)
    {
        Gate::authorize('create', Role::class);

        Role::create($request->validated());
    }

    public function show(Role $role)
    {
        //
    }

    public function edit(Role $role)
    {
        //
    }

    public function update(UpdateRoleRequest $request, Role $role)
    {
        Gate::authorize('update', $role);

        $role->update($request->validated());
    }

    public function destroy(Role $role)
    {
        Gate::authorize('delete', $role);

        $role->delete();
    }

    public function getPermissions(Role $role)
    {
        Gate::authorize('viewPermissions', $role);

        $permissionNames = $role
            ->permissionRoles()
            ->with('permission')
            ->get()
            ->pluck('permission.name');

        return response()->json(['permissions' => $permissionNames]);
    }

    public function updatePermissions(UpdateRolePermissionsRequest $request, Role $role)
    {
        Gate::authorize('updatePermissions', $role);

        $permissions = $request->validated()['permissions'];

        $permissionIds = Permission::whereIn(
            'name',
            $permissions,
        )->pluck('id', 'name');

        DB::transaction(function () use ($role, $permissions, $permissionIds) {
            $role->permissionRoles()->delete();

            foreach ($permissions as $name) {
                if (isset($permissionIds[$name])) {
                    $role->permissionRoles()->create([
                        'permission_id' => $permissionIds[$name],
                    ]);
                }
            }
        });

        return back();
    }
}
