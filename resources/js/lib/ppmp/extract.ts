// resources/js/lib/ppmp/extract.ts
//
// Single PPMP raw extraction — shared across all PPMP importers.
// All PPMP importers (category-import, price-list-import, category-coa-mapping, price-list-quantities-import)
// now call `extractPpmpSheet`. Pure raw data extraction, no dedupe, no DB matching,
// shown as a table in the Extract step (after Verify, strict). Keeps it simple.

import ExcelJS from 'exceljs';
import { cellText } from '@/lib/excel/cell-helpers';
import { isTotalRow, normalize } from '@/lib/ppmp/normalize';
import { columnToNumber, numberToColumn } from '@/lib/ppmp/normalize';
import type {
    QuantitiesSheetConfig,
    SharedSheetConfig,
} from '@/lib/ppmp/sheet-config';

export type PpmpExtractIssue = { row: number; message: string };

export type RawPpmpItem = {
    sheet: string;
    row: number;
    section: 'procurement' | 'additional' | 'non-procurement';
    category: string;
    coa: string;
    description: string;
    unit: string;
    price: number | null;
    priceRaw: string | null;
    itemNumber: string | null;
    // Quantities family: 12 months if qtyStart present
    qtys?: Array<number | null>;
    qtyRaws?: Array<string | null>;
    monthTotal?: number;
};

export type PpmpExtractResult = {
    valid: boolean;
    message: string;
    errors: PpmpExtractIssue[];
    details: string[];
    rawItems: RawPpmpItem[];
};

type PpmpSheetCfg = SharedSheetConfig | QuantitiesSheetConfig;

function hasQtyStart(cfg: PpmpSheetCfg): cfg is QuantitiesSheetConfig {
    return (
        'qtyStart' in cfg.columnConfig &&
        typeof (cfg.columnConfig as unknown as { qtyStart?: string }).qtyStart === 'string' &&
        (cfg.columnConfig as QuantitiesSheetConfig['columnConfig']).qtyStart !== ''
    );
}

function parseQty(raw: string | null): number | null {
    if (!raw) return null;
    const num = Number(raw.replace(/,/g, ''));
    if (Number.isNaN(num) || num < 0) return null;
    return num;
}

