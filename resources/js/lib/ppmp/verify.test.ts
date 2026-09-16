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

// ─── COA names used across cases ──────────────────────────────────────
//
// Office Supplies Expenses
// Accountable Forms Expenses
// Food Supplies Expenses
// Welfare Goods Expenses
// Janitorial Services

// ─── cases ────────────────────────────────────────────────────────────

describe('verifyPpmpSheet — passing', () => {
    it('one category, one COA, two items + additional + non-proc', () => {
        const wb = buildWorkbook([
            /*  1 */ ['', '', '', 'COA', 'Item#', 'Category', 'Unit', 'Price'],
            /*  2 */ ['', '', '', '', '', 'OFFICE SUPPLIES', '', ''],
            /*  3 */ ['', '', '', '', '', 'Office Supplies Expenses', '', ''],
            /*  4 */ [
                '',
                '',
                '',
                'Office Supplies Expenses',
                '1',
                'Bond paper',
                'ream',
                250,
            ],
            /*  5 */ [
                '',
                '',
                '',
                'Office Supplies Expenses',
                '2',
                'Ballpen',
                'pc',
                15,
            ],
            /*  6 */ ['', '', '', '', '', 'OFFICE SUPPLIES - TOTAL', '', ''],
            /*  7 */ ['', '', '', '', '', 'ADDITIONAL ITEMS', '', ''],
            /*  8 */ [
                '',
                '',
                '',
                'Accountable Forms Expenses',
                '1',
                'Stapler',
                'pc',
                100,
            ],
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
            /* 11 */ [
                '',
                '',
                '',
                'Food Supplies Expenses',
                '1',
                'Fee',
                'lot',
                500,
            ],
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
            /*  3 */ ['', '', '', '', '', 'Office Supplies Expenses', '', ''],
            /*  4 */ [
                '',
                '',
                '',
                'Office Supplies Expenses',
                '1',
                'Laptop',
                'pc',
                50000,
            ],
            /*  5 */ ['', '', '', '', '', 'Accountable Forms Expenses', '', ''],
            /*  6 */ [
                '',
                '',
                '',
                'Accountable Forms Expenses',
                '1',
                'Mouse',
                'pc',
                500,
            ],
            /*  7 */ [
                '',
                '',
                '',
                'Accountable Forms Expenses',
                '2',
                'Keyboard',
                'pc',
                1200,
            ],
            /*  8 */ ['', '', '', '', '', 'ICT EQUIPMENT - TOTAL', '', ''],
            /*  9 */ ['', '', '', '', '', 'ADDITIONAL ITEMS', '', ''],
            /* 10 */ [
                '',
                '',
                '',
                'Food Supplies Expenses',
                '1',
                'Extra',
                'pc',
                100,
            ],
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
            /* 13 */ [
                '',
                '',
                '',
                'Welfare Goods Expenses',
                '1',
                'Fee',
                'lot',
                500,
            ],
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

    it('blank rows between every section, category, COA, and item', () => {
        const wb = buildWorkbook([
            /*  1 */ ['', '', '', '', '', '', '', ''], // blank
            /*  2 */ ['', '', '', '', '', '', '', ''], // blank
            /*  3 */ ['', '', '', 'COA', 'Item#', 'Category', 'Unit', 'Price'], // header
            /*  4 */ ['', '', '', '', '', '', '', ''], // blank (header → cat)
            /*  5 */ ['', '', '', '', '', 'OFFICE SUPPLIES', '', ''],
            /*  6 */ ['', '', '', '', '', '', '', ''], // blank (cat → coa)
            /*  7 */ ['', '', '', '', '', 'Office Supplies Expenses', '', ''],
            /*  8 */ ['', '', '', '', '', '', '', ''], // blank (coa → item)
            /*  9 */ [
                '',
                '',
                '',
                'Office Supplies Expenses',
                '1',
                'Bond paper',
                'ream',
                250,
            ],
            /* 10 */ ['', '', '', '', '', '', '', ''], // blank (item → item)
            /* 11 */ [
                '',
                '',
                '',
                'Office Supplies Expenses',
                '2',
                'Ballpen',
                'pc',
                15,
            ],
            /* 12 */ ['', '', '', '', '', '', '', ''], // blank (item → total)
            /* 13 */ ['', '', '', '', '', 'OFFICE SUPPLIES - TOTAL', '', ''],
            /* 14 */ ['', '', '', '', '', '', '', ''], // blank (total → next section)
            /* 15 */ ['', '', '', '', '', '', '', ''], // blank
            /* 16 */ ['', '', '', '', '', 'ADDITIONAL ITEMS', '', ''],
            /* 17 */ ['', '', '', '', '', '', '', ''], // blank (header → item)
            /* 18 */ [
                '',
                '',
                '',
                'Accountable Forms Expenses',
                '1',
                'Stapler',
                'pc',
                100,
            ],
            /* 19 */ ['', '', '', '', '', '', '', ''], // blank (item → total)
            /* 20 */ ['', '', '', '', '', 'ADDITIONAL ITEMS - TOTAL', '', ''],
            /* 21 */ ['', '', '', '', '', '', '', ''], // blank (section → section)
            /* 22 */ ['', '', '', '', '', '', '', ''], // blank
            /* 23 */ [
                '',
                '',
                '',
                '',
                '',
                'NON-PROCUREMENT REQUIREMENTS',
                '',
                '',
            ],
            /* 24 */ ['', '', '', '', '', '', '', ''], // blank (header → item)
            /* 25 */ [
                '',
                '',
                '',
                'Food Supplies Expenses',
                '1',
                'Fee',
                'lot',
                500,
            ],
            /* 26 */ ['', '', '', '', '', '', '', ''], // blank (item → total)
            /* 27 */ ['', '', '', '', '', 'NON-PROCUREMENT - TOTAL', '', ''],
            /* 28 */ ['', '', '', '', '', '', '', ''], // trailing blank
        ]);

        const result = verifyPpmpSheet(
            wb,
            'Sheet1',
            cfg({
                headerRow: 3,
                additionalItemsHeaderRow: 16,
                nonProcurementHeaderRow: 23,
            }),
        );

        console.log(summarize(result));
        expect(result.valid).toBe(true);
    });

    it('no non-procurement section — sheet ends after additional total + grand total', () => {
        const wb = buildWorkbook([
            /*  1 */ ['', '', '', 'COA', 'Item#', 'Category', 'Unit', 'Price'],
            /*  2 */ ['', '', '', '', '', 'OFFICE SUPPLIES', '', ''],
            /*  3 */ ['', '', '', '', '', 'Office Supplies Expenses', '', ''],
            /*  4 */ [
                '',
                '',
                '',
                'Office Supplies Expenses',
                '1',
                'Bond paper',
                'ream',
                250,
            ],
            /*  5 */ [
                '',
                '',
                '',
                'Office Supplies Expenses',
                '2',
                'Ballpen',
                'pc',
                15,
            ],
            /*  6 */ ['', '', '', '', '', 'OFFICE SUPPLIES - TOTAL', '', ''],
            /*  7 */ ['', '', '', '', '', 'ADDITIONAL ITEMS', '', ''],
            /*  8 */ [
                '',
                '',
                '',
                'Accountable Forms Expenses',
                '1',
                'Stapler',
                'pc',
                100,
            ],
            /*  9 */ ['', '', '', '', '', 'ADDITIONAL ITEMS - TOTAL', '', ''],
            /* 10 */ ['', '', '', '', '', 'PROCUREMENT - TOTAL', '', ''],
        ]);

        const result = verifyPpmpSheet(
            wb,
            'Sheet1',
            cfg({
                headerRow: 1,
                additionalItemsHeaderRow: 7,
                nonProcurementHeaderRow: '',
            }),
        );

        console.log(summarize(result));
        expect(result.valid).toBe(true);
        expect(result.groups.nonProcurement).toBe(0);
    });
});

describe('verifyPpmpSheet — failing', () => {
    it('missing closing total', () => {
        const wb = buildWorkbook([
            /*  1 */ ['', '', '', 'COA', 'Item#', 'Category', 'Unit', 'Price'],
            /*  2 */ ['', '', '', '', '', 'OFFICE SUPPLIES', '', ''],
            /*  3 */ ['', '', '', '', '', 'Office Supplies Expenses', '', ''],
            /*  4 */ [
                '',
                '',
                '',
                'Office Supplies Expenses',
                '1',
                'Bond paper',
                'ream',
                250,
            ],
            /*      ← no "OFFICE SUPPLIES - TOTAL" */
            /*  5 */ ['', '', '', '', '', 'ADDITIONAL ITEMS', '', ''],
            /*  6 */ [
                '',
                '',
                '',
                'Accountable Forms Expenses',
                '1',
                'Stapler',
                'pc',
                100,
            ],
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
            /*  9 */ [
                '',
                '',
                '',
                'Food Supplies Expenses',
                '1',
                'Fee',
                'lot',
                500,
            ],
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
            /*  3 */ ['', '', '', '', '', 'Office Supplies Expenses', '', ''],
            /*  4 */ [
                '',
                '',
                '',
                'Office Supplies Expenses',
                '1',
                'Bond paper',
                'ream',
                250,
            ],
            /*  5 */ ['', '', '', '', '', 'WRONG NAME - TOTAL', '', ''],
            /*  6 */ ['', '', '', '', '', 'ADDITIONAL ITEMS', '', ''],
            /*  7 */ [
                '',
                '',
                '',
                'Accountable Forms Expenses',
                '1',
                'Stapler',
                'pc',
                100,
            ],
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
            /* 10 */ [
                '',
                '',
                '',
                'Food Supplies Expenses',
                '1',
                'Fee',
                'lot',
                500,
            ],
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
                'Office Supplies Expenses',
                '1',
                'Bond paper',
                'ream',
                250,
            ],
            /*  4 */ ['', '', '', '', '', 'OFFICE SUPPLIES - TOTAL', '', ''],
            /*  5 */ ['', '', '', '', '', 'ADDITIONAL ITEMS', '', ''],
            /*  6 */ [
                '',
                '',
                '',
                'Accountable Forms Expenses',
                '1',
                'Stapler',
                'pc',
                100,
            ],
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
            /*  9 */ [
                '',
                '',
                '',
                'Food Supplies Expenses',
                '1',
                'Fee',
                'lot',
                500,
            ],
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
        // DESIRED: verifier recognizes row 2 as a category start, so the
        // item on row 3 fires "without active COA".
        // CURRENT: row 2 is not classified as a category (lookahead mismatch),
        // so the failure surfaces as "without active category" instead.
        // This test documents the DESIRED behavior; it will pass once the
        // verifier classifies bare rows by state instead of by lookahead.
        expect(
            result.errors.some((e) => /without active COA/i.test(e.message)),
        ).toBe(true);
    });

    it('COA label with no items', () => {
        const wb = buildWorkbook([
            /*  1 */ ['', '', '', 'COA', 'Item#', 'Category', 'Unit', 'Price'],
            /*  2 */ ['', '', '', '', '', 'OFFICE SUPPLIES', '', ''],
            /*  3 */ ['', '', '', '', '', 'Office Supplies Expenses', '', ''],
            /*      ← no item rows after the label */
            /*  4 */ ['', '', '', '', '', 'OFFICE SUPPLIES - TOTAL', '', ''],
            /*  5 */ ['', '', '', '', '', 'ADDITIONAL ITEMS', '', ''],
            /*  6 */ [
                '',
                '',
                '',
                'Accountable Forms Expenses',
                '1',
                'Stapler',
                'pc',
                100,
            ],
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
            /*  9 */ [
                '',
                '',
                '',
                'Food Supplies Expenses',
                '1',
                'Fee',
                'lot',
                500,
            ],
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
        // DESIRED: verifier recognizes row 3 as a COA label (bare F-only row
        // inside a category), so the flush at row 4 fires "has no items".
        // CURRENT: row 3 is not classified as a COA label (lookahead checks
        // D[4] === F[3]; D[4] is empty), so it's classified as a new category
        // and the failure surfaces as "started before previous".
        // This test documents the DESIRED behavior; it will pass once the
        // verifier classifies bare rows by state instead of by lookahead.
        expect(result.errors.some((e) => /has no items/i.test(e.message))).toBe(
            true,
        );
    });

    it('additional item missing COA', () => {
        const wb = buildWorkbook([
            /*  1 */ ['', '', '', 'COA', 'Item#', 'Category', 'Unit', 'Price'],
            /*  2 */ ['', '', '', '', '', 'OFFICE SUPPLIES', '', ''],
            /*  3 */ ['', '', '', '', '', 'Office Supplies Expenses', '', ''],
            /*  4 */ [
                '',
                '',
                '',
                'Office Supplies Expenses',
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
            /* 10 */ [
                '',
                '',
                '',
                'Food Supplies Expenses',
                '1',
                'Fee',
                'lot',
                500,
            ],
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
            /*  3 */ ['', '', '', '', '', 'Office Supplies Expenses', '', ''],
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

    it('item COA does not match its COA label', () => {
        const wb = buildWorkbook([
            /*  1 */ ['', '', '', 'COA', 'Item#', 'Category', 'Unit', 'Price'],
            /*  2 */ ['', '', '', '', '', 'OFFICE SUPPLIES', '', ''],
            /*  3 */ ['', '', '', '', '', 'Office Supplies Expenses', '', ''],
            /*  4 */ [
                '',
                '',
                '',
                'Accountable Forms Expenses', // ← D doesn't match row 3's F
                '1',
                'Bond paper',
                'ream',
                250,
            ],
            /*  5 */ ['', '', '', '', '', 'OFFICE SUPPLIES - TOTAL', '', ''],
            /*  6 */ ['', '', '', '', '', 'ADDITIONAL ITEMS', '', ''],
            /*  7 */ [
                '',
                '',
                '',
                'Food Supplies Expenses',
                '1',
                'Stapler',
                'pc',
                100,
            ],
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
            /* 10 */ [
                '',
                '',
                '',
                'Welfare Goods Expenses',
                '1',
                'Fee',
                'lot',
                500,
            ],
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
            result.errors.some((e) => /Item COA mismatch/i.test(e.message)),
        ).toBe(true);
    });

    it('category with a valid total but no COA groups', () => {
        const wb = buildWorkbook([
            /*  1 */ ['', '', '', 'COA', 'Item#', 'Category', 'Unit', 'Price'],
            /*  2 */ ['', '', '', '', '', 'OFFICE SUPPLIES', '', ''],
            /*      ← no COA label between category and total */
            /*  3 */ ['', '', '', '', '', 'OFFICE SUPPLIES - TOTAL', '', ''],
            /*  4 */ ['', '', '', '', '', 'ADDITIONAL ITEMS', '', ''],
            /*  5 */ [
                '',
                '',
                '',
                'Food Supplies Expenses',
                '1',
                'Stapler',
                'pc',
                100,
            ],
            /*  6 */ ['', '', '', '', '', 'ADDITIONAL ITEMS - TOTAL', '', ''],
            /*  7 */ [
                '',
                '',
                '',
                '',
                '',
                'NON-PROCUREMENT REQUIREMENTS',
                '',
                '',
            ],
            /*  8 */ [
                '',
                '',
                '',
                'Welfare Goods Expenses',
                '1',
                'Fee',
                'lot',
                500,
            ],
            /*  9 */ ['', '', '', '', '', 'NON-PROCUREMENT - TOTAL', '', ''],
        ]);

        const result = verifyPpmpSheet(
            wb,
            'Sheet1',
            cfg({
                headerRow: 1,
                additionalItemsHeaderRow: 4,
                nonProcurementHeaderRow: 7,
            }),
        );

        console.log(summarize(result));
        expect(result.valid).toBe(false);
        expect(
            result.errors.some((e) =>
                /has no COA groups before total/i.test(e.message),
            ),
        ).toBe(true);
    });

    it('new category starts before previous category closes', () => {
        const wb = buildWorkbook([
            /*  1 */ ['', '', '', 'COA', 'Item#', 'Category', 'Unit', 'Price'],
            /*  2 */ ['', '', '', '', '', 'OFFICE SUPPLIES', '', ''],
            /*  3 */ ['', '', '', '', '', 'Office Supplies Expenses', '', ''],
            /*  4 */ [
                '',
                '',
                '',
                'Office Supplies Expenses',
                '1',
                'Bond paper',
                'ream',
                250,
            ],
            /*      ← no "OFFICE SUPPLIES - TOTAL" */
            /*  5 */ ['', '', '', '', '', 'JANITORIAL', '', ''],
            /*  6 */ ['', '', '', '', '', 'Janitorial Services', '', ''],
            /*  7 */ [
                '',
                '',
                '',
                'Janitorial Services',
                '1',
                'Broom',
                'pc',
                50,
            ],
            /*  8 */ ['', '', '', '', '', 'JANITORIAL - TOTAL', '', ''],
            /*  9 */ ['', '', '', '', '', 'ADDITIONAL ITEMS', '', ''],
            /* 10 */ [
                '',
                '',
                '',
                'Food Supplies Expenses',
                '1',
                'Extra',
                'pc',
                100,
            ],
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
            /* 13 */ [
                '',
                '',
                '',
                'Welfare Goods Expenses',
                '1',
                'Fee',
                'lot',
                500,
            ],
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
        expect(result.valid).toBe(false);

        // ─────────────────────────────────────────────────────────────────
        // DESIRED BEHAVIOR
        //
        // Row 5 starts a new category ("JANITORIAL") while "OFFICE SUPPLIES"
        // (row 2) has not been closed with an "OFFICE SUPPLIES - TOTAL" row.
        // The verifier should report:
        //
        //   Category "JANITORIAL" at row 5 started before previous cat
        //   "OFFICE SUPPLIES" (row 2) closed with " - TOTAL"
        //
        // ─────────────────────────────────────────────────────────────────
        // CURRENT BEHAVIOR
        //
        // The with-label state machine classifies any bare F-only row inside
        // an open category as a COA label. So row 5 becomes a COA label named
        // "JANITORIAL", and row 6 becomes another COA label, and the mismatch
        // surfaces downstream as "Total mismatch" or "Item COA mismatch".
        // The sheet is still rejected — just with a different error.
        //
        // The classifier cannot distinguish "COA label" from "new category"
        // because both are structurally identical (bare F-only rows). Once
        // the verifier has access to the DB's list of known category names,
        // it can disambiguate: if a bare row's F value matches a known
        // category name, treat it as a category start; otherwise treat it
        // as a COA label.
        //
        // This test documents the DESIRED behavior. It will pass once the
        // verifier is extended with that DB-backed disambiguation.
        // ─────────────────────────────────────────────────────────────────
        expect(
            result.errors.some((e) =>
                /started before previous/i.test(e.message),
            ),
        ).toBe(true);
    });
});
