// resources/js/lib/ppmp/verify.ts
//
// Single PPMP verify shared logic — strict for all PPMP importers.
// All PPMP importers (category-import, price-list-import, category-coa-mapping, price-list-quantities-import)
// now call `verifyPpmpSheet`. AIP Summary keeps its own `verifyAipSummarySheet` in
// `lib/aip-summary-import/verify.ts` — file-input families stay separate, but within
// PPMP there is one verifier. Strict: all 3 sections (procurement, additional,
// non-procurement) are validated; procurement is cat → coa → items → total via
// group-state machine, additional/non-proc are item-per-row with COA required.
// Every item row (COA + description present) must also have a unit and a
// positive price — enforced in all three sections.
// Quantities sheets (cfg.columnConfig.qtyStart) additionally validate 12 qty columns
// (every other column from qtyStart) are numeric.
// Returns warnings: [] for PPMP (reserved for future non-blocking issues) so the
// shared `ImportVerifyIssues` UI can render disabled Warnings (0) consistently.

import ExcelJS from 'exceljs';
import { cellText } from '@/lib/excel/cell-helpers';
import { isTotalRow, normalize } from '@/lib/ppmp/normalize';
import { columnToNumber, numberToColumn } from '@/lib/ppmp/normalize';
import type {
    QuantitiesSheetConfig,
    SharedSheetConfig,
} from '@/lib/ppmp/sheet-config';

export type PpmpVerifyIssue = {
    row: number;
    message: string;
};

export type PpmpVerifyResult = {
    valid: boolean;
    message: string;
    errors: PpmpVerifyIssue[];
    /** Non-blocking issues — PPMP currently empty, reserved for future. */
    warnings: PpmpVerifyIssue[];
    details: string[];
    groups: {
        procurement: number;
        additional: number;
        nonProcurement: number;
    };
};

type PpmpSheetCfg = SharedSheetConfig | QuantitiesSheetConfig;

function hasQtyStart(cfg: PpmpSheetCfg): cfg is QuantitiesSheetConfig {
    return (
        'qtyStart' in cfg.columnConfig &&
        typeof (cfg.columnConfig as unknown as { qtyStart?: string })
            .qtyStart === 'string' &&
        (cfg.columnConfig as QuantitiesSheetConfig['columnConfig']).qtyStart !==
            ''
    );
}

