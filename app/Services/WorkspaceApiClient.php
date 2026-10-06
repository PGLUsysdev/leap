<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\LazyCollection;
use RuntimeException;

/**
 * Read-only client for the PGLU Space data API.
 *
 * Every endpoint is a GET behind a bearer token and answers with the same
 * `{ data, meta }` envelope, so the list endpoints are thin wrappers over
 * `all()`, which walks the pagination for the caller.
 *
 * @see docs/pgluspace-data-api.md
 */
class WorkspaceApiClient
{
    /**
     * Rows per page requested when the caller does not choose one. The lowest
     * per-endpoint maximum is 500 (`/employees`), so this never gets clamped.
     */
    private const DEFAULT_PER_PAGE = 500;

    public function __construct(
        private readonly string $token,
        private readonly string $baseUrl,
        private readonly int $timeout = 30,
        private readonly int $retryTimes = 3,
        private readonly int $retryDelayMs = 1000,
    ) {}

    /**
     * Build the client from the `services.workspace` config.
     *
     * @throws RuntimeException when no token is configured.
     */
    public static function fromConfig(): self
    {
        $token = config('services.workspace.token');

        if (! is_string($token) || trim($token) === '') {
            throw new RuntimeException('No Workspace API token configured. Set WORKSPACE_TOKEN in your .env file.');
        }

        return new self(
            token: $token,
            baseUrl: (string) config('services.workspace.base_url'),
            timeout: (int) config('services.workspace.timeout', 30),
            retryTimes: (int) config('services.workspace.retry_times', 3),
            retryDelayMs: (int) config('services.workspace.retry_delay_ms', 1000),
        );
    }

    /**
     * Token details — name, scopes, rate limit, expiry. Also the cheapest
     * end-to-end check that the credentials work.
     *
     * @return array<string, mixed>
     */
    public function me(): array
    {
        return $this->request('me')->json('data') ?? [];
    }

    /**
     * One page of a list endpoint.
     *
     * @param  array<string, mixed>  $query
     * @return array{rows: array<int, array<string, mixed>>, meta: array<string, mixed>}
     */
    public function page(string $endpoint, array $query = [], int $pageNumber = 1, ?int $perPage = null): array
    {
        $response = $this->request($endpoint, [
            'page' => $pageNumber,
            'per_page' => $perPage ?? self::DEFAULT_PER_PAGE,
            ...$query,
        ]);

        return [
            'rows' => $response->json('data') ?? [],
            'meta' => $response->json('meta') ?? [],
        ];
    }

    /**
     * Every row of a list endpoint, fetched lazily one page at a time.
     *
     * @param  array<string, mixed>  $query
     * @return LazyCollection<int, array<string, mixed>>
     */
    public function all(string $endpoint, array $query = [], ?int $perPage = null): LazyCollection
    {
        $first = $this->page($endpoint, $query, 1, $perPage);

        $lastPage = (int) ($first['meta']['last_page'] ?? 1);

        $remainingPages = $lastPage > 1
            ? LazyCollection::range(2, $lastPage)
            : LazyCollection::make();

        return LazyCollection::make($first['rows'])->concat(
            $remainingPages
                ->flatMap(fn (int $pageNumber): array => $this->page($endpoint, $query, $pageNumber, $perPage)['rows'])
        );
    }

    /**
     * Provincial offices.
     *
     * @param  array<string, mixed>  $query
     * @return LazyCollection<int, array<string, mixed>>
     */
    public function departments(array $query = []): LazyCollection
    {
        return $this->all('departments', $query);
    }

    /**
     * Divisions under each office.
     *
     * @param  array<string, mixed>  $query
     * @return LazyCollection<int, array<string, mixed>>
     */
    public function divisions(array $query = []): LazyCollection
    {
        return $this->all('divisions', $query);
    }

    /**
     * Position masterlist.
     *
     * @param  array<string, mixed>  $query
     * @return LazyCollection<int, array<string, mixed>>
     */
    public function positions(array $query = []): LazyCollection
    {
        return $this->all('positions', $query);
    }

    /**
     * Monthly rate per salary grade and step.
     *
     * @param  array<string, mixed>  $query
     * @return LazyCollection<int, array<string, mixed>>
     */
    public function salaryGrades(array $query = []): LazyCollection
    {
        return $this->all('salary-grades', $query);
    }

    /**
     * Employee records, active ones unless the filters say otherwise.
     *
     * @param  array<string, mixed>  $query  e.g. `['dept_code' => '1040', 'employment_status' => 'all']`
     * @return LazyCollection<int, array<string, mixed>>
     */
    public function employees(array $query = []): LazyCollection
    {
        return $this->all('employees', $query);
    }

    /**
     * Issuances the qualification standards were taken from.
     *
     * @param  array<string, mixed>  $query
     * @return LazyCollection<int, array<string, mixed>>
     */
    public function qualificationSources(array $query = []): LazyCollection
    {
        return $this->all('qs/sources', $query);
    }

    /**
     * Occupational services — the top level of the index.
     *
     * @param  array<string, mixed>  $query
     * @return LazyCollection<int, array<string, mixed>>
     */
    public function occupationalServices(array $query = []): LazyCollection
    {
        return $this->all('qs/occupational-services', $query);
    }

    /**
     * Occupational groups within each service.
     *
     * @param  array<string, mixed>  $query
     * @return LazyCollection<int, array<string, mixed>>
     */
    public function occupationalGroups(array $query = []): LazyCollection
    {
        return $this->all('qs/occupational-groups', $query);
    }

    /**
     * Qualification standard position classes.
     *
     * @param  array<string, mixed>  $query
     * @return LazyCollection<int, array<string, mixed>>
     */
    public function positionClasses(array $query = []): LazyCollection
    {
        return $this->all('qs/position-classes', $query);
    }

    /**
     * @param  array<string, mixed>  $query
     */
    private function request(string $endpoint, array $query = []): Response
    {
        return $this->pendingRequest()
            ->get($endpoint, $query)
            ->throw();
    }

    private function pendingRequest(): PendingRequest
    {
        return Http::baseUrl($this->baseUrl)
            ->withToken($this->token)
            ->acceptJson()
            ->timeout($this->timeout)
            ->retry($this->retryTimes, $this->retryDelayMs);
    }
}
