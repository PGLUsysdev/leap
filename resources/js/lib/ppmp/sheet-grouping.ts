import ExcelJS from 'exceljs';
import { cellText } from '@/lib/excel/cell-helpers';
import { isTotalRow, normalize } from '@/lib/ppmp/normalize';

export type SheetGroupOptions = {
    sectionName: 'procurement' | 'additional' | 'non-procurement';
    coaLabelMode: 'with-label' | 'without-label';
    createSentinelIfMissing?: boolean;
    strictTotal?: boolean;
    missingCoaMode?: 'error' | 'implicitCreate';
    missingCategoryMode?: 'error' | 'sentinel' | 'skip';
};

export type CatGroup = {
    cat: string;
    catRow: number;
    coas: Array<{ coa: string; coaRow: number; items: number }>;
    totalRow?: number;
};

export function isCoaLabel(
    ws: ExcelJS.Worksheet,
    r: number,
    dataNorm: string | null,
    dataColumn: string,
    coaColumn: string,
): {
    isCoaLabel: boolean;
    nextCoaRaw: string | null;
    nextCoaNorm: string | null;
} {
    const lastRow = ws.actualRowCount;
    let nextCoaRaw: string | null = null;
    let nextCoaNorm: string | null = null;
    if (r + 1 <= lastRow) {
        nextCoaRaw = cellText(ws.getRow(r + 1).getCell(coaColumn));
        nextCoaNorm = nextCoaRaw ? normalize(nextCoaRaw) : null;
        if (nextCoaNorm && dataNorm && nextCoaNorm === dataNorm) {
            return { isCoaLabel: true, nextCoaRaw, nextCoaNorm };
        }
    }
    return { isCoaLabel: false, nextCoaRaw, nextCoaNorm };
}

