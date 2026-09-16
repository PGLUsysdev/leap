// resources/js/pages/imports/category-import/index.tsx

import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { ImportPageShell } from '@/components/imports/import-page-shell';
import { ImportPpmpCalibrateStep } from '@/components/imports/import-ppmp-calibrate-step';
import { ImportPpmpVerifyStep } from '@/components/imports/import-verify-step';
import { ImportUploadStep } from '@/components/imports/import-upload-step';
import { useImportWorkbook } from '@/hooks/use-import-workbook';
import { getDefaultSharedConfig } from '@/lib/ppmp/sheet-config';
import type { SharedSheetConfig } from '@/lib/ppmp/sheet-config';
import { verifyPpmpSheet } from '@/lib/ppmp/verify';
import {
    extractPpmpSheet,
    type PpmpExtractResult,
    type RawPpmpItem,
} from '@/lib/ppmp/extract';
import { extractRawSheets, type RawSheet } from '@/lib/raw-extract';
import {
    extractCategoryCandidates,
    getCategoryExtractionStats,
} from '@/lib/ppmp/category-extract';
import {
    index as categoryImportIndex,
    store as categoryImportStore,
} from '@/routes/category-import';
import { index as importsIndex } from '@/routes/imports';

import type {
    CategoryImportState,
    CimpStep,
    ExtractResult,
    VerifyResult,
} from './types';
import { ImportExtractStep } from '@/components/imports/import-extract-step';
import { ImportStep } from './steps/import-step';
import type { ExistingCategory } from '@/lib/ppmp/normalize';

interface CategoryImportProps {
    existingCategories?: ExistingCategory[];
}

export default function CategoryImport({
    existingCategories = [],
}: CategoryImportProps) {
    const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
    const [config, setConfig] = useState<SharedSheetConfig | null>(null);
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
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const { sheets, workbook, fileName, loading, error, handleFileChange } =
        useImportWorkbook(() => {
            setSelectedSheet(null);
            setConfig(null);
            setVerifyResults({});
            setActiveVerifySheet('');
            setExtractResult(null);
            setPpmpExtractResults({});
            setPpmpRawItems([]);
            setRawSheets({});
            setStep('upload');
            setSelected(new Set());
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
    const canExtract = canVerify && hasAnyVerify && allVerifyValid;
    const canImport =
        canExtract && !!extractResult && extractResult.unique.length > 0;

    const extractionStats = useMemo(
        () => getCategoryExtractionStats(extractResult),
        [extractResult],
    );

    function getEffectiveConfig(): SharedSheetConfig {
        return config ?? getDefaultSharedConfig();
    }

    function ensureConfigInitialized() {
        if (config) return;

        setConfig(getDefaultSharedConfig());
    }

    function handleSheetChange(sheet: string | null) {
        setSelectedSheet(sheet);
        setActiveVerifySheet(sheet ?? '');
        setVerifyResults({});
        setExtractResult(null);
        setPpmpExtractResults({});
        setPpmpRawItems([]);
        setRawSheets({});
        setSelected(new Set());
    }

    function handleVerify() {
        setExtractResult(null);
        setPpmpExtractResults({});
        setPpmpRawItems([]);
        setRawSheets({});

        if (!workbook || !selectedSheet) return;

        if (!config) ensureConfigInitialized();

        const result = verifyPpmpSheet(
            workbook,
            selectedSheet,
            getEffectiveConfig(),
        );

        setVerifyResults({
            [selectedSheet]: {
                valid: result.valid,
                message: result.message,
                errors: result.errors,
                warnings: result.warnings,
                groups: result.groups,
                details: result.details,
            },
        });
        setActiveVerifySheet(selectedSheet);
    }

    function handlePpmpExtract() {
        if (!workbook || !selectedSheet) return;

        const cfg = getEffectiveConfig();
        const res = extractPpmpSheet(workbook, selectedSheet, cfg);

        setPpmpExtractResults({ [selectedSheet]: res });
        setPpmpRawItems(res.rawItems);
        setRawSheets(
            extractRawSheets(workbook, [selectedSheet], () =>
                getEffectiveConfig(),
            ),
        );
    }

    function handleExtract() {
        if (!workbook || !selectedSheet) return;

        const ws = workbook.getWorksheet(selectedSheet);

        if (!ws) return;

        const res = extractCategoryCandidates(
            ws,
            getEffectiveConfig(),
            selectedSheet,
        );

        setExtractResult(res);
        setSelected(new Set(res.unique.map((u) => u.normalized)));
    }

    function handleImport() {
        if (!extractResult || extractResult.unique.length === 0) return;

        const toImport = extractResult.unique.filter((u) =>
            selected.has(u.normalized),
        );

        if (toImport.length === 0) return;

        setImporting(true);
        router.post(
            categoryImportStore.url as never,
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
        canImport,

        config,
        setConfig,
        getEffectiveConfig,
        ensureConfigInitialized,

        handleFileChange,
        handleSheetChange,

        verifyResults,
        setVerifyResults,
        activeVerifySheet,
        setActiveVerifySheet,
        handleVerify,

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
            description="Import PPMP procurement categories from XLSX. Calibrate columns/headers, verify format, and bulk create categories."
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
                    setExtractResult(null);
                    setPpmpExtractResults({});
                    setPpmpRawItems([]);
                    setRawSheets({});
                    setSelected(new Set());
                }}
                showGroupsSummary
                onBack={() => setStep('upload')}
                onNext={() => setStep('verify')}
                canNext={canVerify}
                nextLabel="Next: Verify Format"
            />
            <ImportPpmpVerifyStep
                tabsValue="verify"
                title="Verify procurement format (categories in procurement section only)"
                description="Checks the selected sheet with its calibration — cat → coa(s) → items → cat - total."
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
                canNext={canExtract}
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
                    setStep('import');
                }}
                canNext={allVerifyValid}
                nextLabel="Next: Review & Import"
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