const QUANTITY_MONTHS = [
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

function parseQty(raw: string | null): number | null {
    if (!raw) return null;
    const num = Number(raw.replace(/,/g, ''));
    if (Number.isNaN(num) || num < 0) return null;
    return num;
}

/**
 * Parse a price cell into a number. Returns NaN for empty, non-numeric, or
 * non-positive values. Used by both the item-row validator and the duplicate
 * price check.
 */
function parsePrice(raw: string | null): number {
    if (!raw) return NaN;
    const num = Number(raw.replace(/,/g, ''));
    if (Number.isNaN(num)) return NaN;
    return num;
}

/**
 * Returns the Excel error code (e.g. '#REF!') if the cell holds an error,
 * else null. ExcelJS represents errors as `{ error: '#REF!' }` (a plain
 * error value) or `{ formula/sharedFormula, result: { error: '#REF!' } }`
 * (a broken formula). Neither is a valid COA value.
 */
function excelErrorOnCell(cell: ExcelJS.Cell): string | null {
    const v = cell.value;
    if (v && typeof v === 'object') {
        const direct = (v as { error?: unknown }).error;
        if (typeof direct === 'string') return direct;

        const res = (v as { result?: unknown }).result;
        if (res && typeof res === 'object') {
            const nested = (res as { error?: unknown }).error;
            if (typeof nested === 'string') return nested;
        }
    }
    return null;
}

/**
 * Detects rows that share the same (COA, description, unit) but disagree on
 * price. These are almost always the same item underspecified in the
 * description — e.g. "Outdoor Cat6 Cable" listed at 4,755 and 7,068
 * (different lengths, brands, or gauges). Deduping silently would discard
 * one price. Verify fails so the user makes each description unique (or
 * consolidates the rows) before importing.
 *
 * Runs across all sections. Rows without a COA (category headers, COA label
 * rows, section headers, totals) are naturally skipped by the `!coaRaw`
 * guard. Rows with no price or non-positive price are skipped — those are
 * reported by the per-row unit/price validator instead.
 */
function checkConflictingDuplicatePrices(
    ws: ExcelJS.Worksheet,
    ranges: Array<{ start: number; end: number }>,
    cols: {
        coa: string;
        description: string;
        unit: string;
        price: string;
    },
    lastRow: number,
): PpmpVerifyIssue[] {
    type Entry = {
        row: number;
        price: number;
        coa: string;
        description: string;
        unit: string;
    };
    const groups = new Map<string, Entry[]>();

    for (const { start, end } of ranges) {
        if (start < 0 || end < 0 || start > end) continue;

        for (let r = start; r <= end && r <= lastRow; r++) {
            const row = ws.getRow(r);
            // Default all four to '' so nothing downstream can be null.
            // `cellText` returns null for empty cells; `normalize(null)`
            // throws on `.trim()`.
            const coaRaw = cellText(row.getCell(cols.coa)) ?? '';
            const descRaw = cellText(row.getCell(cols.description)) ?? '';
            const unitRaw = cellText(row.getCell(cols.unit)) ?? '';
            const priceRaw = cellText(row.getCell(cols.price)) ?? '';

            // Only item rows have both COA and description populated.
            // Category headers, COA labels, section headers, and totals
            // miss one of the two and are skipped here.
            if (!coaRaw || !descRaw) continue;

            const descNorm = normalize(descRaw);
            if (descNorm === 'description' || isTotalRow(descNorm)) continue;

            const priceNum = parsePrice(priceRaw);
            if (!Number.isFinite(priceNum) || priceNum <= 0) continue;

            const key = `${normalize(coaRaw)}|${descNorm}|${normalize(unitRaw)}`;
            const list = groups.get(key) ?? [];
            list.push({
                row: r,
                price: priceNum,
                coa: coaRaw,
                description: descRaw,
                unit: unitRaw,
            });
            groups.set(key, list);
        }
    }

    const issues: PpmpVerifyIssue[] = [];

    for (const entries of groups.values()) {
        if (entries.length < 2) continue;

        const distinctPrices = new Set(entries.map((e) => e.price));
        if (distinctPrices.size < 2) continue;

        const rows = entries.map((e) => e.row).sort((a, b) => a - b);
        const prices = [...distinctPrices]
            .sort((a, b) => a - b)
            .map((p) => p.toLocaleString())
            .join(', ');
        const first = entries[0];

        issues.push({
            row: rows[0],
            message:
                `Rows ${rows.join(', ')} share description "${first.description}" ` +
                `(${first.unit || 'no unit'}, COA "${first.coa}") but have different prices: ${prices}. ` +
                `Make each description unique (e.g. add size, length, or brand) so they import as separate items.`,
        });
    }

    return issues;
}

/**
 * Validate a single item row's required fields. Called for every row where
 * both COA and description are present — i.e. an item row — in all three
 * sections. Pushes a `unit is required` issue if column G is blank and a
 * `price is required and must be >0` issue if column H is missing,
 * non-numeric, or non-positive.
 *
 * Exposed as a helper so the same rule applies uniformly and so it's easy
 * to add more required-field checks later.
 */
function validateItemRow(
    r: number,
    dataRaw: string,
    unitRaw: string | null,
    priceRaw: string | null,
    cols: { unit: string; price: string },
    sectionName: string,
    errors: PpmpVerifyIssue[],
): void {
    if (!unitRaw || !unitRaw.trim()) {
        errors.push({
            row: r,
            message: `${sectionName} item at row ${r} ("${dataRaw}") unit is required (${cols.unit}${r})`,
        });
    }

    const priceNum = parsePrice(priceRaw);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
        errors.push({
            row: r,
            message: `${sectionName} item at row ${r} ("${dataRaw}") price is required and must be >0 (${cols.price}${r})`,
        });
    }
}

