import { describe, expect, it } from 'vitest';
import type { AipEntry } from '@/types';
import { sortFlatLikeTree, toLetters } from './sort-tree';

function entry(
    id: number,
    ppaId: number,
    parentId: number | null,
    sortOrder = 0,
): AipEntry {
    return {
        id,
        is_supplemental: false,
        ppa_id: ppaId,
        supplemental_aip_id: null,
        ppa: {
            id: ppaId,
            name: `PPA ${ppaId}`,
            type: 'Program',
            code_suffix: String(ppaId),
            is_active: true,
            sort_order: sortOrder,
            is_supplemetal: false,
            office_id: 1,
            parent_id: parentId,
            fiscal_year_id: 4,
            full_code: `code-${ppaId}`,
        },
    } as AipEntry;
}

describe('toLetters', () => {
    it('numbers roots A, B, … Z, AA', () => {
        expect(toLetters(1)).toBe('A');
        expect(toLetters(26)).toBe('Z');
        expect(toLetters(27)).toBe('AA');
    });
});

describe('sortFlatLikeTree', () => {
    it('orders a full tree depth-first with dotted numbers', () => {
        const result = sortFlatLikeTree([
            entry(1, 10, null),
            entry(2, 20, 10),
            entry(3, 30, 20),
        ]);

        expect(result.map((r) => [r.id, r.depth, r.number])).toEqual([
            [1, 0, 'A.'],
            [2, 1, '1.'],
            [3, 2, '1.1.'],
        ]);
    });

    it('appends orphan subtrees as depth-0 roots instead of dropping them', () => {
        // Parent PPA 10 has no entry; children 20 (with kid 30) do.
        const result = sortFlatLikeTree([
            entry(2, 20, 10),
            entry(3, 30, 20),
            entry(1, 40, null),
        ]);

        expect(result.map((r) => [r.id, r.depth, r.number])).toEqual([
            [1, 0, 'A.'],
            [2, 0, 'B.'],
            [3, 1, '1.'],
        ]);
    });

    it('returns an empty list for empty input without throwing', () => {
        expect(sortFlatLikeTree([])).toEqual([]);
    });

    it('still throws on duplicate ppa_id', () => {
        expect(() =>
            sortFlatLikeTree([entry(1, 10, null), entry(2, 10, null)]),
        ).toThrow('Duplicate ppa_id found: 10');
    });
});
