// resources/js/pages/price-list-import/steps/upload-step.tsx

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { TabsContent } from '@/components/ui/tabs';
import type { PriceListImportState } from '../types';

export function UploadStep({ s }: { s: PriceListImportState }) {
    const {
        sheets,
        selectedSheets,
        loading,
        error,
        isMounted,
        handleFileChange,
        handleSheetToggle,
        ensureCalibrationsInitialized,
        setStep,
    } = s;

    return (
        <TabsContent value="upload" className="mt-4 flex flex-col gap-4">
            <Field>
                <FieldLabel htmlFor="price-list-file">
                    Excel File (.xlsx only)
                </FieldLabel>
                <Input
                    id="price-list-file"
                    type="file"
                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={handleFileChange}
                    disabled={loading}
                />
                <FieldDescription>
                    Select an .xlsx price list export (PPMP template).
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
                        Sheets — click to select one or more
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
                                    className="cursor-pointer text-sm hover:opacity-80"
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
                </Field>
            )}

            <div className="flex justify-end">
                <Button
                    suppressHydrationWarning
                    disabled={isMounted ? selectedSheets.length === 0 : false}
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
