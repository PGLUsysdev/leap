<?php

use App\Services\WorkspaceApiClient;
use Illuminate\Http\Client\Request;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;

beforeEach(function () {
    config([
        'services.workspace.token' => 'pdapi_test_token',
        'services.workspace.base_url' => 'https://api.example.test/api/data/v1',
        'services.workspace.retry_times' => 2,
        'services.workspace.retry_delay_ms' => 1000,
    ]);

    Http::preventStrayRequests();
});

it('authenticates with the configured bearer token', function () {
    Http::fake([
        'api.example.test/api/data/v1/me' => Http::response(['data' => ['name' => 'LEAP']]),
    ]);

    app(WorkspaceApiClient::class)->me();

    Http::assertSent(function (Request $request): bool {
        return $request->hasHeader('Authorization', 'Bearer pdapi_test_token')
            && $request->hasHeader('Accept', 'application/json');
    });
});

it('returns the token details reported by the api', function () {
    Http::fake([
        'api.example.test/api/data/v1/me' => Http::response([
            'data' => ['name' => 'LEAP', 'scopes' => ['employees'], 'rate_limit_per_minute' => 60],
        ]),
    ]);

    expect(app(WorkspaceApiClient::class)->me())
        ->toMatchArray(['name' => 'LEAP', 'rate_limit_per_minute' => 60]);
});

it('walks every page of a list endpoint', function () {
    Http::fake([
        'api.example.test/api/data/v1/departments?page=1&per_page=500' => Http::response([
            'data' => [['id' => 1], ['id' => 2]],
            'meta' => ['current_page' => 1, 'total' => 3, 'last_page' => 2],
        ]),
        'api.example.test/api/data/v1/departments?page=2&per_page=500' => Http::response([
            'data' => [['id' => 3]],
            'meta' => ['current_page' => 2, 'total' => 3, 'last_page' => 2],
        ]),
    ]);

    $departments = app(WorkspaceApiClient::class)->departments()->all();

    expect($departments)->toHaveCount(3)
        ->and(array_last($departments))->toBe(['id' => 3]);

    Http::assertSentCount(2);
});

it('requests a single page when there is no more than one', function () {
    Http::fake([
        'api.example.test/api/data/v1/positions*' => Http::response([
            'data' => [['id' => 304]],
            'meta' => ['current_page' => 1, 'total' => 1, 'last_page' => 1],
        ]),
    ]);

    expect(app(WorkspaceApiClient::class)->positions())->toHaveCount(1);

    Http::assertSentCount(1);
});

it('passes endpoint filters through to the api', function () {
    Http::fake([
        'api.example.test/api/data/v1/employees*' => Http::response([
            'data' => [],
            'meta' => ['current_page' => 1, 'total' => 0, 'last_page' => 1],
        ]),
    ]);

    app(WorkspaceApiClient::class)->employees([
        'dept_code' => '1040',
        'employment_status' => 'all',
    ]);

    Http::assertSent(fn (Request $request): bool => $request['dept_code'] === '1040'
        && $request['employment_status'] === 'all'
        && $request['per_page'] === 500);
});

it('retries a rate limited request and returns the retried response', function () {
    Sleep::fake();

    Http::fake([
        'api.example.test/api/data/v1/salary-grades*' => Http::sequence()
            ->push(['message' => 'Too Many Attempts.'], 429)
            ->push([
                'data' => [['salary_grade' => 1, 'steps' => ['1' => 14061]]],
                'meta' => ['current_page' => 1, 'total' => 1, 'last_page' => 1],
            ]),
    ]);

    $grades = app(WorkspaceApiClient::class)->salaryGrades()->all();

    expect($grades)->toHaveCount(1)
        ->and($grades[0]['steps'])->toBe(['1' => 14061]);

    Http::assertSentCount(2);
    Sleep::assertSleptTimes(1);
});

it('gives up with a request exception once the rate limit retries are exhausted', function () {
    Sleep::fake();

    Http::fake([
        'api.example.test/api/data/v1/employees*' => Http::response(['message' => 'Too Many Attempts.'], 429),
    ]);

    app(WorkspaceApiClient::class)->employees();

    Http::assertSentCount(2);
})->throws(RequestException::class);

it('refuses to build a client when no token is configured', function () {
    config(['services.workspace.token' => null]);

    WorkspaceApiClient::fromConfig();
})->throws(RuntimeException::class, 'Set WORKSPACE_TOKEN');
