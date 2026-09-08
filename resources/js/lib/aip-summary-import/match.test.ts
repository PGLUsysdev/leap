import { describe, expect, it } from 'vitest';
import type { ExistingOffice, ExistingPpa } from './match';
import { matchPpaBlocks, officePrefixOf } from './match';
import type { AipSummaryRecord } from './extract';

const OFFICES: ExistingOffice[] = [
    { id: 1, acronym: 'MHO', parent_id: null, full_code: '1000-1-03-009' },
    { id: 2, acronym: 'MEO', parent_id: null, full_code: '2000-1-03-010' },
];

const PPAS: ExistingPpa[] = [
    {
        id: 11,
        office_id: 1,
        parent_id: null,
        name: 'Health Program',
        type: 'Program',
        code_suffix: '001',
        full_code: '1000-1-03-009-001',
    },
];

function record(overrides: Partial<AipSummaryRecord> = {}): AipSummaryRecord {
    return {
        key: '1000-1-03-009-001#9',
        row: 9,
        blockRow: 9,
        isContinuation: false,
        fullCode: '1000-1-03-009-001',
        type: 'Program',
        typeIndex: 0,
        name: 'Health Program',
        nameRaw: 'A. Health Program',
        offices: ['MHO'],
        startDate: '2026-01-01',
        endDate: '2026-12-01',
        startDateRaw: 'Jan-26',
        endDateRaw: 'Dec-26',
        expectedOutput: 'Served',
        fundingSource: 'GF',
        adaptation: null,
        mitigation: null,
        typology: null,
        fullCodeNorm: '1000-1-03-009-001',
        nameNorm: 'health program',
        outputNorm: 'served',
        fundNorm: 'gf',
        typologyNorm: null,
        ...overrides,
    };
}

describe('officePrefixOf', () => {
    it('takes the first four segments', () => {
        expect(officePrefixOf('1000-1-03-009-001-001-01')).toBe(
            '1000-1-03-009',
        );
    });
});

describe('matchPpaBlocks', () => {
    it('marks blocks with a DB PPA as exists', () => {
        const blocks = matchPpaBlocks([record()], OFFICES, PPAS);

        expect(blocks).toHaveLength(1);
        expect(blocks[0].status).toBe('exists');
        expect(blocks[0].ppa?.id).toBe(11);
        expect(blocks[0].office?.acronym).toBe('MHO');
    });

    it('marks blocks without a DB PPA as new', () => {
        const blocks = matchPpaBlocks(
            [record({ fullCode: '1000-1-03-009-002', fullCodeNorm: '1000-1-03-009-002', key: 'x#10', row: 10, blockRow: 10 })],
            OFFICES,
            PPAS,
        );

        expect(blocks[0].status).toBe('new');
        expect(blocks[0].ppa).toBeNull();
        expect(blocks[0].office?.acronym).toBe('MHO');
    });

    it('marks blocks with an unknown office prefix as no-office', () => {
        const blocks = matchPpaBlocks(
            [record({ fullCode: '9999-9-99-999-001', fullCodeNorm: '9999-9-99-999-001' })],
            OFFICES,
            PPAS,
        );

        expect(blocks[0].status).toBe('no-office');
        expect(blocks[0].office).toBeNull();
    });

    it('groups continuation rows into one block', () => {
        const blocks = matchPpaBlocks(
            [record(), record({ key: 'x#10', row: 10, isContinuation: true })],
            OFFICES,
            PPAS,
        );

        expect(blocks).toHaveLength(1);
        expect(blocks[0].rows).toEqual([9, 10]);
    });
});
