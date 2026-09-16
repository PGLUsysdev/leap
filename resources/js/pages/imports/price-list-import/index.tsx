// resources/js/pages/imports/price-list-import/index.tsx

import { Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import type ExcelJS from 'exceljs';
import { ImportPageShell } from '@/components/imports/import-page-shell';
import { ImportUploadStep } from '@/components/imports/import-upload-step';
import { useImportWorkbook } from '@/hooks/use-import-workbook';
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
import {
    extractPpmpSheet,
    type PpmpExtractResult,
    type RawPpmpItem,
} from '@/lib/ppmp/extract';
import { extractRawSheets, type RawSheet } from '@/lib/raw-extract';
import { verifyPpmpSheet } from '@/lib/ppmp/verify';

import type {
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
import { ImportPpmpCalibrateStep } from '@/components/imports/import-ppmp-calibrate-step';
import { ImportPpmpVerifyStep } from '@/components/imports/import-verify-step';
import { ImportExtractStep } from '@/components/imports/import-extract-step';
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
    const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
    const [config, setConfig] = useState<PriceListSheetConfig | null>(null);
    const [verifyResults, setVerifyResults] = useState<
        Record<string, VerifyResult>
    >({});
    const [activeVerifySheet, setActiveVerifySheet] = useState<string>('');
    const [rawItems, setRawItems] = useState<RawItem[]>([]);
    const [ppmpExtractResults, setPpmpExtractResults] = useState<
        Record<string, PpmpExtractResult>
    >({});
    const [ppmpRawItems, setPpmpRawItems] = useState<RawPpmpItem[]>([]);
    const [rawSheets, setRawSheets] = useState<Record<string, RawSheet>>({});
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

    const { sheets, workbook, fileName, loading, error, handleFileChange } =
        useImportWorkbook(() => {
            setSelectedSheet(null);
            setConfig(null);
            setVerifyResults({});
            setActiveVerifySheet('');
            setPpmpExtractResults({});
            setPpmpRawItems([]);
            setRawSheets({});
            setRawItems([]);
            setUniqueItems([]);
            setSelected(new Set());
            setCoaOverrides({});
            setReviewFilter('all');
            setShowDuplicateDetails(false);
            setStep('upload');
        });

    const canCalibrate = selectedSheet !== null;
    const rowsCalibrated =
        !!config &&
        config.rowConfig.headerRow !== '' &&
        config.rowConfig.headerRow != null &&
        config.rowConfig.additionalItemsHeaderRow !== '' &&
        config.rowConfig.additionalItemsHeaderRow != null &&
        config.rowConfig.nonProcurementHeaderRow !== '' &&
        config.rowConfig.nonProcurementHeaderRow != null;
    const canVerify = canCalibrate && !!workbook && rowsCalibrated;
    const allVerifyValid =
        selectedSheet !== null && !!verifyResults[selectedSheet]?.valid;
    const hasAnyVerify =
        selectedSheet !== null && !!verifyResults[selectedSheet];
    const canReview = canVerify && hasAnyVerify && allVerifyValid;

    const junctionByPair = useMemo(() => {
        const m = new Map<string, number>();

        for (const mm of existingMappings) {
            m.set(`${mm.chart_of_account_id}|${mm.ppmp_category_id}`, mm.id);
        }

        return m;
    }, [existingMappings]);

    function getEffectiveConfig(): PriceListSheetConfig {
        return config ?? getDefaultPriceListConfig();
    }

    function ensureConfigInitialized() {
        if (config) return;

        setConfig(getDefaultPriceListConfig());
    }

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

    function handleSheetChange(sheet: string | null) {
        setSelectedSheet(sheet);
        setActiveVerifySheet(sheet ?? '');
        setVerifyResults({});
        setRawItems([]);
        setUniqueItems([]);
        setSelected(new Set());
        setCoaOverrides({});
        setReviewFilter('all');
        setShowDuplicateDetails(false);
        setPpmpExtractResults({});
        setPpmpRawItems([]);
        setRawSheets({});
    }

    // Kept for downstream compatibility (ReviewStep uses these by name).
    function handleSheetToggle(sheet: string) {
        handleSheetChange(sheet);
    }

    function verifySheet(
        sheet: string,
        cfg: PriceListSheetConfig,
    ): VerifyResult {
        const result = verifyPpmpSheet(workbook, sheet, cfg);

        return {
            valid: result.valid,
            message: result.message,
            errors: result.errors,
            groups: result.groups,
            details: result.details,
        };
    }

    function handleVerify() {
        setPpmpExtractResults({});
        setPpmpRawItems([]);
        if (!workbook || !selectedSheet) return;

        if (!config) ensureConfigInitialized();

        const r = verifySheet(selectedSheet, getEffectiveConfig());

        setVerifyResults({ [selectedSheet]: r });
        setActiveVerifySheet(selectedSheet);
        setRawItems([]);
        setUniqueItems([]);
        setSelected(new Set());
        setCoaOverrides({});
        setReviewFilter('all');
        setShowDuplicateDetails(false);
    }

    function handlePpmpExtract() {
        if (!workbook || !selectedSheet) return;

        const res = extractPpmpSheet(
            workbook,
            selectedSheet,
            getEffectiveConfig(),
        );

        setPpmpExtractResults({ [selectedSheet]: res });
        setPpmpRawItems(res.rawItems);
        setRawSheets(
            extractRawSheets(workbook, [selectedSheet], () =>
                getEffectiveConfig(),
            ),
        );
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
        const descriptionColumn = cfg.columnConfig.description || dataColumn;
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
            const descriptionRaw =
                cellText(row.getCell(descriptionColumn)) ?? dataRaw;

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
                    description: descriptionRaw ?? dataRaw,
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
        if (!workbook || !selectedSheet) return;

        const sheet = selectedSheet;
        const ws = workbook.getWorksheet(sheet);

        if (!ws) return;

        const cfg = getEffectiveConfig();

        if (
            cfg.rowConfig.headerRow === '' ||
            cfg.rowConfig.headerRow == null ||
            cfg.rowConfig.additionalItemsHeaderRow === '' ||
            cfg.rowConfig.additionalItemsHeaderRow == null ||
            cfg.rowConfig.nonProcurementHeaderRow === '' ||
            cfg.rowConfig.nonProcurementHeaderRow == null
        )
            return;

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

        const all: RawItem[] = [
            ...extractItemsForSection(
                ws,
                cfg,
                'procurement',
                procurementStart,
                procurementEnd,
            ),
        ];

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
    }

    function handleImport() {
        const toImport = verifiedItems.filter(
            (v) =>
                selected.has(v.key) &&
                (v.status === 'ready' || v.status === 'update'),
        );

        if (toImport.length === 0) return;

        setImporting(true);
        router.post(
            '/imports/price-list-import' as const,
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
            },
        );
    }

    const s: PriceListImportState = {
        sheets,
        workbook,
        fileName,
        selectedSheet,
        loading,
        error,

        step,
        setStep,
        canCalibrate,
        canVerify,
        allVerifyValid,
        hasAnyVerify,
        canReview,

        config,
        setConfig,
        getEffectiveConfig,
        ensureConfigInitialized,

        handleFileChange,
        handleSheetToggle,

        verifyResults,
        setVerifyResults,
        activeVerifySheet,
        setActiveVerifySheet,
        handleVerify,

        ppmpExtractResults,
        setPpmpExtractResults,
        ppmpRawItems,
        setPpmpRawItems,
        rawSheets,
        setRawSheets,
        handlePpmpExtract,

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
        <ImportPageShell
            title="Price List Import"
            description={
                <>
                    Imports <strong>price list only</strong> (no quantities).
                    Requires official{' '}
                    <Link href="/imports/category-import" className="underline">
                        Category Import
                    </Link>{' '}
                    and{' '}
                    <Link
                        href="/imports/category-coa-mapping"
                        className="underline"
                    >
                        Category–COA Mappings
                    </Link>{' '}
                    to exist first.
                </>
            }
            fileName={fileName}
            loading={loading}
            step={step}
            onStepChange={(v) => setStep(v as PliStep)}
            tabs={[
                { value: 'upload', label: '1. Upload' },
                {
                    value: 'calibrate',
                    label: '2. Calibrate',
                    disabled: !canCalibrate,
                },
                {
                    value: 'verify',
                    label: '3. Verify',
                    disabled: !canVerify,
                },
                {
                    value: 'extract',
                    label: '4. Extract',
                    disabled: !canReview,
                },
                {
                    value: 'review',
                    label: '5. Review & Import',
                    disabled: !canReview || ppmpRawItems.length === 0,
                },
            ]}
        >
            <ImportUploadStep
                fileInputId="price-list-file"
                fileLabel="Excel File (.xlsx only)"
                fileDescription="Select a PPMP workbook (.xlsx)."
                error={error}
                loading={loading}
                onFileChange={handleFileChange}
                sheets={sheets}
                selectedSheet={selectedSheet}
                onSheetChange={handleSheetChange}
                onNext={() => {
                    ensureConfigInitialized();
                    setStep('calibrate');
                }}
            />
            <ImportPpmpCalibrateStep
                selectedSheet={selectedSheet}
                config={config}
                setConfig={setConfig}
                getDefaultConfig={getDefaultSharedConfig}
                onInvalidate={() => {
                    setVerifyResults({});
                    setRawItems([]);
                    setUniqueItems([]);
                    setSelected(new Set());
                    setCoaOverrides({});
                    setReviewFilter('all');
                    setShowDuplicateDetails(false);
                }}
                onBack={() => setStep('upload')}
                onNext={() => setStep('verify')}
                canNext={canVerify}
                nextLabel="Next: Verify Format"
            />
            <ImportPpmpVerifyStep
                tabsValue="verify"
                title="Verify price list format per sheet"
                description="Checks the selected sheet — cat → coa(s) → items → cat - total."
                verifyButtonLabel="Verify Sheet"
                canVerify={canVerify}
                onVerify={handleVerify}
                selectedSheet={selectedSheet}
                result={
                    selectedSheet
                        ? (verifyResults[selectedSheet] ?? null)
                        : null
                }
                allValid={allVerifyValid}
                onBack={() => setStep('calibrate')}
                onNext={() => setStep('extract')}
                canNext={allVerifyValid}
                nextLabel={
                    allVerifyValid
                        ? 'Next: Extract'
                        : hasAnyVerify
                          ? 'Next: Extract (fix verification first)'
                          : 'Next: Extract (verify first)'
                }
            />
            <ImportExtractStep
                sheet={selectedSheet}
                canExtract={allVerifyValid}
                hasAnyVerify={hasAnyVerify}
                ppmpItems={ppmpRawItems}
                rawSheets={rawSheets}
                onRunExtract={handlePpmpExtract}
                onBack={() => setStep('verify')}
                backLabel="Back: Verify"
                onNext={() => {
                    handleExtract();
                    setStep('review');
                }}
                canNext={allVerifyValid}
                nextLabel="Next: Review & Import"
            />
            {/*<ReviewStep s={s} />*/}
        </ImportPageShell>
    );
}

PriceListImport.layout = {
    breadcrumbs: [
        { title: 'Imports', href: '/imports' },
        { title: 'Price List Import', href: '/imports/price-list-import' },
    ],
};
