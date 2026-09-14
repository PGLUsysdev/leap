// tests/lib/ppmp/verify.test.ts
//
// Run once:    pnpm vitest run tests/lib/ppmp/verify.test.ts
// Watch:       pnpm vitest tests/lib/ppmp/verify.test.ts --watch
// One case:    pnpm vitest tests/lib/ppmp/verify.test.ts -t "missing closing"

import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { verifyPpmpSheet } from '@/lib/ppmp/verify';
import { getDefaultSharedConfig } from '@/lib/ppmp/sheet-config';

// ─── helpers ──────────────────────────────────────────────────────────
//
// Column layout (matches the app defaults):
//   A  B  C  D=coa  E=item#  F=category  G=unit  H=price
//
// Every row is a plain array. Empty cells are ''.

function buildWorkbook(rows: (string | number)[][]) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Sheet1');
    for (const r of rows) ws.addRow(r);
    return wb;
}

function cfg(overrides: {
    headerRow: number | '';
    additionalItemsHeaderRow: number | '';
    nonProcurementHeaderRow: number | '';
}) {
    const c = getDefaultSharedConfig();
    c.rowConfig.headerRow = overrides.headerRow;
    c.rowConfig.additionalItemsHeaderRow = overrides.additionalItemsHeaderRow;
    c.rowConfig.nonProcurementHeaderRow = overrides.nonProcurementHeaderRow;
    return c;
}

function summarize(result: {
    valid: boolean;
    message: string;
    errors: { row: number; message: string }[];
    groups: {
        procurement: number;
        additional: number;
        nonProcurement: number;
    };
}) {
    const lines = [
        result.valid ? '✅ VALID' : '❌ INVALID',
        `   ${result.message}`,
    ];
    for (const e of result.errors) lines.push(`   row ${e.row}: ${e.message}`);
    lines.push(
        `   groups: proc=${result.groups.procurement} add=${result.groups.additional} nonProc=${result.groups.nonProcurement}`,
    );
    return lines.join('\n');
}

// ─── cases ────────────────────────────────────────────────────────────

describe('verifyPpmpSheet — passing', () => {
    it('one category, one COA, two items + additional + non-proc', () => {
        const wb = buildWorkbook([
            /*  1 */ ['', '', '', 'COA', 'Item#', 'Category', 'Unit', 'Price'],
            /*  2 */ ['', '', '', '', '', 'OFFICE SUPPLIES', '', ''],
            /*  3 */ ['', '', '', '', '', '5-02-01-010', '', ''],
            /*  4 */ [
                '',
                '',
                '',
                '5-02-01-010',
                '1',
                'Bond paper',
                'ream',
                250,
            ],
            /*  5 */ ['', '', '', '5-02-01-010', '2', 'Ballpen', 'pc', 15],
            /*  6 */ ['', '', '', '', '', 'OFFICE SUPPLIES - TOTAL', '', ''],
            /*  7 */ ['', '', '', '', '', 'ADDITIONAL ITEMS', '', ''],
            /*  8 */ ['', '', '', '5-02-01-020', '1', 'Stapler', 'pc', 100],
            /*  9 */ ['', '', '', '', '', 'ADDITIONAL ITEMS - TOTAL', '', ''],
            /* 10 */ [
                '',
                '',
                '',
                '',
                '',
                'NON-PROCUREMENT REQUIREMENTS',
                '',
                '',
            ],
            /* 11 */ ['', '', '', '5-02-01-030', '1', 'Fee', 'lot', 500],
            /* 12 */ ['', '', '', '', '', 'NON-PROCUREMENT - TOTAL', '', ''],
        ]);

        const result = verifyPpmpSheet(
            wb,
            'Sheet1',
            cfg({
                headerRow: 1,
                additionalItemsHeaderRow: 7,
                nonProcurementHeaderRow: 10,
            }),
        );

        console.log(summarize(result));
        expect(result.valid).toBe(true);
    });

    it('one category with two COA groups', () => {
        const wb = buildWorkbook([
            /*  1 */ ['', '', '', 'COA', 'Item#', 'Category', 'Unit', 'Price'],
            /*  2 */ ['', '', '', '', '', 'ICT EQUIPMENT', '', ''],
            /*  3 */ ['', '', '', '', '', '5-02-01-010', '', ''],
            /*  4 */ ['', '', '', '5-02-01-010', '1', 'Laptop', 'pc', 50000],
            /*  5 */ ['', '', '', '', '', '5-02-01-020', '', ''],
            /*  6 */ ['', '', '', '5-02-01-020', '1', 'Mouse', 'pc', 500],
            /*  7 */ ['', '', '', '5-02-01-020', '2', 'Keyboard', 'pc', 1200],
            /*  8 */ ['', '', '', '', '', 'ICT EQUIPMENT - TOTAL', '', ''],
            /*  9 */ ['', '', '', '', '', 'ADDITIONAL ITEMS', '', ''],
            /* 10 */ ['', '', '', '5-02-01-030', '1', 'Extra', 'pc', 100],
            /* 11 */ ['', '', '', '', '', 'ADDITIONAL ITEMS - TOTAL', '', ''],
            /* 12 */ [
                '',
                '',
                '',
                '',
                '',
                'NON-PROCUREMENT REQUIREMENTS',
                '',
                '',
            ],
            /* 13 */ ['', '', '', '5-02-01-040', '1', 'Fee', 'lot', 500],
            /* 14 */ ['', '', '', '', '', 'NON-PROCUREMENT - TOTAL', '', ''],
        ]);

        const result = verifyPpmpSheet(
            wb,
            'Sheet1',
            cfg({
                headerRow: 1,
                additionalItemsHeaderRow: 9,
                nonProcurementHeaderRow: 12,
            }),
        );

        console.log(summarize(result));
        expect(result.valid).toBe(true);
    });
});

