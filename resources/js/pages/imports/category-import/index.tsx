// resources/js/pages/imports/category-import/index.tsx

import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { ImportPageShell } from '@/components/imports/import-page-shell';
import { ImportPpmpCalibrateStep } from '@/components/imports/import-ppmp-calibrate-step';
import { ImportPpmpVerifyStep } from '@/components/imports/import-verify-step';
import { ImportUploadStep } from '@/components/imports/import-upload-step';
import { useImportWorkbook } from '@/hooks/use-import-workbook';
import { cellText } from '@/lib/excel/cell-helpers';
import { isTotalRow, normalize } from '@/lib/ppmp/normalize';
import type { ExistingCategory } from '@/lib/ppmp/normalize';
import { getDefaultSharedConfig } from '@/lib/ppmp/sheet-config';
import type { SharedSheetConfig } from '@/lib/ppmp/sheet-config';
import { verifyPpmpSheet } from '@/lib/ppmp/verify';
import {
    extractPpmpSheet,
    type PpmpExtractResult,
    type RawPpmpItem,
} from '@/lib/ppmp/extract';
import { extractRawSheets, type RawSheet } from '@/lib/raw-extract';
import { index as categoryImportIndex } from '@/routes/category-import';
import { index as importsIndex } from '@/routes/imports';

import type {
    CalibrationMode,
    CategoryImportState,
    CimpStep,
    ExtractResult,
    VerifyResult,
} from './types';
import { ImportExtractStep } from '@/components/imports/import-extract-step';
import { ImportStep } from './steps/import-step';

interface CategoryImportProps {
    existingCategories?: ExistingCategory[];
}

