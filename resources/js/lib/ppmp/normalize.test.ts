import { describe, expect, it } from 'vitest';
import {
    SHORT_PROCUREMENT_ROOTS,
    columnToNumber,
    getCategoryMatch,
    getCoaMatch,
    isTotalRow,
    leftColumn,
    levenshtein,
    normalize,
    numberToColumn,
} from '@/lib/ppmp/normalize';
import type { ExistingCategory, ExistingCoa } from '@/lib/ppmp/normalize';

describe('normalize', () => {
    it('should_ReturnLowercasedSingleSpacedString_When_InputHasExtraSpacesAndCase', () => {
        // Arrange
        const input = '  Office   SUPPLIES  ';
        // Act
        const result = normalize(input);
        // Assert
        expect(result).toBe('office supplies');
    });

    it('should_ReturnEmptyString_When_InputIsBlank', () => {
        expect(normalize('   ')).toBe('');
        expect(normalize('')).toBe('');
    });
});

describe('isTotalRow', () => {
    it.each([
        ['office supplies - total', true],
        ['office supplies-total', true],
        ['total expenses', true],
        ['total', true],
        ['office supplies', false],
        ['subtotal', false],
        ['totals are here', false],
    ])('should_Return%s_When_NormalizedIs%s', (input, expected) => {
        expect(isTotalRow(input)).toBe(expected);
    });
});

describe('levenshtein', () => {
    it('should_ReturnZero_When_StringsAreIdentical', () => {
        expect(levenshtein('office', 'office')).toBe(0);
    });

    it('should_ReturnOtherLength_When_OneStringIsEmpty', () => {
        expect(levenshtein('', 'abc')).toBe(3);
        expect(levenshtein('abc', '')).toBe(3);
        expect(levenshtein('', '')).toBe(0);
    });

    it('should_ReturnThree_When_ComparingKittenToSitting', () => {
        expect(levenshtein('kitten', 'sitting')).toBe(3);
    });

    it('should_ReturnOne_When_SingleTypo', () => {
        expect(levenshtein('office', 'offcie')).toBe(2);
        expect(levenshtein('office', 'offic')).toBe(1);
    });
});

describe('columnToNumber / numberToColumn / leftColumn', () => {
    it.each([
        ['A', 1],
        ['Z', 26],
        ['AA', 27],
        ['F', 6],
        ['f', 6],
        ['H', 8],
    ])('should_Return%s_When_ColumnIs%s', (col, expected) => {
        expect(columnToNumber(col)).toBe(expected);
    });

    it.each([
        [1, 'A'],
        [26, 'Z'],
        [27, 'AA'],
        [28, 'AB'],
    ])('should_Return_%s_When_NumberIs_%s', (n: number, col: string) => {
        expect(numberToColumn(n)).toBe(col);
    });

    it('should_RoundTrip_When_ConvertingBothWays', () => {
        for (const col of ['A', 'D', 'F', 'Z', 'AA', 'AZ']) {
            expect(numberToColumn(columnToNumber(col))).toBe(col);
        }
    });

    it('should_StayOnA_When_TakingLeftOfA', () => {
        expect(leftColumn('A')).toBe('A');
    });

    it.each([
        ['A', 'B'],
        ['F', 'G'],
        ['Z', 'AA'],
    ])(
        'should_Return%s_When_TakingLeftOf%s',
        (expected: string, col: string) => {
            expect(leftColumn(col)).toBe(expected);
        },
    );
});

describe('getCategoryMatch', () => {
    const existing: ExistingCategory[] = [
        {
            id: 1,
            name: 'Office Supplies',
            is_non_procurement: false,
            is_additional: false,
        },
        {
            id: 2,
            name: 'Oil Products',
            is_non_procurement: false,
            is_additional: false,
        },
        {
            id: 3,
            name: 'Laboratory Equipment',
            is_non_procurement: false,
            is_additional: false,
        },
    ];

    it('should_ReturnStrict_When_CandidateEqualsNormalizedName', () => {
        // Arrange
        const candidate = normalize('  OFFICE supplies ');
        // Act
        const result = getCategoryMatch(candidate, existing);
        // Assert
        expect(result.type).toBe('strict');
        expect(result.match?.id).toBe(1);
    });

    it('should_ReturnPartial_When_CandidateIsSubstringAndLongEnough', () => {
        const result = getCategoryMatch(normalize('Office'), existing);
        expect(result.type).toBe('partial');
        expect(result.topMatches?.[0].category.id).toBe(1);
    });

    it('should_ReturnPartial_When_CandidateIsShortRootLikeOil', () => {
        expect(SHORT_PROCUREMENT_ROOTS.has('oil')).toBe(true);
        const result = getCategoryMatch(normalize('oil'), existing);
        expect(result.type).toBe('partial');
        expect(result.topMatches?.[0].category.id).toBe(2);
    });

    it('should_ReturnNone_When_CandidateIsShortAndUnrelated', () => {
        const result = getCategoryMatch(normalize('zz'), existing);
        expect(result.type).toBe('none');
    });

    it('should_ReturnNone_When_NoCloseMatch', () => {
        const result = getCategoryMatch(
            normalize('unrelated category xyz'),
            existing,
        );
        expect(result.type).toBe('none');
    });

    it('should_ReturnPartialWithTypo_When_WithinLevenshteinThreshold', () => {
        // "Office Supplies" vs "Office Suplies" (1 deletion, len > 12 -> threshold 3)
        const result = getCategoryMatch(normalize('Office Suplies'), existing);
        expect(result.type).toBe('partial');
        expect(result.topMatches?.[0].category.id).toBe(1);
    });

    it('should_LimitTopMatchesToThree_When_ManyPartials', () => {
        const many: ExistingCategory[] = Array.from({ length: 10 }, (_, i) => ({
            id: 100 + i,
            name: 'Office Supplies Branch',
            is_non_procurement: false,
            is_additional: false,
        }));
        const result = getCategoryMatch(
            normalize('Office Supplies Branch X'),
            many,
        );
        expect(result.type).toBe('partial');
        expect(result.topMatches?.length).toBeLessThanOrEqual(3);
    });
});

