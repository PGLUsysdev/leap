// resources/js/pages/imports/category-coa-mapping/index.tsx

import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import type ExcelJS from 'exceljs';
import { ImportPageShell } from '@/components/imports/import-page-shell';
import { ImportUploadStep } from '@/components/imports/import-upload-step';
import { useImportWorkbook } from '@/hooks/use-import-workbook';
import { cellText } from '@/lib/excel/cell-helpers';
import {
    normalize,
    isTotalRow,
    getCategoryMatch,
    getCoaMatch,
} from '@/lib/ppmp/normalize';
import type { ExistingCategory, ExistingCoa } from '@/lib/ppmp/normalize';
import { getDefaultMappingConfig } from '@/lib/ppmp/sheet-config';
import {
    extractPpmpSheet,
    type PpmpExtractResult,
    type RawPpmpItem,
} from '@/lib/ppmp/extract';
import { extractRawSheets, type RawSheet } from '@/lib/raw-extract';
import type { CategoryCoaSheetConfig } from '@/lib/ppmp/sheet-config';
import { verifyPpmpSheet } from '@/lib/ppmp/verify';
import { index as categoryCoaMappingIndex } from '@/routes/category-coa-mapping';
import { index as importsIndex } from '@/routes/imports';

import type {
    CategoryCoaMappingState,
    CcmStep,
    EffectiveVerificationState,
    ExistingMapping,
    ExtractedPair,
    VerificationState,
    VerifiedPair,
    VerifyFormatResult,
} from './types';
import { ImportPpmpCalibrateStep } from '@/components/imports/import-ppmp-calibrate-step';
import { ImportExtractStep } from '@/components/imports/import-extract-step';
import { ImportPpmpVerifyStep } from '@/components/imports/import-verify-step';
import { ReviewStep } from './steps/review-step';

interface CategoryCoaMappingProps {
    existingCategories?: ExistingCategory[];
    existingCoas?: ExistingCoa[];
    existingMappings?: ExistingMapping[];
}

