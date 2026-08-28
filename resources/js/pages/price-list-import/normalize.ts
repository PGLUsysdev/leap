/**
 * Shared normalization / sanitization helpers for PPMP Price List import
 * Spec §4: 2-Layer Matching Logic
 */

export function normalize(str: string): string {
    return str.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * COA sanitization: remove hyphens, dots, slashes then re-normalize
 * Example: "5-02-03-010" -> "50203010", "5.02.03.010" -> "50203010"
 */
export function sanitizeCoa(str: string): string {
    // normalize first (trim + collapse + lower), then strip - . /
    return normalize(str).replace(/[-./]/g, "");
}

/**
 * Category sanitization: replace hyphens with spaces then re-normalize
 * Example: "Educational-Supplies" -> "educational supplies"
 */
export function sanitizeCategory(str: string): string {
    // replace hyphens with space, then normalize collapses
    return normalize(str.replace(/-/g, " "));
}

export type MatchResult<T> = {
    id: number | null;
    matchedValue: string | null; // DB value that matched
    layer: "strict" | "sanitized" | null; // null = no match
    sanitized: boolean;
};

/**
 * Resolve a raw excel string against a lookup Map using 2-layer logic.
 * - lookup: Map<normalized DB value, id>
 * - sanitizedLookup: Map<sanitized DB value, { id, originalNormalized }>
 * We build both maps caller-side to allow COA to expose account_number + title.
 */
export function resolveTwoLayer(
    raw: string,
    lookup: Map<string, number>,
    sanitizedLookup: Map<string, number>,
    sanitizeFn: (s: string) => string,
): MatchResult<number> {
    const n = normalize(raw);

    const strict = lookup.get(n);

    if (strict != null) {
        return { id: strict, matchedValue: n, layer: "strict", sanitized: false };
    }

    const sanitized = sanitizeFn(raw);
    const hit = sanitizedLookup.get(sanitized);

    if (hit != null) {
        return { id: hit, matchedValue: sanitized, layer: "sanitized", sanitized: true };
    }

    return { id: null, matchedValue: null, layer: null, sanitized: false };
}
