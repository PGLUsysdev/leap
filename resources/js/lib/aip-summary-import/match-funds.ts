/**
 * AIP Summary fund matching — sheet tokens × funding sources / typologies.
 *
 * Strict-normalized only: a token matches iff it equals the record code
 * after stripping non-alphanumerics and lowercasing (`GF-Proper`,
 * `GF Proper`, and `gfproper` all key the same). No fuzzy matching —
 * the unmatched pile is surfaced in the UI so we can see exactly where
 * to loosen things later.
 *
 * Pure functions, no React. Vitest-covered.
 */

/** Minimal funding-source shape needed for code matching. */
export type MatchableFund = {
    id: number;
    code: string;
};

/** Minimal CC typology shape needed for code matching. */
export type MatchableTypology = {
    id: number;
    code: string;
};

/** `GF-Proper` → `gfproper`; `A123-01` → `a12301`. */
export function normalizeCode(value: string | null): string {
    if (value == null) return '';

    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

function indexByCode<T extends { id: number; code: string }>(
    records: T[],
): Map<string, T> {
    const map = new Map<string, T>();

    for (const record of records) {
        const key = normalizeCode(record.code);

        if (key === '' || map.has(key)) continue;

        map.set(key, record);
    }

    return map;
}

/** Match a sheet funding-source token (col G) to a funding source. */
export function matchFund(
    token: string | null,
    funds: MatchableFund[],
): MatchableFund | null {
    const key = normalizeCode(token);

    if (key === '') return null;

    return indexByCode(funds).get(key) ?? null;
}

/** Match a sheet typology token (col O) to a CC typology. */
export function matchTypology(
    token: string | null,
    typologies: MatchableTypology[],
): MatchableTypology | null {
    const key = normalizeCode(token);

    if (key === '') return null;

    return indexByCode(typologies).get(key) ?? null;
}

export type RecordFundMatch = {
    /** Stable per-row id (`${fullCode}#${row}`). */
    key: string;
    /** Raw col G token as extracted (post-coercion; null off output rows). */
    fundToken: string | null;
    fund: MatchableFund | null;
    typology: MatchableTypology | null;
};

/** Resolve one record's fund + typology tokens. */
export function matchRecordFunds(
    key: string,
    fundingSource: string | null,
    typology: string | null,
    funds: MatchableFund[],
    typologies: MatchableTypology[],
): RecordFundMatch {
    return {
        key,
        fundToken: fundingSource,
        fund: matchFund(fundingSource, funds),
        typology: matchTypology(typology, typologies),
    };
}

/**
 * Frequency of unmatched fund tokens across many records, most common
 * first. Use this to decide where to loosen matching later.
 */
export function unmatchedFundFrequency(
    matches: RecordFundMatch[],
): { token: string; count: number }[] {
    const counts = new Map<string, { token: string; count: number }>();

    for (const match of matches) {
        if (match.fundToken == null || match.fund !== null) continue;

        const token = match.fundToken.trim();
        const key = normalizeCode(token);
        const entry = counts.get(key);

        if (entry) {
            entry.count++;
        } else {
            counts.set(key, { token, count: 1 });
        }
    }

    return [...counts.values()].sort((a, b) => b.count - a.count);
}
