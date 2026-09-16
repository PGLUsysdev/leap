// resources/js/lib/ppmp/category-extract.test.ts
//
// Run once:    pnpm vitest run resources/js/lib/ppmp/category-extract.test.ts

import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { extractCategoryCandidates } from '@/lib/ppmp/category-extract';
import { getDefaultSharedConfig } from '@/lib/ppmp/sheet-config';

function buildSheet(rows: (string | number)[][]) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Sheet1');
    for (const r of rows) ws.addRow(r);
    return ws;
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

const PROCUREMENT_ROWS: (string | number)[][] = [
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
];

describe('extractCategoryCandidates', () => {
    it('extracts procurement categories when non-procurement is blank', () => {
        const ws = buildSheet(PROCUREMENT_ROWS);
        const res = extractCategoryCandidates(
            ws,
            cfg({
                headerRow: 1,
                additionalItemsHeaderRow: 7,
                nonProcurementHeaderRow: '',
            }),
            'Sheet1',
        );

        expect(res.unique.map((u) => u.raw)).toEqual(['OFFICE SUPPLIES']);
        expect(res.unique[0].row).toBe(2);
        expect(res.unique[0].address).toBe('Sheet1!F2');
        expect(res.excludedTotal.length).toBe(1);
    });

    it('matches the calibrated three-section result for the same sheet', () => {
        const ws = buildSheet(PROCUREMENT_ROWS);
        const withoutNonProc = extractCategoryCandidates(
            ws,
            cfg({
                headerRow: 1,
                additionalItemsHeaderRow: 7,
                nonProcurementHeaderRow: '',
            }),
            'Sheet1',
        );
        const withNonProc = extractCategoryCandidates(
            ws,
            cfg({
                headerRow: 1,
                additionalItemsHeaderRow: 7,
                nonProcurementHeaderRow: 11,
            }),
            'Sheet1',
        );

        // Procurement-only: identical candidates either way.
        expect(withoutNonProc.unique).toEqual(withNonProc.unique);
    });
});
