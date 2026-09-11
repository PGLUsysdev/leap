import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import {
    extractAipSummaryRecords,
    formatAipScheduleShort,
    normalizeAipSchedule,
    splitAipOffices,
} from './extract';
import { getDefaultAipSummaryConfig } from './sheet-config';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'M', 'N', 'O'];
const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 13, 14, 15];

function buildWorkbook(dataRows: Array<Array<string | Date | null>>) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Sheet1');

    LETTERS.forEach((letter, i) => {
        ws.getRow(8).getCell(letter).value = NUMBERS[i];
    });

    dataRows.forEach((cells, i) => {
        const row = ws.getRow(9 + i);
        cells.forEach((value, j) => {
            row.getCell(LETTERS[j]).value = value;
        });
    });

    return wb;
}

const PROGRAM = [
    '1000-1-03-009-001',
    'A. Health Program',
    'MHO',
    'Jan-26',
    'Dec-26',
    'Served',
    'GF',
    '0',
    '0',
    'A123',
];

const PROJECT = [
    '1000-1-03-009-001-001',
    '1. Immunization',
    'MHO',
    'Jan-26',
    'Jun-26',
    '500 kids',
    'GF',
    '20.00',
    '300.00',
    'A123',
];

describe('normalizeAipSchedule', () => {
    it('converts Mon-YY to the first of the month in 20YY', () => {
        expect(normalizeAipSchedule('Jan-26')).toBe('2026-01-01');
        expect(normalizeAipSchedule('Dec-27')).toBe('2027-12-01');
    });

    it('passes full dates through and nulls the rest', () => {
        expect(normalizeAipSchedule('2026-03-15')).toBe('2026-03-15');
        expect(normalizeAipSchedule(null)).toBeNull();
        expect(normalizeAipSchedule('sometime')).toBeNull();
    });
});

describe('formatAipScheduleShort', () => {
    it('renders Mon-YY shortcuts', () => {
        expect(formatAipScheduleShort('2027-12-01')).toBe('Dec-27');
        expect(formatAipScheduleShort('2026-01-01')).toBe('Jan-26');
        expect(formatAipScheduleShort(null)).toBeNull();
    });
});

describe('splitAipOffices', () => {
    it('splits on slashes and trims', () => {
        expect(splitAipOffices('PICTO/SDU')).toEqual(['PICTO', 'SDU']);
        expect(splitAipOffices('MHO')).toEqual(['MHO']);
        expect(splitAipOffices(null)).toEqual([]);
    });

    it('splits on commas too', () => {
        expect(splitAipOffices('OPG,PGENRO,PHO')).toEqual([
            'OPG',
            'PGENRO',
            'PHO',
        ]);
        expect(splitAipOffices('OPG, PIO')).toEqual(['OPG', 'PIO']);
    });
});

