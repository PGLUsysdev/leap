import { describe, expect, it } from 'vitest';
import type { ExistingOffice } from './match';
import {
    matchRecordOffices,
    unmatchedOfficeFrequency,
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
