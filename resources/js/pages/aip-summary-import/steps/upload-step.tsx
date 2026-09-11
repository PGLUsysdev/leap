// resources/js/pages/aip-summary-import/steps/upload-step.tsx

import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { AipImportState } from '../types';

export function UploadStep({ s }: { s: AipImportState }) {
    const {
        loading,
        error,
        sheets,
        selectedSheet,
        canCalibrate,
        handleFileChange,
        handleSheetChange,
        setStep,
    } = s;

    return (
        <TabsContent value="upload" className="mt-4 flex flex-col gap-4">
            <Field>
                <FieldLabel htmlFor="aip-summary-import-file">
                    Excel File (.xlsx only)
                </FieldLabel>
                <Input
                    id="aip-summary-import-file"
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
                    <FieldLabel>Sheets — select one</FieldLabel>
                    <ToggleGroup
                        value={selectedSheet ? [selectedSheet] : []}
                        onValueChange={handleSheetChange}
                        className="flex flex-wrap"
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
                            {selectedSheet || 'none'}
                        </span>
                    </FieldDescription>
                </Field>
            )}

            <div className="flex justify-end">
                <Button
                    disabled={!canCalibrate}
                    onClick={() => setStep('calibrate')}
                >
                    Next: Calibrate
                </Button>
            </div>
        </TabsContent>
    );
}
