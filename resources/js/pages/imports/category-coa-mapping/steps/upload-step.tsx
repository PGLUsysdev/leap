// resources/js/pages/imports/category-coa-mapping/steps/upload-step.tsx

import type { ChangeEvent, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { TabsContent } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { CategoryCoaMappingState } from '../types';

const XLSX_ACCEPT =
    '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

type SheetSelectionMode = 'single' | 'multiple';

// Kept for reference; no longer used as a prop contract.
interface ImportUploadStepProps {
    fileInputId: string;
    fileLabel?: string;
    fileDescription?: ReactNode;
    error?: string | null;
    loading?: boolean;
    onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;

    sheets: string[];
    selectedSheets: string[];
    selectionMode: SheetSelectionMode;
    sheetPickerLabel?: string;
    onSheetsChange: (sheets: string[]) => void;

    onNext: () => void;
    nextDisabled?: boolean;
    nextLabel?: string;
}

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

    /**
     * Single-sheet mode: the shared picker emits `[picked]` or `[]`.
     * Deselect anything else, then select the picked sheet. The page's
     * `handleSheetToggle` resets downstream results on each call.
     */
    function handleSheetsChange(next: unknown) {
        console.log(
            '[category-coa-mapping handleSheetsChange] raw next:',
            next,
            'selectedSheets before:',
            selectedSheets,
        );
        const flat = (
            Array.isArray(next) ? (next as unknown[]).flat(Infinity) : []
        )
            .map((s) => String(s).trim())
            .filter(Boolean) as string[];
        console.log('[category-coa-mapping handleSheetsChange] flat:', flat);
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

    // ── values that were previously passed as props to <ImportUploadStep> ──
    const fileInputId = 'category-coa-mapping-file';
    const fileLabel = 'Excel File (.xlsx only)';
    const fileDescription =
        'Select an .xlsx file. Only .xlsx is accepted (ExcelJS).';
    const selectionMode: SheetSelectionMode = 'single';
    const sheetPickerLabel: string | undefined = undefined;
    const onSheetsChange = handleSheetsChange;
    const onNext = () => {
        ensureCalibrationsInitialized();
        setStep('calibrate');
    };
    const nextDisabled = selectedSheets.length === 0;
    const nextLabel = 'Next: Calibrate';

    // ── body of ImportUploadStep (verbatim) ────────────────────────────────
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

    const toggleItems = sheets.map((sheet) => (
        <ToggleGroupItem key={sheet} value={sheet}>
            {sheet}
        </ToggleGroupItem>
    ));

    return (
        <TabsContent value="upload" className="mt-4 flex flex-col gap-4">
            {/* ── inlined ImportFileField ─────────────────────────────── */}
            <Field>
                <FieldLabel htmlFor={fileInputId}>{fileLabel}</FieldLabel>
                <Input
                    id={fileInputId}
                    type="file"
                    accept={XLSX_ACCEPT}
                    onChange={handleFileChange}
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
                    <FieldLabel>
                        {sheetPickerLabel ?? defaultPickerLabel}
                    </FieldLabel>

                    {/* ── inlined ImportSheetPicker ──────────────────── */}
                    {selectionMode === 'single' ? (
                        <ToggleGroup
                            type="single"
                            value={selectedSheets[0] ?? ''}
                            onValueChange={
                                ((v: unknown) => {
                                    console.log(
                                        '[picker] single raw v:',
                                        v,
                                        'type:',
                                        typeof v,
                                        'isArray:',
                                        Array.isArray(v),
                                    );
                                    // Base-ui may emit string or string[] depending on version — normalize to string[]
                                    const normalized = Array.isArray(v)
                                        ? (v as unknown[])
                                              .flat()
                                              .map((s) => String(s).trim())
                                              .filter(Boolean)
                                        : v
                                          ? [String(v).trim()]
                                          : [];
                                    console.log(
                                        '[picker] normalized arr:',
                                        normalized,
                                    );
                                    onSheetsChange(normalized);
                                }) as unknown as (value: string) => void
                            }
                            className="flex flex-wrap justify-start"
                        >
                            {toggleItems}
                        </ToggleGroup>
                    ) : (
                        <ToggleGroup
                            type="multiple"
                            value={selectedSheets}
                            onValueChange={
                                ((v: unknown) => {
                                    console.log(
                                        '[picker] multiple raw v:',
                                        v,
                                        'isArray:',
                                        Array.isArray(v),
                                    );
                                    const arr = Array.isArray(v)
                                        ? (v as unknown[])
                                              .flat()
                                              .map((s) => String(s).trim())
                                              .filter(Boolean)
                                        : [];
                                    console.log(
                                        '[picker] normalized multiple arr:',
                                        arr,
                                    );
                                    onSheetsChange(arr);
                                }) as unknown as (value: string[]) => void
                            }
                            className="flex flex-wrap justify-start"
                        >
                            {toggleItems}
                        </ToggleGroup>
                    )}

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
