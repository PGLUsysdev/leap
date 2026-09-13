import type { ChangeEvent, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { TabsContent } from '@/components/ui/tabs';
import { ImportFileField } from './import-file-field';
import { ImportSheetPicker } from './import-sheet-picker';
import type { SheetSelectionMode } from './import-sheet-picker';

interface ImportUploadStepProps {
    // file input
    fileInputId: string;
    fileLabel?: string;
    fileDescription?: ReactNode;
    error?: string | null;
    loading?: boolean;
    onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;

    // sheet picker
    sheets: string[];
    selectedSheets: string[];
    selectionMode: SheetSelectionMode;
    sheetPickerLabel?: string;
    onSheetsChange: (sheets: string[]) => void;

    // next button
    onNext: () => void;
    nextDisabled?: boolean;
    nextLabel?: string;
}

export function ImportUploadStep({
    fileInputId,
    fileLabel,
    fileDescription,
    error,
    loading,
    onFileChange,

    sheets,
    selectedSheets,
    selectionMode,
    sheetPickerLabel,
    onSheetsChange,

    onNext,
    nextDisabled,
    nextLabel = 'Next: Calibrate',
}: ImportUploadStepProps) {
    const defaultPickerLabel =
        selectionMode === 'single'
            ? 'Sheets — select one'
            : 'Sheets — select one or more (multi-sheet)';

    const isDisabled =
        nextDisabled ??
        (selectionMode === 'single'
            ? selectedSheets.length === 0
            : selectedSheets.length === 0);

    const countSuffix =
        selectionMode === 'multiple' && selectedSheets.length > 0
            ? ` (${selectedSheets.length} sheet${selectedSheets.length === 1 ? '' : 's'})`
            : '';

    return (
        <TabsContent value="upload" className="mt-4 flex flex-col gap-4">
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
                    <FieldLabel>
                        {sheetPickerLabel ?? defaultPickerLabel}
                    </FieldLabel>
                    <ImportSheetPicker
                        sheets={sheets}
                        selected={selectedSheets}
                        mode={selectionMode}
                        onChange={onSheetsChange}
                    />
                    <FieldDescription>
                        Selected:{' '}
                        <span className="text-foreground font-medium">
                            {selectedSheets.length > 0
                                ? selectedSheets.join(', ')
                                : 'none'}
                        </span>
                        {selectionMode === 'multiple' &&
                            ` — ${selectedSheets.length}/${sheets.length} sheets`}
                    </FieldDescription>
                    {selectionMode === 'multiple' &&
                        selectedSheets.length > 1 && (
                            <p className="text-muted-foreground text-xs">
                                Shared calibration will apply to all{' '}
                                {selectedSheets.length} sheets; per-sheet mode
                                lets you adjust individually.
                            </p>
                        )}
                </Field>
            )}

            <div className="flex justify-end">
                <Button disabled={isDisabled} onClick={onNext}>
                    {nextLabel}
                    {countSuffix}
                </Button>
            </div>
        </TabsContent>
    );
}
