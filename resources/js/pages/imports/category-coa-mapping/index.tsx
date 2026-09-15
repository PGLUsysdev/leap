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
    const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
    const [calibrationMode, setCalibrationMode] =
        useState<CalibrationMode>('shared');
    const [sharedConfig, setSharedConfig] =
        useState<CategoryCoaSheetConfig | null>(null);
    const [calibrations, setCalibrations] = useState<
        Record<string, CategoryCoaSheetConfig>
    >({});
    const [currentSheet, setCurrentSheet] = useState<string>('');
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
            setSelectedSheets([]);
            setCurrentSheet('');
            setSharedConfig(null);
            setCalibrations({});
            setPpmpExtractResults({});
            setPpmpRawItems([]);
            setRawSheets({});
            setFormatResults({});
            setActiveFormatSheet('');
            setVerification(null);
            setCoaOverrides({});
            setStep('upload');
        });

    const canCalibrate = selectedSheets.length > 0;
    const rowsCalibrated =
        !!sharedConfig &&
        sharedConfig.rowConfig.headerRow !== '' &&
        sharedConfig.rowConfig.headerRow != null &&
        sharedConfig.rowConfig.additionalItemsHeaderRow !== '' &&
        sharedConfig.rowConfig.additionalItemsHeaderRow != null &&
        sharedConfig.rowConfig.nonProcurementHeaderRow !== '' &&
        sharedConfig.rowConfig.nonProcurementHeaderRow != null;
    const canVerifyFormat =
        selectedSheets.length > 0 && !!workbook && rowsCalibrated;
    const hasFormatResult =
        selectedSheets.length > 0 &&
        selectedSheets.every((s) => !!formatResults[s]);
    const formatValid =
        selectedSheets.length > 0 &&
        selectedSheets.every((s) => formatResults[s]?.valid);
    const canExtract = canVerifyFormat && hasFormatResult && formatValid;
    const hasAnyExtract = ppmpRawItems.length > 0;
    const canReview =
        canExtract && hasAnyExtract && !!verification && verification.total > 0;

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

    function verifyFormatForSheet(sheet: string): VerifyFormatResult | null {
        if (!workbook || !sheet) return null;

        const effective = getEffectiveConfig(sheet);
        const result = verifyPpmpSheet(workbook, sheet, effective);

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
        if (!workbook || selectedSheets.length === 0) return;

        const flatSheets = (selectedSheets as unknown[])
            .flat(Infinity)
            .map((s) => String(s).trim())
            .filter(Boolean) as string[];
        console.log(
            '[verifyFormat] selectedSheets raw:',
            selectedSheets,
            'flatSheets:',
            flatSheets,
        );
        if (
            flatSheets.length !== selectedSheets.length ||
            flatSheets.some((s, i) => s !== selectedSheets[i])
        ) {
            console.warn(
                '[verifyFormat] flattened nested',
                selectedSheets,
                '→',
                flatSheets,
            );
            setSelectedSheets(flatSheets);
        }

        const availableNames = workbook
            ? workbook.worksheets.map((ws) => ws.name)
            : sheets;
        const missing = flatSheets.filter((s) => !availableNames.includes(s));
        if (missing.length > 0) {
            console.warn(
                '[verifyFormat] stale selectedSheets:',
                flatSheets,
                'available:',
                availableNames,
                'missing:',
                missing,
            );
        }

        const next: Record<string, VerifyFormatResult> = {};

        for (const sheet of flatSheets) {
            const result = verifyFormatForSheet(sheet);

            if (result) next[sheet] = result;
        }

        setFormatResults(next);
        const firstInvalid = flatSheets.find((s) => !next[s]?.valid);
        setActiveFormatSheet(firstInvalid ?? flatSheets[0] ?? '');
        setVerification(null);
        setCoaOverrides({});

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

    function handlePpmpExtract() {
        if (!workbook || selectedSheets.length === 0) return;
        const flatSheets = (selectedSheets as unknown[])
            .flat(Infinity)
            .map((s) => String(s).trim())
            .filter(Boolean) as string[];
        const next: Record<string, PpmpExtractResult> = {};
        const allRaw: RawPpmpItem[] = [];
        for (const sheet of flatSheets) {
            const cfg = getEffectiveConfig(sheet);
            const res = extractPpmpSheet(workbook, sheet, cfg);
            next[sheet] = res;
            allRaw.push(...res.rawItems);
        }
        setPpmpExtractResults(next);
        setPpmpRawItems(allRaw);
        const raws = extractRawSheets(workbook, flatSheets, (s) =>
            getEffectiveConfig(s),
        );
        setRawSheets(raws);
    }

    function handleSheetToggle(sheet: string) {
        setPpmpExtractResults({});
        setPpmpRawItems([]);
        setRawSheets({});
        setSelectedSheets((prev) => {
            const next = prev.includes(sheet)
                ? prev.filter((s) => s !== sheet)
                : [...prev, sheet];
            setFormatResults({});
            setActiveFormatSheet(next[0] ?? '');
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

    /**
     * Single-sheet mode: the shared picker emits `[picked]` or `[]`.
     * Deselect anything else, then select the picked sheet. The page's
     * `handleSheetToggle` resets downstream results on each call.
     */
    function handleSheetsChange(next: unknown) {
        console.log(
            '[category-coa-mapping handleSheetsChange] raw next:',
            next,
            'selectedSheets before:',
            selectedSheets,
        );
        const flat = (
            Array.isArray(next) ? (next as unknown[]).flat(Infinity) : []
        )
            .map((s) => String(s).trim())
            .filter(Boolean) as string[];
        console.log('[category-coa-mapping handleSheetsChange] flat:', flat);
        const picked = flat[0] ?? '';

        for (const sheet of selectedSheets) {
            if (sheet !== picked) {
                handleSheetToggle(String(sheet));
            }
        }

        if (picked && !selectedSheets.includes(picked)) {
            handleSheetToggle(picked);
        }
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
                effective.rowConfig.headerRow == null ||
                effective.rowConfig.additionalItemsHeaderRow === '' ||
                effective.rowConfig.additionalItemsHeaderRow == null ||
                effective.rowConfig.nonProcurementHeaderRow === '' ||
                effective.rowConfig.nonProcurementHeaderRow == null
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
        canExtract,
        hasAnyExtract,
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
                    value: 'verifyFormat',
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
                selectedSheets={selectedSheets}
                onSheetsChange={handleSheetsChange}
                onNext={() => {
                    ensureCalibrationsInitialized();
                    setStep('calibrate');
                }}
                nextDisabled={selectedSheets.length === 0}
            />
            <ImportPpmpCalibrateStep
                calibrationMode={calibrationMode}
                setCalibrationMode={setCalibrationMode}
                sharedConfig={sharedConfig}
                setSharedConfig={setSharedConfig}
                calibrations={calibrations}
                setCalibrations={setCalibrations}
                currentSheet={currentSheet}
                setCurrentSheet={setCurrentSheet}
                selectedSheets={selectedSheets}
                getDefaultConfig={getDefaultMappingConfig}
                onInvalidate={() => {
                    setVerification(null);
                    setFormatResults({});
                    setActiveFormatSheet(selectedSheets[0] ?? '');
                    setCoaOverrides({});
                }}
                verifyMarks={(() => {
                    const marks: Record<string, boolean> = {};

                    for (const [sheet, result] of Object.entries(
                        formatResults,
                    )) {
                        if (result) {
                            marks[sheet] = result.valid;
                        }
                    }

                    return marks;
                })()}
                onBack={() => setStep('upload')}
                onNext={() => setStep('verifyFormat')}
                canNext={canVerifyFormat}
                nextLabel="Next: Verify Format"
            />
            <ImportPpmpVerifyStep
                tabsValue="verifyFormat"
                title="Verify Sheet Format — check calibration and structure (all 3 sections)"
                description={
                    <>
                        Checks {selectedSheets.length} sheet
                        {selectedSheets.length === 1 ? '' : 's'} with current
                        calibration (
                        {calibrationMode === 'shared'
                            ? `shared header ${sharedConfig?.rowConfig.headerRow === '' || sharedConfig?.rowConfig.headerRow == null ? 7 : sharedConfig.rowConfig.headerRow}`
                            : `per-sheet`}
                        ). Validates cat → coa(s) → items → cat - TOTAL per
                        section.
                    </>
                }
                verifyButtonLabel={`Verify Format${selectedSheets.length > 1 ? ` (${selectedSheets.length} sheets)` : ''}`}
                canVerify={canVerifyFormat}
                onVerify={handleVerifyFormat}
                selectedSheets={selectedSheets}
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
                sheets={selectedSheets}
                canExtract={canExtract}
                hasAnyVerify={canExtract}
                allVerifyValid={canExtract}
                ppmpItems={ppmpRawItems}
                rawSheets={rawSheets}
                onRunExtract={() => {
                    handlePpmpExtract();
                    handleLogRelationships();
                }}
                onBack={() => setStep('verifyFormat')}
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
