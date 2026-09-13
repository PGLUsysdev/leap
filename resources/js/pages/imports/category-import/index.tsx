import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { ImportPageShell } from '@/components/imports/import-page-shell';
import { useImportWorkbook } from '@/hooks/use-import-workbook';
import { cellText } from '@/lib/excel/cell-helpers';
import { isTotalRow, normalize } from '@/lib/ppmp/normalize';
import type { ExistingCategory } from '@/lib/ppmp/normalize';
import { getDefaultSharedConfig } from '@/lib/ppmp/sheet-config';
import type { SharedSheetConfig } from '@/lib/ppmp/sheet-config';
import { index as categoryImportIndex } from '@/routes/category-import';
import { index as importsIndex } from '@/routes/imports';

import type {
    CalibrationMode,
    CategoryImportState,
    CimpStep,
    ExtractResult,
    VerifyResult,
} from './types';
import { UploadStep } from './steps/upload-step';
import { CalibrateStep } from './steps/calibrate-step';
import { VerifyStep } from './steps/verify-step';
import { ExtractStep } from './steps/extract-step';

interface CategoryImportProps {
    existingCategories?: ExistingCategory[];
}

export default function CategoryImport({
    existingCategories = [],
}: CategoryImportProps) {
    const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
    const [calibrationMode, setCalibrationMode] =
        useState<CalibrationMode>('shared');
    const [sharedConfig, setSharedConfig] = useState<SharedSheetConfig | null>(
        null,
    );
    const [calibrations, setCalibrations] = useState<
        Record<string, SharedSheetConfig>
    >({});
    const [currentSheet, setCurrentSheet] = useState<string>('');
    const [verifyResults, setVerifyResults] = useState<
        Record<string, VerifyResult>
    >({});
    const [activeVerifySheet, setActiveVerifySheet] = useState<string>('');
    const [extractResult, setExtractResult] = useState<ExtractResult | null>(
        null,
    );
    const [step, setStep] = useState<CimpStep>('upload');
    const [importing, setImporting] = useState(false);
    const [skipProblematic, setSkipProblematic] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [isAdditionalDraft, setIsAdditionalDraft] = useState<
        Record<string, boolean>
    >({});

    const { sheets, workbook, fileName, loading, error, handleFileChange } =
        useImportWorkbook(() => {
            setSelectedSheets([]);
            setCurrentSheet('');
            setSharedConfig(null);
            setCalibrations({});
            setVerifyResults({});
            setActiveVerifySheet('');
            setExtractResult(null);
            setStep('upload');
        });

    function getEffectiveConfig(sheet: string): SharedSheetConfig {
        if (calibrationMode === 'shared' && sharedConfig) return sharedConfig;

        return calibrations[sheet] ?? sharedConfig ?? getDefaultSharedConfig();
    }

    const canCalibrate = selectedSheets.length > 0;
    const rowsCalibrated =
        !!sharedConfig &&
        sharedConfig.rowConfig.headerRow !== '' &&
        sharedConfig.rowConfig.headerRow != null &&
        sharedConfig.rowConfig.additionalItemsHeaderRow !== '' &&
        sharedConfig.rowConfig.additionalItemsHeaderRow != null &&
        sharedConfig.rowConfig.nonProcurementHeaderRow !== '' &&
        sharedConfig.rowConfig.nonProcurementHeaderRow != null;
    const canVerify = canCalibrate && !!workbook && rowsCalibrated;
    const allVerifyValid =
        selectedSheets.length > 0 &&
        selectedSheets.every((s) => verifyResults[s]?.valid);
    const hasAnyVerify = selectedSheets.some((s) => !!verifyResults[s]);
    const canExtract =
        canVerify && hasAnyVerify && (allVerifyValid || skipProblematic);

    const extractionStats = useMemo(() => {
        if (!extractResult) return null;

        return {
            raw: extractResult.filtered.length,
            unique: extractResult.unique.length,
            duplicates: extractResult.duplicates.length,
        };
    }, [extractResult]);

    function handleSheetToggle(sheet: string) {
        setSelectedSheets((prev) => {
            const next = prev.includes(sheet)
                ? prev.filter((s) => s !== sheet)
                : [...prev, sheet];
            setVerifyResults({});
            setActiveVerifySheet(next[0] ?? '');
            setExtractResult(null);
            setSkipProblematic(false);

            if (next.length > 0 && !next.includes(currentSheet))
                setCurrentSheet(next[0]);

            if (next.length === 0) setCurrentSheet('');

            return next;
        });
    }

    function handleSheetSelect(sheet: string) {
        handleSheetToggle(sheet);
    }

    function ensureCalibrationsInitialized() {
        if (sharedConfig) return;

        const def = getDefaultSharedConfig();
        setSharedConfig(def);
        const clones: Record<string, SharedSheetConfig> = {};

        for (const s of selectedSheets) clones[s] = { ...def };

        setCalibrations(clones);

        if (!currentSheet && selectedSheets[0])
            setCurrentSheet(selectedSheets[0]);
    }

    function handleApplySharedToAll() {
        if (!sharedConfig) return;

        const next: Record<string, SharedSheetConfig> = {};

        for (const s of selectedSheets) next[s] = { ...sharedConfig };

        setCalibrations(next);
    }

    function handleCopyCurrentToAll() {
        const src = calibrations[currentSheet] ?? sharedConfig;

        if (!src) return;

        const next: Record<string, SharedSheetConfig> = {};

        for (const s of selectedSheets) next[s] = { ...src };

        setCalibrations(next);
    }

    function updateSharedConfig(patch: Partial<SharedSheetConfig>) {
        setSharedConfig((prev) => ({
            ...(prev ?? getDefaultSharedConfig()),
            ...patch,
        }));
    }

    function updateCurrentCalibration(patch: Partial<SharedSheetConfig>) {
        if (!currentSheet) return;

        setCalibrations((prev) => ({
            ...prev,
            [currentSheet]: {
                ...(prev[currentSheet] ??
                    sharedConfig ??
                    getDefaultSharedConfig()),
                ...patch,
            },
        }));
    }

    function verifySheet(sheet: string, cfg: SharedSheetConfig): VerifyResult {
        if (!workbook) {
            return {
                valid: false,
                message: 'Workbook not loaded',
                errors: [{ row: 0, message: 'Workbook not loaded' }],
                groups: { procurement: 0, additional: 0, nonProcurement: 0 },
                details: [],
            };
        }

        const ws = workbook.getWorksheet(sheet);

        if (!ws) {
            return {
                valid: false,
                message: `Worksheet "${sheet}" not found`,
                errors: [{ row: 0, message: `Worksheet "${sheet}" not found` }],
                groups: { procurement: 0, additional: 0, nonProcurement: 0 },
                details: [],
            };
        }

        const dataColumn = cfg.columnConfig.category;
        const coaColumn = cfg.columnConfig.coa;
        const itemColumn = cfg.columnConfig.itemNumber;
        const { headerRow, additionalItemsHeaderRow, nonProcurementHeaderRow } =
            cfg.rowConfig;
        const { coaLabelMode } = cfg;

        if (headerRow === '' || headerRow == null) {
            return {
                valid: false,
                message: 'Header Row is required',
                errors: [
                    {
                        row: 0,
                        message: 'Header Row is required — check calibration',
                    },
                ],
                groups: { procurement: 0, additional: 0, nonProcurement: 0 },
                details: [],
            };
        }

        if (
            additionalItemsHeaderRow === '' ||
            additionalItemsHeaderRow == null
        ) {
            return {
                valid: false,
                message: 'Additional Items Header Row is required',
                errors: [
                    {
                        row: 0,
                        message:
                            'Additional Items Header Row is required — check calibration',
                    },
                ],
                groups: { procurement: 0, additional: 0, nonProcurement: 0 },
                details: [],
            };
        }

        if (nonProcurementHeaderRow === '' || nonProcurementHeaderRow == null) {
            return {
                valid: false,
                message: 'Non-Procurement Header Row is required',
                errors: [
                    {
                        row: 0,
                        message:
                            'Non-Procurement Header Row is required — check calibration',
                    },
                ],
                groups: { procurement: 0, additional: 0, nonProcurement: 0 },
                details: [],
            };
        }

        const lastRow = ws.actualRowCount;
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

        const errors: Array<{ row: number; message: string }> = [];
        const details: string[] = [];
        details.push(
            `COA label mode: ${coaLabelMode === 'without-label' ? 'Without label (COA on item rows)' : 'With label (COA label rows)'}`,
        );

        const groups = { procurement: 0, additional: 0, nonProcurement: 0 };
        const countData = (s: number, e: number) => {
            if (s < 0 || e < 0 || s > e) return 0;

            let c = 0;

            for (let r = s; r <= e && r <= lastRow; r++) {
                const v = cellText(ws.getRow(r).getCell(dataColumn));

                if (v) c++;
            }

            return c;
        };
        groups.procurement = additionalItemsHeaderRow
            ? countData(procurementStart, procurementEnd)
            : countData(
                  procurementStart,
                  nonProcurementHeaderRow
                      ? nonProcurementHeaderRow - 1
                      : lastRow,
              );
        groups.additional = additionalItemsHeaderRow
            ? countData(additionalStart, additionalEnd)
            : 0;
        groups.nonProcurement = nonProcurementHeaderRow
            ? countData(nonProcStart, nonProcEnd)
            : 0;

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

        const verifyStart = procurementStart;
        const verifyEnd = procurementEnd;

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
                    currentCat.coas.push({ ...currentCoa });
                    currentCoa = null;
                }

                if (totalRow) currentCat.totalRow = totalRow;

                catGroups.push(currentCat);
                currentCat = null;
            }
        };

        for (let r = verifyStart; r <= verifyEnd && r <= lastRow; r++) {
            const row = ws.getRow(r);
            const coaRaw = cellText(row.getCell(coaColumn));
            const dataRaw = cellText(row.getCell(dataColumn));
            const itemRaw = cellText(row.getCell(itemColumn));

            if (!dataRaw && !coaRaw) continue;

            const coaNorm = coaRaw ? normalize(coaRaw) : null;
            const dataNorm = dataRaw ? normalize(dataRaw) : null;

            if (dataNorm === 'description') continue;

            if (coaNorm && dataRaw) {
                if (!currentCat) {
                    errors.push({
                        row: r,
                        message: `Item at row ${r} ("${dataRaw}") found without active category`,
                    });
                    continue;
                }

                if (coaLabelMode === 'without-label') {
                    if (!currentCoa || coaNorm !== normalize(currentCoa.coa)) {
                        if (currentCoa) {
                            if (currentCoa.items === 0) {
                                errors.push({
                                    row: currentCoa.coaRow,
                                    message: `COA "${currentCoa.coa}" at row ${currentCoa.coaRow} in cat "${currentCat.cat}" has no items before next COA`,
                                });
                            }

                            currentCat.coas.push({ ...currentCoa });
                        }

                        currentCoa = { coa: coaRaw!, coaRow: r, items: 1 };
                    } else {
                        currentCoa.items += 1;
                    }

                    continue;
                } else {
                    if (!currentCoa) {
                        errors.push({
                            row: r,
                            message: `Item at row ${r} ("${dataRaw}") found without active COA in cat "${currentCat.cat}"`,
                        });
                        continue;
                    }

                    if (coaNorm !== normalize(currentCoa.coa)) {
                        errors.push({
                            row: r,
                            message: `Item COA mismatch at row ${r}: D="${coaRaw}" != current COA "${currentCoa.coa}" in cat "${currentCat.cat}"`,
                        });
                    }

                    currentCoa.items += 1;
                    continue;
                }
            }

            if (!dataRaw || !dataNorm) continue;

            if (itemRaw && dataRaw && !coaNorm) {
                errors.push({
                    row: r,
                    message: `Item at row ${r} ("${dataRaw}") has an item number but no COA (D)`,
                });
                continue;
            }

            if (isTotalRow(dataNorm)) {
                const expected = currentCat
                    ? normalize(`${currentCat.cat} - total`)
                    : null;

                if (!currentCat) {
                    errors.push({
                        row: r,
                        message: `Total "${dataRaw}" at row ${r} without active category`,
                    });
                } else if (expected && dataNorm !== expected) {
                    errors.push({
                        row: r,
                        message: `Total mismatch at row ${r}: got "${dataRaw}" (norm "${dataNorm}") expected "${currentCat.cat} - TOTAL"`,
                    });
                }

                if (currentCat) {
                    if (currentCoa) {
                        currentCat.coas.push({ ...currentCoa });
                        currentCoa = null;
                    }

                    if (currentCat.coas.length === 0) {
                        errors.push({
                            row: r,
                            message: `Category "${currentCat.cat}" at row ${currentCat.catRow} has no COA groups before total`,
                        });
                    } else {
                        for (const c of currentCat.coas) {
                            if (c.items === 0) {
                                errors.push({
                                    row: c.coaRow,
                                    message: `COA "${c.coa}" at row ${c.coaRow} in cat "${currentCat.cat}" has no items`,
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

                    if (nextCoaNorm && dataNorm && nextCoaNorm === dataNorm)
                        isCoaLabel = true;
                }

                if (isCoaLabel) {
                    if (!currentCat) {
                        errors.push({
                            row: r,
                            message: `COA "${dataRaw}" at row ${r} found without active category`,
                        });
                        continue;
                    }

                    if (currentCoa) {
                        if (currentCoa.items === 0) {
                            errors.push({
                                row: currentCoa.coaRow,
                                message: `COA "${currentCoa.coa}" at row ${currentCoa.coaRow} in cat "${currentCat.cat}" has no items before next COA`,
                            });
                        }

                        currentCat.coas.push({ ...currentCoa });
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
                    message: `Category "${dataRaw}" at row ${r} started before previous cat "${currentCat.cat}" (row ${currentCat.catRow}) closed with " - TOTAL"`,
                });

                if (currentCoa) {
                    if (currentCoa.items === 0) {
                        errors.push({
                            row: currentCoa.coaRow,
                            message: `COA "${currentCoa.coa}" at row ${currentCoa.coaRow} in cat "${currentCat.cat}" has no items`,
                        });
                    }

                    currentCat.coas.push({ ...currentCoa });
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
                        message: `COA "${currentCoa.coa}" at row ${currentCoa.coaRow} in cat "${currentCat.cat}" has no items at end`,
                    });
                }

                currentCat.coas.push({ ...currentCoa });
            }

            if (!currentCat.totalRow) {
                errors.push({
                    row: currentCat.catRow,
                    message: `Category "${currentCat.cat}" at row ${currentCat.catRow} missing closing "${currentCat.cat} - TOTAL" (found ${currentCat.coas.length} COA(s))`,
                });
            } else if (currentCat.coas.length === 0) {
                errors.push({
                    row: currentCat.catRow,
                    message: `Category "${currentCat.cat}" has no COAs`,
                });
            }

            catGroups.push(currentCat);
        }

        if (catGroups.length) {
            details.push(
                `Procurement groups: ${catGroups.length} cat(s) verified in rows [${verifyStart}..${verifyEnd}] (excluding additional)`,
            );

            for (const g of catGroups) {
                details.push(
                    `  Cat "${g.cat}" row ${g.catRow}: ${g.coas.length} COA(s)${g.totalRow ? ` → total at ${g.totalRow}` : ' MISSING total'}`,
                );
            }
        }

        const procurementErrors = errors.filter(
            (e) => e.row <= verifyEnd || e.message.includes('Procurement'),
        );
        const valid = procurementErrors.length === 0;
        const message = valid
            ? `✅ Format OK — ${catGroups.length} procurement cat group(s) verified` +
              (groups.additional || groups.nonProcurement
                  ? ` | Additional: ${groups.additional ? 'found' : '—'}, Non-Proc: ${groups.nonProcurement ? 'found' : '—'}`
                  : '')
            : `❌ Found ${errors.length} issue(s) in procurement format`;
        console.log(`[${sheet}]`, message, errors, catGroups);

        return { valid, message, errors, groups, details };
    }

    function handleVerify() {
        setSkipProblematic(false);
        setExtractResult(null);

        if (!workbook || selectedSheets.length === 0) return;

        if (!sharedConfig) ensureCalibrationsInitialized();

        const next: Record<string, VerifyResult> = {};

        for (const sheet of selectedSheets) {
            const cfg = getEffectiveConfig(sheet);
            const result = verifySheet(sheet, cfg);
            next[sheet] = result;
        }

        setVerifyResults(next);
        const firstInvalid = selectedSheets.find((s) => !next[s]?.valid);
        setActiveVerifySheet(firstInvalid ?? selectedSheets[0] ?? '');

        if (Object.keys(next).length) {
            console.table(
                Object.entries(next).map(([sh, r]) => ({
                    sheet: sh,
                    valid: r.valid,
                    errors: r.errors.length,
                    message: r.message,
                })),
            );
        }
    }

    function handleExtract() {
        if (!workbook || selectedSheets.length === 0) return;

        const filtered: ExtractResult['filtered'] = [];
        const excludedTotal: ExtractResult['excludedTotal'] = [];
        const excludedCoa: ExtractResult['excludedCoa'] = [];
        const skippedCoaNotEmpty: ExtractResult['skippedCoaNotEmpty'] = [];
        const skippedProblematic: ExtractResult['skippedProblematic'] = [];

        const problematicBySheet = new Map<
            string,
            { rows: Set<number>; norms: Set<string> }
        >();

        if (skipProblematic) {
            for (const sheet of selectedSheets) {
                const vr = verifyResults[sheet];

                if (!vr || vr.valid) continue;

                const rows = new Set<number>();
                const norms = new Set<string>();

                for (const e of vr.errors) {
                    rows.add(e.row);
                    const quoted = e.message.match(/"([^"]+)"/g);

                    if (quoted) {
                        for (const q of quoted) {
                            const inner = q.slice(1, -1);

                            if (inner) norms.add(normalize(inner));
                        }
                    }
                }

                problematicBySheet.set(sheet, { rows, norms });
            }
        }

        for (const sheet of selectedSheets) {
            const cfg = getEffectiveConfig(sheet);
            const dataColumn = cfg.columnConfig.category;
            const coaColumn = cfg.columnConfig.coa;
            const itemColumn = cfg.columnConfig.itemNumber;
            const {
                headerRow,
                additionalItemsHeaderRow,
                nonProcurementHeaderRow,
            } = cfg.rowConfig;
            const { coaLabelMode } = cfg;

            if (headerRow === '' || headerRow == null) continue;

            if (
                additionalItemsHeaderRow === '' ||
                additionalItemsHeaderRow == null
            )
                continue;

            if (
                nonProcurementHeaderRow === '' ||
                nonProcurementHeaderRow == null
            )
                continue;

            const ws = workbook!.getWorksheet(sheet);

            if (!ws) continue;

            const startRow = headerRow + 1;
            const lastRow = ws.actualRowCount;
            const prob = problematicBySheet.get(sheet);
            const probRows = prob?.rows ?? new Set<number>();
            const probNorms = prob?.norms ?? new Set<string>();

            for (let r = startRow; r <= lastRow; r++) {
                const row = ws.getRow(r);
                const coaRaw = cellText(row.getCell(coaColumn));
                const dataRaw = cellText(row.getCell(dataColumn));
                const itemRaw = cellText(row.getCell(itemColumn));

                if (!dataRaw) continue;

                const coaNorm = coaRaw ? normalize(coaRaw) : null;
                const dataNorm = normalize(dataRaw);

                if (dataNorm === 'description') continue;

                if (additionalItemsHeaderRow && r === additionalItemsHeaderRow)
                    continue;

                if (nonProcurementHeaderRow && r === nonProcurementHeaderRow)
                    continue;

                if (
                    dataNorm === 'non-procurement requirements' ||
                    dataNorm === 'additional items' ||
                    dataNorm === 'procurement requirements'
                ) {
                    continue;
                }

                if (additionalItemsHeaderRow && r > additionalItemsHeaderRow)
                    continue;

                if (nonProcurementHeaderRow && r > nonProcurementHeaderRow)
                    continue;

                if (
                    skipProblematic &&
                    prob &&
                    (probRows.has(r) || probNorms.has(dataNorm))
                ) {
                    const reason = probRows.has(r)
                        ? `row ${r} flagged in verify (${sheet})`
                        : `normalized "${dataNorm}" flagged (${sheet})`;
                    skippedProblematic.push({
                        row: r,
                        raw: dataRaw,
                        normalized: dataNorm,
                        reason,
                        sheet,
                    });
                    continue;
                }

                if (
                    skipProblematic &&
                    prob &&
                    coaNorm &&
                    (probRows.has(r) || probNorms.has(coaNorm))
                ) {
                    skippedProblematic.push({
                        row: r,
                        raw: dataRaw,
                        normalized: dataNorm,
                        reason: `COA "${coaRaw}" flagged (${sheet})`,
                        sheet,
                    });
                    continue;
                }

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

                if (itemRaw && !coaNorm) {
                    continue;
                }

                if (isTotalRow(dataNorm)) {
                    excludedTotal.push({
                        row: r,
                        raw: dataRaw,
                        normalized: dataNorm,
                        sheet,
                    });
                    continue;
                }

                if (coaLabelMode === 'with-label' && r + 1 <= lastRow) {
                    const nextRow = ws.getRow(r + 1);
                    const nextCoaRaw = cellText(nextRow.getCell(coaColumn));
                    const nextCoaNorm = nextCoaRaw
                        ? normalize(nextCoaRaw)
                        : null;

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

                const address = `${sheet}!${dataColumn}${r}`;
                filtered.push({
                    row: r,
                    raw: dataRaw,
                    normalized: dataNorm,
                    sheet,
                    address,
                });
            }
        }

        type SeenVal = {
            raw: string;
            normalized: string;
            rows: number[];
            sheets: string[];
            locations: ExtractResult['unique'][number]['locations'];
        };
        const seen = new Map<string, SeenVal>();
        const duplicates: ExtractResult['duplicates'] = [];

        for (const c of filtered) {
            const existing = seen.get(c.normalized);
            const loc = {
                sheet: c.sheet,
                row: c.row,
                col: getEffectiveConfig(c.sheet).columnConfig.category,
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

                if (!existing.sheets.includes(c.sheet))
                    existing.sheets.push(c.sheet);

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

        const unique = [...seen.values()].map((v) => ({
            raw: v.raw,
            normalized: v.normalized,
            rows: v.rows,
            count: v.locations.length,
            sheets: v.sheets,
            sheetCount: v.sheets.length,
            locations: v.locations,
        }));
        unique.sort(
            (a, b) => b.sheetCount - a.sheetCount || a.raw.localeCompare(b.raw),
        );

        console.log('Extract multi-sheet', {
            filtered,
            unique,
            duplicates,
            excludedTotal,
            excludedCoa,
            skippedProblematic,
        });

        if (skippedProblematic.length > 0) {
            console.table(
                skippedProblematic.map((sk) => ({
                    sheet: sk.sheet,
                    row: sk.row,
                    raw: sk.raw,
                    reason: sk.reason,
                })),
            );
        }

        setExtractResult({
            filtered,
            unique,
            duplicates,
            excludedTotal,
            excludedCoa,
            skippedCoaNotEmpty,
            skippedProblematic,
        });
        setSelected(new Set(unique.map((u) => u.normalized)));
        setIsAdditionalDraft({});
    }

    function handleImport() {
        if (!extractResult || extractResult.unique.length === 0) return;

        const toImport = extractResult.unique.filter((u) =>
            selected.has(u.normalized),
        );

        if (toImport.length === 0) return;

        setImporting(true);
        router.post(
            '/imports/category-import' as const,
            {
                categories: toImport.map((u) => ({
                    name: u.raw,
                    normalized: u.normalized,
                    is_additional: isAdditionalDraft[u.normalized] ?? false,
                })),
            } as never,
            {
                onFinish: () => setImporting(false),
            },
        );
    }

    const s: CategoryImportState = {
        sheets,
        workbook,
        fileName,
        selectedSheets,
        loading,
        error,

        step,
        setStep,
        canCalibrate,
        canVerify,
        allVerifyValid,
        hasAnyVerify,
        canExtract,

        calibrationMode,
        setCalibrationMode,
        sharedConfig,
        setSharedConfig,
        calibrations,
        setCalibrations,
        currentSheet,
        setCurrentSheet,
        getEffectiveConfig,
        ensureCalibrationsInitialized,
        handleApplySharedToAll,
        handleCopyCurrentToAll,
        updateSharedConfig,
        updateCurrentCalibration,

        handleFileChange,
        handleSheetToggle,
        handleSheetSelect,

        verifyResults,
        setVerifyResults,
        activeVerifySheet,
        setActiveVerifySheet,
        handleVerify,
        skipProblematic,
        setSkipProblematic,

        extractResult,
        setExtractResult,
        extractionStats,
        handleExtract,
        selected,
        setSelected,
        isAdditionalDraft,
        setIsAdditionalDraft,
        importing,
        handleImport,

        existingCategories,
    };

    return (
        <ImportPageShell
            title="Category Import"
            description="Import PPMP categories from XLSX. Calibrate columns/headers, verify format, and bulk create categories."
            fileName={fileName}
            loading={loading}
            step={step}
            onStepChange={(v) => setStep(v as CimpStep)}
            tabs={[
                { value: 'upload', label: '1. Upload' },
                {
                    value: 'calibrate',
                    label: '2. Calibrate',
                    disabled: !canCalibrate,
                },
                {
                    value: 'verify',
                    label: '3. Verify Format',
                    disabled: !canVerify,
                },
                {
                    value: 'extract',
                    label: '4. Extract & Import',
                    disabled: !canExtract,
                },
            ]}
        >
            <UploadStep s={s} />
            <CalibrateStep s={s} />
            <VerifyStep s={s} />
            <ExtractStep s={s} />
        </ImportPageShell>
    );
}

CategoryImport.layout = {
    breadcrumbs: [
        { title: 'Imports', href: importsIndex().url },
        { title: 'Category Import', href: categoryImportIndex().url },
    ],
};
