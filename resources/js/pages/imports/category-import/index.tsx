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
import { extractRawSheet, type RawSheet } from '@/lib/raw-extract';
import {
    extractCategoryCandidates,
    getCategoryExtractionStats,
} from '@/lib/ppmp/category-extract';
import {
    index as categoryImportIndex,
    sentinels as categoryImportSentinels,
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
    const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
    const [extractResult, setExtractResult] = useState<ExtractResult | null>(
        null,
    );
    const [ppmpExtract, setPpmpExtract] =
        useState<PpmpExtractResult | null>(null);
    const [ppmpRawItems, setPpmpRawItems] = useState<RawPpmpItem[]>([]);
    const [rawSheet, setRawSheet] = useState<RawSheet | null>(null);
    const [step, setStep] = useState<CimpStep>('upload');
    const [importing, setImporting] = useState(false);
    const [ensuringSentinels, setEnsuringSentinels] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const { sheets, workbook, fileName, loading, error, handleFileChange } =
        useImportWorkbook(() => {
            setSelectedSheet(null);
            setConfig(null);
            setVerifyResult(null);
            setExtractResult(null);
            setPpmpExtract(null);
            setPpmpRawItems([]);
            setRawSheet(null);
            setStep('upload');
            setSelected(new Set());
        });

    const canCalibrate = selectedSheet !== null;
    const rowsCalibrated =
        !!config &&
        config.rowConfig.headerRow !== '' &&
        config.rowConfig.headerRow != null &&
        config.rowConfig.additionalItemsHeaderRow !== '' &&
        config.rowConfig.additionalItemsHeaderRow != null;
    const canVerify = canCalibrate && !!workbook && rowsCalibrated;
    const allVerifyValid = verifyResult?.valid === true;
    const hasAnyVerify = verifyResult !== null;
    const canExtract = canVerify && hasAnyVerify && allVerifyValid;
    const canImport =
        canExtract && !!extractResult && extractResult.unique.length > 0;

    const extractionStats = useMemo(
        () => getCategoryExtractionStats(extractResult),
        [extractResult],
    );

    // Adapter: shared Extract tab still takes a single-entry Record.
    const rawSheetsForStep = useMemo(
        () =>
            rawSheet && selectedSheet
                ? { [selectedSheet]: rawSheet }
                : {},
        [rawSheet, selectedSheet],
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
        setVerifyResult(null);
        setExtractResult(null);
        setPpmpExtract(null);
        setPpmpRawItems([]);
        setRawSheet(null);
        setSelected(new Set());
    }

    function handleVerify() {
        setExtractResult(null);
        setPpmpExtract(null);
        setPpmpRawItems([]);
        setRawSheet(null);

        if (!workbook || !selectedSheet) return;

        if (!config) ensureConfigInitialized();

        const result = verifyPpmpSheet(
            workbook,
            selectedSheet,
            getEffectiveConfig(),
        );

        setVerifyResult({
            valid: result.valid,
            message: result.message,
            errors: result.errors,
            warnings: result.warnings,
            groups: result.groups,
            details: result.details,
        });
    }

    function handlePpmpExtract() {
        if (!workbook || !selectedSheet) return;

        const cfg = getEffectiveConfig();
        const res = extractPpmpSheet(workbook, selectedSheet, cfg);

        setPpmpExtract(res);
        setPpmpRawItems(res.rawItems);
        setRawSheet(extractRawSheet(workbook, selectedSheet, cfg));
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
            categoryImportStore().url as never,
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

    function handleEnsureSentinels() {
        if (ensuringSentinels) return;

        setEnsuringSentinels(true);
        router.post(categoryImportSentinels().url as never, {} as never, {
            onFinish: () => setEnsuringSentinels(false),
        });
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

        verifyResult,
        setVerifyResult,
        handleVerify,

        extractResult,
        setExtractResult,
        extractionStats,
        handleExtract,
        ppmpExtract,
        setPpmpExtract,
        ppmpRawItems,
        setPpmpRawItems,
        rawSheet,
        setRawSheet,
        handlePpmpExtract,
        selected,
        setSelected,
        importing,
        handleImport,
        ensuringSentinels,
        handleEnsureSentinels,

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
                    setVerifyResult(null);
                    setExtractResult(null);
                    setPpmpExtract(null);
                    setPpmpRawItems([]);
                    setRawSheet(null);
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
                result={verifyResult}
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
                rawSheets={rawSheetsForStep}
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
