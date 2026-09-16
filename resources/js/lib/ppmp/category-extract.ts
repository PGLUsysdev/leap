// resources/js/lib/ppmp/category-extract.ts
//
// Category Import domain extraction — procurement only.
// Shared preview (extractPpmpSheet + raw grid) stays on the Extract tab;
// this helper computes what will actually be imported (Review input).

import type ExcelJS from 'exceljs';
import { cellText } from '@/lib/excel/cell-helpers';
import { isTotalRow, normalize } from '@/lib/ppmp/normalize';
import type { SharedSheetConfig } from '@/lib/ppmp/sheet-config';

export type CategoryCandidateLocation = {
    sheet: string;
    row: number;
    col: string;
    address: string;
};

export type CatLocation = CategoryCandidateLocation;

export type CategoryFilteredRow = {
    row: number;
    raw: string;
    normalized: string;
    sheet: string;
    address: string;
};

export type CategoryUniqueRow = {
    raw: string;
    normalized: string;
    rows: number[];
    count: number;
    sheets: string[];
    sheetCount: number;
    locations: CategoryCandidateLocation[];
};

export type CategoryDuplicateRow = {
    normalized: string;
    keptRow: number;
    keptSheet: string;
    keptAddress: string;
    duplicateRow: number;
    duplicateSheet: string;
    duplicateAddress: string;
    duplicateRaw: string;
};

export type CategoryExcludedTotal = {
    row: number;
    raw: string;
    normalized: string;
    sheet: string;
};

export type CategoryExcludedCoa = {
    row: number;
    raw: string;
    normalized: string;
    nextRowCoaRaw: string;
    nextRowCoaNormalized: string;
    sheet: string;
};

export type CategorySkippedCoa = {
    row: number;
    coaRaw: string;
    coaNormalized: string;
    raw: string;
    normalized: string;
    sheet: string;
};

export type CategoryExtractResult = {
    filtered: CategoryFilteredRow[];
    unique: CategoryUniqueRow[];
    duplicates: CategoryDuplicateRow[];
    excludedTotal: CategoryExcludedTotal[];
    excludedCoa: CategoryExcludedCoa[];
    skippedCoaNotEmpty: CategorySkippedCoa[];
};

export type CategoryExtractionStats = {
    raw: number;
    unique: number;
    duplicates: number;
};

const SECTION_WORDS = new Set([
    'non-procurement requirements',
    'additional items',
    'procurement requirements',
]);

