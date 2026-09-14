// resources/js/lib/ppmp/verify.ts
//
// Single PPMP verify shared logic — strict for all PPMP importers.
// All PPMP importers (category-import, price-list-import, category-coa-mapping, price-list-quantities-import)
// now call `verifyPpmpSheet`. AIP Summary keeps its own `verifyAipSummarySheet` in
// `lib/aip-summary-import/verify.ts` — file-input families stay separate, but within
// PPMP there is one verifier. Strict: all 3 sections (procurement, additional,
// non-procurement) are validated; procurement is cat → coa → items → total via
// group-state machine, additional/non-proc are item-per-row with COA required.
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

function hasQtyStart(
    cfg: PpmpSheetCfg,
): cfg is QuantitiesSheetConfig {
    return (
        'qtyStart' in cfg.columnConfig &&
        typeof (cfg.columnConfig as unknown as { qtyStart?: string }).qtyStart ===
            'string' &&
        (cfg.columnConfig as QuantitiesSheetConfig['columnConfig']).qtyStart !== ''
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

    console.log('[verifyPpmpSheet] sheetName:', sheetName, 'type:', typeof sheetName, 'isArray:', Array.isArray(sheetName));
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
        workbook.worksheets.find(
            (w) => w.name.trim() === trimmedName,
        ) ??
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

    if (
        additionalItemsHeaderRow === '' ||
        additionalItemsHeaderRow == null
    ) {
        return makeFail('Additional Items Header Row is required', [
            {
                row: 0,
                message:
                    'Additional Items Header Row is required — check calibration',
            },
        ]);
    }

    if (nonProcurementHeaderRow === '' || nonProcurementHeaderRow == null) {
        return makeFail('Non-Procurement Header Row is required', [
            {
                row: 0,
                message:
                    'Non-Procurement Header Row is required — check calibration',
            },
        ]);
    }

    // Quantities-specific: qtyStart required and qty columns derived
    let qtyCols: string[] | null = null;

    if (hasQtyStart(cfg)) {
        const qtyStartNum = columnToNumber(cfg.columnConfig.qtyStart);
        if (qtyStartNum <= 0) {
            return makeFail('Qty Start column is required — check calibration', [
                { row: 0, message: 'Qty Start column is required — check calibration' },
            ]);
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
                  nonProcurementHeaderRow ? nonProcurementHeaderRow - 1 : lastRow,
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
            message: 'No data found in procurement group — check header calibration',
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
                const coaRaw = cellText(row.getCell(coaColumn));
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

                if (isFalsyItem && isFalsyCoa && isFalsyUnit && isFalsyPrice) continue;

                if (coaNorm && dataRaw) {
                    itemCount++;
                    continue;
                }

                if (dataRaw && !coaNorm) {
                    errors.push({
                        row: r,
                        message: `${sectionName} item at row ${r} ("${dataRaw}") missing COA (D) in ${sectionName}`,
                    });
                }

                // Quantities qty-numeric check per row (only for quantities sheets)
                if (qtyCols && dataRaw && coaNorm) {
                    const qtyRaws = qtyCols.map((c) => cellText(row.getCell(c)));
                    qtyRaws.forEach((q, i) => {
                        if (q && parseQty(q) === null) {
                            errors.push({
                                row: r,
                                message: `Qty ${QUANTITY_MONTHS[i]} "${q}" is not a number`,
                            });
                        }
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

            if (!dataRaw && !coaRaw) continue;

            const coaNorm = coaRaw ? normalize(coaRaw) : null;
            const dataNorm = dataRaw ? normalize(dataRaw) : null;

            if (dataNorm === 'description') continue;

            if (coaNorm && dataRaw) {
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

            if (coaLabelMode === 'with-label') {
                let isCoaLabel = false;
                let nextCoaRaw: string | null = null;
                let nextCoaNorm: string | null = null;
                if (r + 1 <= lastRow) {
                    nextCoaRaw = cellText(ws.getRow(r + 1).getCell(coaColumn));
                    nextCoaNorm = nextCoaRaw ? normalize(nextCoaRaw) : null;
                    if (nextCoaNorm && dataNorm && nextCoaNorm === dataNorm) {
                        isCoaLabel = true;
                    }
                }
                if (isCoaLabel) {
                    if (!currentCat) {
                        // Allow top-level catch: will be validated by next cat start if missing?
                        // But keep strict: COA without active category is error unless we're at section start sentinel.
                        // Use same behavior as before: error if no active cat.
                        // However sheet-grouping allows sentinel for additional/non-proc — here we are in procurement only, so error.
                        errors.push({
                            row: r,
                            message: `COA "${dataRaw}" at row ${r} found without active category (${sectionName})`,
                        });
                        continue;
                    }
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

                if (nextCoaNorm && dataNorm) {
                    errors.push({
                        row: r,
                        message: `COA label "${dataRaw}" at row ${r} mismatched next D "${nextCoaRaw}" after normalize (expected same) — not treated as category`,
                    });
                    continue;
                }
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
            // Re-scan procurement item rows for qty numeric (unit already handled in generic path? not for quantities)
            // We already check qty numeric in the additional branch; for procurement we need to check here as well.
            // Scan procurement rows that were items (coa && data): re-validate qty cells
            for (let r = startRow; r <= endRow && r <= lastRow; r++) {
                const row = ws.getRow(r);
                const coaRaw = cellText(row.getCell(coaColumn));
                const dataRaw = cellText(row.getCell(dataColumn));
                if (!coaRaw || !dataRaw) continue;
                const qtyRaws = qtyCols.map((c) => cellText(row.getCell(c)));
                const hasAnyQty = qtyRaws.some((q) => !!q);
                // Only check numeric, not required - same as verifyQuantitiesSheet (qty optional per row)
                qtyRaws.forEach((q, i) => {
                    if (q && parseQty(q) === null) {
                        // Avoid duplicate if already pushed in additional path (not here)
                        // Check if already exists for this row+month to avoid double push
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
                void hasAnyQty;
            }

            // Also check that at least one procurement row exists (generic already does groups check)
            // and that every qty cell is numeric already handled. No extra required qty-per-row check for now
            // (quantities-extract's verify requires unit, we keep that as separate: unit check below)
            // Unit check for quantities: every item row has unit
            for (let r = startRow; r <= endRow && r <= lastRow; r++) {
                const row = ws.getRow(r);
                const coaRaw = cellText(row.getCell(coaColumn));
                const dataRaw = cellText(row.getCell(dataColumn));
                const unitRaw = cellText(row.getCell(unitColumn));
                if (!coaRaw || !dataRaw) continue;
                if (!unitRaw) {
                    const dup = errors.some(
                        (e) => e.row === r && e.message === 'Unit is empty',
                    );
                    if (!dup) {
                        errors.push({ row: r, message: 'Unit is empty' });
                    }
                }
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
