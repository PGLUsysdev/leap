<?php

namespace App\Providers;

use App\Models\Ppmp;
use App\Observers\PpmpObserver;
use App\Policies\DashboardPolicy;
use App\Policies\ExpenseClassCodePolicy;
use App\Policies\ImportPolicy;
use App\Services\WorkspaceApiClient;
use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(
            WorkspaceApiClient::class,
            fn (): WorkspaceApiClient => WorkspaceApiClient::fromConfig(),
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Ppmp::observe(PpmpObserver::class);

        Gate::policy('dashboard', DashboardPolicy::class);
        Gate::policy('expense-class-code', ExpenseClassCodePolicy::class);
        Gate::policy('imports', ImportPolicy::class);

        $this->configureDefaults();

        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }

        RateLimiter::for('partner', function (Request $request) {
            return Limit::perMinute(120)
                ->by($request->user()?->id ?? $request->ip())
                ->response(function () {
                    return response()->json([
                        'message' => 'Rate limit exceeded. Try again later.',
                    ], 429);
                });
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(8)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
