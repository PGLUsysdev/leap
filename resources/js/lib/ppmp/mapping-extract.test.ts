// resources/js/lib/ppmp/mapping-extract.test.ts
//
// Run once:    pnpm vitest run resources/js/lib/ppmp/mapping-extract.test.ts

import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { extractMappingPairs } from '@/lib/ppmp/mapping-extract';
import { getDefaultMappingConfig } from '@/lib/ppmp/sheet-config';

function buildSheet(rows: (string | number)[][]) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Sheet1');
    for (const r of rows) ws.addRow(r);
    return ws;
}

function cfg(
    overrides: {
        headerRow: number | '';
        additionalItemsHeaderRow: number | '';
        nonProcurementHeaderRow: number | '';
    },
    coaLabelMode: 'with-label' | 'without-label' = 'with-label',
) {
    const c = getDefaultMappingConfig();
    c.rowConfig.headerRow = overrides.headerRow;
    c.rowConfig.additionalItemsHeaderRow = overrides.additionalItemsHeaderRow;
    c.rowConfig.nonProcurementHeaderRow = overrides.nonProcurementHeaderRow;
    c.coaLabelMode = coaLabelMode;
    return c;
}

const CATS = [
    { id: 1, name: 'OFFICE SUPPLIES', is_non_procurement: false, is_additional: false },
    { id: 276, name: 'Additional Items (Uncategorized)', is_non_procurement: false, is_additional: true },
    { id: 277, name: 'Non-Procurement (Uncategorized)', is_non_procurement: true, is_additional: false },
];

const COAS = [
    { id: 10, account_number: '5-02-03-010', path: '5-02-03-010', account_title: 'Office Supplies Expenses' },
    { id: 11, account_number: '5-02-03-020', path: '5-02-03-020', account_title: 'Accountable Forms Expenses' },
    { id: 12, account_number: '5-02-99-010', path: '5-02-99-010', account_title: 'Welfare Goods Expenses' },
];

describe('extractMappingPairs', () => {
    it('with-label procurement + additional sentinel, no non-procurement', () => {
        const ws = buildSheet([
            /*  1 */ ['', '', '', 'COA', 'Item#', 'Category', 'Unit', 'Price'],
            /*  2 */ ['', '', '', '', '', 'OFFICE SUPPLIES', '', ''],
            /*  3 */ ['', '', '', '', '', 'Office Supplies Expenses', '', ''],
            /*  4 */ ['', '', '', 'Office Supplies Expenses', '1', 'Bond paper', 'ream', 250],
            /*  5 */ ['', '', '', 'Office Supplies Expenses', '2', 'Ballpen', 'pc', 15],
            /*  6 */ ['', '', '', '', '', 'OFFICE SUPPLIES - TOTAL', '', ''],
            /*  7 */ ['', '', '', '', '', 'ADDITIONAL ITEMS', '', ''],
            /*  8 */ ['', '', '', 'Accountable Forms Expenses', '1', 'Stapler', 'pc', 100],
            /*  9 */ ['', '', '', '', '', 'ADDITIONAL ITEMS - TOTAL', '', ''],
            /* 10 */ ['', '', '', '', '', 'PROCUREMENT - TOTAL', '', ''],
        ]);

        const res = extractMappingPairs(
            ws,
            cfg({ headerRow: 1, additionalItemsHeaderRow: 7, nonProcurementHeaderRow: '' }),
            'Sheet1',
            { existingCategories: CATS, existingCoas: COAS, existingMappings: [] },
        );

        expect(res.total).toBe(2);
        expect(res.catFound).toBe(2);
        expect(res.coaFound).toBe(2);
        expect(res.missingMapping).toBe(2);
        expect(res.mappingFound).toBe(0);
        const keys = res.verifiedPairs.map(
            (p) => `${p.category}|${p.coa}|${p.section}`,
        );
        expect(keys).toContain(
            'OFFICE SUPPLIES|Office Supplies Expenses|procurement',
        );
        expect(keys).toContain(
            'Additional Items (Uncategorized)|Accountable Forms Expenses|additional',
        );
    });

    it('without-label groups, non-proc sentinel, existing mapping detected', () => {
        const ws = buildSheet([
            /*  1 */ ['', '', '', 'COA', 'Item#', 'Category', 'Unit', 'Price'],
            /*  2 */ ['', '', '', '', '', 'OFFICE SUPPLIES', '', ''],
            /*  3 */ ['', '', '', 'Paper', '1', 'Bond paper', 'ream', 250],
            /*  4 */ ['', '', '', 'Ink', '2', 'Ballpen', 'pc', 15],
            /*  5 */ ['', '', '', '', '', 'OFFICE SUPPLIES - TOTAL', '', ''],
            /*  6 */ ['', '', '', '', '', 'ADDITIONAL ITEMS', '', ''],
            /*  7 */ ['', '', '', 'Accountable Forms Expenses', '1', 'Stapler', 'pc', 100],
            /*  8 */ ['', '', '', '', '', 'ADDITIONAL ITEMS - TOTAL', '', ''],
            /*  9 */ ['', '', '', '', '', 'NON-PROCUREMENT REQUIREMENTS', '', ''],
            /* 10 */ ['', '', '', 'Welfare Goods Expenses', '1', 'Fee', 'lot', 500],
            /* 11 */ ['', '', '', '', '', 'NON-PROCUREMENT - TOTAL', '', ''],
        ]);

        const res = extractMappingPairs(
            ws,
            cfg(
                { headerRow: 1, additionalItemsHeaderRow: 6, nonProcurementHeaderRow: 9 },
                'without-label',
            ),
            'Sheet1',
            {
                existingCategories: CATS,
                existingCoas: COAS,
                existingMappings: [
                    { ppmp_category_id: 1, chart_of_account_id: 10 },
                ],
            },
        );

        // (OFFICE SUPPLIES,Paper) missing coa · (OFFICE SUPPLIES,Ink) missing coa ·
        // (Additional sentinel, Forms) creatable · (Non-Proc sentinel, Welfare) creatable.
        // 'Paper'/'Ink' are not account_titles in COAS → coa missing.
        expect(res.total).toBe(4);
        expect(res.catFound).toBe(4);
        expect(res.coaFound).toBe(2);
        expect(res.missingCoa).toBe(2);
        expect(res.missingMapping).toBe(2);
        expect(res.mappingFound).toBe(0);
    });

    it('returns empty when header calibration missing', () => {
        const ws = buildSheet([
            /*  1 */ ['', '', '', 'COA', 'Item#', 'Category', 'Unit', 'Price'],
        ]);

        const res = extractMappingPairs(
            ws,
            cfg({ headerRow: '', additionalItemsHeaderRow: '', nonProcurementHeaderRow: '' }),
            'Sheet1',
            { existingCategories: CATS, existingCoas: COAS, existingMappings: [] },
        );

        expect(res.total).toBe(0);
        expect(res.verifiedPairs).toEqual([]);
    });
});
