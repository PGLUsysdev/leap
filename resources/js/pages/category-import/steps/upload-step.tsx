// resources/js/pages/category-import/steps/upload-step.tsx

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { TabsContent } from '@/components/ui/tabs';
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

    return (
        <TabsContent value="upload" className="mt-4 flex flex-col gap-4">
            <Field>
                <FieldLabel htmlFor="category-import-file">
                    Excel File (.xlsx only)
                </FieldLabel>
                <Input
                    id="category-import-file"
                    type="file"
                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={handleFileChange}
                    disabled={loading}
                />
                <FieldDescription>
                    Select an .xlsx file. Only .xlsx is accepted (ExcelJS).
                </FieldDescription>
                {error && <p className="text-destructive text-sm">{error}</p>}
            </Field>

            {loading && (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Spinner /> Parsing workbook...
                </div>
            )}

            {!loading && sheets.length > 0 && (
                <Field>
                    <FieldLabel>
                        Sheets — click to select one or more (multi-sheet)
                    </FieldLabel>
                    <div className="flex flex-wrap gap-2 rounded-lg border p-3">
                        {sheets.map((sheet) => {
                            const isSelected = selectedSheets.includes(sheet);

                            return (
                                <Badge
                                    key={sheet}
                                    variant={
                                        isSelected ? 'default' : 'secondary'
                                    }
                                    className="cursor-pointer text-sm transition-colors hover:opacity-80"
                                    onClick={() => handleSheetToggle(sheet)}
                                >
                                    {sheet} {isSelected && '✓'}
                                </Badge>
                            );
                        })}
                    </div>
                    <FieldDescription>
                        Selected:{' '}
                        <span className="text-foreground font-medium">
                            {selectedSheets.length > 0
                                ? selectedSheets.join(', ')
                                : 'none'}
                        </span>{' '}
                        — {selectedSheets.length}/{sheets.length} sheets
                    </FieldDescription>
                    {selectedSheets.length > 1 && (
                        <p className="text-muted-foreground text-xs">
                            Shared calibration will apply to all{' '}
                            {selectedSheets.length} sheets; per-sheet mode lets
                            you adjust individually.
                        </p>
                    )}
                </Field>
            )}

            <div className="flex justify-end">
                <Button
                    disabled={selectedSheets.length === 0}
                    onClick={() => {
                        ensureCalibrationsInitialized();
                        setStep('calibrate');
                    }}
                >
                    Next: Calibrate{' '}
                    {selectedSheets.length > 0 &&
                        `(${selectedSheets.length} sheets)`}
                </Button>
            </div>
        </TabsContent>
    );
}
