// resources/js/components/imports/import-aip-upload-step.tsx
//
// Shared upload step for the AIP Summary family. Mirrors
// `import-upload-step.tsx` (PPMP) in structure — file field, single-sheet
// picker, Next footer — but speaks AIP-native state: `selectedSheet: string`
// (`''` = none) and `onSheetChange: (sheet: string) => void`, matching
// `AipImportState`. Composed from `ImportFileField` + `ImportSheetPicker`
// so future AIP importers reuse it without copying markup.

import type { ChangeEvent, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { TabsContent } from '@/components/ui/tabs';
import { ImportFileField } from './import-file-field';
import { ImportSheetPicker } from './import-sheet-picker';

interface ImportAipUploadStepProps {
    tabsValue?: string;

    fileInputId?: string;
    fileLabel?: string;
    fileDescription?: ReactNode;
    error?: string | null;
    loading?: boolean;
    onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;

    sheets: string[];
    /** Currently picked sheet, or '' when nothing is selected. */
    selectedSheet: string;
    sheetPickerLabel?: string;
    onSheetChange: (sheet: string) => void;

    canCalibrate: boolean;
    onNext: () => void;
    nextLabel?: string;
}

export function ImportAipUploadStep({
    tabsValue = 'upload',

    fileInputId = 'aip-summary-import-file',
    fileLabel = 'Excel File (.xlsx only)',
    fileDescription = 'Select an .xlsx file. Only .xlsx is accepted (ExcelJS).',
    error,
    loading = false,
    onFileChange,

    sheets,
    selectedSheet,
    sheetPickerLabel,
    onSheetChange,

    canCalibrate,
    onNext,
    nextLabel = 'Next: Calibrate',
}: ImportAipUploadStepProps) {
    const pickerLabel = sheetPickerLabel ?? 'Sheet — select one';

    return (
        <TabsContent value={tabsValue} className="mt-4 flex flex-col gap-4">
            <ImportFileField
                id={fileInputId}
                label={fileLabel}
                description={fileDescription}
                error={error}
                loading={loading}
                onFileChange={onFileChange}
            />

            {!loading && sheets.length > 0 && (
                <Field>
                    <FieldLabel id="sheet-picker-label">
                        {pickerLabel}
                    </FieldLabel>

                    <ImportSheetPicker
                        sheets={sheets}
                        selected={selectedSheet ? [selectedSheet] : []}
                        mode="single"
                        onChange={(v) => onSheetChange(v[0] ?? '')}
                    />

                    <FieldDescription>
                        Selected:{' '}
                        <span className="text-foreground font-medium">
                            {selectedSheet || 'none'}
                        </span>
                    </FieldDescription>
                </Field>
            )}

            {!loading && sheets.length === 0 && !error && (
                <p className="text-muted-foreground text-sm">
                    No sheets found in this workbook.
                </p>
            )}

            <div className="flex justify-end">
                <Button disabled={!canCalibrate} onClick={onNext}>
                    {nextLabel}
                </Button>
            </div>
        </TabsContent>
    );
}
