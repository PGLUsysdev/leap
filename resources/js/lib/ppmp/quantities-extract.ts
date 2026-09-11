import ExcelJS from 'exceljs';
import { cellText } from '@/lib/excel/cell-helpers';
import {
    columnToNumber,
    isTotalRow,
    normalize,
    numberToColumn,
} from '@/lib/ppmp/normalize';
import type { QuantitiesSheetConfig } from '@/lib/ppmp/sheet-config';

export const QUANTITY_MONTHS = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec',
] as const;

export type QuantitySection = 'procurement' | 'additional' | 'non-procurement';

export type RawQuantityItem = {
    sheet: string;
    row: number;
    section: QuantitySection;
    category: string;
    coa: string;
    description: string;
    unit: string;
    price: number | null;
    priceRaw: string | null;
    qtys: Array<number | null>;
    qtyRaws: Array<string | null>;
    monthTotal: number;
};

export type UniqueQuantityItem = {
    key: string;
    category: string;
    coa: string;
    description: string;
    unit: string;
    price: number | null;
    qtys: number[];
    monthTotal: number;
    sheets: string[];
    rows: number[];
    count: number;
};

export type QuantitiesExtractResult = {
    valid: boolean;
    message: string;
    errors: Array<{ row: number; message: string }>;
    details: string[];
    rawItems: RawQuantityItem[];
    uniqueItems: UniqueQuantityItem[];
};

export type QuantitiesVerifyResult = {
    valid: boolean;
    message: string;
    errors: Array<{ row: number; message: string }>;
    details: string[];
};

const SECTION_LABELS = new Set([
    'additional items for procurement',
    'additional items',
    'non-procurement requirements',
    'non - procurement requirements',
    'additional items for procurement - total',
    'non-procurement requirements - total',
    'non-procurement - total',
]);

function parseQty(raw: string | null): number | null {
    if (!raw) {
        return null;
    }

    const num = Number(raw.replace(/,/g, ''));

    if (Number.isNaN(num) || num < 0) {
        return null;
    }

    return num;
}

type SectionRanges = {
    procurement: [number, number];
    additional: [number, number];
    nonProcurement: [number, number];
};

type ResolvedSheet = {
    ws: ExcelJS.Worksheet;
    qtyCols: string[];
    ranges: SectionRanges;
    lastRow: number;
};

function resolveSheet(
    workbook: ExcelJS.Workbook | null,
    sheet: string,
    cfg: QuantitiesSheetConfig,
): { ok: true; resolved: ResolvedSheet } | { ok: false; message: string } {
    if (!workbook) {
        return { ok: false, message: 'Workbook not loaded' };
    }

    const ws = workbook.getWorksheet(sheet);

    if (!ws) {
        return { ok: false, message: `Worksheet "${sheet}" not found` };
    }

    const { headerRow, additionalItemsHeaderRow, nonProcurementHeaderRow } =
        cfg.rowConfig;

    if (headerRow === '' || headerRow == null) {
        return {
            ok: false,
            message: 'Header Row is required — check calibration',
        };
    }

    const qtyStartNum = columnToNumber(cfg.columnConfig.qtyStart);

    if (qtyStartNum <= 0) {
        return {
            ok: false,
            message: 'Qty Start column is required — check calibration',
        };
    }

    // Months alternate qty/amount pairs: K=Jan qty, L=Jan amount,
    // M=Feb qty … — quantities live on every other column.
    const qtyCols = Array.from({ length: 12 }, (_, i) =>
        numberToColumn(qtyStartNum + i * 2),
    );

    // rowCount = highest row index touched; actualRowCount is only a count of
    // non-empty rows, so it under-runs when the header sits below row 1.
    const lastRow = ws.rowCount;

    return {
        ok: true,
        resolved: {
            ws,
            qtyCols,
            lastRow,
            ranges: {
                procurement: [
                    headerRow + 1,
                    additionalItemsHeaderRow
                        ? additionalItemsHeaderRow - 1
                        : nonProcurementHeaderRow
                          ? nonProcurementHeaderRow - 1
                          : lastRow,
                ],
                additional: [
                    additionalItemsHeaderRow
                        ? additionalItemsHeaderRow + 1
                        : -1,
                    nonProcurementHeaderRow
                        ? nonProcurementHeaderRow - 1
                        : lastRow,
                ],
                nonProcurement: [
                    nonProcurementHeaderRow ? nonProcurementHeaderRow + 1 : -1,
                    lastRow,
                ],
            },
        },
    };
}

