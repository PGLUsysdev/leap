import { ImportUploadStep } from '@/components/imports/import-upload-step';
import type { CategoryImportState } from '../types';

export function UploadStep({ s }: { s: CategoryImportState }) {
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

    /**
     * Adapter: shared picker emits the full new selection, but the page's
     * `handleSheetToggle` operates on individual add/remove. Diff against the
     * current selection and apply the toggles. Functional setState inside
     * `handleSheetToggle` composes across calls.
     */
    function handleSheetsChange(next: string[]) {
        const toAdd = next.filter((s) => !selectedSheets.includes(s));
        const toRemove = selectedSheets.filter((s) => !next.includes(s));

        for (const sheet of toAdd) handleSheetToggle(sheet);

        for (const sheet of toRemove) handleSheetToggle(sheet);
    }

    return (
        <ImportUploadStep
            fileInputId="category-import-file"
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