export function extractCategoryCandidates(
    ws: ExcelJS.Worksheet,
    cfg: SharedSheetConfig,
    sheet: string,
): CategoryExtractResult {
    const dataColumn = cfg.columnConfig.category;
    const coaColumn = cfg.columnConfig.coa;
    const itemColumn = cfg.columnConfig.itemNumber;
    const { headerRow, additionalItemsHeaderRow, nonProcurementHeaderRow } =
        cfg.rowConfig;
    const { coaLabelMode } = cfg;

    const filtered: CategoryFilteredRow[] = [];
    const excludedTotal: CategoryExcludedTotal[] = [];
    const excludedCoa: CategoryExcludedCoa[] = [];
    const skippedCoaNotEmpty: CategorySkippedCoa[] = [];

    // Procurement only: headerRow+1 .. additionalItemsHeaderRow-1.
    // Guards mirror the previous page implementation.
    if (
        headerRow === '' ||
        headerRow == null ||
        additionalItemsHeaderRow === '' ||
        additionalItemsHeaderRow == null ||
        nonProcurementHeaderRow === '' ||
        nonProcurementHeaderRow == null
    ) {
        return {
            filtered,
            unique: [],
            duplicates: [],
            excludedTotal,
            excludedCoa,
            skippedCoaNotEmpty,
        };
    }

    const startRow = headerRow + 1;
    const lastRow = ws.actualRowCount;

    for (let r = startRow; r <= lastRow; r++) {
        const row = ws.getRow(r);
        const coaRaw = cellText(row.getCell(coaColumn));
        const dataRaw = cellText(row.getCell(dataColumn));
        const itemRaw = cellText(row.getCell(itemColumn));

        if (!dataRaw) continue;

        const coaNorm = coaRaw ? normalize(coaRaw) : null;
        const dataNorm = normalize(dataRaw);

        if (dataNorm === 'description') continue;
        if (r === additionalItemsHeaderRow) continue;
        if (r === nonProcurementHeaderRow) continue;
        if (SECTION_WORDS.has(dataNorm)) continue;
        if (r > additionalItemsHeaderRow) continue;
        if (r > nonProcurementHeaderRow) continue;

        if (coaNorm) {
            skippedCoaNotEmpty.push({
                row: r,
                coaRaw: coaRaw!,
                coaNormalized: coaNorm,
                raw: dataRaw,
                normalized: dataNorm,
                sheet,
            });
            continue;
        }

        if (itemRaw && !coaNorm) continue;

        if (isTotalRow(dataNorm)) {
            excludedTotal.push({ row: r, raw: dataRaw, normalized: dataNorm, sheet });
            continue;
        }

        if (coaLabelMode === 'with-label' && r + 1 <= lastRow) {
            const nextCoaRaw = cellText(ws.getRow(r + 1).getCell(coaColumn));
            const nextCoaNorm = nextCoaRaw ? normalize(nextCoaRaw) : null;

            if (nextCoaNorm && nextCoaNorm === dataNorm) {
                excludedCoa.push({
                    row: r,
                    raw: dataRaw,
                    normalized: dataNorm,
                    nextRowCoaRaw: nextCoaRaw!,
                    nextRowCoaNormalized: nextCoaNorm,
                    sheet,
                });
                continue;
            }
        }

        filtered.push({
            row: r,
            raw: dataRaw,
            normalized: dataNorm,
            sheet,
            address: `${sheet}!${dataColumn}${r}`,
        });
    }

    type SeenVal = {
        raw: string;
        normalized: string;
        rows: number[];
        sheets: string[];
        locations: CategoryCandidateLocation[];
    };
    const seen = new Map<string, SeenVal>();
    const duplicates: CategoryDuplicateRow[] = [];

    for (const c of filtered) {
        const existing = seen.get(c.normalized);
        const loc: CategoryCandidateLocation = {
            sheet: c.sheet,
            row: c.row,
            col: dataColumn,
            address: c.address,
        };

        if (!existing) {
            seen.set(c.normalized, {
                raw: c.raw,
                normalized: c.normalized,
                rows: [c.row],
                sheets: [c.sheet],
                locations: [loc],
            });
        } else {
            existing.rows.push(c.row);
            if (!existing.sheets.includes(c.sheet)) existing.sheets.push(c.sheet);
            existing.locations.push(loc);
            const kept = existing.locations[0];
            duplicates.push({
                normalized: c.normalized,
                keptRow: kept.row,
                keptSheet: kept.sheet,
                keptAddress: kept.address,
                duplicateRow: c.row,
                duplicateSheet: c.sheet,
                duplicateAddress: c.address,
                duplicateRaw: c.raw,
            });
        }
    }

    const unique: CategoryUniqueRow[] = [...seen.values()].map((v) => ({
        raw: v.raw,
        normalized: v.normalized,
        rows: v.rows,
        count: v.locations.length,
        sheets: v.sheets,
        sheetCount: v.sheets.length,
        locations: v.locations,
    }));
    unique.sort((a, b) => a.raw.localeCompare(b.raw));

    return {
        filtered,
        unique,
        duplicates,
        excludedTotal,
        excludedCoa,
        skippedCoaNotEmpty,
    };
}

export function getCategoryExtractionStats(
    result: CategoryExtractResult | null,
): CategoryExtractionStats | null {
    if (!result) return null;

    return {
        raw: result.filtered.length,
        unique: result.unique.length,
        duplicates: result.duplicates.length,
    };
}
