import type { ExistingCoa } from "@/lib/ppmp/normalize";

/** Minimal row shape needed for batch matching (subset of VerifiedItem). */
export type BatchMatchableRow = {
    key: string;
    /** Raw extracted COA label from Excel. */
    coa: string;
    /** Normalized extracted COA label — the group key (normalize always). */
    coaNorm: string;
    coaExists: boolean;
    overrideId: number | null;
    coaTopMatches: Array<{ coa: ExistingCoa; score: number }>;
};

export type ExtractedCoaGroup = {
    coaNorm: string;
    /** Raw label from the first member (display only). */
    label: string;
    rowKeys: string[];
    count: number;
    topSuggestion: ExistingCoa | null;
    topMatches: Array<{ coa: ExistingCoa; score: number }>;
};

/**
 * Group rows still needing a human COA decision by normalized extracted label.
 * Rows already strict-matched or manually overridden are excluded.
 * Groups sort by row count desc so the biggest batches come first.
 */
export function groupUnmatchedByExtractedCoa<T extends BatchMatchableRow>(rows: T[]): ExtractedCoaGroup[] {
    const map = new Map<string, ExtractedCoaGroup>();

    for (const row of rows) {
        if (row.coaExists || row.overrideId !== null) continue;

        let group = map.get(row.coaNorm);

        if (!group) {
            group = {
                coaNorm: row.coaNorm,
                label: row.coa,
                rowKeys: [],
                count: 0,
                topSuggestion: row.coaTopMatches[0]?.coa ?? null,
                topMatches: row.coaTopMatches,
            };
            map.set(row.coaNorm, group);
        }

        group.rowKeys.push(row.key);
        group.count += 1;
    }

    return [...map.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/** Format a COA as a Combobox item value, shared with per-row pickers. */
export function formatCoaOption(coa: ExistingCoa): string {
    return `coa:${coa.id}:${coa.path} — ${coa.account_title}`;
}

/** Parse a COA id back out of a Combobox item value (`coa:<id>:...`). */
export function parseCoaOptionId(value: string): number | null {
    const match = value.match(/^coa:(\d+)/);

    return match ? Number(match[1]) : null;
}