type CandidateRow = {
    row: number;
    section: QuantitySection;
    coaRaw: string | null;
    dataRaw: string;
    unitRaw: string | null;
    priceRaw: string | null;
    itemRaw: string | null;
    qtyRaws: Array<string | null>;
};

/**
 * Shared row reader — same file, same skip rules as the other PPMP-based
 * importers. Returns item-candidate rows; label/total/empty/header-echo
 * rows are counted as skipped, not errors.
 */
function readCandidateRows(
    resolved: ResolvedSheet,
    cfg: QuantitiesSheetConfig,
): { rows: CandidateRow[]; labelRows: number } {
    const { ws, qtyCols, ranges, lastRow } = resolved;
    const { category, coa, unit, price, itemNumber } = cfg.columnConfig;
    const rows: CandidateRow[] = [];
    let labelRows = 0;

    const readSection = (
        section: QuantitySection,
        [startRow, endRow]: [number, number],
    ) => {
        if (startRow < 0 || endRow < 0 || startRow > endRow) {
            return;
        }

        for (let r = startRow; r <= endRow && r <= lastRow; r++) {
            const row = ws.getRow(r);
            const coaRaw = cellText(row.getCell(coa));
            const dataRaw = cellText(row.getCell(category));
            const unitRaw = cellText(row.getCell(unit));
            const priceRaw = cellText(row.getCell(price));
            const itemRaw = cellText(row.getCell(itemNumber));
            const qtyRaws = qtyCols.map((c) => cellText(row.getCell(c)));

            if (
                !dataRaw &&
                !coaRaw &&
                !unitRaw &&
                !priceRaw &&
                !itemRaw &&
                qtyRaws.every((q) => !q)
            ) {
                continue;
            }

            const dataNorm = dataRaw ? normalize(dataRaw) : null;

            if (!dataNorm) {
                continue;
            }

            if (dataNorm === 'description') {
                continue;
            }

            if (SECTION_LABELS.has(dataNorm) || isTotalRow(dataNorm)) {
                continue;
            }

            // D empty → category/COA label row, not an item.
            if (!coaRaw) {
                labelRows++;
                continue;
            }

            rows.push({
                row: r,
                section,
                coaRaw,
                dataRaw: dataRaw ?? '',
                unitRaw,
                priceRaw,
                itemRaw,
                qtyRaws,
            });
        }
    };

    readSection('procurement', ranges.procurement);
    readSection('additional', ranges.additional);
    readSection('non-procurement', ranges.nonProcurement);

    return { rows, labelRows };
}

/**
 * Structural verification — mirrors the price-list importer's verify step
 * for the same PPMP sheet layout: ranges sane, every item row complete,
 * every quantity cell numeric, every item row carrying quantities.
 */
export function verifyQuantitiesSheet(
    workbook: ExcelJS.Workbook,
    sheet: string,
    cfg: QuantitiesSheetConfig,
): QuantitiesVerifyResult {
    const resolved = resolveSheet(workbook, sheet, cfg);

    if (!resolved.ok) {
        return {
            valid: false,
            message: resolved.message,
            errors: [{ row: 0, message: resolved.message }],
            details: [],
        };
    }

    const { qtyCols, ranges } = resolved.resolved;
    const errors: Array<{ row: number; message: string }> = [];
    const details: string[] = [];
    details.push(
        `Ranges: procurement [${ranges.procurement[0]}..${ranges.procurement[1]}] additional [${ranges.additional[0]}..${ranges.additional[1]}] non-proc [${ranges.nonProcurement[0]}..${ranges.nonProcurement[1]}]`,
    );
    details.push(
        `Qty columns: ${qtyCols.join(', ')} (every other column — amount columns skipped)`,
    );

    const [procurementStart, procurementEnd] = ranges.procurement;

    if (procurementStart > procurementEnd) {
        errors.push({
            row: procurementStart,
            message: `Procurement range invalid [${procurementStart}..${procurementEnd}]`,
        });
    }

    const { rows, labelRows } = readCandidateRows(resolved.resolved, cfg);

    const procurementRows = rows.filter(
        (r) => r.section === 'procurement',
    ).length;

    if (procurementRows === 0) {
        errors.push({
            row: procurementStart,
            message: 'No data found in procurement group',
        });
    }

    for (const candidate of rows) {
        if (!candidate.unitRaw) {
            errors.push({
                row: candidate.row,
                message: 'Unit is empty',
            });
        }

        candidate.qtyRaws.forEach((q, i) => {
            if (q && parseQty(q) === null) {
                errors.push({
                    row: candidate.row,
                    message: `Qty ${QUANTITY_MONTHS[i]} "${q}" is not a number`,
                });
            }
        });
    }

    details.push(
        `Checked ${rows.length} item rows, skipped ${labelRows} label rows`,
    );

    if (errors.length > 0) {
        return {
            valid: false,
            message: `${errors.length} problem(s) in ${rows.length} item rows`,
            errors,
            details,
        };
    }

    return {
        valid: true,
        message: `${rows.length} item rows valid`,
        errors,
        details,
    };
}

