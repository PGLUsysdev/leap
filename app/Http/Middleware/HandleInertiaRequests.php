<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Middleware;
use App\Models\FiscalYear;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        Log::info($request->user());

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
                'permissions' =>
                    $request
                        ->user()
                        ?->loadMissing('role.permissionRoles.permission')
                        ?->role?->permissionRoles?->pluck('permission.name') ??
                    [],
            ],
            'sidebarOpen' =>
                !$request->hasCookie('sidebar_state') ||
                $request->cookie('sidebar_state') === 'true',
            'activeFiscalYear' => function () use ($request) {
                $id = $request->session()->get('active_fiscal_year_id');

                if (!$id) {
                    $year = FiscalYear::where('status', 'draft')
                        ->latest('created_at')
                        ->first();
                    if ($year) {
                        $request
                            ->session()
                            ->put('active_fiscal_year_id', $year->id);
                    }
                    return $year;
                }

                return FiscalYear::find($id);
            },
        ];
    }
}
