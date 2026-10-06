<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

/**
 * The PGLU Space positions masterlist, indexed by position code.
 *
 * Employees carry a `pos_code` but never a title of their own, and the API has
 * no endpoint that resolves a batch of codes — only `pos_code` one at a time.
 * Asking per employee would burn the token's 60 requests/minute on a single
 * office, so the whole masterlist is fetched once and cached instead. The
 * catalog is immutable for the life of the cache entry, so it is memoized per
 * instance as well.
 */
class WorkspacePositionCatalog
{
    private const CACHE_KEY = 'workspace.positions.by-code';

    /**
     * @var array<string, string>|null
     */
    private ?array $titlesByCode = null;

    public function __construct(private readonly WorkspaceApiClient $workspace) {}

    /**
     * The position title for a code, or null when the code is absent upstream.
     */
    public function titleFor(?string $posCode): ?string
    {
        if ($posCode === null || trim($posCode) === '') {
            return null;
        }

        return $this->titlesByCode()[$posCode] ?? null;
    }

    /**
     * @return array<string, string>
     */
    private function titlesByCode(): array
    {
        if ($this->titlesByCode !== null) {
            return $this->titlesByCode;
        }

        return $this->titlesByCode = Cache::remember(
            self::CACHE_KEY,
            now()->addDay(),
            fn (): array => $this->workspace->positions()
                ->mapWithKeys(fn (array $position): array => [
                    (string) ($position['pos_code'] ?? '') => (string) ($position['pos_name'] ?? ''),
                ])
                ->filter(fn (string $name, string $code): bool => $code !== '' && $name !== '')
                ->all(),
        );
    }
}