export function extractPpmpSheet(
    workbook: ExcelJS.Workbook | null,
    sheetName: unknown,
    cfg: PpmpSheetCfg,
): PpmpExtractResult {
    const makeFail = (message: string, errors: PpmpExtractIssue[] = [{ row: 0, message }]): PpmpExtractResult => ({
        valid: false,
        message,
        errors,
        details: [],
        rawItems: [],
    });

    if (!workbook) return makeFail('Workbook not loaded');

    const rawName = Array.isArray(sheetName) ? String((sheetName as unknown[])[0] ?? sheetName) : typeof sheetName === 'string' ? sheetName : String(sheetName ?? '');
    const trimmedName = rawName.trim();
    const numId = Number(trimmedName);
    const ws =
        workbook.getWorksheet(rawName) ??
        workbook.getWorksheet(trimmedName) ??
        (Number.isFinite(numId) ? workbook.getWorksheet(numId) : undefined) ??
        workbook.worksheets.find((w) => w.name.trim() === trimmedName) ??
        workbook.worksheets.find((w) => w.name.trim().toLowerCase() === trimmedName.toLowerCase());

    if (!ws) {
        const available = workbook.worksheets.map((w) => `"${w.name}"`).join(', ');
        return makeFail(`Worksheet "${rawName}" not found — available: ${available || 'none'}`, [
            { row: 0, message: `Worksheet "${rawName}" not found — available: ${available || 'none'}` },
        ]);
    }

    const { headerRow, additionalItemsHeaderRow, nonProcurementHeaderRow } = cfg.rowConfig;
    const { coaLabelMode } = cfg;
    const dataColumn = cfg.columnConfig.category;
    const descColumn = cfg.columnConfig.description || dataColumn;
    const coaColumn = cfg.columnConfig.coa;
    const unitColumn = cfg.columnConfig.unit;
    const priceColumn = cfg.columnConfig.price;
    const itemColumn = cfg.columnConfig.itemNumber;
    const lastRow = ws.actualRowCount;

    if (headerRow === '' || headerRow == null) return makeFail('Header Row is required — check calibration');
    if (additionalItemsHeaderRow === '' || additionalItemsHeaderRow == null) return makeFail('Additional Items Header Row is required');
    if (nonProcurementHeaderRow === '' || nonProcurementHeaderRow == null) return makeFail('Non-Procurement Header Row is required');

    let qtyCols: string[] | null = null;
    if (hasQtyStart(cfg)) {
        const qtyStartNum = columnToNumber(cfg.columnConfig.qtyStart);
        if (qtyStartNum > 0) {
            qtyCols = Array.from({ length: 12 }, (_, i) => numberToColumn(qtyStartNum + i * 2));
        }
    }

    const procurementStart = headerRow + 1;
    const procurementEnd = additionalItemsHeaderRow ? additionalItemsHeaderRow - 1 : nonProcurementHeaderRow ? nonProcurementHeaderRow - 1 : lastRow;
    const additionalStart = additionalItemsHeaderRow ? additionalItemsHeaderRow + 1 : -1;
    const additionalEnd = nonProcurementHeaderRow ? nonProcurementHeaderRow - 1 : lastRow;
    const nonProcStart = nonProcurementHeaderRow ? nonProcurementHeaderRow + 1 : -1;
    const nonProcEnd = lastRow;

    const details: string[] = [];
    details.push(`Ranges: procurement [${procurementStart}..${procurementEnd}] additional [${additionalStart}..${additionalEnd}] non-proc [${nonProcStart}..${nonProcEnd}]`);
    if (qtyCols) details.push(`Qty columns: ${qtyCols.join(', ')}`);

    const rawItems: RawPpmpItem[] = [];
    let skippedLabels = 0;

    const extractSection = (section: RawPpmpItem['section'], startRow: number, endRow: number) => {
        if (startRow < 0 || endRow < 0 || startRow > endRow) return;
        for (let r = startRow; r <= endRow && r <= lastRow; r++) {
            const row = ws.getRow(r);
            const coaRaw = cellText(row.getCell(coaColumn));
            const dataRaw = cellText(row.getCell(dataColumn));
            const descRaw = cellText(row.getCell(descColumn));
            const unitRaw = cellText(row.getCell(unitColumn));
            const priceRaw = cellText(row.getCell(priceColumn));
            const itemRaw = cellText(row.getCell(itemColumn));

            if (!dataRaw && !coaRaw && !unitRaw && !priceRaw) continue;

            const dataNorm = dataRaw ? normalize(dataRaw) : null;
            if (!dataNorm) continue;
            if (dataNorm === 'description') continue;
            if (
                [
                    'additional items for procurement',
                    'additional items',
                    'non-procurement requirements',
                    'non - procurement requirements',
                    'additional items for procurement - total',
                    'non-procurement requirements - total',
                    'non-procurement - total',
                ].includes(dataNorm) ||
                isTotalRow(dataNorm)
            ) {
                continue;
            }

            // With-label: coa label rows have D empty but F holds COA name matching next D
            let isCoaLabel = false;
            if (coaLabelMode === 'with-label' && !coaRaw && dataRaw) {
                if (r + 1 <= lastRow) {
                    const nextCoaRaw = cellText(ws.getRow(r + 1).getCell(coaColumn));
                    const nextCoaNorm = nextCoaRaw ? normalize(nextCoaRaw) : null;
                    if (nextCoaNorm && dataNorm && nextCoaNorm === dataNorm) isCoaLabel = true;
                }
            }
            if (isCoaLabel) {
                skippedLabels++;
                continue;
            }

            // Raw item requires both COA and category/description to be considered an item
            // Keep it simple: raw extraction shows any row with COA + data
            if (!coaRaw || !dataRaw) {
                // Still count as skipped label if no coa?
                if (!coaRaw) skippedLabels++;
                continue;
            }

            const priceNum = priceRaw ? Number(priceRaw.replace(/,/g, '')) : NaN;
            const item: RawPpmpItem = {
                sheet: rawName,
                row: r,
                section,
                category: dataRaw,
                coa: coaRaw,
                description: descRaw ?? dataRaw,
                unit: unitRaw ?? '',
                price: Number.isNaN(priceNum) ? null : priceNum,
                priceRaw: priceRaw ?? null,
                itemNumber: itemRaw ?? null,
            };

            if (qtyCols) {
                const qtyRaws = qtyCols.map((c) => cellText(row.getCell(c)));
                const qtys = qtyRaws.map((q) => parseQty(q));
                const monthTotal = qtys.reduce<number>((sum, q) => sum + (q ?? 0), 0);
                item.qtyRaws = qtyRaws;
                item.qtys = qtys;
                item.monthTotal = monthTotal;
            }

            rawItems.push(item);
        }
    };

    extractSection('procurement', procurementStart, procurementEnd);
    if (additionalItemsHeaderRow) extractSection('additional', additionalStart, additionalEnd);
    if (nonProcurementHeaderRow) extractSection('non-procurement', nonProcStart, nonProcEnd);

    details.push(`Extracted ${rawItems.length} raw item rows, skipped ${skippedLabels} label/total rows`);

    return {
        valid: true,
        message: `Extracted ${rawItems.length} raw rows from ${rawName}`,
        errors: [],
        details,
        rawItems,
    };
}

export function extractPpmpSheets(
    workbook: ExcelJS.Workbook | null,
    sheetNames: unknown[],
    getCfg: (sheet: string) => PpmpSheetCfg,
): Record<string, PpmpExtractResult> {
    const flat = (sheetNames as unknown[]).flat(Infinity).map((s) => String(s).trim()).filter(Boolean) as string[];
    const out: Record<string, PpmpExtractResult> = {};
    for (const sheet of flat) {
        out[sheet] = extractPpmpSheet(workbook, sheet, getCfg(sheet));
    }
    return out;
}
