// resources/js/components/imports/import-upload-step.tsx

import type { ChangeEvent, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { TabsContent } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const XLSX_ACCEPT =
    '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

interface ImportUploadStepProps {
    fileInputId: string;
    fileLabel?: string;
    fileDescription?: ReactNode;
    error?: string | null;
    loading?: boolean;
    onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;

    sheets: string[];
    selectedSheets: string[];
    sheetPickerLabel?: string;
    onSheetsChange: (sheets: string[]) => void;

    onNext: () => void;
    nextDisabled?: boolean;
    nextLabel?: string;
}

export function ImportUploadStep({
    fileInputId,
    fileLabel = 'Excel File (.xlsx only)',
    fileDescription = 'Select an .xlsx file. Only .xlsx is accepted (ExcelJS).',
    error,
    loading = false,
    onFileChange,

    sheets,
    selectedSheets,
    sheetPickerLabel,
    onSheetsChange,

    onNext,
    nextDisabled,
    nextLabel = 'Next: Calibrate',
}: ImportUploadStepProps) {
    const pickerLabel = sheetPickerLabel ?? 'Sheets — select one';

    const isDisabled = nextDisabled ?? selectedSheets.length === 0;

    const toggleItems = sheets.map((sheet) => (
        <ToggleGroupItem key={sheet} value={sheet}>
            {sheet}
        </ToggleGroupItem>
    ));

    return (
        <TabsContent value="upload" className="mt-4 flex flex-col gap-4">
            <Field>
                <FieldLabel htmlFor={fileInputId}>{fileLabel}</FieldLabel>
                <Input
                    id={fileInputId}
                    type="file"
                    accept={XLSX_ACCEPT}
                    onChange={onFileChange}
                    disabled={loading}
                />
                <FieldDescription>{fileDescription}</FieldDescription>
                {error && <p className="text-destructive text-sm">{error}</p>}
                {loading && (
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Spinner /> Parsing workbook...
                    </div>
                )}
            </Field>

            {!loading && sheets.length > 0 && (
                <Field>
                    <FieldLabel>{pickerLabel}</FieldLabel>

                    <ToggleGroup
                        value={selectedSheets}
                        onValueChange={(groupValue) => {
                            onSheetsChange(groupValue);
                        }}
                        className="flex flex-wrap justify-start"
                    >
                        {toggleItems}
                    </ToggleGroup>

                    <FieldDescription>
                        Selected:{' '}
                        <span className="text-foreground font-medium">
                            {selectedSheets.length > 0
                                ? selectedSheets.join(', ')
                                : 'none'}
                        </span>
                    </FieldDescription>
                </Field>
            )}

            <div className="flex justify-end">
                <Button disabled={isDisabled} onClick={onNext}>
                    {nextLabel}
                </Button>
            </div>
        </TabsContent>
    );
}