export default function CategoryCoaMappingImport({
    existingCategories = [],
    existingCoas = [],
    existingMappings = [],
}: CategoryCoaMappingProps) {
    const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
    const [config, setConfig] = useState<CategoryCoaSheetConfig | null>(null);
    const [ppmpExtractResults, setPpmpExtractResults] = useState<
        Record<string, PpmpExtractResult>
    >({});
    const [ppmpRawItems, setPpmpRawItems] = useState<RawPpmpItem[]>([]);
    const [rawSheets, setRawSheets] = useState<Record<string, RawSheet>>({});
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

    const { sheets, workbook, fileName, loading, error, handleFileChange } =
        useImportWorkbook(() => {
            setSelectedSheet(null);
            setConfig(null);
            setPpmpExtractResults({});
            setPpmpRawItems([]);
            setRawSheets({});
            setFormatResults({});
            setActiveFormatSheet('');
            setVerification(null);
            setCoaOverrides({});
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
    const canVerifyFormat =
        selectedSheet !== null && !!workbook && rowsCalibrated;
    const hasFormatResult =
        selectedSheet !== null && !!formatResults[selectedSheet];
    const formatValid =
        selectedSheet !== null && !!formatResults[selectedSheet]?.valid;
    const canExtract = canVerifyFormat && hasFormatResult && formatValid;
    const hasAnyExtract = ppmpRawItems.length > 0;
    const canReview =
        canExtract && hasAnyExtract && !!verification && verification.total > 0;

    function getEffectiveConfig(): CategoryCoaSheetConfig {
        return config ?? getDefaultMappingConfig();
    }

    function ensureConfigInitialized() {
        if (config) return;

        setConfig(getDefaultMappingConfig());
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
            '/imports/category-coa-mappings/bulk' as never,
            { mappings: uniqueToCreate } as never,
            {
                onFinish: () => setIsSaving(false),
            },
        );
    }

    function verifyFormatForSheet(): VerifyFormatResult | null {
        if (!workbook || !selectedSheet) return null;

        const result = verifyPpmpSheet(
            workbook,
            selectedSheet,
            getEffectiveConfig(),
        );

        return {
            valid: result.valid,
            message: result.message,
            errors: result.errors,
            groups: result.groups,
            details: result.details,
        };
    }

    function handleVerifyFormat() {
        setPpmpExtractResults({});
        setPpmpRawItems([]);
        if (!workbook || !selectedSheet) return;

        if (!config) ensureConfigInitialized();

        const result = verifyFormatForSheet();

        if (!result) return;

        setFormatResults({ [selectedSheet]: result });
        setActiveFormatSheet(selectedSheet);
        setVerification(null);
        setCoaOverrides({});
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

    function handleSheetChange(sheet: string | null) {
        setSelectedSheet(sheet);
        setActiveFormatSheet(sheet ?? '');
        setFormatResults({});
        setVerification(null);
        setCoaOverrides({});
        setPpmpExtractResults({});
        setPpmpRawItems([]);
        setRawSheets({});
    }

    // Kept for downstream compatibility (ReviewStep still calls these by name).
    function handleSheetToggle(sheet: string) {
        handleSheetChange(sheet);
    }

    function handleSheetClick(sheet: string) {
        handleSheetChange(sheet);
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
        if (!workbook || !selectedSheet) return;

        const sheet = selectedSheet;
        const ws = workbook.getWorksheet(sheet);

        if (!ws) return;

        const effective = getEffectiveConfig();

        if (
            effective.rowConfig.headerRow === '' ||
            effective.rowConfig.headerRow == null ||
            effective.rowConfig.additionalItemsHeaderRow === '' ||
            effective.rowConfig.additionalItemsHeaderRow == null ||
            effective.rowConfig.nonProcurementHeaderRow === '' ||
            effective.rowConfig.nonProcurementHeaderRow == null
        ) {
            return;
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
            pairsForSheet.push(...(sections['non-procurement'] as any).pairs);
        }

        const combinedAllPairs = pairsForSheet;

        const seen = new Map<string, ExtractedPair>();

        for (const p of combinedAllPairs) {
            const key = `${normalize(p.category)}|${normalize(p.coa)}`;

            if (!seen.has(key)) seen.set(key, p);
        }

        const uniquePairs = [...seen.values()];

        const mappingSet = new Set(
            existingMappings.map(
                (m) => `${m.ppmp_category_id}|${m.chart_of_account_id}`,
            ),
        );
        const verifiedPairs: VerifiedPair[] = uniquePairs.map((p) => {
            const catNorm = normalize(p.category);
            const coaNorm = normalize(p.coa);
            const catRes = getCategoryMatch(catNorm, existingCategories);
            const coaRes = getCoaMatch(coaNorm, existingCoas, 'account_title');
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
    }

    const s: CategoryCoaMappingState = {
        sheets,
        workbook,
        fileName,
        selectedSheet,
        loading,
        error,

        step,
        setStep,
        canCalibrate,
        canVerifyFormat,
        hasFormatResult,
        formatValid,
        canExtract,
        hasAnyExtract,
        canReview,

        config,
        setConfig,
        getEffectiveConfig,
        ensureConfigInitialized,

        handleFileChange,
        handleSheetToggle,
        handleSheetClick,

        formatResults,
        setFormatResults,
        activeFormatSheet,
        setActiveFormatSheet,
        handleVerifyFormat,

        verification,
        setVerification,
        effectiveVerification,
        coaOverrides,
        setCoaOverrides,
        handleClearOverride,
        isSaving,
        handleBulkCreateMappings,

        ppmpExtractResults,
        setPpmpExtractResults,
        ppmpRawItems,
        setPpmpRawItems,
        handlePpmpExtract,

        existingCategories,
        existingCoas,
        existingMappings,
    };

    return (
        <ImportPageShell
            title="Category COA Mapping"
            description="Bulk import Category ↔ COA mappings from XLSX. Calibrate, verify format, and create mappings in bulk."
            fileName={fileName}
            loading={loading}
            step={step}
            onStepChange={(v) => setStep(v as CcmStep)}
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
                    disabled: !canVerifyFormat,
                },
                {
                    value: 'extract',
                    label: '4. Extract',
                    disabled: !canExtract,
                },
                {
                    value: 'review',
                    label: '5. Review & Import',
                    disabled: !canReview,
                },
            ]}
        >
            <ImportUploadStep
                fileInputId="category-coa-mapping-file"
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
                getDefaultConfig={getDefaultMappingConfig}
                onInvalidate={() => {
                    setVerification(null);
                    setFormatResults({});
                    setActiveFormatSheet(selectedSheet ?? '');
                    setCoaOverrides({});
                }}
                onBack={() => setStep('upload')}
                onNext={() => setStep('verify')}
                canNext={canVerifyFormat}
                nextLabel="Next: Verify Format"
            />
            <ImportPpmpVerifyStep
                tabsValue="verify"
                title="Verify Sheet Format — check calibration and structure (all 3 sections)"
                description="Checks the selected sheet with current calibration. Validates cat → coa(s) → items → cat - TOTAL per section."
                verifyButtonLabel="Verify Format"
                canVerify={canVerifyFormat}
                onVerify={handleVerifyFormat}
                selectedSheets={selectedSheet ? [selectedSheet] : []}
                results={formatResults}
                hasResult={hasFormatResult}
                allValid={formatValid}
                activeSheet={activeFormatSheet}
                onActiveChange={setActiveFormatSheet}
                onBack={() => setStep('calibrate')}
                onNext={() => setStep('extract')}
                canNext={hasFormatResult && formatValid}
                nextLabel={`Next: Extract${hasFormatResult && !formatValid ? ' (blocked)' : ''}`}
            />
            <ImportExtractStep
                sheet={selectedSheet}
                canExtract={canExtract}
                hasAnyVerify={canExtract}
                allVerifyValid={canExtract}
                ppmpItems={ppmpRawItems}
                rawSheets={rawSheets}
                onRunExtract={() => {
                    handlePpmpExtract();
                    handleLogRelationships();
                }}
                onBack={() => setStep('verify')}
                backLabel="Back: Verify"
                onNext={() => setStep('review')}
                canNext={canReview}
                nextLabel="Next: Review & Save"
            />
            <ReviewStep s={s} />
        </ImportPageShell>
    );
}

CategoryCoaMappingImport.layout = {
    breadcrumbs: [
        { title: 'Imports', href: importsIndex().url },
        { title: 'Category COA Mapping', href: categoryCoaMappingIndex().url },
    ],
};
