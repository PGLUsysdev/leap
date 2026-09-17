// resources/js/pages/imports/aip-summary-import/index.tsx

import { useState } from 'react';
import { ImportPageShell } from '@/components/imports/import-page-shell';
import { useImportWorkbook } from '@/hooks/use-import-workbook';
import { index as importsIndex } from '@/routes/imports';
import { ImportAipUploadStep } from '@/components/imports/import-aip-upload-step';
import { ImportAipCalibrateStep } from '@/components/imports/import-aip-calibrate-step';
import { ImportAipVerifyStep } from '@/components/imports/import-aip-verify-step';
import { ImportAipExtractStep } from '@/components/imports/import-aip-extract-step';
import { getDefaultAipSummaryConfig } from '@/lib/aip-summary-import/sheet-config';
import { verifyAipSummarySheet } from '@/lib/aip-summary-import/verify';
import type { AipSummaryVerifyResult } from '@/lib/aip-summary-import/verify';
import { extractAipSummaryRecords } from '@/lib/aip-summary-import/extract';
import type { AipSummaryExtractResult } from '@/lib/aip-summary-import/extract';
import type {
    AipSummaryField,
    AipSummarySheetConfig,
} from '@/lib/aip-summary-import/sheet-config';
// import { ExtractStep } from './steps/extract-step';
// import { ReviewAndImport } from './steps/review-import-step';
// import { ImportPpaStep } from './steps/import-ppa-step';
// import { ImportOutputsStep } from './steps/import-outputs-step';
// import { ImportFundingStep } from './steps/import-funding-step';
import type { ImportStep } from './types';

export default function AipSummaryImport() {
    const [selectedSheet, setSelectedSheet] = useState<string>('');
    const [step, setStep] = useState<ImportStep>('upload');
    const [config, setConfig] = useState<AipSummarySheetConfig>(() =>
        getDefaultAipSummaryConfig(),
    );
    const [verifyResult, setVerifyResult] =
        useState<AipSummaryVerifyResult | null>(null);
    const [extractResult, setExtractResult] =
        useState<AipSummaryExtractResult | null>(null);

    const { sheets, workbook, fileName, loading, error, handleFileChange } =
        useImportWorkbook(() => {
            setSelectedSheet('');
            setConfig(getDefaultAipSummaryConfig());
            setVerifyResult(null);
            setExtractResult(null);
            setStep('upload');
        });

    const canCalibrate = selectedSheet !== '';
    const canVerify = canCalibrate && config.headerRow !== '';
    const canExtract = verifyResult?.valid === true && canVerify;
    const canImportPpa =
        canExtract &&
        extractResult !== null &&
        extractResult.records.length > 0;

    function handleSheetChange(sheet: string) {
        setSelectedSheet(sheet);
        setVerifyResult(null);
        setExtractResult(null);
    }

    function updateColumn(field: AipSummaryField, letter: string) {
        setConfig((prev) => ({
            ...prev,
            columnConfig: { ...prev.columnConfig, [field]: letter },
        }));
        setVerifyResult(null);
        setExtractResult(null);
    }

    function updateHeaderRow(v: string) {
        setConfig((prev) => ({
            ...prev,
            headerRow: v === '' ? '' : Number(v),
        }));
        setVerifyResult(null);
        setExtractResult(null);
    }

    function updateHasNumberRow(v: boolean) {
        setConfig((prev) => ({ ...prev, hasNumberRow: v }));
        setVerifyResult(null);
        setExtractResult(null);
    }

    function handleResetDefaults() {
        setConfig(getDefaultAipSummaryConfig());
        setVerifyResult(null);
        setExtractResult(null);
    }

    function handleVerify() {
        if (!workbook || !canVerify) {
            return;
        }

        setVerifyResult(verifyAipSummarySheet(workbook, selectedSheet, config));
        setExtractResult(null);
    }

    function handleExtract() {
        if (!workbook || !canExtract || config.headerRow === '') {
            return;
        }

        const ws = workbook.getWorksheet(selectedSheet);

        if (!ws) {
            return;
        }

        setExtractResult(
            extractAipSummaryRecords(ws, { ...config, headerRow: config.headerRow }),
        );
    }

    return (
        <ImportPageShell
            title="AIP Summary Import"
            description="Import AIP Summary from XLSX. Upload a workbook and pick a sheet."
            fileName={fileName}
            loading={loading}
            step={step}
            onStepChange={(v) => setStep(v as ImportStep)}
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
                // { value: 'review', label: '5. Review & Import' },
                // { value: 'import-ppa', label: '6. Import PPA' },
                // { value: 'import-outputs', label: '7. Import Outputs' },
                // { value: 'import-funding', label: '8. Import Funding' },
            ]}
        >
            <ImportAipUploadStep
                error={error}
                loading={loading}
                onFileChange={handleFileChange}
                sheets={sheets}
                selectedSheet={selectedSheet}
                onSheetChange={handleSheetChange}
                canCalibrate={canCalibrate}
                onNext={() => setStep('calibrate')}
            />
            <ImportAipCalibrateStep
                config={config}
                selectedSheet={selectedSheet}
                canVerify={canVerify}
                onHeaderRowChange={updateHeaderRow}
                onHasNumberRowChange={updateHasNumberRow}
                onColumnChange={updateColumn}
                onResetDefaults={handleResetDefaults}
                onBack={() => setStep('upload')}
                onNext={() => setStep('verify')}
            />
            <ImportAipVerifyStep
                selectedSheet={selectedSheet}
                config={config}
                canVerify={canVerify}
                verifyResult={verifyResult}
                canExtract={canExtract}
                onVerify={handleVerify}
                onBack={() => setStep('calibrate')}
                onNext={() => setStep('extract')}
            />
            <ImportAipExtractStep
                selectedSheet={selectedSheet}
                canExtract={canExtract}
                extractResult={extractResult}
                canImportPpa={canImportPpa}
                onExtract={handleExtract}
                onImportPpa={() => setStep('import-ppa')}
                onImportOutputs={() => setStep('import-outputs')}
                onImportFunding={() => setStep('import-funding')}
                onBack={() => setStep('verify')}
            />
            {/* <ReviewAndImport s={s} /> */}
            {/* <ImportPpaStep s={s} /> */}
            {/* <ImportOutputsStep s={s} /> */}
            {/* <ImportFundingStep s={s} /> */}
        </ImportPageShell>
    );
}

AipSummaryImport.layout = {
    breadcrumbs: [
        { title: 'Imports', href: importsIndex().url },
        { title: 'AIP Summary Import', href: '/imports/aip-summary-import' },
    ],
};
