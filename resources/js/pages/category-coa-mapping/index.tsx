// resources/js/pages/category-coa-mapping/index.tsx

import { Head, router } from '@inertiajs/react';
import ExcelJS from 'exceljs';
import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cellText } from '@/lib/excel/cell-helpers';
import {
    normalize,
    isTotalRow,
    getCategoryMatch,
    getCoaMatch,
} from '@/lib/ppmp/normalize';
import type { ExistingCategory, ExistingCoa } from '@/lib/ppmp/normalize';
import { getDefaultMappingConfig } from '@/lib/ppmp/sheet-config';
import type {
    CategoryCoaSheetConfig,
    CategoryCoaColumnConfig,
    CategoryCoaRowConfig,
} from '@/lib/ppmp/sheet-config';
import { index as categoryCoaMappingIndex } from '@/routes/category-coa-mapping';
import { index as importsIndex } from '@/routes/imports';

import type {
    CalibrationMode,
    CategoryCoaMappingState,
    CcmStep,
    EffectiveVerificationState,
    ExistingMapping,
    ExtractedPair,
    VerificationState,
    VerifiedPair,
    VerifyFormatResult,
} from './types';
import { UploadStep } from './steps/upload-step';
import { CalibrateStep } from './steps/calibrate-step';
import { VerifyFormatStep } from './steps/verify-format-step';
import { VerifyMapStep } from './steps/verify-map-step';
import { ReviewStep } from './steps/review-step';

interface CategoryCoaMappingProps {
    existingCategories?: ExistingCategory[];
    existingCoas?: ExistingCoa[];
    existingMappings?: ExistingMapping[];
}

