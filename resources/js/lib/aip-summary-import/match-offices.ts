/**
 * AIP Summary office matching — implementing-office tokens × existing offices.
 *
 * Strict-normalized only: a sheet token (col C, already split on `/` or `,`
 * by `splitAipOffices`) matches an office iff
 * `normalize(token) === normalize(office.acronym)`. No fuzzy matching, no
 * alias maps, no punctuation stripping — the unmatched pile is surfaced in
 * the UI so we can see exactly where to loosen things later.
 *
 * Pure functions, no React. Vitest-covered.
 */
import { normalize } from '@/lib/ppmp/normalize';

/** Minimal office shape needed for acronym matching. */
export type MatchableOffice = {
    id: number;
    acronym: string | null;
};

export type OfficeTokenMatch = {
    /** Sheet token as written (trimmed). */
    token: string;
    /** Matched office, or null when no normalized acronym equals the token. */
    office: MatchableOffice | null;
};

export type RecordOfficeMatch = {
    /** Stable per-row id (`${fullCode}#${row}`). */
    key: string;
    tokens: OfficeTokenMatch[];
    /** Distinct matched offices, in first-seen order. */
    matched: MatchableOffice[];
    /** Raw tokens with no office match, in sheet order (may repeat). */
    unmatched: string[];
};

function indexOfficesByAcronym(
    offices: MatchableOffice[],
): Map<string, MatchableOffice> {
    const map = new Map<string, MatchableOffice>();

    for (const office of offices) {
        const key = normalize(office.acronym ?? '');

        if (key === '' || map.has(key)) continue;

        map.set(key, office);
    }

    return map;
}

/**
 * Match one record's office tokens against existing offices.
 * Duplicate tokens resolve independently; `matched` is de-duplicated.
 */
export function matchRecordOffices(
    key: string,
    tokens: string[],
    offices: MatchableOffice[],
): RecordOfficeMatch {
    const byAcronym = indexOfficesByAcronym(offices);
    const seen = new Set<number>();
    const result: RecordOfficeMatch = {
        key,
        tokens: [],
        matched: [],
        unmatched: [],
    };

    for (const raw of tokens) {
        const token = raw.trim();
        const office = byAcronym.get(normalize(token)) ?? null;

        result.tokens.push({ token, office });

        if (office === null) {
            if (token !== '') result.unmatched.push(token);
        } else if (!seen.has(office.id)) {
            seen.add(office.id);
            result.matched.push(office);
        }
    }

    return result;
}

/**
 * Frequency of unmatched tokens across many records, most common first.
 * Use this to decide where to loosen matching later.
 */
export function unmatchedOfficeFrequency(
    matches: RecordOfficeMatch[],
): { token: string; count: number }[] {
    const counts = new Map<string, { token: string; count: number }>();

    for (const match of matches) {
        for (const token of match.unmatched) {
            const key = normalize(token);
            const entry = counts.get(key);

            if (entry) {
                entry.count++;
            } else {
                counts.set(key, { token, count: 1 });
            }
        }
    }

    return [...counts.values()].sort((a, b) => b.count - a.count);
}

/** Manual 1:1 token → office links for one record. */
export type TokenMapping = Record<string, number>;

/**
 * Effective office ids for a record: manual bulk override wins over
 * auto-match as the base, then 1:1 token mappings are unioned in.
 * De-duplicated, first-seen order (base first).
 */
export function effectiveOfficeIds(
    auto: RecordOfficeMatch | undefined,
    override: number[] | undefined,
    mappings: TokenMapping,
): number[] {
    const base = override ?? auto?.matched.map((o) => o.id) ?? [];
    const seen = new Set<number>();
    const result: number[] = [];

    for (const id of [...base, ...Object.values(mappings)]) {
        if (!seen.has(id)) {
            seen.add(id);
            result.push(id);
        }
    }

    return result;
}

/**
 * Unmatched tokens still needing attention: auto-unmatched minus mapped
 * (1:1 context exists) minus dismissed (explicitly removed), sheet order.
 */
export function visibleUnmatched(
    auto: RecordOfficeMatch | undefined,
    mappings: TokenMapping,
    dismissed: string[],
): string[] {
    if (!auto) return [];

    const dismissedKeys = new Set(dismissed.map((t) => normalize(t)));

    return auto.unmatched.filter(
        (token) => !(token in mappings) && !dismissedKeys.has(normalize(token)),
    );
}
