// resources/js/pages/price-list-import/index.tsx

import { Head, Link, router } from '@inertiajs/react';
import ExcelJS from 'exceljs';
import { FileSpreadsheet } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cellText } from '@/lib/excel/cell-helpers';
import {
    formatCoaOption,
    groupUnmatchedByExtractedCoa,
    parseCoaOptionId,
} from '@/lib/ppmp/batch-match';
import type { ExtractedCoaGroup } from '@/lib/ppmp/batch-match';
import {
    normalize,
    isTotalRow,
    getCategoryMatch,
    getCoaMatch,
} from '@/lib/ppmp/normalize';
import type { ExistingCategory, ExistingCoa } from '@/lib/ppmp/normalize';
import { getDefaultSharedConfig } from '@/lib/ppmp/sheet-config';

import type {
    CalibrationMode,
    ExistingMapping,
    ExistingPriceList,
    PriceListImportState,
    PriceListSheetConfig,
    PliStep,
    RawItem,
    ReviewFilter,
    UniqueItem,
    VerifiedItem,
    VerifyResult,
} from './types';
import { UploadStep } from './steps/upload-step';
import { CalibrateStep } from './steps/calibrate-step';
import { VerifyStep } from './steps/verify-step';
import { ReviewStep } from './steps/review-step';

function getDefaultPriceListConfig(): PriceListSheetConfig {
    return getDefaultSharedConfig();
}

interface PriceListImportProps {
    existingCategories: ExistingCategory[];
    existingCoas: ExistingCoa[];
    existingMappings: ExistingMapping[];
    existingPriceLists: ExistingPriceList[];
}

