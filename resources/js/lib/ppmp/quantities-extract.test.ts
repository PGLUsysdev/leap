import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import {
    extractQuantitiesSheet,
    verifyQuantitiesSheet,
} from '@/lib/ppmp/quantities-extract';
import { getDefaultQuantitiesConfig } from '@/lib/ppmp/sheet-config';

async function buildWorkbook(): Promise<ExcelJS.Workbook> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('PPMP');
    // Header row 7 (defaults: D=COA, E=item no, F=category/desc, G=unit, H=price, K=Jan…)
    ws.getCell('D7').value = 'COA';
    ws.getCell('F7').value = 'Description';
    // Item row 8 (K=Jan qty, L=Jan amount ignored, M=Feb qty, N=Feb amount ignored)
    ws.getCell('D8').value = '5-02-03-010 Office Supplies';
    ws.getCell('E8').value = 1;
    ws.getCell('F8').value = 'Bond paper A4';
    ws.getCell('G8').value = 'ream';
    ws.getCell('H8').value = 250;
    ws.getCell('K8').value = 10;
    ws.getCell('L8').value = 1000;
    ws.getCell('M8').value = 5;
    ws.getCell('N8').value = 500;
    // Duplicate of row 8 (grouping check; O=Mar qty)
    ws.getCell('D9').value = '5-02-03-010 Office Supplies';
    ws.getCell('E9').value = 1;
    ws.getCell('F9').value = 'Bond paper A4';
    ws.getCell('G9').value = 'ream';
    ws.getCell('H9').value = 250;
    ws.getCell('K9').value = 2;
    ws.getCell('L9').value = 200;
    ws.getCell('O9').value = 3;
    // Label row (D empty) — skipped
    ws.getCell('F10').value = 'Office Supplies Category';
    // Total row — skipped
    ws.getCell('F11').value = 'Office Supplies - Total';

    // Round-trip through the xlsx loader so actualRowCount etc. behave
    // exactly like the production file-upload path.
    const buf = await wb.xlsx.writeBuffer();
    const loaded = new ExcelJS.Workbook();
    await loaded.xlsx.load(buf);

    return loaded;
}

describe('extractQuantitiesSheet', () => {
    it('should_ExtractRowsAndSumMonthlyQtys_When_SheetHasItems', async () => {
        const result = extractQuantitiesSheet(
            await buildWorkbook(),
            'PPMP',
            getDefaultQuantitiesConfig(),
        );

        expect(result.valid).toBe(true);
        expect(result.rawItems).toHaveLength(2);
        expect(result.uniqueItems).toHaveLength(1);
        const [item] = result.uniqueItems;
        // Jan 10+2, Feb 5, Mar 3
        expect(item.qtys[0]).toBe(12);
        expect(item.qtys[1]).toBe(5);
        expect(item.qtys[2]).toBe(3);
        expect(item.monthTotal).toBe(20);
        expect(item.price).toBe(250);
    });

    it('should_Fail_When_HeaderRowMissing', async () => {
        const cfg = getDefaultQuantitiesConfig();
        cfg.rowConfig.headerRow = '';
        const result = extractQuantitiesSheet(
            await buildWorkbook(),
            'PPMP',
            cfg,
        );

        expect(result.valid).toBe(false);
        expect(result.rawItems).toHaveLength(0);
    });

    it('should_Fail_When_SheetMissing', async () => {
        const result = extractQuantitiesSheet(
            await buildWorkbook(),
            'Nope',
            getDefaultQuantitiesConfig(),
        );

        expect(result.valid).toBe(false);
    });
});

async function loadWorkbook(wb: ExcelJS.Workbook): Promise<ExcelJS.Workbook> {
    const buf = await wb.xlsx.writeBuffer();
    const loaded = new ExcelJS.Workbook();
    await loaded.xlsx.load(buf);

    return loaded;
}

function problemWorkbook(): ExcelJS.Workbook {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('PPMP');
    ws.getCell('F7').value = 'Description';
    // Row 8: bad qty text in Jan
    ws.getCell('D8').value = '5-02-03-010';
    ws.getCell('F8').value = 'Item bad qty';
    ws.getCell('G8').value = 'pc';
    ws.getCell('K8').value = 'ten';
    // Row 9: missing unit
    ws.getCell('D9').value = '5-02-03-010';
    ws.getCell('F9').value = 'Item no unit';
    ws.getCell('K9').value = 4;
    // Row 10: all-zero quantities — allowed, no issue
    ws.getCell('D10').value = '5-02-03-010';
    ws.getCell('F10').value = 'Item no qty';
    ws.getCell('G10').value = 'pc';
    ws.getCell('K10').value = 0;

    return wb;
}

describe('verifyQuantitiesSheet', () => {
    it('should_Pass_When_SheetHasValidItems', async () => {
        const result = verifyQuantitiesSheet(
            await buildWorkbook(),
            'PPMP',
            getDefaultQuantitiesConfig(),
        );

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should_FlagBadQtyAndMissingUnit_When_RowsHaveProblems', async () => {
        const result = verifyQuantitiesSheet(
            await loadWorkbook(problemWorkbook()),
            'PPMP',
            getDefaultQuantitiesConfig(),
        );

        expect(result.valid).toBe(false);
        const messages = result.errors.map((e) => e.message);
        expect(messages).toContain('Qty jan "ten" is not a number');
        expect(messages).toContain('Unit is empty');
        // Row 10 (all-zero quantities) is allowed — no issue raised.
        expect(result.errors.filter((e) => e.row === 10)).toHaveLength(0);
        expect(result.errors).toHaveLength(2);
    });

    it('should_Fail_When_HeaderRowMissing', async () => {
        const cfg = getDefaultQuantitiesConfig();
        cfg.rowConfig.headerRow = '';
        const result = verifyQuantitiesSheet(
            await buildWorkbook(),
            'PPMP',
            cfg,
        );

        expect(result.valid).toBe(false);
    });
});