describe('verifyPpmpSheet — failing', () => {
    it('missing closing total', () => {
        const wb = buildWorkbook([
            /*  1 */ ['', '', '', 'COA', 'Item#', 'Category', 'Unit', 'Price'],
            /*  2 */ ['', '', '', '', '', 'OFFICE SUPPLIES', '', ''],
            /*  3 */ ['', '', '', '', '', '5-02-01-010', '', ''],
            /*  4 */ [
                '',
                '',
                '',
                '5-02-01-010',
                '1',
                'Bond paper',
                'ream',
                250,
            ],
            /*      ← no "OFFICE SUPPLIES - TOTAL" */
            /*  5 */ ['', '', '', '', '', 'ADDITIONAL ITEMS', '', ''],
            /*  6 */ ['', '', '', '5-02-01-020', '1', 'Stapler', 'pc', 100],
            /*  7 */ ['', '', '', '', '', 'ADDITIONAL ITEMS - TOTAL', '', ''],
            /*  8 */ [
                '',
                '',
                '',
                '',
                '',
                'NON-PROCUREMENT REQUIREMENTS',
                '',
                '',
            ],
            /*  9 */ ['', '', '', '5-02-01-030', '1', 'Fee', 'lot', 500],
            /* 10 */ ['', '', '', '', '', 'NON-PROCUREMENT - TOTAL', '', ''],
        ]);

        const result = verifyPpmpSheet(
            wb,
            'Sheet1',
            cfg({
                headerRow: 1,
                additionalItemsHeaderRow: 5,
                nonProcurementHeaderRow: 8,
            }),
        );

        console.log(summarize(result));
        expect(result.valid).toBe(false);
        expect(
            result.errors.some((e) => /missing closing/i.test(e.message)),
        ).toBe(true);
    });

    it('total name mismatch', () => {
        const wb = buildWorkbook([
            /*  1 */ ['', '', '', 'COA', 'Item#', 'Category', 'Unit', 'Price'],
            /*  2 */ ['', '', '', '', '', 'OFFICE SUPPLIES', '', ''],
            /*  3 */ ['', '', '', '', '', '5-02-01-010', '', ''],
            /*  4 */ [
                '',
                '',
                '',
                '5-02-01-010',
                '1',
                'Bond paper',
                'ream',
                250,
            ],
            /*  5 */ ['', '', '', '', '', 'WRONG NAME - TOTAL', '', ''],
            /*  6 */ ['', '', '', '', '', 'ADDITIONAL ITEMS', '', ''],
            /*  7 */ ['', '', '', '5-02-01-020', '1', 'Stapler', 'pc', 100],
            /*  8 */ ['', '', '', '', '', 'ADDITIONAL ITEMS - TOTAL', '', ''],
            /*  9 */ [
                '',
                '',
                '',
                '',
                '',
                'NON-PROCUREMENT REQUIREMENTS',
                '',
                '',
            ],
            /* 10 */ ['', '', '', '5-02-01-030', '1', 'Fee', 'lot', 500],
            /* 11 */ ['', '', '', '', '', 'NON-PROCUREMENT - TOTAL', '', ''],
        ]);

        const result = verifyPpmpSheet(
            wb,
            'Sheet1',
            cfg({
                headerRow: 1,
                additionalItemsHeaderRow: 6,
                nonProcurementHeaderRow: 9,
            }),
        );

        console.log(summarize(result));
        expect(result.valid).toBe(false);
        expect(
            result.errors.some((e) => /Total mismatch/i.test(e.message)),
        ).toBe(true);
    });

    it('item without COA label (with-label mode)', () => {
        const wb = buildWorkbook([
            /*  1 */ ['', '', '', 'COA', 'Item#', 'Category', 'Unit', 'Price'],
            /*  2 */ ['', '', '', '', '', 'OFFICE SUPPLIES', '', ''],
            /*      ← no COA label row between cat and item */
            /*  3 */ [
                '',
                '',
                '',
                '5-02-01-010',
                '1',
                'Bond paper',
                'ream',
                250,
            ],
            /*  4 */ ['', '', '', '', '', 'OFFICE SUPPLIES - TOTAL', '', ''],
            /*  5 */ ['', '', '', '', '', 'ADDITIONAL ITEMS', '', ''],
            /*  6 */ ['', '', '', '5-02-01-020', '1', 'Stapler', 'pc', 100],
            /*  7 */ ['', '', '', '', '', 'ADDITIONAL ITEMS - TOTAL', '', ''],
            /*  8 */ [
                '',
                '',
                '',
                '',
                '',
                'NON-PROCUREMENT REQUIREMENTS',
                '',
                '',
            ],
            /*  9 */ ['', '', '', '5-02-01-030', '1', 'Fee', 'lot', 500],
            /* 10 */ ['', '', '', '', '', 'NON-PROCUREMENT - TOTAL', '', ''],
        ]);

        const result = verifyPpmpSheet(
            wb,
            'Sheet1',
            cfg({
                headerRow: 1,
                additionalItemsHeaderRow: 5,
                nonProcurementHeaderRow: 8,
            }),
        );

        console.log(summarize(result));
        expect(result.valid).toBe(false);
        expect(
            result.errors.some((e) => /without active COA/i.test(e.message)),
        ).toBe(true);
    });

    it('COA label with no items', () => {
        const wb = buildWorkbook([
            /*  1 */ ['', '', '', 'COA', 'Item#', 'Category', 'Unit', 'Price'],
            /*  2 */ ['', '', '', '', '', 'OFFICE SUPPLIES', '', ''],
            /*  3 */ ['', '', '', '', '', '5-02-01-010', '', ''],
            /*      ← no item rows after the label */
            /*  4 */ ['', '', '', '', '', 'OFFICE SUPPLIES - TOTAL', '', ''],
            /*  5 */ ['', '', '', '', '', 'ADDITIONAL ITEMS', '', ''],
            /*  6 */ ['', '', '', '5-02-01-020', '1', 'Stapler', 'pc', 100],
            /*  7 */ ['', '', '', '', '', 'ADDITIONAL ITEMS - TOTAL', '', ''],
            /*  8 */ [
                '',
                '',
                '',
                '',
                '',
                'NON-PROCUREMENT REQUIREMENTS',
                '',
                '',
            ],
            /*  9 */ ['', '', '', '5-02-01-030', '1', 'Fee', 'lot', 500],
            /* 10 */ ['', '', '', '', '', 'NON-PROCUREMENT - TOTAL', '', ''],
        ]);

        const result = verifyPpmpSheet(
            wb,
            'Sheet1',
            cfg({
                headerRow: 1,
                additionalItemsHeaderRow: 5,
                nonProcurementHeaderRow: 8,
            }),
        );

        console.log(summarize(result));
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => /has no items/i.test(e.message))).toBe(
            true,
        );
    });

    it('additional item missing COA', () => {
        const wb = buildWorkbook([
            /*  1 */ ['', '', '', 'COA', 'Item#', 'Category', 'Unit', 'Price'],
            /*  2 */ ['', '', '', '', '', 'OFFICE SUPPLIES', '', ''],
            /*  3 */ ['', '', '', '', '', '5-02-01-010', '', ''],
            /*  4 */ [
                '',
                '',
                '',
                '5-02-01-010',
                '1',
                'Bond paper',
                'ream',
                250,
            ],
            /*  5 */ ['', '', '', '', '', 'OFFICE SUPPLIES - TOTAL', '', ''],
            /*  6 */ ['', '', '', '', '', 'ADDITIONAL ITEMS', '', ''],
            /*  7 */ ['', '', '', '', '1', 'Stapler', 'pc', 100], // ← missing COA
            /*  8 */ ['', '', '', '', '', 'ADDITIONAL ITEMS - TOTAL', '', ''],
            /*  9 */ [
                '',
                '',
                '',
                '',
                '',
                'NON-PROCUREMENT REQUIREMENTS',
                '',
                '',
            ],
            /* 10 */ ['', '', '', '5-02-01-030', '1', 'Fee', 'lot', 500],
            /* 11 */ ['', '', '', '', '', 'NON-PROCUREMENT - TOTAL', '', ''],
        ]);

        const result = verifyPpmpSheet(
            wb,
            'Sheet1',
            cfg({
                headerRow: 1,
                additionalItemsHeaderRow: 6,
                nonProcurementHeaderRow: 9,
            }),
        );

        console.log(summarize(result));
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => /missing COA/i.test(e.message))).toBe(
            true,
        );
    });

    it('inverted ranges', () => {
        const wb = buildWorkbook([
            /*  1 */ ['', '', '', 'COA', 'Item#', 'Category', 'Unit', 'Price'],
            /*  2 */ ['', '', '', '', '', 'X', '', ''],
            /*  3 */ ['', '', '', '', '', '5-02-01-010', '', ''],
            /*  4 */ ['', '', '', '', '', 'X - TOTAL', '', ''],
        ]);

        const result = verifyPpmpSheet(
            wb,
            'Sheet1',
            cfg({
                headerRow: 8,
                additionalItemsHeaderRow: 2,
                nonProcurementHeaderRow: 3,
            }),
        );

        console.log(summarize(result));
        expect(result.valid).toBe(false);
        expect(
            result.errors.some((e) =>
                /Procurement range invalid/i.test(e.message),
            ),
        ).toBe(true);
    });
});
