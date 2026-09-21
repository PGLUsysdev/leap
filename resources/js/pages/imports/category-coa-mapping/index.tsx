// resources/js/pages/imports/category-coa-mapping/index.tsx

import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { ImportPageShell } from '@/components/imports/import-page-shell';
import { ImportUploadStep } from '@/components/imports/import-upload-step';
import { useImportWorkbook } from '@/hooks/use-import-workbook';
import type { ExistingCategory, ExistingCoa } from '@/lib/ppmp/normalize';
import { getDefaultMappingConfig } from '@/lib/ppmp/sheet-config';
import type { CategoryCoaSheetConfig } from '@/lib/ppmp/sheet-config';
import { verifyPpmpSheet } from '@/lib/ppmp/verify';
import {
    extractPpmpSheet,
    type PpmpExtractResult,
    type RawPpmpItem,
} from '@/lib/ppmp/extract';
import { extractRawSheet, type RawSheet } from '@/lib/raw-extract';
import {
    applyCoaOverrides,
    extractMappingPairs,
} from '@/lib/ppmp/mapping-extract';
import { bulkStore as categoryCoaMappingBulkStore } from '@/routes/category-coa-mappings';
import { index as categoryCoaMappingIndex } from '@/routes/category-coa-mapping';
import { index as importsIndex } from '@/routes/imports';

import type {
    CategoryCoaMappingState,
    CcmStep,
    ExistingMapping,
    VerificationState,
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
    const [ppmpExtract, setPpmpExtract] =
        useState<PpmpExtractResult | null>(null);
    const [ppmpRawItems, setPpmpRawItems] = useState<RawPpmpItem[]>([]);
    const [rawSheet, setRawSheet] = useState<RawSheet | null>(null);
    const [coaOverrides, setCoaOverrides] = useState<Record<string, number>>(
        {},
    );
    const [verification, setVerification] = useState<VerificationState | null>(
        null,
    );
    const [isSaving, setIsSaving] = useState(false);
    const [step, setStep] = useState<CcmStep>('upload');
    const [formatResult, setFormatResult] = useState<VerifyFormatResult | null>(
        null,
    );

    const { sheets, workbook, fileName, loading, error, handleFileChange } =
        useImportWorkbook(() => {
            setSelectedSheet(null);
            setConfig(null);
            setPpmpExtract(null);
            setPpmpRawItems([]);
            setRawSheet(null);
            setFormatResult(null);
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
        config.rowConfig.additionalItemsHeaderRow != null;
    const canVerifyFormat =
        selectedSheet !== null && !!workbook && rowsCalibrated;
    const hasFormatResult = formatResult !== null;
    const formatValid = formatResult?.valid === true;
    const canExtract = canVerifyFormat && hasFormatResult && formatValid;
    const canReview =
        canExtract && !!verification && verification.total > 0;

    const rawSheetsForStep = useMemo(
        () =>
            rawSheet && selectedSheet
                ? { [selectedSheet]: rawSheet }
                : {},
        [rawSheet, selectedSheet],
    );

    function getEffectiveConfig(): CategoryCoaSheetConfig {
        return config ?? getDefaultMappingConfig();
    }

    function ensureConfigInitialized() {
        if (config) return;

        setConfig(getDefaultMappingConfig());
    }

    const effectiveVerification = useMemo(
        () =>
            applyCoaOverrides(
                verification,
                coaOverrides,
                existingCoas,
                existingMappings,
            ),
        [verification, coaOverrides, existingCoas, existingMappings],
    );

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
            categoryCoaMappingBulkStore().url as never,
            { mappings: uniqueToCreate } as never,
            {
                onFinish: () => setIsSaving(false),
            },
        );
    }

    function handleVerifyFormat() {
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

        setFormatResult({
            valid: result.valid,
            message: result.message,
            errors: result.errors,
            warnings: result.warnings,
            groups: result.groups,
            details: result.details,
        });
        setVerification(null);
        setCoaOverrides({});
    }

    function handlePpmpExtract() {
        if (!workbook || !selectedSheet) return;

        const cfg = getEffectiveConfig();
        const res = extractPpmpSheet(workbook, selectedSheet, cfg);

        setPpmpExtract(res);
        setPpmpRawItems(res.rawItems);
        setRawSheet(extractRawSheet(workbook, selectedSheet, cfg));
    }

    function handleSheetChange(sheet: string | null) {
        setSelectedSheet(sheet);
        setFormatResult(null);
        setVerification(null);
        setCoaOverrides({});
        setPpmpExtract(null);
        setPpmpRawItems([]);
        setRawSheet(null);
    }

    function handleLogRelationships() {
        if (!workbook || !selectedSheet) return;

        const ws = workbook.getWorksheet(selectedSheet);

        if (!ws) return;

        setVerification(
            extractMappingPairs(ws, getEffectiveConfig(), selectedSheet, {
                existingCategories,
                existingCoas,
                existingMappings,
            }),
        );
        setCoaOverrides({});
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
        canReview,
        canExtract,

        config,
        setConfig,
        getEffectiveConfig,
        ensureConfigInitialized,

        handleFileChange,
        handleSheetChange,

        formatResult,
        setFormatResult,
        handleVerifyFormat,

        verification,
        setVerification,
        effectiveVerification,
        coaOverrides,
        setCoaOverrides,
        handleClearOverride,
        isSaving,
        handleBulkCreateMappings,

        ppmpExtract,
        setPpmpExtract,
        ppmpRawItems,
        setPpmpRawItems,
        rawSheet,
        setRawSheet,
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
                    setFormatResult(null);
                    setCoaOverrides({});
                    setPpmpExtract(null);
                    setPpmpRawItems([]);
                    setRawSheet(null);
                }}
                onBack={() => setStep('upload')}
                onNext={() => setStep('verify')}
                canNext={canVerifyFormat}
                nextLabel="Next: Verify Format"
            />
            <ImportPpmpVerifyStep
                tabsValue="verify"
                title="Verify Sheet Format — check calibration and structure (all calibrated sections)"
                description="Checks the selected sheet with current calibration. Validates cat → coa(s) → items → cat - TOTAL per section."
                verifyButtonLabel="Verify Sheet"
                canVerify={canVerifyFormat}
                onVerify={handleVerifyFormat}
                selectedSheet={selectedSheet}
                result={formatResult}
                allValid={formatValid}
                onBack={() => setStep('calibrate')}
                onNext={() => setStep('extract')}
                canNext={hasFormatResult && formatValid}
                nextLabel={
                    formatValid
                        ? 'Next: Extract'
                        : hasFormatResult
                          ? 'Next: Extract (fix verification first)'
                          : 'Next: Extract (verify first)'
                }
            />
            <ImportExtractStep
                sheet={selectedSheet}
                canExtract={formatValid}
                hasAnyVerify={hasFormatResult}
                ppmpItems={ppmpRawItems}
                rawSheets={rawSheetsForStep}
                onRunExtract={handlePpmpExtract}
                onBack={() => setStep('verify')}
                backLabel="Back: Verify"
                onNext={() => {
                    handleLogRelationships();
                    setStep('review');
                }}
                canNext={formatValid}
                nextLabel="Next: Review & Import"
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