describe('getCoaMatch', () => {
    const coas: ExistingCoa[] = [
        {
            id: 1,
            account_number: '50203010',
            path: '5-02-03-010',
            account_title: 'Office Supplies Expenses',
        },
        {
            id: 2,
            account_number: '50201010',
            path: '5-02-01-010',
            account_title: 'Traveling Expenses',
        },
    ];

    it('should_ReturnStrictByTitle_When_ModeIsAutoAndTitleMatches', () => {
        const result = getCoaMatch(
            normalize('Office Supplies Expenses'),
            coas,
            'auto',
        );
        expect(result.type).toBe('strict');
        expect(result.match?.id).toBe(1);
    });

    it('should_ReturnStrictByNumber_When_ModeIsAutoAndNumberMatches', () => {
        const result = getCoaMatch(normalize('50203010'), coas, 'auto');
        expect(result.type).toBe('strict');
        expect(result.match?.id).toBe(1);
    });

    it('should_ReturnStrictByPath_When_PathMatches', () => {
        const result = getCoaMatch(normalize('5-02-03-010'), coas, 'auto');
        expect(result.type).toBe('strict');
        expect(result.match?.id).toBe(1);
    });

    it('should_NotMatchTitle_When_ModeIsAccountNumber', () => {
        const result = getCoaMatch(
            normalize('Office Supplies Expenses'),
            coas,
            'account_number',
        );
        expect(result.type).not.toBe('strict');
    });

    it('should_NotMatchNumber_When_ModeIsAccountTitle', () => {
        const result = getCoaMatch(
            normalize('50203010'),
            coas,
            'account_title',
        );
        expect(result.type).not.toBe('strict');
    });

    it('should_ReturnPartial_When_CandidateIsSubstring', () => {
        // len >= 4 and title contains candidate
        const result = getCoaMatch(normalize('Office Supplies'), coas, 'auto');
        expect(result.type).toBe('partial');
        expect(result.topMatches?.[0].coa.id).toBe(1);
    });

    it('should_ReturnNone_When_CandidateIsUnrelated', () => {
        const result = getCoaMatch(
            normalize('zzz unrelated qqq'),
            coas,
            'auto',
        );
        expect(result.type).toBe('none');
    });

    it('should_RankPath502First_When_MultiplePartials', () => {
        // Arrange: same title shape under different paths, candidate is a typo (partial for all)
        const candidates: ExistingCoa[] = [
            {
                id: 10,
                account_number: '60101010',
                path: '6-01-01-010',
                account_title: 'Office Supplies Expenses',
            },
            {
                id: 11,
                account_number: '50101010',
                path: '5-01-01-010',
                account_title: 'Office Supplies Expenses',
            },
            {
                id: 12,
                account_number: '50203010',
                path: '5-02-03-010',
                account_title: 'Office Supplies Expenses',
            },
        ];
        // Act
        const result = getCoaMatch(
            normalize('Office Suplies Expenses'),
            candidates,
            'auto',
        );
        // Assert
        expect(result.type).toBe('partial');
        expect(result.topMatches?.map((m) => m.coa.id)).toEqual([12, 11, 10]);
    });

    it('should_RankPath5BeforeOthers_When_No502Candidate', () => {
        // Arrange
        const candidates: ExistingCoa[] = [
            {
                id: 20,
                account_number: '60101010',
                path: '6-01-01-010',
                account_title: 'Traveling Expenses',
            },
            {
                id: 21,
                account_number: '50101010',
                path: '5-01-01-010',
                account_title: 'Traveling Expenses',
            },
        ];
        // Act
        const result = getCoaMatch(
            normalize('Traveling Expenss'),
            candidates,
            'auto',
        );
        // Assert
        expect(result.type).toBe('partial');
        expect(result.topMatches?.[0].coa.id).toBe(21);
    });
});