describe('extractAipSummaryRecords', () => {
    it('emits one record per row with stripped names and normalized dates', () => {
        const wb = buildWorkbook([PROGRAM, PROJECT]);
        const ws = wb.getWorksheet('Sheet1')!;
        const result = extractAipSummaryRecords(ws, {
            ...getDefaultAipSummaryConfig(),
            headerRow: 7,
        });

        expect(result.blocks).toBe(2);
        expect(result.rowsKept).toBe(2);
        expect(result.records).toHaveLength(2);

        const [program, project] = result.records;
        expect(program.name).toBe('Health Program');
        expect(program.nameRaw).toBe('A. Health Program');
        expect(program.type).toBe('Program');
        expect(program.startDate).toBe('2026-01-01');
        expect(program.endDate).toBe('2026-12-01');
        expect(program.offices).toEqual(['MHO']);
        expect(project.name).toBe('Immunization');
        expect(project.type).toBe('Project');
        expect(project.fullCodeNorm).toBe('1000-1-03-009-001-001');
        expect(project.fundNorm).toBe('gf');
        expect(project.isContinuation).toBe(false);
        expect(project.adaptation).toBe('20.00');
        expect(project.mitigation).toBe('300.00');
        expect(project.typology).toBe('A123');
    });

    it('attaches continuation rows to the preceding block', () => {
        const wb = buildWorkbook([
            PROGRAM,
            [
                null,
                null,
                'MHO/SDU',
                'Mar-26',
                'Nov-26',
                '2 RHUs upgraded',
                'SEF',
                '0',
                '0',
                'M456',
            ],
        ]);
        const ws = wb.getWorksheet('Sheet1')!;
        const result = extractAipSummaryRecords(ws, {
            ...getDefaultAipSummaryConfig(),
            headerRow: 7,
        });

        expect(result.blocks).toBe(1);
        expect(result.records).toHaveLength(2);

        const [leader, cont] = result.records;
        expect(cont.isContinuation).toBe(true);
        expect(cont.blockRow).toBe(leader.row);
        expect(cont.fullCode).toBe(leader.fullCode);
        expect(cont.name).toBe('Health Program');
        expect(cont.offices).toEqual(['MHO', 'SDU']);
        expect(cont.expectedOutput).toBe('2 RHUs upgraded');
        expect(cont.fundingSource).toBe('SEF');
        expect(cont.outputNorm).toBe('2 rhus upgraded');
        expect(cont.key).not.toBe(leader.key);
    });

    it('reads real Excel dates in schedule columns', () => {
        const wb = buildWorkbook([
            [
                '1000-1-03-009-001',
                'A. Health Program',
                'MHO',
                new Date(2027, 0, 1),
                new Date(2027, 11, 1),
                'Served',
                'GF',
                '0',
                '0',
                'A123',
            ],
        ]);
        const ws = wb.getWorksheet('Sheet1')!;
        const result = extractAipSummaryRecords(ws, {
            ...getDefaultAipSummaryConfig(),
            headerRow: 7,
        });

        expect(result.records).toHaveLength(1);
        expect(result.records[0].startDate).toBe('2027-01-01');
        expect(result.records[0].endDate).toBe('2027-12-01');
    });

    it('keeps the fund on output rows, even bare ones', () => {
        const wb = buildWorkbook([
            [
                '1000-1-03-009-001',
                'A. Health Program',
                null,
                null,
                null,
                '20 Component LGU',
                'GF-Proper',
                null,
                null,
                null,
            ],
        ]);
        const ws = wb.getWorksheet('Sheet1')!;
        const result = extractAipSummaryRecords(ws, {
            ...getDefaultAipSummaryConfig(),
            headerRow: 7,
        });

        expect(result.records).toHaveLength(1);
        expect(result.records[0].fundingSource).toBe('GF-Proper');
        expect(result.records[0].fundNorm).toBe('gf-proper');
    });

    it('coerces the fund to null on rows without an expected output', () => {
        const wb = buildWorkbook([
            // Context row: office + dates set, output blank.
            [
                '1000-1-03-009-001',
                'A. Health Program',
                'OPG',
                'Jan-27',
                'Dec-27',
                null,
                'GF-Proper',
                null,
                null,
                null,
            ],
            // Continuation row without its own output.
            [
                null,
                null,
                'OPG',
                'Jan-27',
                'Dec-27',
                null,
                'SEF',
                null,
                null,
                null,
            ],
        ]);
        const ws = wb.getWorksheet('Sheet1')!;
        const result = extractAipSummaryRecords(ws, {
            ...getDefaultAipSummaryConfig(),
            headerRow: 7,
        });

        expect(result.records).toHaveLength(2);

        for (const record of result.records) {
            expect(record.fundingSource).toBeNull();
            expect(record.fundNorm).toBeNull();
        }
    });

    it('keeps each continuation fund under an output leader', () => {
        const wb = buildWorkbook([
            [
                '1000-1-03-009-001-001',
                '1. Support work',
                'OPG',
                'Jan-27',
                'Dec-27',
                'Support provided',
                'GF-Proper',
                null,
                null,
                null,
            ],
            [null, null, null, null, null, null, '20%-DF', null, null, null],
            [null, null, null, null, null, null, '5%-LDRRMF', null, null, null],
        ]);
        const ws = wb.getWorksheet('Sheet1')!;
        const result = extractAipSummaryRecords(ws, {
            ...getDefaultAipSummaryConfig(),
            headerRow: 7,
        });

        expect(result.records).toHaveLength(3);
        expect(result.records.map((r) => r.fundingSource)).toEqual([
            'GF-Proper',
            '20%-DF',
            '5%-LDRRMF',
        ]);
        expect(result.records.map((r) => r.fundNorm)).toEqual([
            'gf-proper',
            '20%-df',
            '5%-ldrrmf',
        ]);
        // Leader carries the output; blank continuations inherit it, so
        // their fund links attach to the block's expected output.
        for (const record of result.records) {
            expect(record.expectedOutput).toBe('Support provided');
            expect(record.fullCode).toBe('1000-1-03-009-001-001');
        }
        expect(result.records[0].isContinuation).toBe(false);
        expect(result.records[1].offices).toEqual(['OPG']);
    });

    it('inherits leader offices and schedule on blank continuations', () => {
        const wb = buildWorkbook([
            [
                '1000-1-03-009-001-001',
                '1. Support work',
                'OPG',
                'Jan-27',
                'Dec-27',
                'Support provided',
                'GF-Proper',
                null,
                null,
                null,
            ],
            [null, null, null, null, null, null, '20%-DF', null, null, null],
        ]);
        const ws = wb.getWorksheet('Sheet1')!;
        const result = extractAipSummaryRecords(ws, {
            ...getDefaultAipSummaryConfig(),
            headerRow: 7,
        });

        const cont = result.records[1];
        expect(cont.isContinuation).toBe(true);
        expect(cont.expectedOutput).toBe('Support provided');
        expect(cont.offices).toEqual(['OPG']);
        expect(cont.startDate).toBe('2027-01-01');
        expect(cont.endDate).toBe('2027-12-01');
        expect(cont.fundingSource).toBe('20%-DF');
    });
});
