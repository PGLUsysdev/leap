import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { getDefaultAipSummaryConfig } from './sheet-config';
import {
    effectiveFundingSource,
    extractAipSummaryRows,
    isBlankCell,
    outputRowState,
    verifyAipSummarySheet,
} from './verify';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'M', 'N', 'O'];
const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 13, 14, 15];

function buildSheet(
    dataRows: Array<Array<string | Date | null>>,
    numberRow?: Array<number | null>,
) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Sheet1');

    LETTERS.forEach((letter, i) => {
        ws.getRow(8).getCell(letter).value = numberRow?.[i] ?? NUMBERS[i];
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
    '0',
    '0',
    'A123',
];

describe('extractAipSummaryRows', () => {
    it('classifies ppa, continuation, blank, and signatory rows', () => {
        const wb = buildSheet([
            PROGRAM,
            [
                null,
                null,
                'MHO',
                'Jan-26',
                'Dec-26',
                '500 kids',
                'SEF',
                '0',
                '0',
                'A123',
            ],
            [null, null, null, null, null, null, null, null, null, null],
            [
                'Prepared by:',
                null,
                'Reviewed by:',
                null,
                null,
                'Approved by:',
                null,
                null,
                null,
                null,
            ],
        ]);
        const ws = wb.getWorksheet('Sheet1')!;
        const result = extractAipSummaryRows(ws, {
            ...getDefaultAipSummaryConfig(),
            headerRow: 7,
        });

        expect(result.kept.map((k) => k.kind)).toEqual(['ppa', 'continuation']);
        expect(result.skippedBlank).toBe(1);
        expect(result.skippedFooter).toBe(1);
    });
});

describe('verifyAipSummarySheet', () => {
    it('accepts a valid program + project hierarchy', () => {
        const wb = buildSheet([PROGRAM, PROJECT]);
        const result = verifyAipSummarySheet(
            wb,
            'Sheet1',
            getDefaultAipSummaryConfig(),
        );

        expect(result.valid).toBe(true);
        expect(result.ppaBlocks).toBe(2);
        expect(result.rowsKept).toBe(2);
    });

    it('rejects a child whose parent is missing', () => {
        const wb = buildSheet([PROJECT]);
        const result = verifyAipSummarySheet(
            wb,
            'Sheet1',
            getDefaultAipSummaryConfig(),
        );

        expect(result.valid).toBe(false);
        expect(
            result.errors.some((e) => e.message.includes('not found in sheet')),
        ).toBe(true);
    });

    it('rejects ref codes deeper than subsubactivity', () => {
        const wb = buildSheet([
            PROGRAM,
            [
                '1000-1-03-009-001-001-01-1-2-3',
                '1.1.1.1.1. Too deep',
                'MHO',
                'Jan-26',
                'Dec-26',
                'Deep',
                'GF',
                '0',
                '0',
                'A123',
            ],
        ]);
        const result = verifyAipSummarySheet(
            wb,
            'Sheet1',
            getDefaultAipSummaryConfig(),
        );

        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.message.includes('5–9'))).toBe(true);
    });

    it('rejects a wrong number row', () => {
        const wb = buildSheet([PROGRAM], [1, 2, 3, 4, 5, 6, 7, 13, 14, 99]);
        const result = verifyAipSummarySheet(
            wb,
            'Sheet1',
            getDefaultAipSummaryConfig(),
        );

        expect(result.valid).toBe(false);
        expect(
            result.errors.some((e) =>
                e.message.includes('Number row mismatch'),
            ),
        ).toBe(true);
    });

    it('treats office, expected output, funding source, and schedule as optional', () => {
        const wb = buildSheet([
            [
                '1000-1-03-009-001',
                'A. Health Program',
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
            ],
        ]);
        const result = verifyAipSummarySheet(
            wb,
            'Sheet1',
            getDefaultAipSummaryConfig(),
        );

        expect(result.valid).toBe(true);
    });

    it('passes a dotted prefix without a trailing dot as a warning', () => {
        const wb = buildSheet([
            PROGRAM,
            PROJECT,
            [
                '1000-1-03-009-001-001-01',
                '1.1 Support to Maintenance',
                'MHO',
                'Jan-26',
                'Jun-26',
                'Support',
                'GF',
                '0',
                '0',
                'A123',
            ],
        ]);
        const result = verifyAipSummarySheet(
            wb,
            'Sheet1',
            getDefaultAipSummaryConfig(),
        );

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0].message).toContain('missing trailing');
    });

    it('passes a program letter without a trailing dot as a warning', () => {
        const wb = buildSheet([
            [
                '1000-1-03-009-001',
                'A Health Program',
                'MHO',
                'Jan-26',
                'Dec-26',
                'Served',
                'GF',
                '0',
                '0',
                'A123',
            ],
        ]);
        const result = verifyAipSummarySheet(
            wb,
            'Sheet1',
            getDefaultAipSummaryConfig(),
        );

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0].message).toContain('missing trailing');
    });

    it('passes a spaced prefix as a warning and sequences on the collapsed form', () => {
        const wb = buildSheet([
            PROGRAM,
            PROJECT,
            [
                '1000-1-03-009-001-001-01',
                '1. 1. Spaced activity',
                'MHO',
                'Jan-26',
                'Jun-26',
                'Support',
                'GF',
                '0',
                '0',
                'A123',
            ],
        ]);
        const result = verifyAipSummarySheet(
            wb,
            'Sheet1',
            getDefaultAipSummaryConfig(),
        );

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0].message).toContain('spacing');
    });

    it('passes a spaced prefix without a trailing dot with both warnings', () => {
        const wbActivity = buildSheet([
            PROGRAM,
            [
                '1000-1-03-009-001-001',
                '1. Project',
                'MHO',
                'Jan-26',
                'Jun-26',
                'Support',
                'GF',
                '0',
                '0',
                'A123',
            ],
            [
                '1000-1-03-009-001-001-01',
                '1. 1 Spaced activity without dot',
                'MHO',
                'Jan-26',
                'Jun-26',
                'Support',
                'GF',
                '0',
                '0',
                'A123',
            ],
        ]);
        const result = verifyAipSummarySheet(
            wbActivity,
            'Sheet1',
            getDefaultAipSummaryConfig(),
        );

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.warnings).toHaveLength(2);
    });

    it('reports no warnings for canonical prefixes', () => {
        const wb = buildSheet([PROGRAM, PROJECT]);
        const result = verifyAipSummarySheet(
            wb,
            'Sheet1',
            getDefaultAipSummaryConfig(),
        );

        expect(result.valid).toBe(true);
        expect(result.warnings).toHaveLength(0);
    });

    it('accepts real Excel dates in schedule columns', () => {        const wb = buildSheet([
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
        const result = verifyAipSummarySheet(
            wb,
            'Sheet1',
            getDefaultAipSummaryConfig(),
        );

        expect(result.valid).toBe(true);
    });

    it('rejects a tandem mismatch between code depth and description prefix', () => {        const wb = buildSheet([
            PROGRAM,
            [
                '1000-1-03-009-001-001',
                '1.1. Wrong depth prefix',
                'MHO',
                'Jan-26',
                'Jun-26',
                'Mismatch',
                'GF',
                '0',
                '0',
                'A123',
            ],
        ]);
        const result = verifyAipSummarySheet(
            wb,
            'Sheet1',
            getDefaultAipSummaryConfig(),
        );

        expect(result.valid).toBe(false);
        expect(
            result.errors.some((e) => e.message.includes("doesn't match")),
        ).toBe(true);
    });

    it('errors on a description in col B with a blank col A', () => {
        const wb = buildSheet([
            PROGRAM,
            [
                null,
                '1. Orphan description without code',
                'MHO',
                'Jan-26',
                'Jun-26',
                'Stray',
                'GF',
                '0',
                '0',
                'A123',
            ],
        ]);
        const result = verifyAipSummarySheet(
            wb,
            'Sheet1',
            getDefaultAipSummaryConfig(),
        );

        expect(result.valid).toBe(false);
        expect(
            result.errors.some((e) =>
                e.message.includes('without an AIP Reference Code'),
            ),
        ).toBe(true);
    });

    it('names the calibrated columns in the missing-code error', () => {
        const config = getDefaultAipSummaryConfig();
        const wb = buildSheet([
            ['1000-1-03-009-001', 'MHO', 'A. Health Program', 'Jan-26', 'Dec-26', 'Served', 'GF', '0', '0', 'A123'],
            [null, 'MHO', '1. Stray desc', 'Jan-26', 'Jun-26', 'Stray', 'GF', '0', '0', 'A123'],
        ]);
        const result = verifyAipSummarySheet(wb, 'Sheet1', {
            ...config,
            columnConfig: { ...config.columnConfig, office: 'B', description: 'C' },
        });

        expect(result.valid).toBe(false);
        expect(
            result.errors.some(
                (e) =>
                    e.message.includes('PPA Description (col C)') &&
                    e.message.includes('AIP Reference Code (col A)'),
            ),
        ).toBe(true);
    });

    it('stays silent when cols A and B are both blank', () => {
        const wb = buildSheet([
            PROGRAM,
            [null, null, 'MHO', 'Jan-26', 'Dec-26', 'Extra', 'SEF', '0', '0', '-'],
        ]);
        const result = verifyAipSummarySheet(
            wb,
            'Sheet1',
            getDefaultAipSummaryConfig(),
        );

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.rowsKept).toBe(2);
    });
});

