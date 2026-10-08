<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreApiClientRequest;
use App\Models\ApiClient;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ApiClientController extends Controller
{
    private function permissions(): array
    {
        /** @var User $user */
        $user = auth()->user();
        $user->loadMissing('role.permissionRoles.permission');

        return $user->role->permissionRoles->pluck('permission.name')->all();
    }

    private function ensureCanManage(): void
    {
        abort_unless(in_array('manage-api-clients', $this->permissions(), true), 403);
    }

    public function index(): Response
    {
        $this->ensureCanManage();

        $clients = ApiClient::with(['owner:id,name', 'serviceUser:id'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function (ApiClient $client) {
                $lastUsed = $client->serviceUser
                    ? $client->serviceUser->tokens()->max('last_used_at')
                    : null;

                return [
                    'id' => $client->id,
                    'name' => $client->name,
                    'description' => $client->description,
                    'owner' => $client->owner?->name,
                    'abilities' => $client->abilities,
                    'expires_at' => $client->expires_at,
                    'revoked_at' => $client->revoked_at,
                    'last_used_at' => $lastUsed ?? $client->last_used_at,
                    'is_active' => $client->isActive(),
                    'created_at' => $client->created_at,
                ];
            });

        return Inertia::render('settings/api-clients', [
            'clients' => $clients,
            'availableAbilities' => ['read:procurement'],
            'flashToken' => session('plainToken'),
            'flashClientId' => session('clientId'),
        ]);
    }

    public function store(StoreApiClientRequest $request): RedirectResponse
    {
        $this->ensureCanManage();

        $data = $request->validated();

        $plainToken = null;
        $clientId = null;

        DB::transaction(function () use ($data, $request, &$plainToken, &$clientId) {
            $serviceUser = User::create([
                'name' => 'API: '.$data['name'],
                'email' => 'api-client-'.Str::uuid()->toString().'@service.local',
                'password' => Str::random(64),
                'is_service_account' => true,
            ]);

            $client = ApiClient::create([
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'owner_user_id' => $request->user()->id,
                'service_user_id' => $serviceUser->id,
                'abilities' => $data['abilities'],
                'expires_at' => $data['expires_at'] ?? now()->addYear(),
            ]);

            $expiresAt = $client->expires_at;
            $plainToken = $serviceUser->createToken(
                $client->name,
                $client->abilities,
                $expiresAt
            )->plainTextToken;
            $clientId = $client->id;
        });

        return to_route('api-clients.index')
            ->with('plainToken', $plainToken)
            ->with('clientId', $clientId);
    }

    public function rotate(ApiClient $apiClient): RedirectResponse
    {
        $this->ensureCanManage();

        abort_if($apiClient->revoked_at !== null, 422, 'Client is revoked.');

        $apiClient->serviceUser->tokens()->delete();

        $plainToken = $apiClient->serviceUser->createToken(
            $apiClient->name,
            $apiClient->abilities,
            $apiClient->expires_at
        )->plainTextToken;

        return to_route('api-clients.index')
            ->with('plainToken', $plainToken)
            ->with('clientId', $apiClient->id);
    }

    public function revoke(ApiClient $apiClient): RedirectResponse
    {
        $this->ensureCanManage();

        DB::transaction(function () use ($apiClient) {
            $apiClient->update(['revoked_at' => now()]);
            $apiClient->serviceUser->tokens()->delete();
        });

        return back()->with('status', 'API client revoked.');
    }
}