export function verifyPpmpSheet(
    workbook: ExcelJS.Workbook | null,
    sheetName: unknown,
    cfg: PpmpSheetCfg,
): PpmpVerifyResult {
    const makeFail = (
        message: string,
        errors: PpmpVerifyIssue[] = [{ row: 0, message }],
    ): PpmpVerifyResult => ({
        valid: false,
        message,
        errors,
        warnings: [],
        details: [],
        groups: { procurement: 0, additional: 0, nonProcurement: 0 },
    });

    if (!workbook) {
        return makeFail('Workbook not loaded');
    }

    const rawName = Array.isArray(sheetName)
        ? String((sheetName as unknown[])[0] ?? sheetName)
        : typeof sheetName === 'string'
          ? sheetName
          : String(sheetName ?? '');
    // Robust lookup: exact name → trimmed name → id → case-insensitive
    const trimmedName = rawName.trim();
    const numId = Number(trimmedName);
    const ws =
        workbook.getWorksheet(rawName) ??
        workbook.getWorksheet(trimmedName) ??
        (Number.isFinite(numId) ? workbook.getWorksheet(numId) : undefined) ??
        workbook.worksheets.find((w) => w.name.trim() === trimmedName) ??
        workbook.worksheets.find(
            (w) => w.name.trim().toLowerCase() === trimmedName.toLowerCase(),
        );

    if (!ws) {
        const available = workbook.worksheets
            .map((w) => `"${w.name}"`)
            .join(', ');
        return makeFail(
            `Worksheet "${rawName}" not found — available: ${available || 'none'}`,
            [
                {
                    row: 0,
                    message: `Worksheet "${rawName}" not found — available: ${available || 'none'}. Please reselect sheet.`,
                },
            ],
        );
    }

    const { headerRow, additionalItemsHeaderRow, nonProcurementHeaderRow } =
        cfg.rowConfig;
    const { coaLabelMode } = cfg;
    const dataColumn = cfg.columnConfig.category;
    const coaColumn = cfg.columnConfig.coa;
    const unitColumn = cfg.columnConfig.unit;
    const priceColumn = cfg.columnConfig.price;
    const itemColumn = cfg.columnConfig.itemNumber;
    const lastRow = ws.actualRowCount;

    if (headerRow === '' || headerRow == null) {
        return makeFail('Header Row is required', [
            {
                row: 0,
                message: 'Header Row is required — check calibration',
            },
        ]);
    }

    if (additionalItemsHeaderRow === '' || additionalItemsHeaderRow == null) {
        return makeFail('Additional Items Header Row is required', [
            {
                row: 0,
                message:
                    'Additional Items Header Row is required — check calibration',
            },
        ]);
    }

    // Non-Procurement is optional — a sheet may end after Additional.
    // When blank, the section is skipped (groups.nonProcurement stays 0).

    // Quantities-specific: qtyStart required and qty columns derived
    let qtyCols: string[] | null = null;

    if (hasQtyStart(cfg)) {
        const qtyStartNum = columnToNumber(cfg.columnConfig.qtyStart);
        if (qtyStartNum <= 0) {
            return makeFail(
                'Qty Start column is required — check calibration',
                [
                    {
                        row: 0,
                        message:
                            'Qty Start column is required — check calibration',
                    },
                ],
            );
        }
        qtyCols = Array.from({ length: 12 }, (_, i) =>
            numberToColumn(qtyStartNum + i * 2),
        );
    }

    const procurementStart = headerRow + 1;
    const procurementEnd = additionalItemsHeaderRow
        ? additionalItemsHeaderRow - 1
        : nonProcurementHeaderRow
          ? nonProcurementHeaderRow - 1
          : lastRow;
    const additionalStart = additionalItemsHeaderRow
        ? additionalItemsHeaderRow + 1
        : -1;
    const additionalEnd = nonProcurementHeaderRow
        ? nonProcurementHeaderRow - 1
        : lastRow;
    const nonProcStart = nonProcurementHeaderRow
        ? nonProcurementHeaderRow + 1
        : -1;
    const nonProcEnd = lastRow;

    const errors: PpmpVerifyIssue[] = [];
    const details: string[] = [];
    details.push(
        `COA label mode: ${coaLabelMode === 'without-label' ? 'Without label (COA on item rows)' : 'With label (COA label rows)'}`,
    );
    details.push(
        `Ranges: procurement [${procurementStart}..${procurementEnd}] additional [${additionalStart}..${additionalEnd}] non-proc [${nonProcStart}..${nonProcEnd}]`,
    );
    if (qtyCols) {
        details.push(
            `Qty columns: ${qtyCols.join(', ')} (every other column — amount columns skipped)`,
        );
    }

    const countData = (s: number, e: number) => {
        if (s < 0 || e < 0 || s > e) return 0;
        let c = 0;
        for (let r = s; r <= e && r <= lastRow; r++) {
            if (cellText(ws.getRow(r).getCell(dataColumn))) c++;
        }
        return c;
    };

    const groups = {
        procurement: additionalItemsHeaderRow
            ? countData(procurementStart, procurementEnd)
            : countData(
                  procurementStart,
                  nonProcurementHeaderRow
                      ? nonProcurementHeaderRow - 1
                      : lastRow,
              ),
        additional: additionalItemsHeaderRow
            ? countData(additionalStart, additionalEnd)
            : 0,
        nonProcurement: nonProcurementHeaderRow
            ? countData(nonProcStart, nonProcEnd)
            : 0,
    };

    if (!additionalItemsHeaderRow) {
        details.push(
            'Additional Items header not calibrated — skipping additional group check',
        );
    }

    if (!nonProcurementHeaderRow) {
        details.push(
            'Non-Procurement header not calibrated — skipping non-procurement group check',
        );
    }

    if (procurementStart > procurementEnd) {
        errors.push({
            row: procurementStart,
            message: `Procurement range invalid [${procurementStart}..${procurementEnd}] — check header calibrations`,
        });
    } else if (groups.procurement === 0) {
        errors.push({
            row: procurementStart,
            message:
                'No data found in procurement group — check header calibration',
        });
    }

    if (additionalItemsHeaderRow && groups.additional === 0) {
        errors.push({
            row: additionalStart,
            message: 'No data found in additional items group',
        });
    }

    const verifySection = (
        sectionName: 'procurement' | 'additional' | 'non-procurement',
        startRow: number,
        endRow: number,
    ) => {
        if (startRow < 0 || endRow < 0 || startRow > endRow) return;

        if (sectionName === 'additional' || sectionName === 'non-procurement') {
            let itemCount = 0;

            for (let r = startRow; r <= endRow && r <= lastRow; r++) {
                const row = ws.getRow(r);
                const coaCell = row.getCell(coaColumn);
                const coaErr = excelErrorOnCell(coaCell);
                const coaRaw = cellText(coaCell);
                const dataRaw = cellText(row.getCell(dataColumn));
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

                const coaNorm = coaRaw ? normalize(coaRaw) : null;
                const isFalsy = (v: string | null) =>
                    !v ||
                    normalize(v) === '0' ||
                    normalize(v) === '-' ||
                    normalize(v) === '0.00';
                const priceNum = priceRaw
                    ? Number(priceRaw.replace(/,/g, ''))
                    : NaN;
                const isFalsyPrice =
                    !priceRaw ||
                    Number.isNaN(priceNum) ||
                    priceNum === 0 ||
                    isFalsy(priceRaw);
                const isFalsyUnit = isFalsy(unitRaw);
                const isFalsyCoa = !coaNorm;
                const isFalsyItem = !itemRaw;

                if (isFalsyItem && isFalsyCoa && isFalsyUnit && isFalsyPrice)
                    continue;

                // Broken COA formula (Excel error) — distinct from a truly
                // blank COA. Scope: additional only for now; non-procurement
                // falls through to the existing "missing COA" path.
                if (dataRaw && coaErr && sectionName === 'additional') {
                    errors.push({
                        row: r,
                        message: `${sectionName} item at row ${r} ("${dataRaw}") has a broken COA formula in ${coaColumn}${r} (${coaErr}) — fix the formula or replace with a COA name`,
                    });
                    continue;
                }

                if (coaNorm && dataRaw) {
                    // Item row (COA + description present). Validate the
                    // remaining required fields before counting it as good.
                    validateItemRow(
                        r,
                        dataRaw,
                        unitRaw,
                        priceRaw,
                        { unit: unitColumn, price: priceColumn },
                        sectionName,
                        errors,
                    );
                    itemCount++;
                    continue;
                }

                if (dataRaw && !coaNorm) {
                    errors.push({
                        row: r,
                        message: `${sectionName} item at row ${r} ("${dataRaw}") missing COA (${coaColumn}) in ${sectionName}`,
                    });
                }
            }

            details.push(`${sectionName} items: ${itemCount} rows checked`);
            return;
        }

        // procurement — cat → coa → items → total state machine (strict)
        type CatGroup = {
            cat: string;
            catRow: number;
            coas: Array<{ coa: string; coaRow: number; items: number }>;
            totalRow?: number;
        };
        const catGroups: CatGroup[] = [];
        let currentCat: CatGroup | null = null;
        let currentCoa: { coa: string; coaRow: number; items: number } | null =
            null;

        const flushCat = (totalRow?: number) => {
            if (currentCat) {
                if (currentCoa) {
                    currentCat.coas.push(currentCoa);
                    currentCoa = null;
                }
                if (totalRow) currentCat.totalRow = totalRow;
                catGroups.push(currentCat);
                currentCat = null;
            }
        };

        for (let r = startRow; r <= endRow && r <= lastRow; r++) {
            const row = ws.getRow(r);
            const coaRaw = cellText(row.getCell(coaColumn));
            const dataRaw = cellText(row.getCell(dataColumn));
            const unitRaw = cellText(row.getCell(unitColumn));
            const priceRaw = cellText(row.getCell(priceColumn));

            if (!dataRaw && !coaRaw) continue;

            const coaNorm = coaRaw ? normalize(coaRaw) : null;
            const dataNorm = dataRaw ? normalize(dataRaw) : null;

            if (dataNorm === 'description') continue;

            if (coaNorm && dataRaw) {
                // Item row. Validate unit + price regardless of whether the
                // surrounding category/COA state is valid — so a malformed
                // sheet reports all problems at once.
                validateItemRow(
                    r,
                    dataRaw,
                    unitRaw,
                    priceRaw,
                    { unit: unitColumn, price: priceColumn },
                    sectionName,
                    errors,
                );

                if (!currentCat) {
                    errors.push({
                        row: r,
                        message: `Item at row ${r} ("${dataRaw}") found without active category in ${sectionName}`,
                    });
                    continue;
                }

                if (coaLabelMode === 'without-label') {
                    if (!currentCoa || coaNorm !== normalize(currentCoa.coa)) {
                        if (currentCoa) {
                            if (currentCoa.items === 0) {
                                errors.push({
                                    row: currentCoa.coaRow,
                                    message: `COA "${currentCoa.coa}" at row ${currentCoa.coaRow} in cat "${currentCat.cat}" has no items before next COA (${sectionName})`,
                                });
                            }
                            currentCat.coas.push(currentCoa);
                        }
                        currentCoa = { coa: coaRaw!, coaRow: r, items: 1 };
                    } else {
                        currentCoa.items += 1;
                    }
                    continue;
                }

                // with-label: item rows must have active COA label
                if (!currentCoa) {
                    errors.push({
                        row: r,
                        message: `Item at row ${r} ("${dataRaw}") found without active COA in cat "${currentCat.cat}" (${sectionName})`,
                    });
                    continue;
                }

                if (coaNorm !== normalize(currentCoa.coa)) {
                    errors.push({
                        row: r,
                        message: `Item COA mismatch at row ${r}: D="${coaRaw}" != current COA "${currentCoa.coa}" in cat "${currentCat.cat}" (${sectionName})`,
                    });
                }
                currentCoa.items += 1;
                continue;
            }

            if (!dataRaw || !dataNorm) continue;

            if (isTotalRow(dataNorm)) {
                const expected = currentCat
                    ? normalize(`${currentCat.cat} - total`)
                    : null;

                if (!currentCat) {
                    errors.push({
                        row: r,
                        message: `Total "${dataRaw}" at row ${r} without active category (${sectionName})`,
                    });
                } else if (expected && dataNorm !== expected) {
                    errors.push({
                        row: r,
                        message: `Total mismatch at row ${r}: got "${dataRaw}" (norm "${dataNorm}") expected "${currentCat.cat} - TOTAL" (${sectionName})`,
                    });
                }

                if (currentCat) {
                    if (currentCoa) {
                        currentCat.coas.push(currentCoa);
                        currentCoa = null;
                    }
                    if (currentCat.coas.length === 0) {
                        errors.push({
                            row: r,
                            message: `Category "${currentCat.cat}" at row ${currentCat.catRow} has no COA groups before total (${sectionName})`,
                        });
                    } else {
                        for (const c of currentCat.coas) {
                            if (c.items === 0) {
                                errors.push({
                                    row: c.coaRow,
                                    message: `COA "${c.coa}" at row ${c.coaRow} in cat "${currentCat.cat}" has no items (${sectionName})`,
                                });
                            }
                        }
                    }
                    flushCat(r);
                }
                continue;
            }

            if (coaLabelMode === 'with-label' && currentCat) {
                // We're inside a category, and this row has only F populated.
                // In with-label mode that makes it a COA label.
                // (A bare F-only row OUTSIDE a category falls through to
                // the "new category" branch below.)
                if (currentCoa) {
                    if (currentCoa.items === 0) {
                        errors.push({
                            row: currentCoa.coaRow,
                            message: `COA "${currentCoa.coa}" at row ${currentCoa.coaRow} in cat "${currentCat.cat}" has no items before next COA (${sectionName})`,
                        });
                    }
                    currentCat.coas.push(currentCoa);
                }
                currentCoa = { coa: dataRaw, coaRow: r, items: 0 };
                continue;
            }

            if (currentCat) {
                errors.push({
                    row: r,
                    message: `Category "${dataRaw}" at row ${r} started before previous cat "${currentCat.cat}" (row ${currentCat.catRow}) closed with " - TOTAL" (${sectionName})`,
                });
                if (currentCoa) {
                    if (currentCoa.items === 0) {
                        errors.push({
                            row: currentCoa.coaRow,
                            message: `COA "${currentCoa.coa}" at row ${currentCoa.coaRow} in cat "${currentCat.cat}" has no items (${sectionName})`,
                        });
                    }
                    currentCat.coas.push(currentCoa);
                    currentCoa = null;
                }
                catGroups.push(currentCat);
            }
            currentCat = { cat: dataRaw, catRow: r, coas: [] };
            currentCoa = null;
        }

        if (currentCat) {
            if (currentCoa) {
                if (currentCoa.items === 0) {
                    errors.push({
                        row: currentCoa.coaRow,
                        message: `COA "${currentCoa.coa}" at row ${currentCoa.coaRow} in cat "${currentCat.cat}" has no items at end (${sectionName})`,
                    });
                }
                currentCat.coas.push(currentCoa);
            }
            if (!currentCat.totalRow) {
                errors.push({
                    row: currentCat.catRow,
                    message: `Category "${currentCat.cat}" at row ${currentCat.catRow} missing closing "${currentCat.cat} - TOTAL" (${sectionName}) (found ${currentCat.coas.length} COA(s))`,
                });
            } else if (currentCat.coas.length === 0) {
                errors.push({
                    row: currentCat.catRow,
                    message: `Category "${currentCat.cat}" has no COAs (${sectionName})`,
                });
            }
            catGroups.push(currentCat);
        }

        if (catGroups.length) {
            details.push(
                `${sectionName} groups: ${catGroups.length} cat(s) verified in rows [${startRow}..${endRow}]`,
            );
            for (const g of catGroups) {
                details.push(
                    `  Cat "${g.cat}" row ${g.catRow}: ${g.coas.length} COA(s)${g.totalRow ? ` → total at ${g.totalRow}` : ' MISSING total'}`,
                );
            }
        }

        // Quantities qty-numeric validation for procurement item rows when qtyCols present
        if (qtyCols) {
            for (let r = startRow; r <= endRow && r <= lastRow; r++) {
                const row = ws.getRow(r);
                const coaRaw = cellText(row.getCell(coaColumn));
                const dataRaw = cellText(row.getCell(dataColumn));
                if (!coaRaw || !dataRaw) continue;
                const qtyRaws = qtyCols.map((c) => cellText(row.getCell(c)));
                qtyRaws.forEach((q, i) => {
                    if (q && parseQty(q) === null) {
                        const dup = errors.some(
                            (e) =>
                                e.row === r &&
                                e.message.includes(`Qty ${QUANTITY_MONTHS[i]}`),
                        );
                        if (!dup) {
                            errors.push({
                                row: r,
                                message: `Qty ${QUANTITY_MONTHS[i]} "${q}" is not a number`,
                            });
                        }
                    }
                });
            }
        }
    };

    // Strict: all 3 sections
    verifySection('procurement', procurementStart, procurementEnd);
    if (additionalItemsHeaderRow) {
        verifySection('additional', additionalStart, additionalEnd);
    }
    if (nonProcurementHeaderRow) {
        verifySection('non-procurement', nonProcStart, nonProcEnd);
    }

    // ─── Conflicting duplicate prices ─────────────────────────────────
    // Rows sharing (COA, description, unit) with different prices are the
    // same item underspecified in the description. Dedup would silently
    // drop one price, so fail verify and let the user disambiguate in the
    // sheet. Runs across all sections.
    errors.push(
        ...checkConflictingDuplicatePrices(
            ws,
            [
                { start: procurementStart, end: procurementEnd },
                { start: additionalStart, end: additionalEnd },
                { start: nonProcStart, end: nonProcEnd },
            ],
            {
                coa: coaColumn,
                description: dataColumn,
                unit: unitColumn,
                price: priceColumn,
            },
            lastRow,
        ),
    );

    // Final valid strictly requires no errors (both procurement and additional/non-proc)
    const valid = errors.length === 0;
    const message = valid
        ? `✅ Format OK — ${groups.procurement} procurement, ${groups.additional} additional, ${groups.nonProcurement} non-proc cells checked`
        : `❌ Found ${errors.length} issue(s) in sheet format`;

    return {
        valid,
        message,
        errors,
        warnings: [],
        details,
        groups,
    };
}