export default function CategoryCoaMappingPage({
    existingCategories = [],
    existingCoas = [],
    existingMappings = [],
}: CategoryCoaMappingProps) {
    const [sheets, setSheets] = useState<string[]>([]);
    const [workbook, setWorkbook] = useState<ExcelJS.Workbook | null>(null);
    const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    // Calibration – shared + per-sheet (multi-sheet)
    const [calibrationMode, setCalibrationMode] =
        useState<CalibrationMode>('shared');
    const [sharedConfig, setSharedConfig] =
        useState<CategoryCoaSheetConfig | null>(null);
    const [calibrations, setCalibrations] = useState<
        Record<string, CategoryCoaSheetConfig>
    >({});
    const [currentSheet, setCurrentSheet] = useState<string>('');
    const [coaOverrides, setCoaOverrides] = useState<Record<string, number>>(
        {},
    );
    const [verification, setVerification] = useState<VerificationState | null>(
        null,
    );
    const [isSaving, setIsSaving] = useState(false);
    const [step, setStep] = useState<CcmStep>('upload');
    const [formatResults, setFormatResults] = useState<
        Record<string, VerifyFormatResult>
    >({});
    const [activeFormatSheet, setActiveFormatSheet] = useState<string>('');
    const [activeVerifySheet, setActiveVerifySheet] = useState<string>('');

    const canCalibrate = selectedSheets.length > 0;
    const canVerifyFormat =
        selectedSheets.length > 0 && !!workbook && !!sharedConfig;
    const hasFormatResult =
        selectedSheets.length > 0 &&
        selectedSheets.every((s) => !!formatResults[s]);
    const formatValid =
        selectedSheets.length > 0 &&
        selectedSheets.every((s) => formatResults[s]?.valid);
    const canVerifyMap = canVerifyFormat && hasFormatResult && formatValid;
    const canReview = canVerifyMap && !!verification && verification.total > 0;

    function getEffectiveConfig(sheet: string): CategoryCoaSheetConfig {
        if (calibrationMode === 'shared' && sharedConfig) return sharedConfig;

        return calibrations[sheet] ?? sharedConfig ?? getDefaultMappingConfig();
    }

    function ensureCalibrationsInitialized() {
        if (sharedConfig) return;

        const def = getDefaultMappingConfig();
        setSharedConfig(def);
        const clones: Record<string, CategoryCoaSheetConfig> = {};

        for (const s of selectedSheets) {
            clones[s] = {
                ...def,
                columnConfig: { ...def.columnConfig },
                rowConfig: { ...def.rowConfig },
            };
        }

        setCalibrations(clones);

        if (!currentSheet && selectedSheets[0])
            setCurrentSheet(selectedSheets[0]);
    }

    function handleApplySharedToAll() {
        if (!sharedConfig) return;

        const next: Record<string, CategoryCoaSheetConfig> = {};

        for (const s of selectedSheets) {
            next[s] = {
                ...sharedConfig,
                columnConfig: { ...sharedConfig.columnConfig },
                rowConfig: { ...sharedConfig.rowConfig },
            };
        }

        setCalibrations(next);
    }

    function handleCopyCurrentToAll() {
        const src = calibrations[currentSheet] ?? sharedConfig;

        if (!src) return;

        const next: Record<string, CategoryCoaSheetConfig> = {};

        for (const s of selectedSheets) {
            next[s] = {
                ...src,
                columnConfig: { ...src.columnConfig },
                rowConfig: { ...src.rowConfig },
            };
        }

        setCalibrations(next);
    }

    const effectiveVerification =
        useMemo<EffectiveVerificationState | null>(() => {
            if (!verification) return null;

            const mappingSet = new Set(
                existingMappings.map(
                    (m) => `${m.ppmp_category_id}|${m.chart_of_account_id}`,
                ),
            );
            const effectivePairs = verification.verifiedPairs.map((v) => {
                const key = `${v.sheet}|${v.catRow}|${v.coaRow}`;
                const overrideId = coaOverrides[key] ?? null;
                const effectiveCoa = overrideId
                    ? (existingCoas.find((c) => c.id === overrideId) ?? null)
                    : v.coaMatch;
                const effectiveCoaExists =
                    overrideId !== null ? true : v.coaExists;
                const effectiveCoaId = overrideId ?? v.coaId;
                const effectiveCoaMatchType =
                    overrideId !== null ? ('strict' as const) : v.coaMatchType;
                const effectiveMappingExists =
                    v.catId !== null &&
                    effectiveCoaId !== null &&
                    mappingSet.has(`${v.catId}|${effectiveCoaId}`);

                return {
                    ...v,
                    key,
                    overrideId,
                    effectiveCoa,
                    effectiveCoaExists,
                    effectiveCoaId,
                    effectiveCoaMatchType,
                    effectiveMappingExists,
                };
            });
            const effCoaFound = effectivePairs.filter(
                (p) => p.effectiveCoaExists,
            ).length;
            const effMappingFound = effectivePairs.filter(
                (p) => p.effectiveMappingExists,
            ).length;
            const effMissingMapping = effectivePairs.filter(
                (p) =>
                    p.catExists &&
                    p.effectiveCoaExists &&
                    !p.effectiveMappingExists,
            ).length;
            const effMissingCoa = effectivePairs.filter(
                (p) => !p.effectiveCoaExists,
            ).length;

            return {
                ...verification,
                effectivePairs,
                effCoaFound,
                effMappingFound,
                effMissingMapping,
                effMissingCoa,
            };
        }, [verification, coaOverrides, existingCoas, existingMappings]);

    function handleCoaOverrideChange(
        rowKey: string,
        selectedValue: string | null,
    ) {
        if (!selectedValue) {
            setCoaOverrides((prev) => {
                const next = { ...prev };
                delete next[rowKey];

                return next;
            });

            return;
        }

        const idMatch = selectedValue.match(/^coa:(\d+)/);

        if (idMatch) {
            const id = Number(idMatch[1]);
            setCoaOverrides((prev) => ({ ...prev, [rowKey]: id }));
        } else {
            const found = existingCoas.find(
                (c) => `${c.path} — ${c.account_title}` === selectedValue,
            );

            if (found)
                setCoaOverrides((prev) => ({ ...prev, [rowKey]: found.id }));
        }
    }

    function handleClearOverride(rowKey: string) {
        setCoaOverrides((prev) => {
            const next = { ...prev };
            delete next[rowKey];

            return next;
        });
    }

    function handleBulkCreateMappings() {
        if (!effectiveVerification) return;

        const toCreate = effectiveVerification.effectivePairs
            .filter(
                (p) =>
                    p.catExists &&
                    p.effectiveCoaExists &&
                    !p.effectiveMappingExists &&
                    p.catId !== null &&
                    p.effectiveCoaId !== null,
            )
            .map((p) => ({
                ppmp_category_id: p.catId!,
                chart_of_account_id: p.effectiveCoaId!,
            }));

        if (toCreate.length === 0) return;

        const seen = new Set<string>();
        const uniqueToCreate: typeof toCreate = [];

        for (const m of toCreate) {
            const k = `${m.ppmp_category_id}|${m.chart_of_account_id}`;

            if (!seen.has(k)) {
                seen.add(k);
                uniqueToCreate.push(m);
            }
        }

        setIsSaving(true);
        router.post(
            '/category-coa-mappings/bulk' as never,
            { mappings: uniqueToCreate } as never,
            {
                onFinish: () => setIsSaving(false),
            },
        );
    }

    function verifyFormatForSheet(sheet: string): VerifyFormatResult | null {
        if (!workbook || !sheet) return null;

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

        const effective = getEffectiveConfig(sheet);

        if (
            effective.rowConfig.headerRow === '' ||
            effective.rowConfig.headerRow == null
        ) {
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

        const { coaLabelMode } = effective;
        const dataColumn = effective.columnConfig.category;
        const coaColumn = effective.columnConfig.coa;
        const lastRow = ws.actualRowCount;
        const procurementStart = effective.rowConfig.headerRow + 1;
        const procurementEnd = effective.rowConfig.additionalItemsHeaderRow
            ? effective.rowConfig.additionalItemsHeaderRow - 1
            : effective.rowConfig.nonProcurementHeaderRow
              ? effective.rowConfig.nonProcurementHeaderRow - 1
              : lastRow;
        const additionalStart = effective.rowConfig.additionalItemsHeaderRow
            ? effective.rowConfig.additionalItemsHeaderRow + 1
            : -1;
        const additionalEnd = effective.rowConfig.nonProcurementHeaderRow
            ? effective.rowConfig.nonProcurementHeaderRow - 1
            : lastRow;
        const nonProcStart = effective.rowConfig.nonProcurementHeaderRow
            ? effective.rowConfig.nonProcurementHeaderRow + 1
            : -1;
        const nonProcEnd = lastRow;

        const errors: Array<{ row: number; message: string }> = [];
        const details: string[] = [];
        details.push(
            `COA label mode: ${coaLabelMode === 'without-label' ? 'Without label (COA on item rows)' : 'With label (COA label rows)'}`,
        );
        details.push(
            `Ranges: procurement [${procurementStart}..${procurementEnd}] additional [${additionalStart}..${additionalEnd}] non-proc [${nonProcStart}..${nonProcEnd}]`,
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
        groups.procurement = countData(procurementStart, procurementEnd);
        groups.additional = effective.rowConfig.additionalItemsHeaderRow
            ? countData(additionalStart, additionalEnd)
            : 0;
        groups.nonProcurement = effective.rowConfig.nonProcurementHeaderRow
            ? countData(nonProcStart, nonProcEnd)
            : 0;

        if (!effective.rowConfig.additionalItemsHeaderRow) {
            details.push(
                'Additional Items header not calibrated — skipping additional group check',
            );
        }

        if (!effective.rowConfig.nonProcurementHeaderRow) {
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

        if (
            effective.rowConfig.additionalItemsHeaderRow &&
            groups.additional === 0
        ) {
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

            if (
                sectionName === 'additional' ||
                sectionName === 'non-procurement'
            ) {
                let itemCount = 0;

                for (let r = startRow; r <= endRow && r <= lastRow; r++) {
                    const row = ws.getRow(r);
                    const coaRaw = cellText(row.getCell(coaColumn));
                    const dataRaw = cellText(row.getCell(dataColumn));
                    const unitRaw = cellText(
                        row.getCell(effective.columnConfig.unit),
                    );
                    const priceRaw = cellText(
                        row.getCell(effective.columnConfig.price),
                    );
                    const itemRaw = cellText(
                        row.getCell(effective.columnConfig.itemNumber),
                    );

                    if (!dataRaw && !coaRaw && !unitRaw && !priceRaw) continue;

                    const dataNorm = dataRaw ? normalize(dataRaw) : null;

                    if (!dataNorm) continue;

                    if (dataNorm === 'description') continue;

                    if (
                        dataNorm === 'additional items for procurement' ||
                        dataNorm === 'additional items' ||
                        dataNorm === 'non-procurement requirements' ||
                        dataNorm === 'non - procurement requirements' ||
                        dataNorm ===
                            'additional items for procurement - total' ||
                        dataNorm === 'non-procurement requirements - total' ||
                        dataNorm === 'non-procurement - total' ||
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
                        priceNum === 0 ||
                        Number.isNaN(priceNum) ||
                        isFalsy(priceRaw);
                    const isFalsyUnit = isFalsy(unitRaw);
                    const isFalsyCoa = !coaNorm;
                    const isFalsyItem = !itemRaw;

                    if (
                        isFalsyItem &&
                        isFalsyCoa &&
                        isFalsyUnit &&
                        isFalsyPrice
                    )
                        continue;

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
                }

                details.push(
                    `${sectionName} items: ${itemCount} pricelist rows checked (no categories) in rows [${startRow}..${endRow}]`,
                );

                return;
            }

            type CatGroup = {
                cat: string;
                catRow: number;
                coas: Array<{ coa: string; coaRow: number; items: number }>;
                totalRow?: number;
            };
            const catGroups: CatGroup[] = [];
            let currentCat: CatGroup | null = null;
            let currentCoa: {
                coa: string;
                coaRow: number;
                items: number;
            } | null = null;
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
                        if (
                            !currentCoa ||
                            coaNorm !== normalize(currentCoa.coa)
                        ) {
                            if (currentCoa) {
                                if (currentCoa.items === 0) {
                                    errors.push({
                                        row: currentCoa.coaRow,
                                        message: `COA "${currentCoa.coa}" at row ${currentCoa.coaRow} in cat "${currentCat.cat}" has no items before next COA (${sectionName})`,
                                    });
                                }

                                currentCat.coas.push(currentCoa);
                            }

                            currentCoa = {
                                coa: coaRaw!,
                                coaRow: r,
                                items: 1,
                            };
                        } else {
                            currentCoa.items += 1;
                        }

                        continue;
                    } else {
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
                        nextCoaRaw = cellText(
                            ws.getRow(r + 1).getCell(coaColumn),
                        );
                        nextCoaNorm = nextCoaRaw ? normalize(nextCoaRaw) : null;

                        if (nextCoaNorm && dataNorm && nextCoaNorm === dataNorm)
                            isCoaLabel = true;
                    }

                    if (isCoaLabel) {
                        if (!currentCat) {
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
                        `  ${sectionName} Cat "${g.cat}" row ${g.catRow}: ${g.coas.length} COA(s)${g.totalRow ? ` → total at ${g.totalRow}` : ' MISSING total'}`,
                    );
                }
            }
        };

        verifySection('procurement', procurementStart, procurementEnd);

        if (effective.rowConfig.additionalItemsHeaderRow) {
            verifySection('additional', additionalStart, additionalEnd);
        }

        if (effective.rowConfig.nonProcurementHeaderRow) {
            verifySection('non-procurement', nonProcStart, nonProcEnd);
        }

        const valid = errors.length === 0;
        const message = valid
            ? `✅ Format OK — ${groups.procurement} procurement, ${groups.additional} additional, ${groups.nonProcurement} non-proc cells checked`
            : `❌ Found ${errors.length} issue(s) in sheet format`;
        console.log(`[${sheet}] Format Verification`, message, errors, details);

        return { valid, message, errors, groups, details };
    }

    function handleVerifyFormat() {
        if (!workbook || selectedSheets.length === 0) return;

        const next: Record<string, VerifyFormatResult> = {};

        for (const sheet of selectedSheets) {
            const result = verifyFormatForSheet(sheet);

            if (result) next[sheet] = result;
        }

        setFormatResults(next);
        const firstInvalid = selectedSheets.find((s) => !next[s]?.valid);
        setActiveFormatSheet(firstInvalid ?? selectedSheets[0] ?? '');
        setVerification(null);
        setCoaOverrides({});
        setActiveVerifySheet(firstInvalid ?? selectedSheets[0] ?? '');

        if (Object.keys(next).length) {
            console.table(
                Object.entries(next).map(([sheet, r]) => ({
                    sheet,
                    valid: r.valid,
                    errors: r.errors.length,
                    message: r.message,
                })),
            );
        }
    }

    async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];

        if (!file) return;

        const isXlsx =
            file.name.toLowerCase().endsWith('.xlsx') ||
            file.type ===
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        if (!isXlsx) {
            setError('Only .xlsx files are allowed.');
            setSheets([]);
            setWorkbook(null);
            setSelectedSheets([]);
            setCurrentSheet('');
            setSharedConfig(null);
            setCalibrations({});
            setFileName(null);
            setFormatResults({});
            setActiveFormatSheet('');
            setActiveVerifySheet('');
            e.target.value = '';

            return;
        }

        setError(null);
        setLoading(true);
        setFileName(file.name);
        setSelectedSheets([]);
        setCurrentSheet('');
        setSharedConfig(null);
        setCalibrations({});
        setFormatResults({});
        setActiveFormatSheet('');
        setActiveVerifySheet('');
        setVerification(null);
        setCoaOverrides({});
        setStep('upload');

        try {
            const wb = new ExcelJS.Workbook();
            const arrayBuffer = await file.arrayBuffer();
            await wb.xlsx.load(arrayBuffer);
            setWorkbook(wb);
            setSheets(wb.worksheets.map((ws) => ws.name));
        } catch {
            setError('Failed to parse .xlsx file.');
            setSheets([]);
            setWorkbook(null);
            setSelectedSheets([]);
            setCurrentSheet('');
            setSharedConfig(null);
            setCalibrations({});
            setFileName(null);
        } finally {
            setLoading(false);
        }
    }

    function handleSheetToggle(sheet: string) {
        setSelectedSheets((prev) => {
            const next = prev.includes(sheet)
                ? prev.filter((s) => s !== sheet)
                : [...prev, sheet];
            setFormatResults({});
            setActiveFormatSheet(next[0] ?? '');
            setActiveVerifySheet(next[0] ?? '');
            setVerification(null);
            setCoaOverrides({});

            if (next.length > 0 && !next.includes(currentSheet))
                setCurrentSheet(next[0]);

            if (next.length === 0) setCurrentSheet('');

            return next;
        });
    }

    function handleSheetClick(sheet: string) {
        handleSheetToggle(sheet);
    }

    function handleRowConfigChange(patch: Partial<CategoryCoaRowConfig>) {
        if (calibrationMode === 'shared') {
            setSharedConfig((prev) => {
                const base = prev ?? getDefaultMappingConfig();

                return { ...base, rowConfig: { ...base.rowConfig, ...patch } };
            });
        } else {
            if (!currentSheet) return;

            setCalibrations((prev) => ({
                ...prev,
                [currentSheet]: {
                    ...(prev[currentSheet] ??
                        sharedConfig ??
                        getDefaultMappingConfig()),
                    rowConfig: {
                        ...(
                            prev[currentSheet] ??
                            sharedConfig ??
                            getDefaultMappingConfig()
                        ).rowConfig,
                        ...patch,
                    },
                },
            }));
        }

        setVerification(null);
        setFormatResults({});
        setActiveFormatSheet(selectedSheets[0] ?? '');
        setActiveVerifySheet(selectedSheets[0] ?? '');
        setCoaOverrides({});
    }

    function handleColumnConfigChange(patch: Partial<CategoryCoaColumnConfig>) {
        if (calibrationMode === 'shared') {
            setSharedConfig((prev) => {
                const base = prev ?? getDefaultMappingConfig();

                return {
                    ...base,
                    columnConfig: { ...base.columnConfig, ...patch },
                };
            });
        } else {
            if (!currentSheet) return;

            setCalibrations((prev) => ({
                ...prev,
                [currentSheet]: {
                    ...(prev[currentSheet] ??
                        sharedConfig ??
                        getDefaultMappingConfig()),
                    columnConfig: {
                        ...(
                            prev[currentSheet] ??
                            sharedConfig ??
                            getDefaultMappingConfig()
                        ).columnConfig,
                        ...patch,
                    },
                },
            }));
        }

        setVerification(null);
        setFormatResults({});
        setActiveFormatSheet(selectedSheets[0] ?? '');
        setActiveVerifySheet(selectedSheets[0] ?? '');
        setCoaOverrides({});
    }

    function handleMatchFieldChange(
        value: CategoryCoaSheetConfig['coaMatchField'],
    ) {
        if (calibrationMode === 'shared') {
            setSharedConfig((prev) => ({
                ...(prev ?? getDefaultMappingConfig()),
                coaMatchField: value,
            }));
        } else {
            if (!currentSheet) return;

            setCalibrations((prev) => ({
                ...prev,
                [currentSheet]: {
                    ...(prev[currentSheet] ??
                        sharedConfig ??
                        getDefaultMappingConfig()),
                    coaMatchField: value,
                },
            }));
        }

        setVerification(null);
        setFormatResults({});
        setActiveFormatSheet(selectedSheets[0] ?? '');
        setActiveVerifySheet(selectedSheets[0] ?? '');
        setCoaOverrides({});
    }

    function handleCoaLabelModeChange(
        value: CategoryCoaSheetConfig['coaLabelMode'],
    ) {
        if (calibrationMode === 'shared') {
            setSharedConfig((prev) => ({
                ...(prev ?? getDefaultMappingConfig()),
                coaLabelMode: value,
            }));
        } else {
            if (!currentSheet) return;

            setCalibrations((prev) => ({
                ...prev,
                [currentSheet]: {
                    ...(prev[currentSheet] ??
                        sharedConfig ??
                        getDefaultMappingConfig()),
                    coaLabelMode: value,
                },
            }));
        }

        setVerification(null);
        setFormatResults({});
        setActiveFormatSheet(selectedSheets[0] ?? '');
        setActiveVerifySheet(selectedSheets[0] ?? '');
        setCoaOverrides({});
    }

    function handleResetCalibration() {
        if (calibrationMode === 'shared') {
            setSharedConfig(getDefaultMappingConfig());
        } else {
            if (currentSheet) {
                setCalibrations((prev) => ({
                    ...prev,
                    [currentSheet]: getDefaultMappingConfig(),
                }));
            }
        }

        setVerification(null);
        setFormatResults({});
        setActiveFormatSheet(selectedSheets[0] ?? '');
        setActiveVerifySheet(selectedSheets[0] ?? '');
        setCoaOverrides({});
    }

    function extractRelationshipsForSection(
        ws: ExcelJS.Worksheet,
        cfg: CategoryCoaSheetConfig,
        sectionName: 'procurement' | 'additional' | 'non-procurement',
        startRow: number,
        endRow: number,
    ) {
        type CatGroup = {
            cat: string;
            catRow: number;
            coas: Array<{ coa: string; coaRow: number; items: number }>;
            totalRow?: number;
        };
        const catGroups: CatGroup[] = [];
        let currentCat: CatGroup | null = null;
        let currentCoa: {
            coa: string;
            coaRow: number;
            items: number;
        } | null = null;

        const dataColumn = cfg.columnConfig.category;
        const coaColumn = cfg.columnConfig.coa;
        const coaLabelMode = cfg.coaLabelMode;

        const flushCat = (totalRow?: number) => {
            if (currentCat) {
                if (currentCoa) {
                    currentCat.coas.push(currentCoa!);
                    currentCoa = null;
                }

                if (totalRow) currentCat.totalRow = totalRow;

                catGroups.push(currentCat);
                currentCat = null;
            }
        };

        const lastRow = ws.actualRowCount;

        for (let r = startRow; r <= endRow && r <= lastRow; r++) {
            const row = ws.getRow(r);
            const coaRaw = cellText(row.getCell(coaColumn));
            const dataRaw = cellText(row.getCell(dataColumn));

            if (!dataRaw && !coaRaw) continue;

            const coaNorm = coaRaw ? normalize(coaRaw) : null;
            const dataNorm = dataRaw ? normalize(dataRaw) : null;

            if (dataNorm === 'description') continue;

            const unitRaw = cellText(row.getCell(cfg.columnConfig.unit));
            const priceRaw = cellText(row.getCell(cfg.columnConfig.price));
            const itemRaw = cellText(row.getCell(cfg.columnConfig.itemNumber));
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
                priceNum === 0 ||
                Number.isNaN(priceNum) ||
                isFalsy(priceRaw);
            const isFalsyUnit = isFalsy(unitRaw);
            const isFalsyCoa = !coaNorm;
            const isFalsyItem = !itemRaw;

            if (
                isFalsyItem &&
                isFalsyCoa &&
                isFalsyUnit &&
                isFalsyPrice &&
                dataRaw
            ) {
                if (
                    sectionName === 'additional' ||
                    sectionName === 'non-procurement'
                )
                    continue;
            }

            if (coaNorm && dataRaw) {
                if (!currentCat) {
                    if (sectionName === 'additional') {
                        currentCat = {
                            cat: 'Additional Items (Uncategorized)',
                            catRow: r,
                            coas: [],
                        };
                    } else if (sectionName === 'non-procurement') {
                        currentCat = {
                            cat: 'Non-Procurement (Uncategorized)',
                            catRow: r,
                            coas: [],
                        };
                    } else {
                        continue;
                    }
                }

                if (coaLabelMode === 'without-label') {
                    if (!currentCoa || coaNorm !== normalize(currentCoa.coa)) {
                        if (currentCoa) {
                            currentCat.coas.push(currentCoa!);
                        }

                        currentCoa = { coa: coaRaw!, coaRow: r, items: 1 };
                    } else {
                        currentCoa.items += 1;
                    }

                    continue;
                } else {
                    if (!currentCoa) {
                        const existing = currentCat.coas.find(
                            (c) => normalize(c.coa) === coaNorm,
                        );

                        if (existing) {
                            if (currentCoa) currentCat.coas.push(currentCoa!);

                            currentCoa = { coa: coaRaw!, coaRow: r, items: 1 };
                        } else {
                            if (currentCoa) currentCat.coas.push(currentCoa!);

                            currentCoa = { coa: coaRaw!, coaRow: r, items: 1 };
                        }

                        continue;
                    }

                    if (coaNorm !== normalize(currentCoa.coa)) {
                        currentCat.coas.push(currentCoa!);
                        currentCoa = { coa: coaRaw!, coaRow: r, items: 1 };
                    } else {
                        currentCoa.items += 1;
                    }

                    continue;
                }
            }

            if (!dataRaw || !dataNorm) continue;

            if (isTotalRow(dataNorm)) {
                if (currentCat) {
                    if (currentCoa) {
                        currentCat.coas.push(currentCoa!);
                        currentCoa = null;
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
                        if (sectionName === 'additional') {
                            currentCat = {
                                cat: 'Additional Items (Uncategorized)',
                                catRow: r,
                                coas: [],
                            };
                        } else if (sectionName === 'non-procurement') {
                            currentCat = {
                                cat: 'Non-Procurement (Uncategorized)',
                                catRow: r,
                                coas: [],
                            };
                        } else {
                            continue;
                        }
                    }

                    if (currentCoa) {
                        currentCat.coas.push(currentCoa!);
                    }

                    currentCoa = { coa: dataRaw, coaRow: r, items: 0 };
                    continue;
                }
            }

            if (currentCat) {
                if (currentCoa) {
                    currentCat.coas.push(currentCoa!);
                    currentCoa = null;
                }

                catGroups.push(currentCat);
            }

            currentCat = { cat: dataRaw, catRow: r, coas: [] };
            currentCoa = null;
        }

        if (currentCat) {
            if (currentCoa) {
                currentCat.coas.push(currentCoa!);
            }

            catGroups.push(currentCat);
        }

        const pairs = catGroups.flatMap((g) =>
            g.coas.map((c) => ({
                category: g.cat,
                coa: c.coa,
                catRow: g.catRow,
                coaRow: c.coaRow,
                items: c.items,
                section: sectionName,
            })),
        );

        return { catGroups, pairs };
    }

    function handleLogRelationships() {
        if (!workbook || selectedSheets.length === 0) return;

        const allSheetData: Array<{
            sheet: string;
            sections: Record<string, any>;
            pairs: ExtractedPair[];
        }> = [];
        const combinedAllPairs: ExtractedPair[] = [];

        for (const sheet of selectedSheets) {
            const ws = workbook.getWorksheet(sheet);

            if (!ws) continue;

            const effective = getEffectiveConfig(sheet);

            if (
                effective.rowConfig.headerRow === '' ||
                effective.rowConfig.headerRow == null
            ) {
                continue;
            }

            const lastRow = ws.actualRowCount;
            const procurementStart = effective.rowConfig.headerRow + 1;
            const procurementEnd = effective.rowConfig.additionalItemsHeaderRow
                ? effective.rowConfig.additionalItemsHeaderRow - 1
                : effective.rowConfig.nonProcurementHeaderRow
                  ? effective.rowConfig.nonProcurementHeaderRow - 1
                  : lastRow;
            const additionalStart = effective.rowConfig.additionalItemsHeaderRow
                ? effective.rowConfig.additionalItemsHeaderRow + 1
                : -1;
            const additionalEnd = effective.rowConfig.nonProcurementHeaderRow
                ? effective.rowConfig.nonProcurementHeaderRow - 1
                : lastRow;
            const nonProcStart = effective.rowConfig.nonProcurementHeaderRow
                ? effective.rowConfig.nonProcurementHeaderRow + 1
                : -1;
            const nonProcEnd = lastRow;

            const sections: Record<string, any> = {};

            const proc = extractRelationshipsForSection(
                ws,
                effective,
                'procurement',
                procurementStart,
                procurementEnd,
            );
            const procPairsWithSheet = proc.pairs.map((p) => ({ ...p, sheet }));
            sections.procurement = {
                range: [procurementStart, procurementEnd],
                catGroups: proc.catGroups,
                pairs: procPairsWithSheet,
                count: procPairsWithSheet.length,
            };

            if (effective.rowConfig.additionalItemsHeaderRow) {
                const add = extractRelationshipsForSection(
                    ws,
                    effective,
                    'additional',
                    additionalStart,
                    additionalEnd,
                );
                const addPairsWithSheet = add.pairs.map((p) => ({
                    ...p,
                    sheet,
                }));
                sections.additional = {
                    range: [additionalStart, additionalEnd],
                    catGroups: add.catGroups,
                    pairs: addPairsWithSheet,
                    count: addPairsWithSheet.length,
                };
            } else {
                sections.additional = {
                    skipped: 'additionalItemsHeaderRow not calibrated',
                };
            }

            if (effective.rowConfig.nonProcurementHeaderRow) {
                const non = extractRelationshipsForSection(
                    ws,
                    effective,
                    'non-procurement',
                    nonProcStart,
                    nonProcEnd,
                );
                const nonPairsWithSheet = non.pairs.map((p) => ({
                    ...p,
                    sheet,
                }));
                sections['non-procurement'] = {
                    range: [nonProcStart, nonProcEnd],
                    catGroups: non.catGroups,
                    pairs: nonPairsWithSheet,
                    count: nonPairsWithSheet.length,
                };
            } else {
                sections['non-procurement'] = {
                    skipped: 'nonProcurementHeaderRow not calibrated',
                };
            }

            const pairsForSheet: ExtractedPair[] = [];
            pairsForSheet.push(...procPairsWithSheet);

            if ((sections.additional as any).pairs) {
                pairsForSheet.push(...(sections.additional as any).pairs);
            }

            if ((sections['non-procurement'] as any).pairs) {
                pairsForSheet.push(
                    ...(sections['non-procurement'] as any).pairs,
                );
            }

            allSheetData.push({ sheet, sections, pairs: pairsForSheet });
            combinedAllPairs.push(...pairsForSheet);
        }

        const seen = new Map<string, ExtractedPair>();

        for (const p of combinedAllPairs) {
            const key = `${normalize(p.category)}|${normalize(p.coa)}`;

            if (!seen.has(key)) seen.set(key, p);
        }

        const uniquePairs = [...seen.values()];
        const duplicates = combinedAllPairs.length - uniquePairs.length;

        const mappingSet = new Set(
            existingMappings.map(
                (m) => `${m.ppmp_category_id}|${m.chart_of_account_id}`,
            ),
        );
        const verifiedPairs: VerifiedPair[] = uniquePairs.map((p) => {
            const catNorm = normalize(p.category);
            const coaNorm = normalize(p.coa);
            const sheetCfg = getEffectiveConfig(p.sheet ?? '');
            const catRes = getCategoryMatch(catNorm, existingCategories);
            const coaRes = getCoaMatch(
                coaNorm,
                existingCoas,
                sheetCfg.coaMatchField ?? 'account_title',
            );
            const catExists = catRes.type === 'strict';
            const coaExists = coaRes.type === 'strict';
            const catId = catRes.match?.id ?? null;
            const coaId = coaRes.match?.id ?? null;
            const mappingExists =
                catId !== null &&
                coaId !== null &&
                mappingSet.has(`${catId}|${coaId}`);

            return {
                category: p.category,
                coa: p.coa,
                section: p.section,
                sheet: p.sheet ?? '',
                catRow: p.catRow,
                coaRow: p.coaRow,
                items: p.items,
                catNorm,
                coaNorm,
                catMatchType: catRes.type,
                catMatch: catRes.match ?? null,
                catTopMatches: catRes.topMatches ?? [],
                coaMatchType: coaRes.type,
                coaMatch: coaRes.match ?? null,
                coaTopMatches: coaRes.topMatches ?? [],
                catExists,
                coaExists,
                catId,
                coaId,
                mappingExists,
            };
        });

        const catFound = verifiedPairs.filter((v) => v.catExists).length;
        const coaFound = verifiedPairs.filter((v) => v.coaExists).length;
        const mappingFound = verifiedPairs.filter(
            (v) => v.mappingExists,
        ).length;
        const missingCat = verifiedPairs.filter((v) => !v.catExists).length;
        const missingCoa = verifiedPairs.filter((v) => !v.coaExists).length;
        const missingMapping = verifiedPairs.filter(
            (v) => v.catExists && v.coaExists && !v.mappingExists,
        ).length;

        setVerification({
            total: verifiedPairs.length,
            catFound,
            coaFound,
            mappingFound,
            missingCat,
            missingCoa,
            missingMapping,
            verifiedPairs,
        });
        setActiveVerifySheet(selectedSheets[0] ?? '');

        const result = {
            sheets: selectedSheets,
            file: fileName,
            sheetsData: allSheetData,
            combined: {
                totalPairs: combinedAllPairs.length,
                uniquePairs,
                uniqueCount: uniquePairs.length,
                duplicates,
                allPairs: combinedAllPairs,
            },
            db: {
                total: uniquePairs.length,
                catFound,
                coaFound,
                mappingFound,
                missingCat,
                missingCoa,
                missingMapping,
                verifiedPairs,
            },
        };

        console.log(
            `[Category COA Mapping] Relationships — ${selectedSheets.join(', ')} (all sheets, all sections)`,
            result,
        );

        for (const sd of allSheetData) {
            console.log(
                `Sheet ${sd.sheet} — Procurement pairs: ${sd.sections.procurement.count}`,
                sd.sections.procurement.pairs,
            );

            if ((sd.sections.additional as any).pairs) {
                console.log(
                    `Sheet ${sd.sheet} — Additional pairs: ${sd.sections.additional.count}`,
                    sd.sections.additional.pairs,
                );
            }

            if ((sd.sections['non-procurement'] as any).pairs) {
                console.log(
                    `Sheet ${sd.sheet} — Non-Procurement pairs: ${sd.sections['non-procurement'].count}`,
                    sd.sections['non-procurement'].pairs,
                );
            }
        }

        console.table(
            uniquePairs.map((p) => ({
                sheet: p.sheet,
                section: p.section,
                category: p.category,
                coa: p.coa,
                catRow: p.catRow,
                coaRow: p.coaRow,
                items: p.items,
            })),
        );
        console.log(
            `Combined unique Category ↔ COA relationships: ${uniquePairs.length} (from ${combinedAllPairs.length} raw, ${duplicates} dupes) — flat list counts per sheet/section above`,
        );

        if (uniquePairs.some((p) => p.category.includes('Uncategorized'))) {
            console.log(
                'Sentinel usage: pairs with Additional/Non-Procurement (Uncategorized) are COA-only rows mapped to sentinels 276/277',
            );
        }

        console.log(
            `[Category COA Mapping] DB Verification — ${selectedSheets.join(', ')} (multi-sheet) — ${verifiedPairs.length} unique pairs checked against DB`,
            {
                summary: {
                    totalUnique: verifiedPairs.length,
                    categoriesInDB: `${catFound}/${verifiedPairs.length}`,
                    coasInDB: `${coaFound}/${verifiedPairs.length}`,
                    mappingsInDB: `${mappingFound}/${verifiedPairs.length}`,
                    missingCategory: missingCat,
                    missingCoa: missingCoa,
                    missingMappingButBothExist: missingMapping,
                },
                existingCounts: {
                    categories: existingCategories.length,
                    coas: existingCoas.length,
                    mappings: existingMappings.length,
                },
                verifiedPairs,
            },
        );
        console.table(
            verifiedPairs.map((v) => ({
                sheet: v.sheet,
                section: v.section,
                category: v.category,
                catExists: v.catExists
                    ? `✅ ${v.catId}`
                    : v.catMatchType === 'partial'
                      ? `~ partial`
                      : '❌ missing',
                coa: v.coa,
                coaExists: v.coaExists
                    ? `✅ ${v.coaId} (${v.coaMatch?.path})`
                    : v.coaMatchType === 'partial'
                      ? `~ partial`
                      : '❌ missing',
                mapping: v.mappingExists
                    ? '✅ exists'
                    : v.catExists && v.coaExists
                      ? '❌ not mapped'
                      : '—',
                catRow: v.catRow,
                coaRow: v.coaRow,
                items: v.items,
            })),
        );

        if (missingCat > 0) {
            console.log(
                `Missing categories (${missingCat}):`,
                verifiedPairs
                    .filter((v) => !v.catExists)
                    .map((v) => ({
                        sheet: v.sheet,
                        category: v.category,
                        matchType: v.catMatchType,
                        topMatches: v.catTopMatches,
                    })),
            );
            console.table(
                verifiedPairs
                    .filter((v) => !v.catExists)
                    .map((v) => ({
                        sheet: v.sheet,
                        category: v.category,
                        normalized: v.catNorm,
                        matchType: v.catMatchType,
                        topSuggestions:
                            v.catTopMatches
                                .map(
                                    (m) =>
                                        `${m.category.name} (lev ${m.score})`,
                                )
                                .join(' | ') || '—',
                    })),
            );
        }

        if (missingCoa > 0) {
            console.log(
                `Missing COAs (${missingCoa}):`,
                verifiedPairs
                    .filter((v) => !v.coaExists)
                    .map((v) => ({
                        sheet: v.sheet,
                        coa: v.coa,
                        matchType: v.coaMatchType,
                        topMatches: v.coaTopMatches,
                    })),
            );
            console.table(
                verifiedPairs
                    .filter((v) => !v.coaExists)
                    .map((v) => ({
                        sheet: v.sheet,
                        coa: v.coa,
                        normalized: v.coaNorm,
                        matchType: v.coaMatchType,
                        topSuggestions:
                            v.coaTopMatches
                                .map(
                                    (m: { coa: ExistingCoa; score: number }) =>
                                        `${m.coa.account_title} [${m.coa.path}] (score ${m.score})`,
                                )
                                .join(' | ') || '—',
                    })),
            );
        }

        if (missingMapping > 0) {
            console.log(
                `Mappings not yet in DB but both sides exist (${missingMapping}):`,
                verifiedPairs.filter(
                    (v) => v.catExists && v.coaExists && !v.mappingExists,
                ),
            );
            console.table(
                verifiedPairs
                    .filter(
                        (v) => v.catExists && v.coaExists && !v.mappingExists,
                    )
                    .map((v) => ({
                        sheet: v.sheet,
                        category: `${v.category} [${v.catId}]`,
                        coa: `${v.coa} [${v.coaId}] ${v.coaMatch?.path}`,
                        section: v.section,
                    })),
            );
        }

        console.log(
            `DB Verify Summary: ${catFound}/${verifiedPairs.length} categories ✅, ${coaFound}/${verifiedPairs.length} COAs ✅, ${mappingFound}/${verifiedPairs.length} mappings ✅, ${missingMapping} mappings missing`,
        );
    }

    function handleLog() {
        if (!workbook || selectedSheets.length === 0) return;

        const sheet = currentSheet || selectedSheets[0];
        const ws = workbook.getWorksheet(sheet);
        const effective = getEffectiveConfig(sheet);
        console.log(`[Category COA Mapping] Sheet: ${sheet}`, ws);
        console.log(`Workbook sheets:`, sheets);
        console.log(`File:`, fileName);
        console.log(`Calibration (columnConfig):`, effective.columnConfig);
        console.log(`Calibration (rowConfig):`, effective.rowConfig);
        console.log(`Calibration (coaMatchField):`, effective.coaMatchField);
        console.log(`Calibration (coaLabelMode):`, effective.coaLabelMode);
        console.log(`Calibration (full):`, effective);

        if (ws) {
            console.log(
                `Row count:`,
                ws.rowCount,
                `Actual row count:`,
                ws.actualRowCount,
            );
            console.log(
                `Preview with calibration — headerRow ${effective.rowConfig.headerRow === '' || effective.rowConfig.headerRow == null ? '—' : effective.rowConfig.headerRow} → data starts ${effective.rowConfig.headerRow === '' || effective.rowConfig.headerRow == null ? '—' : effective.rowConfig.headerRow + 1}, category ${effective.columnConfig.category}, coa ${effective.columnConfig.coa}, coaMatchField ${effective.coaMatchField}, coaLabelMode ${effective.coaLabelMode}, additional ${effective.rowConfig.additionalItemsHeaderRow ?? '—'}, nonProc ${effective.rowConfig.nonProcurementHeaderRow ?? '—'}`,
            );

            if (
                effective.rowConfig.headerRow === '' ||
                effective.rowConfig.headerRow == null
            ) {
                return;
            }

            const startRow = effective.rowConfig.headerRow + 1;
            const endRow = Math.min(startRow + 9, ws.rowCount);
            const rows: Array<{
                row: number;
                category: string | null;
                coa: string | null;
                sentinel: string | null;
                section: string;
            }> = [];

            for (let r = startRow; r <= endRow; r++) {
                if (
                    r === effective.rowConfig.additionalItemsHeaderRow ||
                    r === effective.rowConfig.nonProcurementHeaderRow
                ) {
                    rows.push({
                        row: r,
                        category: '[HEADER ROW]',
                        coa: '[HEADER ROW]',
                        sentinel: null,
                        section: 'header',
                    });
                    continue;
                }

                const row = ws.getRow(r);
                const cat = cellText(
                    row.getCell(effective.columnConfig.category),
                );
                const coa = cellText(row.getCell(effective.columnConfig.coa));
                let sentinel: string | null = null;
                let section = 'procurement';

                if (
                    effective.rowConfig.additionalItemsHeaderRow &&
                    r > effective.rowConfig.additionalItemsHeaderRow
                ) {
                    if (
                        effective.rowConfig.nonProcurementHeaderRow &&
                        r > effective.rowConfig.nonProcurementHeaderRow
                    ) {
                        section = 'non-procurement';

                        if (!cat && coa)
                            sentinel = 'Non-Procurement (Uncategorized) [277]';
                    } else {
                        section = 'additional';

                        if (!cat && coa)
                            sentinel = 'Additional Items (Uncategorized) [276]';
                    }
                } else if (
                    effective.rowConfig.nonProcurementHeaderRow &&
                    r > effective.rowConfig.nonProcurementHeaderRow
                ) {
                    section = 'non-procurement';

                    if (!cat && coa)
                        sentinel = 'Non-Procurement (Uncategorized) [277]';
                }

                if (!cat && coa && !sentinel && section === 'procurement') {
                    sentinel = '— (no category, no sentinel)';
                }

                rows.push({ row: r, category: cat, coa, sentinel, section });
            }

            console.table(rows);
            console.log(
                'Sentinels: 276=Additional (is_additional), 277=Non-Proc (is_non_procurement+is_additional) — COA-only rows map to these when section headers calibrated',
            );

            for (let r = 1; r <= Math.min(5, ws.rowCount); r++) {
                const row = ws.getRow(r);
                const values = (row.values as unknown[])?.slice(1);
                console.log(`Row ${r} raw:`, values);
            }
        }
    }

    // ----- Build the state object once -----
    const s: CategoryCoaMappingState = {
        sheets,
        workbook,
        fileName,
        selectedSheets,
        loading,
        error,

        step,
        setStep,
        canCalibrate,
        canVerifyFormat,
        hasFormatResult,
        formatValid,
        canVerifyMap,
        canReview,

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
        handleRowConfigChange,
        handleColumnConfigChange,
        handleMatchFieldChange,
        handleCoaLabelModeChange,
        handleResetCalibration,

        handleFileChange,
        handleSheetToggle,
        handleSheetClick,

        formatResults,
        activeFormatSheet,
        setActiveFormatSheet,
        handleVerifyFormat,

        verification,
        effectiveVerification,
        activeVerifySheet,
        setActiveVerifySheet,
        coaOverrides,
        setCoaOverrides,
        handleCoaOverrideChange,
        handleClearOverride,
        handleLog,
        handleLogRelationships,
        isSaving,
        handleBulkCreateMappings,

        existingCategories,
        existingCoas,
        existingMappings,
    };

    return (
        <ScrollArea className="h-[calc(100vh-3rem)]">
            <Head title="Category COA Mapping" />
            <div className="flex flex-col gap-4 p-4">
                <h1 className="text-2xl font-bold">Category COA Mapping</h1>
                <p className="text-muted-foreground text-sm">
                    Bulk import Category ↔ COA mappings from XLSX. Calibrate,
                    verify format, and create mappings in bulk.
                </p>

                {fileName && !loading && (
                    <div className="bg-card supports-[backdrop-filter]:bg-muted/30 sticky top-0 z-10 flex items-center gap-2 rounded-md border px-3 py-2 text-sm backdrop-blur">
                        <span
                            className="max-w-[42ch] truncate font-medium"
                            title={fileName}
                        >
                            {fileName}
                        </span>
                        <span className="text-muted-foreground hidden sm:inline">
                            •
                        </span>
                        <span className="text-muted-foreground truncate">
                            {selectedSheets.length > 0
                                ? `${selectedSheets.length}/${sheets.length} sheets: ${selectedSheets.join(', ')}`
                                : `${sheets.length} sheet${sheets.length === 1 ? '' : 's'} found`}
                        </span>
                        {selectedSheets.length > 0 &&
                            selectedSheets.length !== sheets.length && (
                                <span className="text-muted-foreground hidden text-xs sm:inline">
                                    ({sheets.length} total)
                                </span>
                            )}
                    </div>
                )}

                <Tabs value={step} onValueChange={(v) => setStep(v as CcmStep)}>
                    <TabsList>
                        <TabsTrigger value="upload">
                            1. Upload{' '}
                            {selectedSheets.length > 0 && (
                                <span className="text-muted-foreground ml-1 text-xs">
                                    {selectedSheets.length}✓
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="calibrate" disabled={!canCalibrate}>
                            2. Calibrate{' '}
                            {sharedConfig ? (
                                <span className="text-muted-foreground ml-1 text-xs">
                                    H
                                    {sharedConfig.rowConfig.headerRow === '' ||
                                    sharedConfig.rowConfig.headerRow == null
                                        ? '—'
                                        : sharedConfig.rowConfig.headerRow}{' '}
                                    {calibrationMode === 'shared'
                                        ? 'shared'
                                        : 'per-sheet'}
                                </span>
                            ) : null}
                        </TabsTrigger>
                        <TabsTrigger
                            value="verifyFormat"
                            disabled={!canVerifyFormat}
                        >
                            3. Verify Format{' '}
                            {hasFormatResult ? (
                                <span
                                    className={`ml-1 text-xs ${formatValid ? 'text-green-600' : 'text-amber-600'}`}
                                >
                                    {formatValid
                                        ? `✓ ${selectedSheets.length}`
                                        : `❌ ${Object.values(formatResults).filter((r) => !r.valid).length}/${selectedSheets.length}`}
                                </span>
                            ) : null}
                        </TabsTrigger>
                        <TabsTrigger value="verifyMap" disabled={!canVerifyMap}>
                            4. Verify & Map{' '}
                            {verification ? (
                                <span className="text-muted-foreground ml-1 text-xs">
                                    {verification.missingMapping} missing
                                </span>
                            ) : null}
                        </TabsTrigger>
                        <TabsTrigger value="review" disabled={!canReview}>
                            5. Review & Save{' '}
                            {effectiveVerification ? (
                                <span className="text-muted-foreground ml-1 text-xs">
                                    {effectiveVerification.effMissingMapping} to
                                    create
                                </span>
                            ) : null}
                        </TabsTrigger>
                    </TabsList>

                    <UploadStep s={s} />
                    <CalibrateStep s={s} />
                    <VerifyFormatStep s={s} />
                    <VerifyMapStep s={s} />
                    <ReviewStep s={s} />
                </Tabs>
            </div>

            <ScrollBar orientation="vertical" />
        </ScrollArea>
    );
}

CategoryCoaMappingPage.layout = {
    breadcrumbs: [
        { title: 'Imports', href: importsIndex().url },
        { title: 'Category COA Mapping', href: categoryCoaMappingIndex().url },
    ],
};