describe('GF Proper climate rule', () => {
    function ccRow(fund: string | null, adaptation: string | null, mitigation: string | null, typology: string | null) {
        return [
            '1000-1-03-009-001',
            'A. Health Program',
            'MHO',
            'Jan-26',
            'Dec-26',
            'Served',
            fund,
            adaptation,
            mitigation,
            typology,
        ];
    }

    function check(fund: string | null, adaptation: string | null, mitigation: string | null, typology: string | null) {
        const wb = buildSheet([ccRow(fund, adaptation, mitigation, typology)]);
        return verifyAipSummarySheet(wb, 'Sheet1', getDefaultAipSummaryConfig());
    }

    it('allows CC values on GF Proper variants', () => {
        for (const fund of ['GF-Proper', 'GF Proper', 'GF', 'gf-proper']) {
            const result = check(fund, '50.00', '300.00', 'A123');
            expect(result.valid).toBe(true);
        }
    });

    it('errors on CC values without GF Proper funding', () => {
        const result = check('SEF', '50.00', '0', '-');
        expect(result.valid).toBe(false);
        expect(
            result.errors.some((e) => e.message.includes('Adaptation')),
        ).toBe(true);
    });

    it('treats blank, dash, and zero CC as empty on other funds', () => {
        const result = check('SEF', '0', '0.00', '-');
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('errors on typology alone with a missing fund', () => {
        const result = check(null, null, null, 'A123');
        expect(result.valid).toBe(false);
        expect(
            result.errors.some((e) => e.message.includes('Typology')),
        ).toBe(true);
    });

    it('errors on a multi-fund cell carrying CC values', () => {
        const result = check('GF-Proper/ 20%-DF', '10.00', null, null);
        expect(result.valid).toBe(false);
    });
});

describe('funding source anchors on expected output', () => {
    // Cols: A refCode, B description, C office, D start, E end,
    // F expectedOutput, G fundingSource, M/N/O climate.
    function anchorRow(
        office: string | null,
        start: string | null,
        end: string | null,
        output: string | null,
        fund: string | null,
    ) {
        return [
            '1000-1-03-009-001',
            'A. Health Program',
            office,
            start,
            end,
            output,
            fund,
            null,
            null,
            null,
        ];
    }

    function check(
        office: string | null,
        start: string | null,
        end: string | null,
        output: string | null,
        fund: string | null,
    ) {
        const wb = buildSheet([
            anchorRow(office, start, end, output, fund),
        ]);
        return verifyAipSummarySheet(wb, 'Sheet1', getDefaultAipSummaryConfig());
    }

    it('treats null, blank, dash, and em-dash as blank cells', () => {
        for (const value of [null, '', '   ', '-', '—']) {
            expect(isBlankCell(value)).toBe(true);
        }
        expect(isBlankCell('MHO')).toBe(false);
        expect(isBlankCell('100% served')).toBe(false);
    });

    it('classifies output, context, and hierarchy rows', () => {
        const values = (
            office: string | null,
            start: string | null,
            end: string | null,
            output: string | null,
        ) => ({
            office,
            startDate: start,
            endDate: end,
            expectedOutput: output,
        });

        expect(
            outputRowState(values('MHO', 'Jan-26', 'Dec-26', 'Served')),
        ).toBe('output');
        // Output alone anchors, even without office or schedule.
        expect(outputRowState(values(null, null, null, 'Served'))).toBe(
            'output',
        );
        expect(outputRowState(values(null, null, null, '—'))).toBe(
            'hierarchy',
        );
        expect(outputRowState(values('MHO', null, null, null))).toBe(
            'context',
        );
        expect(outputRowState(values(null, 'Jan-26', null, null))).toBe(
            'context',
        );
        expect(outputRowState(values(null, null, null, null))).toBe(
            'hierarchy',
        );
    });

    it('coerces context-row funds to null', () => {
        expect(
            effectiveFundingSource({
                office: 'MHO',
                startDate: 'Jan-26',
                endDate: 'Dec-26',
                expectedOutput: null,
                fundingSource: 'GF-Proper',
            }),
        ).toBeNull();
        expect(
            effectiveFundingSource({
                office: null,
                startDate: null,
                endDate: null,
                expectedOutput: 'Served',
                fundingSource: 'GF-Proper',
            }),
        ).toBe('GF-Proper');
    });

    it('passes an output row carrying only a funding source', () => {
        const result = check(null, null, null, '20 Component LGU', 'GF-Proper');
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('passes a context row (no output, office and dates set)', () => {
        const result = check('OPG', 'Jan-27', 'Dec-27', null, 'GF-Proper');
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('passes a pure hierarchy row with no funding source', () => {
        const result = check(null, null, null, null, null);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('errors on a hierarchy row carrying a funding source', () => {
        const result = check(null, null, null, null, 'GF-Proper');
        expect(result.valid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].message).toContain('Funding source');
        expect(result.errors[0].row).toBe(9);
    });

    it('errors on CC values riding a coerced (context-row) fund', () => {
        const wb = buildSheet([
            anchorRow('MHO', 'Jan-26', 'Dec-26', null, 'GF-Proper').map(
                (value, i) => (i === 7 ? '50.00' : value),
            ),
        ]);
        const result = verifyAipSummarySheet(
            wb,
            'Sheet1',
            getDefaultAipSummaryConfig(),
        );
        expect(result.valid).toBe(false);
        expect(
            result.errors.some(
                (e) =>
                    e.message.includes('Adaptation') &&
                    e.message.includes('(got "—")'),
            ),
        ).toBe(true);
    });
});