export function groupSheet(
    ws: ExcelJS.Worksheet,
    cfg: {
        columnConfig: { category: string; coa: string };
        coaLabelMode: 'with-label' | 'without-label';
    },
    startRow: number,
    endRow: number,
    opts: SheetGroupOptions,
    onError: (row: number, message: string) => void,
): CatGroup[] {
    const {
        sectionName,
        coaLabelMode,
        createSentinelIfMissing = false,
        strictTotal = true,
        missingCoaMode = 'error',
        missingCategoryMode = 'error',
    } = opts;
    const dataColumn = cfg.columnConfig.category;
    const coaColumn = cfg.columnConfig.coa;
    const lastRow = ws.actualRowCount;
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
                if (
                    createSentinelIfMissing &&
                    (sectionName === 'additional' ||
                        sectionName === 'non-procurement')
                ) {
                    const sentinelName =
                        sectionName === 'additional'
                            ? 'Additional Items (Uncategorized)'
                            : 'Non-Procurement (Uncategorized)';
                    currentCat = { cat: sentinelName, catRow: r, coas: [] };
                } else {
                    if (missingCategoryMode === 'error')
                        onError(
                            r,
                            `Item at row ${r} ("${dataRaw}") found without active category in ${sectionName}`,
                        );
                    continue;
                }
            }
            if (coaLabelMode === 'without-label') {
                if (!currentCoa || coaNorm !== normalize(currentCoa.coa)) {
                    if (currentCoa) {
                        if (currentCoa.items === 0)
                            onError(
                                currentCoa.coaRow,
                                `COA "${currentCoa.coa}" at row ${currentCoa.coaRow} in cat "${currentCat.cat}" has no items before next COA (${sectionName})`,
                            );
                        currentCat.coas.push(currentCoa);
                    }
                    currentCoa = { coa: coaRaw!, coaRow: r, items: 1 };
                } else {
                    currentCoa.items += 1;
                }
                continue;
            } else {
                if (!currentCoa) {
                    if (missingCoaMode === 'implicitCreate') {
                        const existing = currentCat.coas.find(
                            (c) => normalize(c.coa) === coaNorm,
                        );
                        if (existing) {
                            if (currentCoa) currentCat.coas.push(currentCoa);
                            currentCoa = { coa: coaRaw!, coaRow: r, items: 1 };
                        } else {
                            if (currentCoa) currentCat.coas.push(currentCoa);
                            currentCoa = { coa: coaRaw!, coaRow: r, items: 1 };
                        }
                        continue;
                    } else {
                        onError(
                            r,
                            `Item at row ${r} ("${dataRaw}") found without active COA in cat "${currentCat.cat}" (${sectionName})`,
                        );
                        continue;
                    }
                }
                if (coaNorm !== normalize(currentCoa.coa)) {
                    if (strictTotal)
                        onError(
                            r,
                            `Item COA mismatch at row ${r}: D="${coaRaw}" != current COA "${currentCoa.coa}" in cat "${currentCat.cat}" (${sectionName})`,
                        );
                    currentCat.coas.push(currentCoa);
                    currentCoa = { coa: coaRaw!, coaRow: r, items: 1 };
                } else {
                    currentCoa.items += 1;
                }
                continue;
            }
        }

        if (!dataRaw || !dataNorm) continue;
        if (isTotalRow(dataNorm)) {
            const expected = currentCat
                ? normalize(`${currentCat.cat} - total`)
                : null;
            if (!currentCat) {
                onError(
                    r,
                    `Total "${dataRaw}" at row ${r} without active category (${sectionName})`,
                );
            } else if (strictTotal && expected && dataNorm !== expected) {
                onError(
                    r,
                    `Total mismatch at row ${r}: got "${dataRaw}" (norm "${dataNorm}") expected "${currentCat.cat} - TOTAL" (${sectionName})`,
                );
            }
            if (currentCat) {
                if (currentCoa) {
                    currentCat.coas.push(currentCoa);
                    currentCoa = null;
                }
                if (currentCat.coas.length === 0) {
                    onError(
                        r,
                        `Category "${currentCat.cat}" at row ${currentCat.catRow} has no COA groups before total (${sectionName})`,
                    );
                } else {
                    for (const c of currentCat.coas)
                        if (c.items === 0)
                            onError(
                                c.coaRow,
                                `COA "${c.coa}" at row ${c.coaRow} in cat "${currentCat.cat}" has no items (${sectionName})`,
                            );
                }
                flushCat(r);
            }
            continue;
        }

        if (coaLabelMode === 'with-label') {
            const {
                isCoaLabel: isLabel,
                nextCoaRaw,
                nextCoaNorm,
            } = isCoaLabel(ws, r, dataNorm, dataColumn, coaColumn);
            if (isLabel) {
                if (!currentCat) {
                    if (
                        createSentinelIfMissing &&
                        (sectionName === 'additional' ||
                            sectionName === 'non-procurement')
                    ) {
                        const sentinelName =
                            sectionName === 'additional'
                                ? 'Additional Items (Uncategorized)'
                                : 'Non-Procurement (Uncategorized)';
                        currentCat = { cat: sentinelName, catRow: r, coas: [] };
                    } else {
                        onError(
                            r,
                            `COA "${dataRaw}" at row ${r} found without active category (${sectionName})`,
                        );
                        continue;
                    }
                }
                if (currentCoa) {
                    if (currentCoa.items === 0)
                        onError(
                            currentCoa.coaRow,
                            `COA "${currentCoa.coa}" at row ${currentCoa.coaRow} in cat "${currentCat.cat}" has no items before next COA (${sectionName})`,
                        );
                    currentCat.coas.push(currentCoa);
                }
                currentCoa = { coa: dataRaw, coaRow: r, items: 0 };
                continue;
            }
        }

        if (currentCat) {
            onError(
                r,
                `Category "${dataRaw}" at row ${r} started before previous cat "${currentCat.cat}" (row ${currentCat.catRow}) closed with " - TOTAL" (${sectionName})`,
            );
            if (currentCoa) {
                if (currentCoa.items === 0)
                    onError(
                        currentCoa.coaRow,
                        `COA "${currentCoa.coa}" at row ${currentCoa.coaRow} in cat "${currentCat.cat}" has no items (${sectionName})`,
                    );
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
            if (currentCoa.items === 0)
                onError(
                    currentCoa.coaRow,
                    `COA "${currentCoa.coa}" at row ${currentCoa.coaRow} in cat "${currentCat.cat}" has no items at end (${sectionName})`,
                );
            currentCat.coas.push(currentCoa);
        }
        if (!currentCat.totalRow)
            onError(
                currentCat.catRow,
                `Category "${currentCat.cat}" at row ${currentCat.catRow} missing closing "${currentCat.cat} - TOTAL" (${sectionName}) (found ${currentCat.coas.length} COA(s))`,
            );
        else if (currentCat.coas.length === 0)
            onError(
                currentCat.catRow,
                `Category "${currentCat.cat}" has no COAs (${sectionName})`,
            );
        catGroups.push(currentCat);
    }

    return catGroups;
}