export default function CategoryImport({
    existingCategories = [],
}: CategoryImportProps) {
    const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
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
    const [ppmpExtractResults, setPpmpExtractResults] = useState<
        Record<string, PpmpExtractResult>
    >({});
    const [ppmpRawItems, setPpmpRawItems] = useState<RawPpmpItem[]>([]);
    const [rawSheets, setRawSheets] = useState<Record<string, RawSheet>>({});
    const [step, setStep] = useState<CimpStep>('upload');
    const [importing, setImporting] = useState(false);
    const [skipProblematic, setSkipProblematic] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const { sheets, workbook, fileName, loading, error, handleFileChange } =
        useImportWorkbook(() => {
            setSelectedSheet(null);
            setCurrentSheet('');
            setSharedConfig(null);
            setCalibrations({});
            setVerifyResults({});
            setActiveVerifySheet('');
            setExtractResult(null);
            setPpmpExtractResults({});
            setPpmpRawItems([]);
            setRawSheets({});
            setStep('upload');
        });

    function getEffectiveConfig(sheet: string): SharedSheetConfig {
        if (calibrationMode === 'shared' && sharedConfig) return sharedConfig;

        return calibrations[sheet] ?? sharedConfig ?? getDefaultSharedConfig();
    }

    const canCalibrate = selectedSheet !== null;
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
        selectedSheet !== null && !!verifyResults[selectedSheet]?.valid;
    const hasAnyVerify =
        selectedSheet !== null && !!verifyResults[selectedSheet];
    const canExtract = canVerify && hasAnyVerify && allVerifyValid;
    const canImport =
        canExtract && !!extractResult && extractResult.unique.length > 0;

    const extractionStats = useMemo(() => {
        if (!extractResult) return null;

        return {
            raw: extractResult.filtered.length,
            unique: extractResult.unique.length,
            duplicates: extractResult.duplicates.length,
        };
    }, [extractResult]);

    const verifyMarks = useMemo(() => {
        const marks: Record<string, boolean> = {};

        for (const [sheet, result] of Object.entries(verifyResults)) {
            if (result) {
                marks[sheet] = result.valid;
            }
        }

        return marks;
    }, [verifyResults]);

    function handleSheetChange(sheet: string | null) {
        setSelectedSheet(sheet);
        setCurrentSheet(sheet ?? '');
        setActiveVerifySheet(sheet ?? '');
        setVerifyResults({});
        setExtractResult(null);
        setPpmpExtractResults({});
        setPpmpRawItems([]);
        setRawSheets({});
        setSkipProblematic(false);
        setSelected(new Set());
    }

    // Kept for downstream compatibility (ImportStep uses these by name).
    function handleSheetToggle(sheet: string) {
        handleSheetChange(sheet);
    }

    function handleSheetSelect(sheet: string) {
        handleSheetChange(sheet);
    }

    function ensureCalibrationsInitialized() {
        if (sharedConfig) return;

        const def = getDefaultSharedConfig();
        setSharedConfig(def);

        if (selectedSheet) {
            setCalibrations({ [selectedSheet]: { ...def } });
        }

        if (!currentSheet && selectedSheet) setCurrentSheet(selectedSheet);
    }

    function handleApplySharedToAll() {
        if (!sharedConfig || !selectedSheet) return;

        setCalibrations({ [selectedSheet]: { ...sharedConfig } });
    }

    function handleCopyCurrentToAll() {
        const src = calibrations[currentSheet] ?? sharedConfig;

        if (!src || !selectedSheet) return;

        setCalibrations({ [selectedSheet]: { ...src } });
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
        setSkipProblematic(false);
        setExtractResult(null);
        setPpmpExtractResults({});
        setPpmpRawItems([]);
        setRawSheets({});

        if (!workbook || !selectedSheet) return;

        if (!sharedConfig) ensureCalibrationsInitialized();

        const cfg = getEffectiveConfig(selectedSheet);
        const result = verifySheet(selectedSheet, cfg);

        setVerifyResults({ [selectedSheet]: result });
        setActiveVerifySheet(selectedSheet);
    }

    function handlePpmpExtract() {
        if (!workbook || !selectedSheet) return;

        const cfg = getEffectiveConfig(selectedSheet);
        const res = extractPpmpSheet(workbook, selectedSheet, cfg);

        setPpmpExtractResults({ [selectedSheet]: res });
        setPpmpRawItems(res.rawItems);
        setRawSheets(
            extractRawSheets(workbook, [selectedSheet], (s) =>
                getEffectiveConfig(s),
            ),
        );
    }

    function handleExtract() {
        handlePpmpExtract();
        if (!workbook || !selectedSheet) return;

        const sheet = selectedSheet;
        const cfg = getEffectiveConfig(sheet);

        const dataColumn = cfg.columnConfig.category;
        const coaColumn = cfg.columnConfig.coa;
        const itemColumn = cfg.columnConfig.itemNumber;
        const { headerRow, additionalItemsHeaderRow, nonProcurementHeaderRow } =
            cfg.rowConfig;
        const { coaLabelMode } = cfg;

        if (headerRow === '' || headerRow == null) return;
        if (additionalItemsHeaderRow === '' || additionalItemsHeaderRow == null)
            return;
        if (nonProcurementHeaderRow === '' || nonProcurementHeaderRow == null)
            return;

        const ws = workbook.getWorksheet(sheet);

        if (!ws) return;

        const filtered: ExtractResult['filtered'] = [];
        const excludedTotal: ExtractResult['excludedTotal'] = [];
        const excludedCoa: ExtractResult['excludedCoa'] = [];
        const skippedCoaNotEmpty: ExtractResult['skippedCoaNotEmpty'] = [];
        const skippedProblematic: ExtractResult['skippedProblematic'] = [];

        const probRows = new Set<number>();
        const probNorms = new Set<string>();

        if (skipProblematic) {
            const vr = verifyResults[sheet];

            if (vr && !vr.valid) {
                for (const e of vr.errors) {
                    probRows.add(e.row);
                    const quoted = e.message.match(/"([^"]+)"/g);

                    if (quoted) {
                        for (const q of quoted) {
                            const inner = q.slice(1, -1);

                            if (inner) probNorms.add(normalize(inner));
                        }
                    }
                }
            }
        }

        const startRow = headerRow + 1;
        const lastRow = ws.actualRowCount;

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
                const nextCoaNorm = nextCoaRaw ? normalize(nextCoaRaw) : null;

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
        selectedSheet,
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
        ppmpExtractResults,
        setPpmpExtractResults,
        ppmpRawItems,
        setPpmpRawItems,
        rawSheets,
        setRawSheets,
        handlePpmpExtract,
        selected,
        setSelected,
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
                    label: '3. Verify',
                    disabled: !canVerify,
                },
                {
                    value: 'extract',
                    label: '4. Extract',
                    disabled: !canExtract,
                },
                {
                    value: 'import',
                    label: '5. Review & Import',
                    disabled: !canImport,
                },
            ]}
        >
            <ImportUploadStep
                fileInputId="category-import-file"
                fileLabel="Excel File (.xlsx only)"
                fileDescription="Select a PPMP workbook (.xlsx)."
                error={error}
                loading={loading}
                onFileChange={handleFileChange}
                sheets={sheets}
                selectedSheet={selectedSheet}
                onSheetChange={handleSheetChange}
                onNext={() => {
                    ensureCalibrationsInitialized();
                    setStep('calibrate');
                }}
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
                selectedSheet={selectedSheet}
                getDefaultConfig={getDefaultSharedConfig}
                onInvalidate={() => {
                    setVerifyResults({});
                    setExtractResult(null);
                }}
                verifyMarks={verifyMarks}
                showGroupsSummary
                showEffectiveBadges
                onBack={() => setStep('upload')}
                onNext={() => setStep('verify')}
                canNext={canVerify}
                nextLabel="Next: Verify Format"
            />
            <ImportPpmpVerifyStep
                tabsValue="verify"
                title="Verify procurement format per sheet (categories not in additional)"
                description={
                    <>
                        Checks the selected sheet with its calibration (
                        {calibrationMode}) — cat → coa(s) → items → cat - total.
                    </>
                }
                verifyButtonLabel="Verify Sheet"
                canVerify={canVerify}
                onVerify={handleVerify}
                selectedSheet={selectedSheet}
                results={verifyResults}
                hasResult={hasAnyVerify}
                allValid={allVerifyValid}
                activeSheet={activeVerifySheet}
                onActiveChange={setActiveVerifySheet}
                skip={{
                    checked: skipProblematic,
                    onChange: setSkipProblematic,
                    problematicCount: Object.values(verifyResults).reduce(
                        (a, r) => a + (r.valid ? 0 : r.errors.length),
                        0,
                    ),
                    invalidSheetCount:
                        selectedSheet && !verifyResults[selectedSheet]?.valid
                            ? 1
                            : 0,
                }}
                onBack={() => setStep('calibrate')}
                onNext={() => setStep('extract')}
                canNext={canExtract}
                nextLabel={
                    allVerifyValid
                        ? 'Next: Extract'
                        : skipProblematic && hasAnyVerify
                          ? 'Next: Extract (skipping problematic)'
                          : 'Fix verification first'
                }
            />
            <ImportExtractStep
                sheet={selectedSheet}
                canExtract={canExtract}
                hasAnyVerify={hasAnyVerify}
                allVerifyValid={allVerifyValid}
                ppmpItems={ppmpRawItems}
                rawSheets={rawSheets}
                onRunExtract={handlePpmpExtract}
                onBack={() => setStep('verify')}
                backLabel="Back: Verify"
                onNext={() => {
                    handleExtract();
                    setStep('import');
                }}
                canNext={ppmpRawItems.length > 0}
                nextLabel="Next: Import"
            />
            <ImportStep s={s} />
        </ImportPageShell>
    );
}

CategoryImport.layout = {
    breadcrumbs: [
        { title: 'Imports', href: importsIndex().url },
        { title: 'Category Import', href: categoryImportIndex().url },
    ],
};