export default function PriceListImport({
    existingCategories,
    existingCoas,
    existingMappings,
    existingPriceLists,
}: PriceListImportProps) {
    const [sheets, setSheets] = useState<string[]>([]);
    const [workbook, setWorkbook] = useState<ExcelJS.Workbook | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [calibrationMode, setCalibrationMode] =
        useState<CalibrationMode>('shared');
    const [sharedConfig, setSharedConfig] =
        useState<PriceListSheetConfig | null>(null);
    const [calibrations, setCalibrations] = useState<
        Record<string, PriceListSheetConfig>
    >({});
    const [currentSheet, setCurrentSheet] = useState<string>('');

    const [verifyResults, setVerifyResults] = useState<
        Record<string, VerifyResult>
    >({});
    const [activeVerifySheet, setActiveVerifySheet] = useState<string>('');
    const [rawItems, setRawItems] = useState<RawItem[]>([]);
    const [uniqueItems, setUniqueItems] = useState<UniqueItem[]>([]);
    const [step, setStep] = useState<PliStep>('upload');
    const [importing, setImporting] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [coaOverrides, setCoaOverrides] = useState<Record<string, number>>(
        {},
    );
    const [batchSelections, setBatchSelections] = useState<
        Record<string, string>
    >({});
    const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');
    const [showDuplicateDetails, setShowDuplicateDetails] = useState(false);
    const [excludeMissingCategory, setExcludeMissingCategory] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    function getEffectiveConfig(sheet: string): PriceListSheetConfig {
        if (calibrationMode === 'shared' && sharedConfig) return sharedConfig;

        return (
            calibrations[sheet] ?? sharedConfig ?? getDefaultPriceListConfig()
        );
    }

    const canCalibrate = selectedSheets.length > 0;
    const canVerify =
        canCalibrate &&
        !!workbook &&
        !!sharedConfig &&
        sharedConfig.rowConfig.headerRow !== '' &&
        sharedConfig.rowConfig.headerRow != null;
    const allVerifyValid =
        selectedSheets.length > 0 &&
        selectedSheets.every((s) => verifyResults[s]?.valid);
    const hasAnyVerify = selectedSheets.some((s) => !!verifyResults[s]);
    const canReview = canVerify && hasAnyVerify && allVerifyValid;

    const junctionByPair = useMemo(() => {
        const m = new Map<string, number>();

        for (const mm of existingMappings) {
            m.set(`${mm.chart_of_account_id}|${mm.ppmp_category_id}`, mm.id);
        }

        return m;
    }, [existingMappings]);

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

    function handleClearAllOverrides() {
        setCoaOverrides({});
        setBatchSelections({});
    }

    function handleBatchApplyGroup(group: ExtractedCoaGroup) {
        const picked =
            batchSelections[group.coaNorm] ??
            (group.topSuggestion ? formatCoaOption(group.topSuggestion) : '');
        const id = parseCoaOptionId(picked) ?? group.topSuggestion?.id ?? null;

        if (id === null) return;

        setCoaOverrides((prev) => {
            const next = { ...prev };

            for (const k of group.rowKeys) next[k] = id;

            return next;
        });
    }

    function handleTruncateDescription(rowKey: string) {
        setUniqueItems((prev) =>
            prev.map((u) => {
                if (u.key !== rowKey) return u;

                const truncated = u.description.trim().slice(0, 1000);

                return { ...u, description: truncated };
            }),
        );
    }

    function handleTruncateAllLongDescriptions() {
        setUniqueItems((prev) =>
            prev.map((u) => {
                if (u.description.trim().length <= 1000) return u;

                const truncated = u.description.trim().slice(0, 1000);

                return { ...u, description: truncated };
            }),
        );
    }

    const verifiedItems: VerifiedItem[] = useMemo(() => {
        if (uniqueItems.length === 0) return [];

        return uniqueItems.map((u) => {
            const catNorm = normalize(u.category);
            const coaNorm = normalize(u.coa);
            const catRes = getCategoryMatch(catNorm, existingCategories);
            const coaRes = getCoaMatch(coaNorm, existingCoas, 'account_title');
            const catExists = catRes.type === 'strict';
            const coaExists = coaRes.type === 'strict';
            const catId = catRes.match?.id ?? null;
            const coaId = coaRes.match?.id ?? null;

            const overrideId = coaOverrides[u.key] ?? null;
            const effectiveCoa = overrideId
                ? (existingCoas.find((c) => c.id === overrideId) ?? null)
                : (coaRes.match ?? null);
            const effectiveCoaExists = !!effectiveCoa;
            const effectiveCoaId = effectiveCoa?.id ?? null;
            const effectiveCoaMatchType: VerifiedItem['effectiveCoaMatchType'] =
                effectiveCoa ? 'strict' : coaRes.type;
            const effectiveJunctionId =
                catId && effectiveCoaId
                    ? (junctionByPair.get(`${effectiveCoaId}|${catId}`) ?? null)
                    : null;
            const effectiveMappingExists = effectiveJunctionId !== null;

            const unitValid =
                u.unit.trim() !== '' && u.unit.trim().length <= 20;
            const priceValid = u.price !== null && u.price > 0;
            const descriptionValid =
                u.description.trim().length > 0 &&
                u.description.trim().length <= 1000;
            let effectivePriceListExists = false;

            if (effectiveMappingExists && effectiveJunctionId) {
                effectivePriceListExists = existingPriceLists.some(
                    (p) =>
                        p.chart_of_account_ppmp_category_id ===
                            effectiveJunctionId &&
                        normalize(p.description) === normalize(u.description) &&
                        normalize(p.unit_of_measurement) === normalize(u.unit),
                );
            }

            let status: VerifiedItem['status'] = 'ready';
            let message = 'Ready to import';

            if (!catExists) {
                if (excludeMissingCategory) {
                    status = 'skipped';
                    message = 'Skipped — category not found (excluded)';
                } else {
                    status = 'error';
                    message = 'Category not found — create via Category Import';
                }
            } else if (!effectiveCoaExists) {
                status = 'error';
                message = 'COA not found';
            } else if (!effectiveMappingExists) {
                status = 'error';
                message =
                    'Mapping not found — create via Category–COA Mappings';
            } else if (!descriptionValid) {
                status = 'error';
                message =
                    u.description.trim().length === 0
                        ? 'Description required'
                        : `Description >1000 chars (${u.description.trim().length}) — will be truncated or shorten`;
            } else if (!unitValid) {
                status = 'error';
                message =
                    u.unit.trim() === '' ? 'Unit required' : 'Unit >20 chars';
            } else if (!priceValid) {
                status = 'error';
                message = 'Price must be >0';
            } else if (effectivePriceListExists) {
                status = 'update';
                message = 'Exists — will update price';
            }

            return {
                ...u,
                catNorm,
                coaNorm,
                categoryId: catId,
                coaId,
                mappingId: effectiveJunctionId,
                junctionId: effectiveJunctionId,
                catExists,
                coaExists,
                mappingExists: effectiveMappingExists,
                priceListExists: effectivePriceListExists,
                catMatchType: catRes.type,
                coaMatchType: coaRes.type,
                catTopMatches: catRes.topMatches ?? [],
                coaTopMatches: coaRes.topMatches ?? [],
                catMatch: catRes.match ?? null,
                coaMatch: coaRes.match ?? null,
                effectiveCoa,
                effectiveCoaId,
                effectiveCoaExists,
                effectiveCoaMatchType,
                effectiveJunctionId,
                effectiveMappingExists,
                effectivePriceListExists,
                overrideId,
                unitValid,
                priceValid,
                descriptionValid,
                status,
                message,
            };
        });
    }, [
        uniqueItems,
        existingCategories,
        existingCoas,
        junctionByPair,
        existingPriceLists,
        coaOverrides,
        excludeMissingCategory,
    ]);

    const batchGroups = useMemo(
        () => groupUnmatchedByExtractedCoa(verifiedItems),
        [verifiedItems],
    );

    const importable = verifiedItems.filter(
        (v) => v.status === 'ready' || v.status === 'update',
    );
    const importableSelected = importable.filter((v) => selected.has(v.key));
    const readyCount = importable.length;
    const errorCount = verifiedItems.filter((v) => v.status === 'error').length;
    const updateCount = verifiedItems.filter(
        (v) => v.status === 'update',
    ).length;
    const insertCount = verifiedItems.filter(
        (v) => v.status === 'ready',
    ).length;
    const missingMappingCount = verifiedItems.filter(
        (v) => !v.effectiveMappingExists && v.catExists && v.effectiveCoaExists,
    ).length;
    const missingCategoryCount = verifiedItems.filter(
        (v) => !v.catExists,
    ).length;
    const skippedCount = verifiedItems.filter(
        (v) => v.status === 'skipped',
    ).length;

    const duplicateCount = rawItems.length - uniqueItems.length;
    const duplicateItems = useMemo(
        () => verifiedItems.filter((v) => v.count > 1),
        [verifiedItems],
    );
    const longDescriptionCount = verifiedItems.filter(
        (v) => !v.descriptionValid,
    ).length;

    const filteredItems = useMemo(() => {
        if (reviewFilter === 'duplicates')
            return verifiedItems.filter((v) => v.count > 1);

        if (reviewFilter === 'errors')
            return verifiedItems.filter((v) => v.status === 'error');

        if (reviewFilter === 'longDesc')
            return verifiedItems.filter((v) => !v.descriptionValid);

        return verifiedItems;
    }, [verifiedItems, reviewFilter]);

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
        setVerifyResults({});
        setActiveVerifySheet('');
        setRawItems([]);
        setUniqueItems([]);
        setSelected(new Set());
        setCoaOverrides({});
        setReviewFilter('all');
        setShowDuplicateDetails(false);
        setStep('upload');

        try {
            const wb = new ExcelJS.Workbook();
            const buf = await file.arrayBuffer();
            await wb.xlsx.load(buf);
            setWorkbook(wb);
            setSheets(wb.worksheets.map((ws) => ws.name));
        } catch {
            setError('Failed to parse .xlsx file.');
            setSheets([]);
            setWorkbook(null);
            setSelectedSheets([]);
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
            setVerifyResults({});
            setActiveVerifySheet(next[0] ?? '');
            setRawItems([]);
            setUniqueItems([]);
            setSelected(new Set());
            setCoaOverrides({});
            setReviewFilter('all');
            setShowDuplicateDetails(false);

            if (next.length > 0 && !next.includes(currentSheet))
                setCurrentSheet(next[0]);

            if (next.length === 0) setCurrentSheet('');

            return next;
        });
    }

    function ensureCalibrationsInitialized() {
        if (sharedConfig) return;

        const def = getDefaultPriceListConfig();
        setSharedConfig(def);
        const clones: Record<string, PriceListSheetConfig> = {};

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

        const next: Record<string, PriceListSheetConfig> = {};

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

        const next: Record<string, PriceListSheetConfig> = {};

        for (const s of selectedSheets) {
            next[s] = {
                ...src,
                columnConfig: { ...src.columnConfig },
                rowConfig: { ...src.rowConfig },
            };
        }

        setCalibrations(next);
    }

    function updateSharedConfig(patch: Partial<PriceListSheetConfig>) {
        setSharedConfig((prev) => ({
            ...(prev ?? getDefaultPriceListConfig()),
            ...patch,
        }));
    }

    function updateCurrentCalibration(patch: Partial<PriceListSheetConfig>) {
        if (!currentSheet) return;

        setCalibrations((prev) => ({
            ...prev,
            [currentSheet]: {
                ...(prev[currentSheet] ??
                    sharedConfig ??
                    getDefaultPriceListConfig()),
                ...patch,
            },
        }));
    }

    function verifySheet(
        sheet: string,
        cfg: PriceListSheetConfig,
    ): VerifyResult {
        if (!workbook) {
            return {
                valid: false,
                message: 'Workbook not loaded',
                errors: [{ row: 0, message: 'Workbook not loaded' }],
                details: [],
            };
        }

        const ws = workbook.getWorksheet(sheet);

        if (!ws) {
            return {
                valid: false,
                message: `Worksheet "${sheet}" not found`,
                errors: [{ row: 0, message: `Worksheet "${sheet}" not found` }],
                details: [],
            };
        }

        const { category, coa, unit, price, itemNumber } = cfg.columnConfig;
        const { headerRow, additionalItemsHeaderRow, nonProcurementHeaderRow } =
            cfg.rowConfig;
        const { coaLabelMode } = cfg;
        const lastRow = ws.actualRowCount;

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
                details: [],
            };
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

        const errors: Array<{ row: number; message: string }> = [];
        const details: string[] = [];
        details.push(`COA label mode: ${coaLabelMode}`);
        details.push(
            `Ranges: procurement [${procurementStart}..${procurementEnd}] additional [${additionalStart}..${additionalEnd}] non-proc [${nonProcStart}..${nonProcEnd}]`,
        );

        const countData = (s: number, e: number) => {
            if (s < 0 || e < 0 || s > e) return 0;

            let c = 0;

            for (let r = s; r <= e && r <= lastRow; r++) {
                if (cellText(ws.getRow(r).getCell(category))) c++;
            }

            return c;
        };
        const groups = {
            procurement: countData(procurementStart, procurementEnd),
            additional: additionalItemsHeaderRow
                ? countData(additionalStart, additionalEnd)
                : 0,
            nonProcurement: nonProcurementHeaderRow
                ? countData(nonProcStart, nonProcEnd)
                : 0,
        };

        if (!additionalItemsHeaderRow) {
            details.push(
                'Additional Items header not calibrated — skipping additional check',
            );
        }

        if (!nonProcurementHeaderRow) {
            details.push(
                'Non-Procurement header not calibrated — skipping non-proc check',
            );
        }

        if (procurementStart > procurementEnd) {
            errors.push({
                row: procurementStart,
                message: `Procurement range invalid [${procurementStart}..${procurementEnd}]`,
            });
        } else if (groups.procurement === 0) {
            errors.push({
                row: procurementStart,
                message: 'No data found in procurement group',
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
                    const coaRaw = cellText(row.getCell(coa));
                    const dataRaw = cellText(row.getCell(category));
                    const unitRaw = cellText(row.getCell(unit));
                    const priceRaw = cellText(row.getCell(price));
                    const itemRaw = cellText(row.getCell(itemNumber));

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
                            message: `${sectionName} item at row ${r} ("${dataRaw}") missing COA (D)`,
                        });
                    }
                }

                details.push(`${sectionName} items: ${itemCount} rows checked`);

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
                const coaRaw = cellText(row.getCell(coa));
                const dataRaw = cellText(row.getCell(category));

                if (!dataRaw && !coaRaw) continue;

                const coaNorm = coaRaw ? normalize(coaRaw) : null;
                const dataNorm = dataRaw ? normalize(dataRaw) : null;

                if (dataNorm === 'description') continue;

                if (coaNorm && dataRaw) {
                    if (!currentCat) {
                        errors.push({
                            row: r,
                            message: `Item at row ${r} ("${dataRaw}") without active category`,
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
                                        message: `COA "${currentCoa.coa}" at row ${currentCoa.coaRow} has no items before next COA`,
                                    });
                                }

                                currentCat.coas.push(currentCoa);
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
                                message: `Item at row ${r} ("${dataRaw}") without active COA in cat "${currentCat.cat}"`,
                            });
                            continue;
                        }

                        if (coaNorm !== normalize(currentCoa.coa)) {
                            errors.push({
                                row: r,
                                message: `Item COA mismatch at row ${r}: D="${coaRaw}" != current COA "${currentCoa.coa}"`,
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
                            message: `Total "${dataRaw}" at row ${r} without active category`,
                        });
                    } else if (expected && dataNorm !== expected) {
                        errors.push({
                            row: r,
                            message: `Total mismatch at row ${r}: got "${dataRaw}" expected "${currentCat.cat} - TOTAL"`,
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
                                message: `Category "${currentCat.cat}" has no COA groups before total`,
                            });
                        } else {
                            for (const c of currentCat.coas) {
                                if (c.items === 0) {
                                    errors.push({
                                        row: c.coaRow,
                                        message: `COA "${c.coa}" has no items`,
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
                        nextCoaRaw = cellText(ws.getRow(r + 1).getCell(coa));
                        nextCoaNorm = nextCoaRaw ? normalize(nextCoaRaw) : null;

                        if (nextCoaNorm && dataNorm && nextCoaNorm === dataNorm)
                            isCoaLabel = true;
                    }

                    if (isCoaLabel) {
                        if (!currentCat) {
                            errors.push({
                                row: r,
                                message: `COA "${dataRaw}" at row ${r} without active category`,
                            });
                            continue;
                        }

                        if (currentCoa) {
                            if (currentCoa.items === 0) {
                                errors.push({
                                    row: currentCoa.coaRow,
                                    message: `COA "${currentCoa.coa}" has no items before next COA`,
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
                        message: `Category "${dataRaw}" at row ${r} started before previous cat "${currentCat.cat}" closed with " - TOTAL"`,
                    });

                    if (currentCoa) {
                        if (currentCoa.items === 0) {
                            errors.push({
                                row: currentCoa.coaRow,
                                message: `COA "${currentCoa.coa}" has no items`,
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
                            message: `COA "${currentCoa.coa}" has no items at end`,
                        });
                    }

                    currentCat.coas.push(currentCoa);
                }

                if (!currentCat.totalRow) {
                    errors.push({
                        row: currentCat.catRow,
                        message: `Category "${currentCat.cat}" missing closing "${currentCat.cat} - TOTAL"`,
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
                    `${sectionName} groups: ${catGroups.length} cat(s) verified`,
                );

                for (const g of catGroups) {
                    details.push(
                        `  Cat "${g.cat}" row ${g.catRow}: ${g.coas.length} COA(s)${g.totalRow ? ` → total at ${g.totalRow}` : ' MISSING total'}`,
                    );
                }
            }
        };
        verifySection('procurement', procurementStart, procurementEnd);

        if (additionalItemsHeaderRow)
            verifySection('additional', additionalStart, additionalEnd);

        if (nonProcurementHeaderRow)
            verifySection('non-procurement', nonProcStart, nonProcEnd);

        const valid = errors.length === 0;
        const message = valid
            ? `✅ Format OK`
            : `❌ Found ${errors.length} issue(s)`;

        return { valid, message, errors, details };
    }

    function handleVerify() {
        if (!workbook || selectedSheets.length === 0) return;

        if (!sharedConfig) ensureCalibrationsInitialized();

        const next: Record<string, VerifyResult> = {};

        for (const sheet of selectedSheets) {
            const cfg = getEffectiveConfig(sheet);
            const r = verifySheet(sheet, cfg);
            next[sheet] = r;
        }

        setVerifyResults(next);
        const firstInvalid = selectedSheets.find((s) => !next[s]?.valid);
        setActiveVerifySheet(firstInvalid ?? selectedSheets[0] ?? '');
        setRawItems([]);
        setUniqueItems([]);
        setSelected(new Set());
        setCoaOverrides({});
        setReviewFilter('all');
        setShowDuplicateDetails(false);
    }

    function extractItemsForSection(
        ws: ExcelJS.Worksheet,
        cfg: PriceListSheetConfig,
        sectionName: 'procurement' | 'additional' | 'non-procurement',
        startRow: number,
        endRow: number,
    ): RawItem[] {
        const out: RawItem[] = [];
        const dataColumn = cfg.columnConfig.category;
        const coaColumn = cfg.columnConfig.coa;
        const unitColumn = cfg.columnConfig.unit;
        const priceColumn = cfg.columnConfig.price;
        const itemColumn = cfg.columnConfig.itemNumber;
        const coaLabelMode = cfg.coaLabelMode;
        type CatGroup = { cat: string; catRow: number };
        let currentCat: CatGroup | null = null;
        let currentCoa: { coa: string; coaRow: number } | null = null;
        const lastRow = ws.actualRowCount;
        const sheetName = ws.name;

        for (let r = startRow; r <= endRow && r <= lastRow; r++) {
            const row = ws.getRow(r);
            const coaRaw = cellText(row.getCell(coaColumn));
            const dataRaw = cellText(row.getCell(dataColumn));

            if (!dataRaw && !coaRaw) continue;

            const coaNorm = coaRaw ? normalize(coaRaw) : null;
            const dataNorm = dataRaw ? normalize(dataRaw) : null;

            if (dataNorm === 'description') continue;

            const unitRaw = cellText(row.getCell(unitColumn)) ?? '';
            const priceRaw = cellText(row.getCell(priceColumn));
            const itemRaw = cellText(row.getCell(itemColumn));
            const priceNum = priceRaw
                ? Number(priceRaw.replace(/,/g, ''))
                : null;
            const isFalsy = (v: string | null) =>
                !v ||
                normalize(v) === '0' ||
                normalize(v) === '-' ||
                normalize(v) === '0.00';
            const isFalsyPrice =
                !priceRaw ||
                priceNum === 0 ||
                Number.isNaN(priceNum as number) ||
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
                        };
                    } else if (sectionName === 'non-procurement') {
                        currentCat = {
                            cat: 'Non-Procurement (Uncategorized)',
                            catRow: r,
                        };
                    } else continue;
                }

                if (coaLabelMode === 'without-label') {
                    if (!currentCoa || coaNorm !== normalize(currentCoa.coa)) {
                        currentCoa = { coa: coaRaw!, coaRow: r };
                    }
                } else {
                    if (!currentCoa) {
                        currentCoa = { coa: coaRaw!, coaRow: r };
                    } else if (coaNorm !== normalize(currentCoa.coa)) {
                        currentCoa = { coa: coaRaw!, coaRow: r };
                    }
                }

                const effectiveCoa = currentCoa?.coa ?? coaRaw!;
                const effectiveCat = currentCat.cat;
                out.push({
                    sheet: sheetName,
                    row: r,
                    category: effectiveCat,
                    coa: effectiveCoa,
                    description: dataRaw,
                    unit: unitRaw,
                    price:
                        priceNum !== null && !Number.isNaN(priceNum)
                            ? priceNum
                            : null,
                    priceRaw,
                });
                continue;
            }

            if (!dataRaw || !dataNorm) continue;

            if (isTotalRow(dataNorm)) {
                if (currentCat) {
                    if (currentCoa) currentCoa = null;

                    currentCat = null;
                    currentCoa = null;
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
                            };
                        } else if (sectionName === 'non-procurement') {
                            currentCat = {
                                cat: 'Non-Procurement (Uncategorized)',
                                catRow: r,
                            };
                        } else continue;
                    }

                    currentCoa = { coa: dataRaw, coaRow: r };
                    continue;
                }
            }

            if (currentCat) {
                /* push previous cat done */
            }

            currentCat = { cat: dataRaw, catRow: r };
            currentCoa = null;
        }

        return out;
    }

    function handleExtract() {
        if (!workbook || selectedSheets.length === 0) return;

        const all: RawItem[] = [];

        for (const sheet of selectedSheets) {
            const ws = workbook.getWorksheet(sheet);

            if (!ws) continue;

            const cfg = getEffectiveConfig(sheet);

            if (
                cfg.rowConfig.headerRow === '' ||
                cfg.rowConfig.headerRow == null
            )
                continue;

            const lastRow = ws.actualRowCount;
            const procurementStart = cfg.rowConfig.headerRow + 1;
            const procurementEnd = cfg.rowConfig.additionalItemsHeaderRow
                ? cfg.rowConfig.additionalItemsHeaderRow - 1
                : cfg.rowConfig.nonProcurementHeaderRow
                  ? cfg.rowConfig.nonProcurementHeaderRow - 1
                  : lastRow;
            const additionalStart = cfg.rowConfig.additionalItemsHeaderRow
                ? cfg.rowConfig.additionalItemsHeaderRow + 1
                : -1;
            const additionalEnd = cfg.rowConfig.nonProcurementHeaderRow
                ? cfg.rowConfig.nonProcurementHeaderRow - 1
                : lastRow;
            const nonProcStart = cfg.rowConfig.nonProcurementHeaderRow
                ? cfg.rowConfig.nonProcurementHeaderRow + 1
                : -1;
            const nonProcEnd = lastRow;
            all.push(
                ...extractItemsForSection(
                    ws,
                    cfg,
                    'procurement',
                    procurementStart,
                    procurementEnd,
                ),
            );

            if (cfg.rowConfig.additionalItemsHeaderRow) {
                all.push(
                    ...extractItemsForSection(
                        ws,
                        cfg,
                        'additional',
                        additionalStart,
                        additionalEnd,
                    ),
                );
            }

            if (cfg.rowConfig.nonProcurementHeaderRow) {
                all.push(
                    ...extractItemsForSection(
                        ws,
                        cfg,
                        'non-procurement',
                        nonProcStart,
                        nonProcEnd,
                    ),
                );
            }
        }

        setRawItems(all);
        const seen = new Map<string, UniqueItem>();

        for (const it of all) {
            const key = `${normalize(it.category)}|${normalize(it.coa)}|${normalize(it.description)}|${normalize(it.unit)}`;
            const existing = seen.get(key);

            if (!existing) {
                seen.set(key, {
                    key,
                    category: it.category,
                    coa: it.coa,
                    description: it.description,
                    unit: it.unit,
                    price: it.price,
                    sheets: [it.sheet],
                    rows: [it.row],
                    count: 1,
                });
            } else {
                existing.count += 1;

                if (!existing.sheets.includes(it.sheet))
                    existing.sheets.push(it.sheet);

                existing.rows.push(it.row);

                if (existing.price === null && it.price !== null)
                    existing.price = it.price;
            }
        }

        const unique = [...seen.values()].sort((a, b) =>
            a.description.localeCompare(b.description),
        );
        setUniqueItems(unique);
        setSelected(new Set(unique.map((u) => u.key)));
        setCoaOverrides({});
        setReviewFilter('all');
        setShowDuplicateDetails(false);
        console.log('Extract price-list', {
            raw: all.length,
            uniqueCount: unique.length,
            all,
            unique,
        });
    }

    function handleImport() {
        const toImport = verifiedItems.filter(
            (v) =>
                selected.has(v.key) &&
                (v.status === 'ready' || v.status === 'update'),
        );

        if (toImport.length === 0) {
            console.warn(
                'PriceListImport: nothing to import — selected',
                [...selected],
                'verified',
                verifiedItems.length,
            );

            return;
        }

        console.log(
            'PriceListImport: posting',
            toImport.length,
            toImport.slice(0, 3),
        );

        setImporting(true);
        router.post(
            '/price-list-import' as const,
            {
                items: toImport.map((v) => ({
                    chart_of_account_id: v.effectiveCoaId!,
                    ppmp_category_id: v.categoryId!,
                    description: v.description,
                    unit_of_measurement: v.unit,
                    price: v.price!,
                })),
            } as never,
            {
                onFinish: () => setImporting(false),
                onError: (errors) => {
                    console.error('PriceListImport: validation 422', errors);
                    setImporting(false);
                },
                onSuccess: (page) => {
                    console.log(
                        'PriceListImport: success',
                        (page.props as unknown as Record<string, unknown>)
                            ?.flash,
                    );
                },
            },
        );
    }

    // ----- Build the state object once -----
    const s: PriceListImportState = {
        sheets,
        workbook,
        fileName,
        selectedSheets,
        loading,
        error,
        isMounted,

        step,
        setStep,
        canCalibrate,
        canVerify,
        allVerifyValid,
        hasAnyVerify,
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
        updateSharedConfig,
        updateCurrentCalibration,

        handleFileChange,
        handleSheetToggle,

        verifyResults,
        setVerifyResults,
        activeVerifySheet,
        setActiveVerifySheet,
        handleVerify,

        rawItems,
        setRawItems,
        uniqueItems,
        setUniqueItems,
        handleExtract,

        verifiedItems,
        filteredItems,
        batchGroups,
        batchSelections,
        setBatchSelections,
        coaOverrides,
        setCoaOverrides,
        handleCoaOverrideChange,
        handleClearOverride,
        handleClearAllOverrides,
        handleBatchApplyGroup,
        handleTruncateDescription,
        handleTruncateAllLongDescriptions,

        selected,
        setSelected,

        reviewFilter,
        setReviewFilter,
        showDuplicateDetails,
        setShowDuplicateDetails,
        excludeMissingCategory,
        setExcludeMissingCategory,

        readyCount,
        errorCount,
        updateCount,
        insertCount,
        missingMappingCount,
        missingCategoryCount,
        skippedCount,
        duplicateCount,
        duplicateItems,
        longDescriptionCount,
        importable,
        importableSelected,

        importing,
        handleImport,

        existingCategories,
        existingCoas,
        existingMappings,
        existingPriceLists,
    };

    return (
        <ScrollArea className="h-[calc(100vh-3rem)]">
            <Head title="Price List Import" />
            <div className="flex flex-col gap-4 p-4">
                <h1 className="text-2xl font-bold">Price List Import</h1>
                <p className="text-muted-foreground text-sm">
                    Imports <strong>price list only</strong> (no quantities).
                    Requires official{' '}
                    <Link href="/category-import" className="underline">
                        Category Import
                    </Link>{' '}
                    and{' '}
                    <Link href="/category-coa-mapping" className="underline">
                        Category–COA Mappings
                    </Link>{' '}
                    to exist first.
                </p>

                {fileName && !loading && (
                    <div className="sticky top-0 z-10 flex items-center gap-2 rounded-md border px-3 py-2 text-sm backdrop-blur">
                        <FileSpreadsheet className="text-muted-foreground h-4 w-4 shrink-0" />
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
                                : `${sheets.length} sheets found`}
                        </span>
                    </div>
                )}

                <Tabs value={step} onValueChange={(v) => setStep(v as PliStep)}>
                    <TabsList>
                        <TabsTrigger value="upload">
                            1. Upload & Sheets{' '}
                            {selectedSheets.length > 0 && (
                                <span className="text-muted-foreground ml-1 text-xs">
                                    {selectedSheets.length}✓
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="calibrate" disabled={!canCalibrate}>
                            2. Calibrate{' '}
                            {sharedConfig && (
                                <span className="text-muted-foreground ml-1 text-xs">
                                    {calibrationMode}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="verify" disabled={!canVerify}>
                            3. Verify Format{' '}
                            {allVerifyValid && (
                                <span className="ml-1 text-xs text-green-600">
                                    ✓{selectedSheets.length}
                                </span>
                            )}
                            {!allVerifyValid && hasAnyVerify && (
                                <span className="ml-1 text-xs text-amber-600">
                                    {
                                        Object.values(verifyResults).filter(
                                            (r) => r.valid,
                                        ).length
                                    }
                                    /{selectedSheets.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="review" disabled={!canReview}>
                            4. Review & Import{' '}
                            {uniqueItems.length > 0 && (
                                <span className="text-muted-foreground ml-1 text-xs">
                                    {uniqueItems.length}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <UploadStep s={s} />
                    <CalibrateStep s={s} />
                    <VerifyStep s={s} />
                    <ReviewStep s={s} />
                </Tabs>
            </div>

            <ScrollBar orientation="vertical" />
        </ScrollArea>
    );
}

PriceListImport.layout = {
    breadcrumbs: [
        { title: 'Imports', href: '/imports' },
        { title: 'Price List Import', href: '/price-list-import' },
    ],
};
