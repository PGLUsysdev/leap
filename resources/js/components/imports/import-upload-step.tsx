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
    /** Currently picked sheet, or null when nothing is selected. */
    selectedSheet: string | null;
    sheetPickerLabel?: string;
    onSheetChange: (sheet: string | null) => void;

    onNext: () => void;
    nextLabel?: string;
}

export function ImportUploadStep({
    fileInputId,
    fileLabel = 'Excel File (.xlsx only)',
    fileDescription = 'Select a PPMP workbook (.xlsx). Only .xlsx is accepted (ExcelJS).',
    error,
    loading = false,
    onFileChange,

    sheets,
    selectedSheet,
    sheetPickerLabel,
    onSheetChange,

    onNext,
    nextLabel = 'Next: Calibrate',
}: ImportUploadStepProps) {
    const pickerLabel = sheetPickerLabel ?? 'Sheet — select one';
    const isDisabled = selectedSheet === null;

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
                    <FieldLabel id="sheet-picker-label">
                        {pickerLabel}
                    </FieldLabel>

                    <ToggleGroup
                        multiple={false}
                        value={selectedSheet ? [selectedSheet] : []}
                        onValueChange={(value) =>
                            onSheetChange(value[0] ?? null)
                        }
                        aria-labelledby="sheet-picker-label"
                        className="flex flex-wrap justify-start"
                    >
                        {sheets.map((sheet) => (
                            <ToggleGroupItem key={sheet} value={sheet}>
                                {sheet}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>

                    <FieldDescription>
                        Selected:{' '}
                        <span className="text-foreground font-medium">
                            {selectedSheet ?? 'none'}
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
                <Button disabled={isDisabled} onClick={onNext}>
                    {nextLabel}
                </Button>
            </div>
        </TabsContent>
    );
}
