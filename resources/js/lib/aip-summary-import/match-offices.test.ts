import { describe, expect, it } from 'vitest';
import type { ExistingOffice } from './match';
import {
    effectiveOfficeIds,
    matchRecordOffices,
    unmatchedOfficeFrequency,
    visibleUnmatched,
} from './match-offices';

const OFFICES: ExistingOffice[] = [
    { id: 1, acronym: 'OPG', parent_id: null, full_code: '1000-1-01-001' },
    { id: 2, acronym: 'PIO', parent_id: null, full_code: '1000-1-01-002' },
    { id: 3, acronym: null, parent_id: null, full_code: '1000-1-01-003' },
];

describe('matchRecordOffices', () => {
    it('matches tokens case- and whitespace-insensitively', () => {
        const result = matchRecordOffices(
            'code#1',
            ['OPG', ' pio ', 'opG'],
            OFFICES,
        );

        expect(result.matched.map((o) => o.acronym)).toEqual(['OPG', 'PIO']);
        expect(result.unmatched).toEqual([]);
        expect(result.tokens).toEqual([
            { token: 'OPG', office: OFFICES[0] },
            { token: 'pio', office: OFFICES[1] },
            { token: 'opG', office: OFFICES[0] },
        ]);
    });

    it('collects unmatched tokens like etc. without matching', () => {
        const result = matchRecordOffices(
            'code#2',
            ['OPG', 'etc.', 'PSWDO'],
            OFFICES,
        );

        expect(result.matched.map((o) => o.acronym)).toEqual(['OPG']);
        expect(result.unmatched).toEqual(['etc.', 'PSWDO']);
    });

    it('ignores blank tokens and null-acronym offices', () => {
        const result = matchRecordOffices('code#3', ['', '   '], OFFICES);

        expect(result.matched).toEqual([]);
        expect(result.unmatched).toEqual([]);
    });
});

describe('unmatchedOfficeFrequency', () => {
    it('counts unmatched tokens most common first', () => {
        const matches = [
            matchRecordOffices('a#1', ['OPG', 'etc.'], OFFICES),
            matchRecordOffices('a#2', ['etc.', 'PSWDO'], OFFICES),
        ];

        expect(unmatchedOfficeFrequency(matches)).toEqual([
            { token: 'etc.', count: 2 },
            { token: 'PSWDO', count: 1 },
        ]);
    });
});

describe('effectiveOfficeIds', () => {
    it('unions auto-match with 1:1 mappings, de-duplicated', () => {
        const auto = matchRecordOffices('a#1', ['OPG', 'etc.'], OFFICES);

        expect(effectiveOfficeIds(auto, undefined, {})).toEqual([1]);
        expect(effectiveOfficeIds(auto, undefined, { 'etc.': 2 })).toEqual([
            1, 2,
        ]);
        // Mapping to an already-present office adds nothing twice.
        expect(effectiveOfficeIds(auto, undefined, { 'etc.': 1 })).toEqual([1]);
    });

    it('lets a bulk override replace the auto base, mappings still union in', () => {
        const auto = matchRecordOffices('a#1', ['OPG', 'etc.'], OFFICES);

        expect(effectiveOfficeIds(auto, [2], {})).toEqual([2]);
        expect(effectiveOfficeIds(auto, [2], { 'etc.': 1 })).toEqual([2, 1]);
    });

    it('handles a missing auto-match', () => {
        expect(effectiveOfficeIds(undefined, undefined, {})).toEqual([]);
        expect(effectiveOfficeIds(undefined, [2], {})).toEqual([2]);
    });
});

describe('visibleUnmatched', () => {
    it('hides mapped and dismissed tokens only', () => {
        const auto = matchRecordOffices(
            'a#1',
            ['OPG', 'etc.', 'PSWDO'],
            OFFICES,
        );

        expect(visibleUnmatched(auto, {}, [])).toEqual(['etc.', 'PSWDO']);
        expect(visibleUnmatched(auto, { 'etc.': 2 }, [])).toEqual(['PSWDO']);
        expect(visibleUnmatched(auto, {}, ['PSWDO'])).toEqual(['etc.']);
        expect(
            visibleUnmatched(auto, { 'etc.': 2 }, ['pswdo', 'nope']),
        ).toEqual([]);
    });
});
