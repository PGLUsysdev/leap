// resources/js/pages/category-coa-mapping/steps/calibrate-step.tsx

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
import { getDefaultMappingConfig } from '@/lib/ppmp/sheet-config';
import type {
    CategoryCoaColumnConfig,
    CategoryCoaSheetConfig,
} from '@/lib/ppmp/sheet-config';
import type { CategoryCoaMappingState } from '../types';

export function CalibrateStep({ s }: { s: CategoryCoaMappingState }) {
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
        formatResults,
        handleApplySharedToAll,
        handleCopyCurrentToAll,
        handleColumnConfigChange,
        handleRowConfigChange,
        handleMatchFieldChange,
        handleCoaLabelModeChange,
        handleResetCalibration,
        ensureCalibrationsInitialized,
        canVerifyFormat,
        setStep,
    } = s;

    const cfg =
        calibrationMode === 'shared'
            ? (sharedConfig ?? getDefaultMappingConfig())
            : (calibrations[currentSheet] ??
              sharedConfig ??
              getDefaultMappingConfig());

    return (
        <TabsContent value="calibrate" className="mt-4 flex flex-col gap-4">
            <div className="bg-card flex flex-wrap items-center gap-3 rounded-lg border p-3">
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
                                    CategoryCoaSheetConfig
                                > = {};

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
                        ? `Shared — header ${sharedConfig?.rowConfig.headerRow === '' || sharedConfig?.rowConfig.headerRow == null ? 7 : sharedConfig.rowConfig.headerRow} applies to all ${selectedSheets.length} sheets.`
                        : `Per-sheet — editing ${currentSheet || '—'} only.`}
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
                                        {formatResults[sh]?.valid
                                            ? '✓'
                                            : formatResults[sh]
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
                <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
                    Calibration — Category ↔ COA mapping reference
                </p>
                <p className="text-muted-foreground mb-3 text-xs">
                    Tell us where Category and COA live in the sheet. Data is
                    read from{' '}
                    <span className="font-medium">headerRow + 1 → end</span>.
                    Sentinel categories for COA-only rows:{' '}
                    <span className="font-medium">
                        Additional Items (Uncategorized)
                    </span>{' '}
                    (id 276) and{' '}
                    <span className="font-medium">
                        Non-Procurement (Uncategorized)
                    </span>{' '}
                    (id 277) handle COA without category.
                </p>

                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-card rounded-md border p-3">
                        <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                            Column Config
                        </p>
                        <div className="grid grid-cols-4 gap-4">
                            <Field>
                                <FieldLabel htmlFor="coa-column">
                                    COA Column
                                </FieldLabel>
                                <Input
                                    id="coa-column"
                                    value={cfg.columnConfig.coa}
                                    onChange={(e) =>
                                        handleColumnConfigChange({
                                            coa: e.target.value.toUpperCase(),
                                        })
                                    }
                                    className="w-16"
                                    placeholder="D"
                                />
                                <FieldDescription>
                                    COA — col {cfg.columnConfig.coa || 'D'}
                                </FieldDescription>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="category-column">
                                    Category Column
                                </FieldLabel>
                                <Input
                                    id="category-column"
                                    value={cfg.columnConfig.category}
                                    onChange={(e) =>
                                        handleColumnConfigChange({
                                            category:
                                                e.target.value.toUpperCase(),
                                        })
                                    }
                                    className="w-16"
                                    placeholder="F"
                                />
                                <FieldDescription>
                                    Category — col{' '}
                                    {cfg.columnConfig.category || 'F'}
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
                                        handleColumnConfigChange({
                                            unit: e.target.value.toUpperCase(),
                                        })
                                    }
                                    className="w-16"
                                    placeholder="G"
                                />
                                <FieldDescription>
                                    Unit — col {cfg.columnConfig.unit || 'G'}
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
                                        handleColumnConfigChange({
                                            price: e.target.value.toUpperCase(),
                                        })
                                    }
                                    className="w-16"
                                    placeholder="H"
                                />
                                <FieldDescription>
                                    Price — col {cfg.columnConfig.price || 'H'}
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
                                        handleColumnConfigChange({
                                            itemNumber:
                                                e.target.value.toUpperCase(),
                                        })
                                    }
                                    className="w-16"
                                    placeholder="E"
                                />
                                <FieldDescription>
                                    Item no. — col{' '}
                                    {cfg.columnConfig.itemNumber || 'E'} —
                                    placeholder detection
                                </FieldDescription>
                            </Field>
                        </div>
                        <Field className="mt-3">
                            <FieldLabel>COA Match Field</FieldLabel>
                            <Select
                                value={cfg.coaMatchField}
                                onValueChange={(v) =>
                                    handleMatchFieldChange(
                                        v as CategoryCoaSheetConfig['coaMatchField'],
                                    )
                                }
                            >
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Select match field" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value="auto">
                                            Auto (title or number)
                                        </SelectItem>
                                        <SelectItem value="account_title">
                                            Account Title
                                        </SelectItem>
                                        <SelectItem value="account_number">
                                            Account Number
                                        </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <FieldDescription>
                                How to match COA to DB (column-level matching)
                            </FieldDescription>
                        </Field>
                    </div>

                    <div className="bg-card rounded-md border p-3">
                        <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                            Row Config
                        </p>
                        <div className="flex flex-col gap-3">
                            <Field>
                                <FieldLabel htmlFor="header-row">
                                    Header Row
                                </FieldLabel>
                                <Input
                                    id="header-row"
                                    type="number"
                                    value={cfg.rowConfig.headerRow ?? ''}
                                    onChange={(e) =>
                                        handleRowConfigChange({
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
                                <FieldLabel htmlFor="additional-header-row">
                                    Additional Items Header Row
                                </FieldLabel>
                                <Input
                                    id="additional-header-row"
                                    type="number"
                                    value={
                                        cfg.rowConfig
                                            .additionalItemsHeaderRow ?? ''
                                    }
                                    onChange={(e) =>
                                        handleRowConfigChange({
                                            additionalItemsHeaderRow: e.target
                                                .value
                                                ? Number(e.target.value)
                                                : null,
                                        })
                                    }
                                    placeholder="blank = ignore"
                                    className="w-20"
                                />
                                <FieldDescription>
                                    Sentinel: Additional Items (Uncategorized) •
                                    COA-only rows above this map to sentinel
                                </FieldDescription>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="non-proc-header-row">
                                    Non-Procurement Header Row
                                </FieldLabel>
                                <Input
                                    id="non-proc-header-row"
                                    type="number"
                                    value={
                                        cfg.rowConfig.nonProcurementHeaderRow ??
                                        ''
                                    }
                                    onChange={(e) =>
                                        handleRowConfigChange({
                                            nonProcurementHeaderRow: e.target
                                                .value
                                                ? Number(e.target.value)
                                                : null,
                                        })
                                    }
                                    placeholder="blank = ignore"
                                    className="w-20"
                                />
                                <FieldDescription>
                                    Sentinel: Non-Procurement (Uncategorized) •
                                    COA-only rows below map to sentinel
                                </FieldDescription>
                            </Field>
                        </div>
                    </div>
                </div>

                <Field className="mt-4">
                    <FieldLabel>COA items format *</FieldLabel>
                    <ToggleGroup
                        variant="outline"
                        spacing={2}
                        value={[cfg.coaLabelMode]}
                        onValueChange={(value) => {
                            if (value.length > 0) {
                                handleCoaLabelModeChange(
                                    value[0] as CategoryCoaSheetConfig['coaLabelMode'],
                                );
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
                            <span className="font-medium">
                                Without label (COA on item rows)
                            </span>
                            <span className="text-muted-foreground text-xs font-normal whitespace-normal">
                                COA directly on item row — grouped by COA value
                            </span>
                            <span className="text-muted-foreground/70 font-mono text-xs">
                                Cat 1 → items (D=coa1) / items (D=coa2) → Cat 1
                                - Total
                            </span>
                        </ToggleGroupItem>
                    </ToggleGroup>
                    <FieldDescription>
                        What format is your sheet in? This affects how we detect
                        COA groups.
                    </FieldDescription>
                </Field>

                <div className="mt-4 flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetCalibration}
                    >
                        Reset to defaults
                    </Button>
                    <span className="text-muted-foreground self-center text-xs">
                        Column: D=COA, F=category → Row: header 7 → Mode:{' '}
                        {cfg.coaLabelMode}
                    </span>
                </div>
            </div>

            <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('upload')}>
                    Back
                </Button>
                <Button
                    onClick={() => setStep('verifyFormat')}
                    disabled={!canVerifyFormat}
                >
                    Next: Verify Format
                </Button>
            </div>
        </TabsContent>
    );
}
