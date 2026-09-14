import { ImportUploadStep } from '@/components/imports/import-upload-step';
import type { PriceListQuantitiesImportState } from '../types';

export function UploadStep({ s }: { s: PriceListQuantitiesImportState }) {
    const {
        sheets,
        selectedSheets,
        loading,
        error,
        canCalibrate,
        handleFileChange,
        handleSheetToggle,
        ensureCalibrationsInitialized,
        setStep,
    } = s;

    /**
     * Single-sheet mode: the shared picker emits `[picked]` or `[]`.
     * Deselect anything else, then select the picked sheet. The page's
     * `handleSheetToggle` resets downstream results on each call.
     */
    function handleSheetsChange(next: unknown) {
        console.log('[price-list-quantities handleSheetsChange] raw next:', next, 'selectedSheets before:', selectedSheets);
        const flat = (Array.isArray(next) ? (next as unknown[]).flat(Infinity) : [])
            .map((s) => String(s).trim())
            .filter(Boolean) as string[];
        console.log('[price-list-quantities handleSheetsChange] flat:', flat);
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

    return (
        <ImportUploadStep
            fileInputId="price-list-quantities-file"
            fileLabel="Excel File (.xlsx only)"
            fileDescription="Select an .xlsx file. Only .xlsx is accepted (ExcelJS)."
            error={error}
            loading={loading}
            onFileChange={handleFileChange}
            sheets={sheets}
            selectedSheets={selectedSheets}
            selectionMode="single"
            onSheetsChange={handleSheetsChange}
            onNext={() => {
                ensureCalibrationsInitialized();
                setStep('calibrate');
            }}
            nextDisabled={!canCalibrate}
        />
    );
}