export function extractQuantitiesSheet(
    workbook: ExcelJS.Workbook,
    sheet: string,
    cfg: QuantitiesSheetConfig,
): QuantitiesExtractResult {
    const fail = (
        message: string,
        errors: Array<{ row: number; message: string }> = [],
    ): QuantitiesExtractResult => ({
        valid: false,
        message,
        errors,
        details: [],
        rawItems: [],
        uniqueItems: [],
    });

    const resolved = resolveSheet(workbook, sheet, cfg);

    if (!resolved.ok) {
        return fail(resolved.message, [{ row: 0, message: resolved.message }]);
    }

    const { qtyCols, ranges } = resolved.resolved;
    const details: string[] = [];
    details.push(
        `Ranges: procurement [${ranges.procurement[0]}..${ranges.procurement[1]}] additional [${ranges.additional[0]}..${ranges.additional[1]}] non-proc [${ranges.nonProcurement[0]}..${ranges.nonProcurement[1]}]`,
    );
    details.push(
        `Qty columns: ${qtyCols.join(', ')} (every other column — amount columns skipped)`,
    );

    const { rows, labelRows } = readCandidateRows(resolved.resolved, cfg);
    const rawItems: RawQuantityItem[] = [];
    let qtyParseIssues = 0;

    for (const candidate of rows) {
        const priceNum = candidate.priceRaw
            ? Number(candidate.priceRaw.replace(/,/g, ''))
            : NaN;
        const qtys = candidate.qtyRaws.map((q) => {
            const parsed = parseQty(q);

            if (q && parsed === null) {
                qtyParseIssues++;
            }

            return parsed;
        });
        const monthTotal = qtys.reduce<number>((sum, q) => sum + (q ?? 0), 0);

        rawItems.push({
            sheet,
            row: candidate.row,
            section: candidate.section,
            category: candidate.dataRaw,
            coa: candidate.coaRaw ?? '',
            description: candidate.dataRaw,
            unit: candidate.unitRaw ?? '',
            price: Number.isNaN(priceNum) ? null : priceNum,
            priceRaw: candidate.priceRaw,
            qtys,
            qtyRaws: candidate.qtyRaws,
            monthTotal,
        });
    }

    details.push(
        `Extracted ${rawItems.length} item rows, skipped ${labelRows} label rows, ${qtyParseIssues} unparseable qty cells`,
    );

    if (rawItems.length === 0) {
        return {
            valid: false,
            message: 'No item rows found — check calibration',
            errors: [
                {
                    row: ranges.procurement[0],
                    message: 'No item rows extracted',
                },
            ],
            details,
            rawItems,
            uniqueItems: [],
        };
    }

    const grouped = new Map<string, UniqueQuantityItem>();

    for (const item of rawItems) {
        const key = [
            normalize(item.category),
            normalize(item.coa),
            normalize(item.description),
            normalize(item.unit),
        ].join('|');
        const existing = grouped.get(key);

        if (existing) {
            existing.qtys = existing.qtys.map(
                (q, i) => q + (item.qtys[i] ?? 0),
            );
            existing.monthTotal = existing.qtys.reduce((sum, q) => sum + q, 0);
            existing.sheets.push(item.sheet);
            existing.rows.push(item.row);
            existing.count++;
        } else {
            grouped.set(key, {
                key,
                category: item.category,
                coa: item.coa,
                description: item.description,
                unit: item.unit,
                price: item.price,
                qtys: item.qtys.map((q) => q ?? 0),
                monthTotal: item.monthTotal,
                sheets: [item.sheet],
                rows: [item.row],
                count: 1,
            });
        }
    }

    const uniqueItems = [...grouped.values()];

    return {
        valid: true,
        message: `Extracted ${rawItems.length} rows → ${uniqueItems.length} unique items`,
        errors: [],
        details,
        rawItems,
        uniqueItems,
    };
}
