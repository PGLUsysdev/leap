import { ImportUploadStep } from '@/components/imports/import-upload-step';
import type { CategoryCoaMappingState } from '../types';

export function UploadStep({ s }: { s: CategoryCoaMappingState }) {
    const {
        sheets,
        selectedSheets,
        loading,
        error,
        handleFileChange,
        handleSheetToggle,
        ensureCalibrationsInitialized,
        setStep,
    } = s;

    function handleSheetsChange(next: string[]) {
        const toAdd = next.filter((s) => !selectedSheets.includes(s));
        const toRemove = selectedSheets.filter((s) => !next.includes(s));

        for (const sheet of toAdd) handleSheetToggle(sheet);

        for (const sheet of toRemove) handleSheetToggle(sheet);
    }

    return (
        <ImportUploadStep
            fileInputId="category-coa-mapping-file"
            fileLabel="Excel File (.xlsx only)"
            fileDescription="Select an .xlsx file. Only .xlsx is accepted (ExcelJS)."
            error={error}
            loading={loading}
            onFileChange={handleFileChange}
            sheets={sheets}
            selectedSheets={selectedSheets}
            selectionMode="multiple"
            onSheetsChange={handleSheetsChange}
            onNext={() => {
                ensureCalibrationsInitialized();
                setStep('calibrate');
            }}
            nextDisabled={selectedSheets.length === 0}
        />
    );
}
