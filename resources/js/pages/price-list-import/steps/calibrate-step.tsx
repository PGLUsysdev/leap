// resources/js/pages/price-list-import/steps/calibrate-step.tsx

import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { TabsContent } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { SharedSheetConfig } from '@/lib/ppmp/sheet-config';
import type { PriceListImportState, PriceListSheetConfig } from '../types';
import { getDefaultSharedConfig } from '@/lib/ppmp/sheet-config';

function getDefaultPriceListConfig(): PriceListSheetConfig {
    return getDefaultSharedConfig();
}

export function CalibrateStep({ s }: { s: PriceListImportState }) {
    const {
        calibrationMode,
        setCalibrationMode,
        sharedConfig,
        setSharedConfig,
        calibrations,
        setCalibrations,
        currentSheet,
        setCurrentSheet,
        selectedSheets,
        verifyResults,
        isMounted,
        ensureCalibrationsInitialized,
        handleApplySharedToAll,
        handleCopyCurrentToAll,
        updateSharedConfig,
        updateCurrentCalibration,
        setVerifyResults,
        setRawItems,
        setUniqueItems,
        setSelected,
        setCoaOverrides,
        setReviewFilter,
        setShowDuplicateDetails,
        setStep,
    } = s;

    const cfg =
        calibrationMode === 'shared'
            ? (sharedConfig ?? getDefaultPriceListConfig())
            : (calibrations[currentSheet] ??
              sharedConfig ??
              getDefaultPriceListConfig());

    const onChange = (patch: Partial<PriceListSheetConfig>) => {
        if (calibrationMode === 'shared') updateSharedConfig(patch);
        else updateCurrentCalibration(patch);

        setVerifyResults({});
        setRawItems([]);
        setUniqueItems([]);
        setSelected(new Set());
        setCoaOverrides({});
        setReviewFilter('all');
        setShowDuplicateDetails(false);
    };

    const onColumn = (patch: Partial<SharedSheetConfig['columnConfig']>) => {
        onChange({
            columnConfig: { ...cfg.columnConfig, ...patch },
        } as Partial<PriceListSheetConfig>);
    };

    const onRow = (patch: Partial<SharedSheetConfig['rowConfig']>) => {
        onChange({
            rowConfig: { ...cfg.rowConfig, ...patch },
        } as unknown as Partial<PriceListSheetConfig>);
    };

    return (
        <TabsContent value="calibrate" className="mt-4 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
                <span className="text-sm font-medium">Scope:</span>
                <div className="flex gap-2">
                    <Button
                        variant={
                            calibrationMode === 'shared' ? 'default' : 'outline'
                        }
                        size="sm"
                        onClick={() => {
                            if (
                                calibrationMode === 'per-sheet' &&
                                calibrations[currentSheet]
                            ) {
                                setSharedConfig({
                                    ...calibrations[currentSheet],
                                });
                            } else if (!sharedConfig)
                                ensureCalibrationsInitialized();

                            setCalibrationMode('shared');
                        }}
                    >
                        Shared — all {selectedSheets.length} sheets
                    </Button>
                    <Button
                        variant={
                            calibrationMode === 'per-sheet'
                                ? 'default'
                                : 'outline'
                        }
                        size="sm"
                        onClick={() => {
                            if (sharedConfig) {
                                const next: Record<
                                    string,
                                    PriceListSheetConfig
                                > = {};

                                for (const sh of selectedSheets) {
                                    next[sh] = {
                                        ...sharedConfig,
                                        columnConfig: {
                                            ...sharedConfig.columnConfig,
                                        },
                                        rowConfig: {
                                            ...sharedConfig.rowConfig,
                                        },
                                    };
                                }

                                setCalibrations(next);

                                if (!currentSheet && selectedSheets[0]) {
                                    setCurrentSheet(selectedSheets[0]);
                                }
                            }

                            setCalibrationMode('per-sheet');
                        }}
                    >
                        Per-sheet
                    </Button>
                </div>
                <span className="text-muted-foreground text-xs">
                    {calibrationMode === 'shared'
                        ? `Header row ${sharedConfig?.rowConfig.headerRow === '' || sharedConfig?.rowConfig.headerRow == null ? 7 : sharedConfig.rowConfig.headerRow} applies to every sheet`
                        : `Editing ${currentSheet || '—'} only affects that sheet`}
                </span>
                {calibrationMode === 'shared' ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleApplySharedToAll}
                        disabled={!sharedConfig}
                    >
                        Apply shared to all ({selectedSheets.length})
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyCurrentToAll}
                        disabled={!currentSheet}
                    >
                        Copy “{currentSheet}” to all
                    </Button>
                )}
            </div>

            {calibrationMode === 'per-sheet' && selectedSheets.length > 1 && (
                <Field>
                    <FieldLabel>Editing sheet</FieldLabel>
                    <Select
                        value={currentSheet}
                        onValueChange={(v) => setCurrentSheet(v ?? '')}
                    >
                        <SelectTrigger className="w-[260px]">
                            <SelectValue placeholder="Select sheet to edit" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {selectedSheets.map((sh) => (
                                    <SelectItem key={sh} value={sh}>
                                        {sh}{' '}
                                        {verifyResults[sh]?.valid
                                            ? '✓'
                                            : verifyResults[sh]
                                              ? '❌'
                                              : ''}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </Field>
            )}

            <div className="rounded-lg border p-4">
                <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
                    Calibration{' '}
                    {calibrationMode === 'shared'
                        ? `(Shared – ${selectedSheets.length} sheets)`
                        : `(Per-sheet – ${currentSheet || selectedSheets[0]})`}
                </p>
                <div className="grid grid-cols-4 gap-4">
                    <Field>
                        <FieldLabel>COA Column</FieldLabel>
                        <Input
                            value={cfg.columnConfig.coa}
                            onChange={(e) =>
                                onColumn({
                                    coa: e.target.value.toUpperCase(),
                                })
                            }
                            className="w-16"
                            placeholder="D"
                        />
                        <FieldDescription>
                            D — empty means category
                        </FieldDescription>
                    </Field>
                    <Field>
                        <FieldLabel>Category / Description Column</FieldLabel>
                        <Input
                            value={cfg.columnConfig.category}
                            onChange={(e) =>
                                onColumn({
                                    category: e.target.value.toUpperCase(),
                                })
                            }
                            className="w-16"
                            placeholder="F"
                        />
                        <FieldDescription>F — shared</FieldDescription>
                    </Field>
                    <Field>
                        <FieldLabel>Unit Column</FieldLabel>
                        <Input
                            value={cfg.columnConfig.unit}
                            onChange={(e) =>
                                onColumn({
                                    unit: e.target.value.toUpperCase(),
                                })
                            }
                            className="w-16"
                            placeholder="G"
                        />
                        <FieldDescription>G</FieldDescription>
                    </Field>
                    <Field>
                        <FieldLabel>Price Column</FieldLabel>
                        <Input
                            value={cfg.columnConfig.price}
                            onChange={(e) =>
                                onColumn({
                                    price: e.target.value.toUpperCase(),
                                })
                            }
                            className="w-16"
                            placeholder="H"
                        />
                        <FieldDescription>H</FieldDescription>
                    </Field>
                    <Field>
                        <FieldLabel>Item No. Column</FieldLabel>
                        <Input
                            value={cfg.columnConfig.itemNumber}
                            onChange={(e) =>
                                onColumn({
                                    itemNumber: e.target.value.toUpperCase(),
                                })
                            }
                            className="w-16"
                            placeholder="E"
                        />
                        <FieldDescription>
                            E — placeholder detection
                        </FieldDescription>
                    </Field>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4">
                    <Field>
                        <FieldLabel>Header Row</FieldLabel>
                        <Input
                            type="number"
                            value={cfg.rowConfig.headerRow ?? ''}
                            onChange={(e) =>
                                onRow({
                                    headerRow:
                                        e.target.value === ''
                                            ? ''
                                            : Number(e.target.value),
                                })
                            }
                            className="w-20"
                            placeholder="7"
                        />
                        <FieldDescription>
                            Header{' '}
                            {cfg.rowConfig.headerRow === '' ||
                            cfg.rowConfig.headerRow == null
                                ? '—'
                                : cfg.rowConfig.headerRow}
                            ; data starts{' '}
                            {cfg.rowConfig.headerRow === '' ||
                            cfg.rowConfig.headerRow == null
                                ? '—'
                                : cfg.rowConfig.headerRow + 1}
                        </FieldDescription>
                    </Field>
                    <Field>
                        <FieldLabel>
                            Additional Items Header Row (optional)
                        </FieldLabel>
                        <Input
                            type="number"
                            value={cfg.rowConfig.additionalItemsHeaderRow ?? ''}
                            onChange={(e) =>
                                onRow({
                                    additionalItemsHeaderRow: e.target.value
                                        ? Number(e.target.value)
                                        : null,
                                })
                            }
                            className="w-20"
                            placeholder="—"
                        />
                        <FieldDescription>
                            Blank = no additional section
                        </FieldDescription>
                    </Field>
                    <Field>
                        <FieldLabel>
                            Non-Procurement Header Row (optional)
                        </FieldLabel>
                        <Input
                            type="number"
                            value={cfg.rowConfig.nonProcurementHeaderRow ?? ''}
                            onChange={(e) =>
                                onRow({
                                    nonProcurementHeaderRow: e.target.value
                                        ? Number(e.target.value)
                                        : null,
                                })
                            }
                            className="w-20"
                            placeholder="—"
                        />
                        <FieldDescription>
                            Blank = no non-proc section
                        </FieldDescription>
                    </Field>
                </div>
                <Field className="mt-4">
                    <FieldLabel>COA items format *</FieldLabel>
                    <ToggleGroup
                        variant="outline"
                        spacing={2}
                        value={[cfg.coaLabelMode]}
                        onValueChange={(value) => {
                            if (value.length > 0) {
                                onChange({
                                    coaLabelMode:
                                        value[0] as PriceListSheetConfig['coaLabelMode'],
                                });
                            }
                        }}
                        className="w-full"
                    >
                        <ToggleGroupItem
                            value="with-label"
                            className="h-auto flex-1 flex-col items-start gap-1 border p-3 text-left whitespace-normal"
                        >
                            <span className="font-medium">
                                With COA label rows
                            </span>
                            <span className="text-muted-foreground text-xs font-normal">
                                Category → COA label in F (next D same) → Items
                                with D=COA
                            </span>
                            <span className="text-muted-foreground/70 font-mono text-xs">
                                Cat → coa → items → Cat - Total
                            </span>
                        </ToggleGroupItem>
                        <ToggleGroupItem
                            value="without-label"
                            className="h-auto flex-1 flex-col items-start gap-1 border p-3 text-left whitespace-normal"
                        >
                            <span className="font-medium">
                                Without COA label rows
                            </span>
                            <span className="text-muted-foreground text-xs font-normal">
                                Items already have D=COA directly, no label rows
                            </span>
                            <span className="text-muted-foreground/70 font-mono text-xs">
                                Cat → items (D=coa) → Cat - Total
                            </span>
                        </ToggleGroupItem>
                    </ToggleGroup>
                </Field>
            </div>

            <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('upload')}>
                    Back
                </Button>
                <Button
                    suppressHydrationWarning
                    onClick={() => setStep('verify')}
                    disabled={isMounted ? !sharedConfig : false}
                >
                    Next: Verify Format
                </Button>
            </div>
        </TabsContent>
    );
}
