import { ImportUploadStep } from '@/components/imports/import-upload-step';
import type { AipImportState } from '../types';

export function UploadStep({ s }: { s: AipImportState }) {
    const {
        loading,
        error,
        sheets,
        selectedSheet,
        canCalibrate,
        handleFileChange,
        handleSheetChange,
        setStep,
    } = s;

    return (
        <ImportUploadStep
            fileInputId="aip-summary-import-file"
            fileLabel="Excel File (.xlsx only)"
            fileDescription="Select an .xlsx file. Only .xlsx is accepted (ExcelJS)."
            error={error}
            loading={loading}
            onFileChange={handleFileChange}
            sheets={sheets}
            selectedSheets={selectedSheet ? [selectedSheet] : []}
            selectionMode="single"
            onSheetsChange={handleSheetChange}
            onNext={() => setStep('calibrate')}
            nextDisabled={!canCalibrate}
        />
    );
}
