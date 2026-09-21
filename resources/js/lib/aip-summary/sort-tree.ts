/**
 * AIP Summary tree helpers — flat entry list → depth-first display order.
 *
 * Pure functions, no React. `sortFlatLikeTree` seeds from root entries
 * (PPA `parent_id` null) and walks down; entries whose ancestor chain is
 * broken (parent PPA has no entry — e.g. content-less hierarchy rows that
 * were never imported) are appended as depth-0 roots instead of being
 * silently dropped, so a missing ancestor can never blank the table.
 */
import type { AipEntry } from '@/types';

export type NumberedAipEntry = AipEntry & {
    depth: number;
    number: string;
};

export function toLetters(n: number): string {
    let s = '';

    while (n > 0) {
        n--;
        s = String.fromCharCode(65 + (n % 26)) + s;
        n = Math.floor(n / 26);
    }

    return s;
}

export function sortFlatLikeTree(entries: AipEntry[]): NumberedAipEntry[] {
    const byParent = new Map<number | null, AipEntry[]>();
    const seen = new Set<number>();

    for (const entry of entries) {
        if (seen.has(entry.ppa_id)) {
            throw new Error(`Duplicate ppa_id found: ${entry.ppa_id}`);
        }

        seen.add(entry.ppa_id);

        const parentId = entry.ppa?.parent_id ?? null;

        if (!byParent.has(parentId)) {
            byParent.set(parentId, []);
        }

        byParent.get(parentId)!.push(entry);
    }

    const sortSiblings = (list: AipEntry[]) =>
        list.sort(
            (a, b) => (a.ppa?.sort_order ?? 0) - (b.ppa?.sort_order ?? 0),
        );

    const counters: number[] = [];
    const result: NumberedAipEntry[] = [];
    const visited = new Set<number>();

    function pushWithKids(entry: AipEntry, depth: number) {
        const stack: { entry: AipEntry; depth: number }[] = [{ entry, depth }];

        while (stack.length) {
            const { entry: current, depth: currentDepth } = stack.pop()!;

            if (visited.has(current.id)) continue;

            visited.add(current.id);
            counters[currentDepth] = (counters[currentDepth] ?? 0) + 1;
            counters.length = currentDepth + 1;

            const number =
                (currentDepth === 0
                    ? toLetters(counters[0])
                    : counters.slice(1, currentDepth + 1).join('.')) + '.';

            result.push({ ...current, depth: currentDepth, number });

            const kids = sortSiblings(byParent.get(current.ppa_id) ?? []);

            for (let i = kids.length - 1; i >= 0; i--) {
                stack.push({ entry: kids[i], depth: currentDepth + 1 });
            }
        }
    }

    // Roots first, then orphan subtrees (parent entry missing) as depth-0
    // roots in sibling order — never drop reachable entries.
    for (const root of sortSiblings(byParent.get(null) ?? [])) {
        pushWithKids(root, 0);
    }

    for (const entry of sortSiblings([...entries])) {
        if (!visited.has(entry.id)) {
            pushWithKids(entry, 0);
        }
    }

    return result;
}
