// resources/js/lib/raw-extract.ts
//
// Raw 1:1 extraction — row by row, col by col, no formatting.
// Used by Extract step for all importers (PPMP and AIP families).
// Respects calibration: only cols defined in columnConfig and rows from headerRow.

import ExcelJS from 'exceljs';
import { cellText } from '@/lib/excel/cell-helpers';
import { columnToNumber, numberToColumn } from '@/lib/ppmp/normalize';

export type RawCell = string | null;
export type RawRow = {
    rowNumber: number;
    cells: Record<string, RawCell>; // key: column letter "A", "B", ...
    cellArray: RawCell[]; // index 0 = col 1
};

export type RawSheet = {
    sheetName: string;
    rowCount: number;
    columnCount: number;
    columnLetters: string[];
    rows: RawRow[];
    headerRowNumber?: number;
};

export function extractRawSheet(
    workbook: ExcelJS.Workbook | null,
    sheetName: unknown,
    cfg?: unknown,
): RawSheet | null {
    if (!workbook) return null;

    const rawName = Array.isArray(sheetName) ? String((sheetName as unknown[])[0] ?? sheetName) : typeof sheetName === 'string' ? sheetName : String(sheetName ?? '');
    const trimmed = rawName.trim();
    const numId = Number(trimmed);
    const ws =
        workbook.getWorksheet(rawName) ??
        workbook.getWorksheet(trimmed) ??
        (Number.isFinite(numId) ? workbook.getWorksheet(numId) : undefined) ??
        workbook.worksheets.find((w) => w.name.trim() === trimmed) ??
        workbook.worksheets.find((w) => w.name.trim().toLowerCase() === trimmed.toLowerCase());

    if (!ws) return null;

    const rowCount = ws.rowCount || ws.actualRowCount || 0;

    // Respect calibration if provided: cols = defined letters, rows = headerRow..lastRow
    let columnLetters: string[] = [];
    let startRow = 1;
    let headerRowNumber: number | undefined;

    if (cfg && typeof cfg === 'object' && 'columnConfig' in (cfg as Record<string, unknown>)) {
        const c = cfg as { columnConfig: Record<string, string>; rowConfig?: { headerRow?: number | '' } };
        const cols = new Set<string>();
        for (const v of Object.values(c.columnConfig)) {
            if (typeof v === 'string' && v.trim()) cols.add(v.trim().toUpperCase());
            // qtyStart is a single col, but quantities has 12 cols — expand if present
            if (typeof v === 'string' && /^[A-Z]+$/.test(v.trim().toUpperCase()) && 'qtyStart' in c.columnConfig) {
                // qtyStart handled separately below
            }
        }
        // Handle quantities qtyStart -> 12 qty cols every other column
        const qtyStart = (c.columnConfig as Record<string, string>).qtyStart;
        if (qtyStart && typeof qtyStart === 'string' && qtyStart.trim()) {
            const startNum = columnToNumber(qtyStart.trim().toUpperCase());
            if (startNum > 0) {
                for (let i = 0; i < 12; i++) cols.add(numberToColumn(startNum + i * 2));
            }
        }
        // Sort by column number for stable order
        columnLetters = [...cols].sort((a, b) => columnToNumber(a) - columnToNumber(b));
        if (columnLetters.length === 0) {
            const fallbackCount = (ws as unknown as { columnCount: number }).columnCount || (ws as unknown as { actualColumnCount: number }).actualColumnCount || 15;
            columnLetters = Array.from({ length: fallbackCount }, (_, i) => numberToColumn(i + 1));
        }
        const hr = c.rowConfig?.headerRow;
        if (typeof hr === 'number' && hr > 0) {
            startRow = hr;
            headerRowNumber = hr;
        }
    } else {
        const columnCount = (ws as unknown as { columnCount: number }).columnCount || (ws as unknown as { actualColumnCount: number }).actualColumnCount || 15;
        columnLetters = Array.from({ length: columnCount }, (_, i) => numberToColumn(i + 1));
    }

    const columnCount = columnLetters.length;
    const rows: RawRow[] = [];
    for (let r = startRow; r <= rowCount; r++) {
        const row = ws.getRow(r);
        const cellArray: RawCell[] = [];
        const cells: Record<string, RawCell> = {};
        for (const letter of columnLetters) {
            const v = cellText(row.getCell(letter));
            cellArray.push(v);
            cells[letter] = v;
        }
        rows.push({ rowNumber: r, cells, cellArray });
    }

    return {
        sheetName: ws.name,
        rowCount: rows.length,
        columnCount,
        columnLetters,
        rows,
        headerRowNumber,
    };
}

export function extractRawSheets(
    workbook: ExcelJS.Workbook | null,
    sheetNames: unknown[],
    getCfg?: (sheet: string) => unknown,
): Record<string, RawSheet> {
    const flat = (sheetNames as unknown[]).flat(Infinity).map((s) => String(s).trim()).filter(Boolean) as string[];
    const out: Record<string, RawSheet> = {};
    for (const name of flat) {
        const cfg = getCfg ? getCfg(name) : undefined;
        const raw = extractRawSheet(workbook, name, cfg);
        if (raw) out[name] = raw;
    }
    return out;
}
