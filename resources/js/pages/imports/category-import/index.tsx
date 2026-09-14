// resources/js/pages/imports/category-import/index.tsx

import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { ImportPageShell } from '@/components/imports/import-page-shell';
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
import { CalibrateStep } from './steps/calibrate-step';
import { VerifyStep } from './steps/verify-step';
import { ExtractStep } from './steps/extract-step';
import { ImportStep } from './steps/import-step';

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
    const [ppmpExtractResults, setPpmpExtractResults] = useState<
        Record<string, PpmpExtractResult>
    >({});
    const [ppmpRawItems, setPpmpRawItems] = useState<RawPpmpItem[]>([]);
    const [rawSheets, setRawSheets] = useState<Record<string, RawSheet>>({});
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
            setPpmpExtractResults({});
            setPpmpRawItems([]);
            setRawSheets({});
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

    function handleSheetToggle(sheet: string) {
        setSelectedSheets((prev) => {
            const next = prev.includes(sheet)
                ? prev.filter((s) => s !== sheet)
                : [...prev, sheet];
            setVerifyResults({});
            setActiveVerifySheet(next[0] ?? '');
            setExtractResult(null);
            setPpmpExtractResults({});
            setPpmpRawItems([]);
            setRawSheets({});
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

    function handleSheetsChange(next: unknown) {
        const flat = (
            Array.isArray(next) ? (next as unknown[]).flat(Infinity) : []
        )
            .map((s) => String(s).trim())
            .filter(Boolean) as string[];
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

        if (!workbook || selectedSheets.length === 0) return;

        if (!sharedConfig) ensureCalibrationsInitialized();

        const flatSheets = (selectedSheets as unknown[])
            .flat(Infinity)
            .map((s) => String(s).trim())
            .filter(Boolean) as string[];
        if (flatSheets.length !== selectedSheets.length) {
            setSelectedSheets(flatSheets);
        }

        const next: Record<string, VerifyResult> = {};

        for (const sheet of flatSheets) {
            const cfg = getEffectiveConfig(sheet);
            const result = verifySheet(sheet, cfg);
            next[sheet] = result;
        }

        setVerifyResults(next);
        const firstInvalid = flatSheets.find((s) => !next[s]?.valid);
        setActiveVerifySheet(firstInvalid ?? flatSheets[0] ?? '');
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

    function handleExtract() {
        handlePpmpExtract();
        if (!workbook || selectedSheets.length === 0) return;

        const flatForUnique = (selectedSheets as unknown[])
            .flat(Infinity)
            .map((s) => String(s).trim())
            .filter(Boolean) as string[];
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

        for (const sheet of flatForUnique) {
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
        ppmpExtractResults,
        setPpmpExtractResults,
        ppmpRawItems,
        setPpmpRawItems,
        rawSheets,
        setRawSheets,
        handlePpmpExtract,
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
                fileDescription="Select an .xlsx file. Only .xlsx is accepted (ExcelJS)."
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
            <CalibrateStep s={s} />
            <VerifyStep s={s} />
            <ExtractStep s={s} />
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
