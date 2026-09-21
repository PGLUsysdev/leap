import { describe, expect, it } from 'vitest';
import {
    matchFund,
    matchRecordFunds,
    matchTypology,
    normalizeCode,
    unmatchedFundFrequency,
} from './match-funds';

const FUNDS = [
    { id: 1, code: 'GF Proper' },
    { id: 2, code: 'GF - 20% DF' },
];

const TYPOLOGIES = [{ id: 7, code: 'A123-01' }];

describe('normalizeCode', () => {
    it('strips separators and lowercases', () => {
        expect(normalizeCode('GF-Proper')).toBe('gfproper');
        expect(normalizeCode('GF Proper')).toBe('gfproper');
        expect(normalizeCode('gfproper')).toBe('gfproper');
        expect(normalizeCode(null)).toBe('');
        expect(normalizeCode('  ')).toBe('');
    });
});

describe('matchFund', () => {
    it('matches code variants strictly', () => {
        expect(matchFund('GF-Proper', FUNDS)?.id).toBe(1);
        expect(matchFund('gf proper', FUNDS)?.id).toBe(1);
        expect(matchFund('GF - 20% DF', FUNDS)?.id).toBe(2);
    });

    it('returns null for blank or unknown tokens', () => {
        expect(matchFund(null, FUNDS)).toBeNull();
        expect(matchFund('—', FUNDS)).toBeNull();
        expect(matchFund('SEF', FUNDS)).toBeNull();
    });
});

describe('matchTypology', () => {
    it('matches exact codes after normalization', () => {
        expect(matchTypology('A123-01', TYPOLOGIES)?.id).toBe(7);
        expect(matchTypology('a123 01', TYPOLOGIES)?.id).toBe(7);
        expect(matchTypology('A123', TYPOLOGIES)).toBeNull();
    });
});

describe('matchRecordFunds + unmatchedFundFrequency', () => {
    it('resolves fund and typology per record', () => {
        const result = matchRecordFunds(
            'code#1',
            'GF-Proper',
            'A123-01',
            FUNDS,
            TYPOLOGIES,
        );

        expect(result.fund?.id).toBe(1);
        expect(result.typology?.id).toBe(7);
    });

    it('counts unmatched fund tokens most common first', () => {
        const matches = [
            matchRecordFunds('a#1', 'SEF', null, FUNDS, TYPOLOGIES),
            matchRecordFunds('a#2', 'SEF', null, FUNDS, TYPOLOGIES),
            matchRecordFunds('a#3', 'GF-Proper', null, FUNDS, TYPOLOGIES),
            matchRecordFunds('a#4', null, null, FUNDS, TYPOLOGIES),
        ];

        expect(unmatchedFundFrequency(matches)).toEqual([
            { token: 'SEF', count: 2 },
        ]);
    });
});
