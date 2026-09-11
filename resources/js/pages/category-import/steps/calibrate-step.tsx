// resources/js/pages/category-import/steps/calibrate-step.tsx

import { Badge } from '@/components/ui/badge';
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
import { getDefaultSharedConfig } from '@/lib/ppmp/sheet-config';
import type { SharedSheetConfig } from '@/lib/ppmp/sheet-config';
import type { CategoryImportState } from '../types';

export function CalibrateStep({ s }: { s: CategoryImportState }) {
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
        getEffectiveConfig: _getEffectiveConfig,
        updateSharedConfig,
        updateCurrentCalibration,
        ensureCalibrationsInitialized,
        handleApplySharedToAll,
        handleCopyCurrentToAll,
        setVerifyResults,
        setExtractResult,
        canVerify,
        setStep,
    } = s;

    const cfg =
        calibrationMode === 'shared'
            ? (sharedConfig ?? getDefaultSharedConfig())
            : (calibrations[currentSheet] ??
              sharedConfig ??
              getDefaultSharedConfig());

    const onChange = (patch: Partial<SharedSheetConfig>) => {
        if (calibrationMode === 'shared') updateSharedConfig(patch);
        else updateCurrentCalibration(patch);

        setVerifyResults({});
        setExtractResult(null);
    };

    return (
        <TabsContent value="calibrate" className="mt-4 flex flex-col gap-4">
            <div className="bg-muted/20 flex flex-wrap items-center gap-3 rounded-lg border p-3">
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
                            } else if (!sharedConfig) {
                                ensureCalibrationsInitialized();
                            }

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
                                const next: Record<string, SharedSheetConfig> =
                                    {};

                                for (const sh of selectedSheets) {
                                    next[sh] = {
                                        ...sharedConfig,
                                        ...calibrations[sh],
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
                        ? `Start row ${sharedConfig?.rowConfig.headerRow === '' || sharedConfig?.rowConfig.headerRow == null ? 7 : sharedConfig.rowConfig.headerRow} applies to every sheet — change once. Snapshot: use “Apply to all” to overwrite per-sheet.`
                        : `Each sheet can differ. Editing ${currentSheet || '—'} only affects that sheet.`}
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
                        onValueChange={setCurrentSheet}
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
                    <FieldDescription>
                        Per-sheet calibration — changes affect only the selected
                        sheet.
                    </FieldDescription>
                </Field>
            )}

            <div className="rounded-lg border p-4">
                <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
                    Calibration{' '}
                    {calibrationMode === 'shared'
                        ? `(Shared – ${selectedSheets.length} sheets)`
                        : `(Per-sheet – ${currentSheet || selectedSheets[0]})`}
                </p>
                <div className="grid grid-cols-3 gap-4">
                    <Field>
                        <FieldLabel htmlFor="data-column">
                            Data Column
                        </FieldLabel>
                        <Input
                            id="data-column"
                            value={cfg.columnConfig.category}
                            onChange={(e) =>
                                onChange({
                                    columnConfig: {
                                        ...cfg.columnConfig,
                                        category: e.target.value.toUpperCase(),
                                    },
                                })
                            }
                            className="w-16"
                            placeholder="F"
                        />
                        <FieldDescription>
                            Category data — default F
                        </FieldDescription>
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="coa-column">
                            Chart of Accounts Column
                        </FieldLabel>
                        <Input
                            id="coa-column"
                            value={cfg.columnConfig.coa}
                            onChange={(e) =>
                                onChange({
                                    columnConfig: {
                                        ...cfg.columnConfig,
                                        coa: e.target.value.toUpperCase(),
                                    },
                                })
                            }
                            className="w-16"
                            placeholder="D"
                        />
                        <FieldDescription>
                            COA column — empty means category. Default D
                        </FieldDescription>
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="unit-column">
                            Unit Column
                        </FieldLabel>
                        <Input
                            id="unit-column"
                            value={cfg.columnConfig.unit}
                            onChange={(e) =>
                                onChange({
                                    columnConfig: {
                                        ...cfg.columnConfig,
                                        unit: e.target.value.toUpperCase(),
                                    },
                                })
                            }
                            className="w-16"
                            placeholder="G"
                        />
                        <FieldDescription>
                            Not consumed by this importer — standard field
                        </FieldDescription>
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="price-column">
                            Price Column
                        </FieldLabel>
                        <Input
                            id="price-column"
                            value={cfg.columnConfig.price}
                            onChange={(e) =>
                                onChange({
                                    columnConfig: {
                                        ...cfg.columnConfig,
                                        price: e.target.value.toUpperCase(),
                                    },
                                })
                            }
                            className="w-16"
                            placeholder="H"
                        />
                        <FieldDescription>
                            Not consumed by this importer — standard field
                        </FieldDescription>
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="item-number-column">
                            Item No. Column
                        </FieldLabel>
                        <Input
                            id="item-number-column"
                            value={cfg.columnConfig.itemNumber}
                            onChange={(e) =>
                                onChange({
                                    columnConfig: {
                                        ...cfg.columnConfig,
                                        itemNumber:
                                            e.target.value.toUpperCase(),
                                    },
                                })
                            }
                            className="w-16"
                            placeholder="E"
                        />
                        <FieldDescription>
                            Item number — placeholder detection. Default E
                        </FieldDescription>
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="header-row">Header Row</FieldLabel>
                        <Input
                            id="header-row"
                            type="number"
                            value={cfg.rowConfig.headerRow ?? ''}
                            onChange={(e) =>
                                onChange({
                                    rowConfig: {
                                        ...cfg.rowConfig,
                                        headerRow:
                                            e.target.value === ''
                                                ? ''
                                                : Number(e.target.value),
                                    },
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
                                        value[0] as SharedSheetConfig['coaLabelMode'],
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
                            <span className="text-muted-foreground text-xs font-normal whitespace-normal">
                                Category → COA label in F (next D same) → Items
                                with D=COA
                            </span>
                            <span className="text-muted-foreground/70 font-mono text-xs">
                                Cat 1 → coa 1 → items / coa 2 → items → Cat 1 -
                                Total
                            </span>
                        </ToggleGroupItem>
                        <ToggleGroupItem
                            value="without-label"
                            className="h-auto flex-1 flex-col items-start gap-1 border p-3 text-left whitespace-normal"
                        >
                            <span className="font-medium">Without label</span>
                            <span className="text-muted-foreground text-xs font-normal whitespace-normal">
                                Category → Items directly with D=COA (no extra
                                label row)
                            </span>
                            <span className="text-muted-foreground/70 font-mono text-xs">
                                Cat 1 → items (coa 1), items (coa 2) → Cat 1 -
                                Total
                            </span>
                        </ToggleGroupItem>
                    </ToggleGroup>
                    <FieldDescription>
                        Choose the layout your sheets use. Both tables you
                        showed are supported.
                    </FieldDescription>
                </Field>
                <div className="mt-4 grid grid-cols-2 gap-4">
                    <Field>
                        <FieldLabel htmlFor="additional-header-row">
                            Additional Items Header Row
                        </FieldLabel>
                        <Input
                            id="additional-header-row"
                            type="number"
                            value={cfg.rowConfig.additionalItemsHeaderRow ?? ''}
                            onChange={(e) => {
                                const v = e.target.value
                                    ? Number(e.target.value)
                                    : null;
                                onChange({
                                    rowConfig: {
                                        ...cfg.rowConfig,
                                        additionalItemsHeaderRow: v,
                                    },
                                });
                            }}
                            className="w-24"
                            placeholder="e.g. 85"
                        />
                        <FieldDescription>
                            {cfg.rowConfig.additionalItemsHeaderRow
                                ? `Resumes at ${cfg.rowConfig.additionalItemsHeaderRow + 1}`
                                : 'Leave empty if none'}
                        </FieldDescription>
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="nonproc-header-row">
                            Non-Procurement Header Row
                        </FieldLabel>
                        <Input
                            id="nonproc-header-row"
                            type="number"
                            value={cfg.rowConfig.nonProcurementHeaderRow ?? ''}
                            onChange={(e) => {
                                const v = e.target.value
                                    ? Number(e.target.value)
                                    : null;
                                onChange({
                                    rowConfig: {
                                        ...cfg.rowConfig,
                                        nonProcurementHeaderRow: v,
                                    },
                                });
                            }}
                            className="w-24"
                            placeholder="e.g. 1258"
                        />
                        <FieldDescription>
                            {cfg.rowConfig.nonProcurementHeaderRow
                                ? `Starts at ${cfg.rowConfig.nonProcurementHeaderRow + 1}`
                                : 'Leave empty if none'}
                        </FieldDescription>
                    </Field>
                </div>
                <div className="text-muted-foreground mt-3 text-xs">
                    Groups: procurement [
                    {cfg.rowConfig.headerRow === '' ||
                    cfg.rowConfig.headerRow == null
                        ? '—'
                        : cfg.rowConfig.headerRow + 1}
                    ..
                    {cfg.rowConfig.additionalItemsHeaderRow
                        ? cfg.rowConfig.additionalItemsHeaderRow - 1
                        : cfg.rowConfig.nonProcurementHeaderRow
                          ? cfg.rowConfig.nonProcurementHeaderRow - 1
                          : 'last'}
                    ] → additional [
                    {cfg.rowConfig.additionalItemsHeaderRow
                        ? cfg.rowConfig.additionalItemsHeaderRow + 1
                        : '—'}
                    ..
                    {cfg.rowConfig.nonProcurementHeaderRow
                        ? cfg.rowConfig.nonProcurementHeaderRow - 1
                        : 'last'}
                    ] → non-proc [
                    {cfg.rowConfig.nonProcurementHeaderRow
                        ? cfg.rowConfig.nonProcurementHeaderRow + 1
                        : '—'}
                    ..last]
                </div>
                {calibrationMode === 'per-sheet' && (
                    <div className="mt-3 text-xs">
                        <span className="text-muted-foreground">
                            Effective for {selectedSheets.length} sheets:{' '}
                        </span>
                        {selectedSheets.map((sh) => {
                            const c = calibrations[sh] ?? sharedConfig;
                            const same =
                                c &&
                                cfg &&
                                c.rowConfig.headerRow ===
                                    cfg.rowConfig.headerRow &&
                                c.columnConfig.category ===
                                    cfg.columnConfig.category &&
                                c.columnConfig.coa === cfg.columnConfig.coa &&
                                c.coaLabelMode === cfg.coaLabelMode;

                            return (
                                <Badge
                                    key={sh}
                                    variant={same ? 'secondary' : 'outline'}
                                    className="mr-1 text-xs"
                                >
                                    {sh}:{' '}
                                    {c
                                        ? `${c.columnConfig.category}/${c.columnConfig.coa} H${c.rowConfig.headerRow} ${c.coaLabelMode === 'without-label' ? 'no-label' : 'label'}`
                                        : 'default'}
                                </Badge>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('upload')}>
                    Back
                </Button>
                <Button onClick={() => setStep('verify')} disabled={!canVerify}>
                    Next: Verify Format
                </Button>
            </div>
        </TabsContent>
    );
}
