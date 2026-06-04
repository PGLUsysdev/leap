<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Http\Requests\StoreRoleRequest;
use App\Http\Requests\UpdateRoleRequest;
use Inertia\Inertia;

class RoleController extends Controller
{
    public function index()
    {
        $this->authorize('viewAny', Role::class);

        return Inertia::render('role/index', [
            'roles' => Role::all(),
            'can' => [
                'add' => request()->user()->can('create', Role::class),
                'edit' => request()->user()->can('update', new Role()),
                'delete' => request()->user()->can('delete', new Role()),
                'managePermissions' => request()->user()->can('update', new Role()),
            ],
        ]);
    }

    public function create()
    {
        //
    }

    public function store(StoreRoleRequest $request)
    {
        $this->authorize('create', Role::class);

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
        $this->authorize('update', $role);

        $role->update($request->validated());
    }

    public function destroy(Role $role)
    {
        $this->authorize('delete', $role);

        $role->delete();
    }
}
