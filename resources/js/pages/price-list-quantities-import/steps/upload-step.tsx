// resources/js/pages/price-list-quantities-import/steps/upload-step.tsx

import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { TabsContent } from '@/components/ui/tabs';
import type { PriceListQuantitiesImportState } from '../types';

export function UploadStep({ s }: { s: PriceListQuantitiesImportState }) {
    const {
        sheets,
        selectedSheets,
        fileName,
        error,
        canCalibrate,
        handleFileChange,
        handleSheetToggle,
        ensureCalibrationsInitialized,
        setStep,
    } = s;

    return (
        <TabsContent value="upload" className="flex flex-col gap-4">
            <Field>
                <FieldLabel htmlFor="quantities-file">XLSX file</FieldLabel>
                <Input
                    id="quantities-file"
                    type="file"
                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={handleFileChange}
                />
                <FieldDescription>
                    {fileName ?? 'Choose an .xlsx file to list its sheets.'}
                </FieldDescription>
            </Field>

            {error !== '' && (
                <p className="text-destructive text-sm">{error}</p>
            )}

            {sheets.length > 0 && (
                <div className="flex flex-col gap-2">
                    <h2 className="text-sm font-medium">Sheets</h2>
                    <ul className="flex flex-col gap-1">
                        {sheets.map((name) => (
                            <li key={name}>
                                <button
                                    type="button"
                                    onClick={() => handleSheetToggle(name)}
                                    className={
                                        selectedSheets.includes(name)
                                            ? 'bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm font-medium'
                                            : 'bg-muted hover:bg-muted/70 rounded-md px-3 py-1.5 text-sm'
                                    }
                                >
                                    {name}
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div>
                        <Button
                            disabled={!canCalibrate}
                            onClick={() => {
                                ensureCalibrationsInitialized();
                                setStep('calibrate');
                            }}
                        >
                            Next: Calibrate
                        </Button>
                    </div>
                </div>
            )}
        </TabsContent>
    );
}
