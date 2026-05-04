<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

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
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        // 1. Get the year from session, or find the latest 'active' one as default
        $yearId = $request->session()->get('active_fiscal_year_id');

        if (!$yearId) {
            $yearId = \App\Models\FiscalYear::where('status', 'active')
                ->orderBy('year', 'desc')
                ->value('id');

            // If no 'active' exists, fallback to the literal latest year record
            if (!$yearId) {
                $yearId = \App\Models\FiscalYear::orderBy(
                    'year',
                    'desc',
                )->value('id');
            }

            // Optional: Save this to the session so it persists for the rest of the visit
            if ($yearId) {
                $request->session()->put('active_fiscal_year_id', $yearId);
            }
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user()?->load('office'),
                'can' => [
                    'manage_users' => $request
                        ->user()
                        ?->can('viewAny', \App\Models\User::class),
                ],
            ],
            'sidebarOpen' =>
                !$request->hasCookie('sidebar_state') ||
                $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'status' => $request->session()->get('status'),
            ],
            'activeYear' => \App\Models\FiscalYear::find($yearId),
        ];
    }
}
