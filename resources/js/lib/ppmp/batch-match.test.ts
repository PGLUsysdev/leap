import { describe, expect, it } from 'vitest';
import {
    formatCoaOption,
    groupUnmatchedByExtractedCoa,
    parseCoaOptionId,
} from '@/lib/ppmp/batch-match';
import type { BatchMatchableRow } from '@/lib/ppmp/batch-match';
import type { ExistingCoa } from '@/lib/ppmp/normalize';

const coaA: ExistingCoa = {
    id: 1,
    account_number: '50203010',
    path: '5-02-03-010',
    account_title: 'Drugs and Medicines Expenses',
};
const coaB: ExistingCoa = {
    id: 2,
    account_number: '50201010',
    path: '5-02-01-010',
    account_title: 'Traveling Expenses',
};

function row(
    overrides: Partial<BatchMatchableRow> & { key: string },
): BatchMatchableRow {
    return {
        coa: 'Drugs and Medicines',
        coaNorm: 'drugs and medicines',
        coaExists: false,
        overrideId: null,
        coaTopMatches: [{ coa: coaA, score: 99 }],
        ...overrides,
    };
}

describe('groupUnmatchedByExtractedCoa', () => {
    it('should_MergeRows_When_SameNormalizedLabel', () => {
        // Arrange
        const rows = [
            row({ key: 'a', coa: 'Drugs and Medicines' }),
            row({ key: 'b', coa: 'drugs and  medicines' }),
            row({
                key: 'c',
                coa: 'Traveling',
                coaNorm: 'traveling',
                coaTopMatches: [{ coa: coaB, score: 99 }],
            }),
        ];
        // Act
        const groups = groupUnmatchedByExtractedCoa(rows);
        // Assert
        expect(groups).toHaveLength(2);
        expect(groups[0].coaNorm).toBe('drugs and medicines');
        expect(groups[0].rowKeys).toEqual(['a', 'b']);
        expect(groups[0].count).toBe(2);
        expect(groups[0].label).toBe('Drugs and Medicines');
    });

    it('should_ExcludeStrictAndOverriddenRows_When_Grouping', () => {
        // Arrange
        const rows = [
            row({ key: 'a' }),
            row({ key: 'b', coaExists: true }),
            row({ key: 'c', overrideId: 1 }),
        ];
        // Act
        const groups = groupUnmatchedByExtractedCoa(rows);
        // Assert
        expect(groups).toHaveLength(1);
        expect(groups[0].rowKeys).toEqual(['a']);
    });

    it('should_CarryTopSuggestion_When_GroupHasMatches', () => {
        const groups = groupUnmatchedByExtractedCoa([row({ key: 'a' })]);
        expect(groups[0].topSuggestion?.id).toBe(1);
    });

    it('should_HaveNullTopSuggestion_When_NoMatches', () => {
        const groups = groupUnmatchedByExtractedCoa([
            row({ key: 'a', coaTopMatches: [] }),
        ]);
        expect(groups[0].topSuggestion).toBeNull();
    });

    it('should_SortByCountDesc_When_MultipleGroups', () => {
        // Arrange
        const rows = [
            row({
                key: 'a',
                coaNorm: 'traveling',
                coa: 'Traveling',
                coaTopMatches: [{ coa: coaB, score: 99 }],
            }),
            row({ key: 'b' }),
            row({ key: 'c' }),
        ];
        // Act
        const groups = groupUnmatchedByExtractedCoa(rows);
        // Assert
        expect(groups.map((g) => g.coaNorm)).toEqual([
            'drugs and medicines',
            'traveling',
        ]);
    });

    it('should_ReturnEmpty_When_NoRowsNeedMatching', () => {
        expect(groupUnmatchedByExtractedCoa([])).toEqual([]);
        expect(
            groupUnmatchedByExtractedCoa([row({ key: 'a', coaExists: true })]),
        ).toEqual([]);
    });
});

describe('formatCoaOption / parseCoaOptionId', () => {
    it('should_RoundTrip_When_FormattingAndParsing', () => {
        // Arrange
        const value = formatCoaOption(coaA);
        // Act + Assert
        expect(value).toBe('coa:1:5-02-03-010 — Drugs and Medicines Expenses');
        expect(parseCoaOptionId(value)).toBe(1);
    });

    it('should_ReturnNull_When_ValueHasNoId', () => {
        expect(parseCoaOptionId('nonsense')).toBeNull();
    });
});
