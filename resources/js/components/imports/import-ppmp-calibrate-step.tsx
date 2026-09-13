// resources/js/components/imports/import-ppmp-calibrate-step.tsx
//
// Shared calibration step for every PPMP-format importer
// (category-import, category-coa-mapping, price-list-import,
// price-list-quantities-import). All four share the same sheet layout
// (`SharedSheetConfig` in `@/lib/ppmp/sheet-config`), so they share one UI:
// scope bar (shared / per-sheet), column + row inputs, COA label-mode toggle,
// and Back / Next footer.
//
// Pages keep their own state (useState stays in each index.tsx) and only pass
// values + setters. Field edits always invalidate downstream results through
// the page-provided `onInvalidate` callback, since each flow resets different
// slices (verify results, extracts, selections, overrides).

import type { Dispatch, SetStateAction } from 'react';
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
import type {
    SheetColumnConfig,
    SheetRowConfig,
    SharedSheetConfig,
} from '@/lib/ppmp/sheet-config';

export type PpmpCalibrationMode = 'shared' | 'per-sheet';

export type PpmpCoaMatchField = NonNullable<SharedSheetConfig['coaMatchField']>;

interface ImportPpmpCalibrateStepProps<TConfig extends SharedSheetConfig> {
    tabsValue?: string;

    // calibration state (owned by the page)
    calibrationMode: PpmpCalibrationMode;
    setCalibrationMode: (m: PpmpCalibrationMode) => void;
    sharedConfig: TConfig | null;
    setSharedConfig: Dispatch<SetStateAction<TConfig | null>>;
    calibrations: Record<string, TConfig>;
    setCalibrations: Dispatch<SetStateAction<Record<string, TConfig>>>;
    currentSheet: string;
    setCurrentSheet: (s: string) => void;
    selectedSheets: string[];
    getDefaultConfig: () => TConfig;
    /** Reset downstream results after any field edit (verify, extract, …). */
    onInvalidate: () => void;

    // per-sheet ✓/❌ marks in the editing-sheet select (omit = plain names)
    verifyMarks?: Record<string, boolean>;

    // opt-in sections (only the flows that need them pass these)
    showQtyStart?: boolean;
    showCoaMatchField?: boolean;
    showGroupsSummary?: boolean;
    showEffectiveBadges?: boolean;

    // footer
    onBack: () => void;
    onNext: () => void;
    canNext: boolean;
    backLabel?: string;
    nextLabel?: string;
}

function clonePpmpConfig<TConfig extends SharedSheetConfig>(
    config: TConfig,
): TConfig {
    return {
        ...config,
        columnConfig: { ...config.columnConfig },
        rowConfig: { ...config.rowConfig },
    };
}

export function ImportPpmpCalibrateStep<TConfig extends SharedSheetConfig>({
    tabsValue = 'calibrate',

    calibrationMode,
    setCalibrationMode,
    sharedConfig,
    setSharedConfig,
    calibrations,
    setCalibrations,
    currentSheet,
    setCurrentSheet,
    selectedSheets,
    getDefaultConfig,
    onInvalidate,

    verifyMarks,
    showQtyStart = false,
    showCoaMatchField = false,
    showGroupsSummary = false,
    showEffectiveBadges = false,

    onBack,
    onNext,
    canNext,
    backLabel = 'Back',
    nextLabel = 'Next: Verify Format',
}: ImportPpmpCalibrateStepProps<TConfig>) {
    const cfg =
        calibrationMode === 'shared'
            ? (sharedConfig ?? getDefaultConfig())
            : (calibrations[currentSheet] ??
              sharedConfig ??
              getDefaultConfig());

    function applyPatch(patch: Partial<TConfig>) {
        if (calibrationMode === 'shared') {
            setSharedConfig((prev) => ({
                ...(prev ?? getDefaultConfig()),
                ...patch,
            }));
        } else {
            if (!currentSheet) {
                return;
            }

            setCalibrations((prev) => ({
                ...prev,
                [currentSheet]: {
                    ...(prev[currentSheet] ??
                        sharedConfig ??
                        getDefaultConfig()),
                    ...patch,
                },
            }));
        }

        onInvalidate();
    }

    function applyColumn(
        patch: Partial<SheetColumnConfig> & { qtyStart?: string },
    ) {
        applyPatch({
            columnConfig: { ...cfg.columnConfig, ...patch },
        } as unknown as Partial<TConfig>);
    }

    function applyRow(patch: Partial<SheetRowConfig>) {
        applyPatch({
            rowConfig: { ...cfg.rowConfig, ...patch },
        } as unknown as Partial<TConfig>);
    }

    function applyCoaLabelMode(mode: TConfig['coaLabelMode']) {
        applyPatch({ coaLabelMode: mode } as unknown as Partial<TConfig>);
    }

    function applyCoaMatchField(value: PpmpCoaMatchField) {
        applyPatch({ coaMatchField: value } as unknown as Partial<TConfig>);
    }

    function ensureInitialized() {
        if (sharedConfig) {
            return;
        }

        const def = getDefaultConfig();
        setSharedConfig(def);

        const clones: Record<string, TConfig> = {};

        for (const sheet of selectedSheets) {
            clones[sheet] = clonePpmpConfig(def);
        }

        setCalibrations(clones);

        if (!currentSheet && selectedSheets[0]) {
            setCurrentSheet(selectedSheets[0]);
        }
    }

    function selectSharedScope() {
        if (calibrationMode === 'per-sheet' && calibrations[currentSheet]) {
            setSharedConfig(clonePpmpConfig(calibrations[currentSheet]));
        } else if (!sharedConfig) {
            ensureInitialized();
        }

        setCalibrationMode('shared');
    }

    function selectPerSheetScope() {
        if (sharedConfig) {
            const next: Record<string, TConfig> = {};

            for (const sheet of selectedSheets) {
                next[sheet] = {
                    ...clonePpmpConfig(sharedConfig),
                    ...calibrations[sheet],
                };
            }

            setCalibrations(next);

            if (!currentSheet && selectedSheets[0]) {
                setCurrentSheet(selectedSheets[0]);
            }
        }

        setCalibrationMode('per-sheet');
    }

    function handleApplySharedToAll() {
        if (!sharedConfig) {
            return;
        }

        const next: Record<string, TConfig> = {};

        for (const sheet of selectedSheets) {
            next[sheet] = clonePpmpConfig(sharedConfig);
        }

        setCalibrations(next);
    }

    function handleCopyCurrentToAll() {
        const src = calibrations[currentSheet] ?? sharedConfig;

        if (!src) {
            return;
        }

        const next: Record<string, TConfig> = {};

        for (const sheet of selectedSheets) {
            next[sheet] = clonePpmpConfig(src);
        }

        setCalibrations(next);
    }

    function handleResetDefaults() {
        if (calibrationMode === 'shared') {
            setSharedConfig(getDefaultConfig());
        } else {
            if (currentSheet) {
                setCalibrations((prev) => ({
                    ...prev,
                    [currentSheet]: getDefaultConfig(),
                }));
            }
        }

        onInvalidate();
    }

    const headerRow = cfg.rowConfig.headerRow;
    const sharedHeaderRow = sharedConfig?.rowConfig.headerRow;
    const sharedHeaderLabel =
        sharedHeaderRow === '' || sharedHeaderRow == null
            ? '—'
            : sharedHeaderRow;
    const qtyStart =
        (cfg.columnConfig as SheetColumnConfig & { qtyStart?: string })
            .qtyStart ?? '';

    const isMultiSheet = selectedSheets.length > 1;

    return (
        <TabsContent value={tabsValue} className="mt-4 flex flex-col gap-4">
            {isMultiSheet && (
                <div className="bg-muted/20 flex flex-wrap items-center gap-3 rounded-lg border p-3">
                    <span className="text-sm font-medium">Scope:</span>
                    <div className="flex gap-2">
                        <Button
                            variant={
                                calibrationMode === 'shared'
                                    ? 'default'
                                    : 'outline'
                            }
                            size="sm"
                            onClick={selectSharedScope}
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
                            onClick={selectPerSheetScope}
                        >
                            Per-sheet
                        </Button>
                    </div>
                    <span className="text-muted-foreground text-xs">
                        {calibrationMode === 'shared'
                            ? `Header row ${sharedHeaderLabel} applies to every sheet — change once.`
                            : `Editing ${currentSheet || '—'} only affects that sheet.`}
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
            )}

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
                                {selectedSheets.map((sheet) => (
                                    <SelectItem key={sheet} value={sheet}>
                                        {sheet}{' '}
                                        {verifyMarks?.[sheet] === true
                                            ? '✓'
                                            : verifyMarks?.[sheet] === false
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
                    {!isMultiSheet
                        ? `(– ${selectedSheets[0] ?? currentSheet ?? ''})`
                        : calibrationMode === 'shared'
                          ? `(Shared – ${selectedSheets.length} sheets)`
                          : `(Per-sheet – ${currentSheet || selectedSheets[0]})`}
                </p>
                <div className="grid grid-cols-3 gap-4">
                    <Field>
                        <FieldLabel htmlFor="ppmp-coa-column">
                            COA Column *
                        </FieldLabel>
                        <Input
                            id="ppmp-coa-column"
                            value={cfg.columnConfig.coa}
                            onChange={(e) =>
                                applyColumn({
                                    coa: e.target.value.toUpperCase(),
                                })
                            }
                            className="w-16"
                            placeholder="D"
                        />
                        <FieldDescription>
                            COA — empty means category. Default D
                        </FieldDescription>
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="ppmp-item-number-column">
                            Item No. Column *
                        </FieldLabel>
                        <Input
                            id="ppmp-item-number-column"
                            value={cfg.columnConfig.itemNumber}
                            onChange={(e) =>
                                applyColumn({
                                    itemNumber: e.target.value.toUpperCase(),
                                })
                            }
                            className="w-16"
                            placeholder="E"
                        />
                        <FieldDescription>
                            Placeholder detection — default E
                        </FieldDescription>
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="ppmp-category-column">
                            Category Column *
                        </FieldLabel>
                        <Input
                            id="ppmp-category-column"
                            value={cfg.columnConfig.category}
                            onChange={(e) =>
                                applyColumn({
                                    category: e.target.value.toUpperCase(),
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
                        <FieldLabel htmlFor="ppmp-description-column">
                            Description Column *
                        </FieldLabel>
                        <Input
                            id="ppmp-description-column"
                            value={cfg.columnConfig.description}
                            onChange={(e) =>
                                applyColumn({
                                    description: e.target.value.toUpperCase(),
                                })
                            }
                            className="w-16"
                            placeholder="F"
                        />
                        <FieldDescription>
                            Item description — same as category (F) in the
                            standard template
                        </FieldDescription>
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="ppmp-unit-column">
                            Unit Column *
                        </FieldLabel>
                        <Input
                            id="ppmp-unit-column"
                            value={cfg.columnConfig.unit}
                            onChange={(e) =>
                                applyColumn({
                                    unit: e.target.value.toUpperCase(),
                                })
                            }
                            className="w-16"
                            placeholder="G"
                        />
                        <FieldDescription>Unit — default G</FieldDescription>
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="ppmp-price-column">
                            Price Column *
                        </FieldLabel>
                        <Input
                            id="ppmp-price-column"
                            value={cfg.columnConfig.price}
                            onChange={(e) =>
                                applyColumn({
                                    price: e.target.value.toUpperCase(),
                                })
                            }
                            className="w-16"
                            placeholder="H"
                        />
                        <FieldDescription>Price — default H</FieldDescription>
                    </Field>
                    {showQtyStart && (
                        <Field>
                            <FieldLabel htmlFor="ppmp-qty-start-column">
                                Qty Start Column (Jan) *
                            </FieldLabel>
                            <Input
                                id="ppmp-qty-start-column"
                                value={qtyStart}
                                onChange={(e) =>
                                    applyColumn({
                                        qtyStart: e.target.value.toUpperCase(),
                                    })
                                }
                                className="w-16"
                                placeholder="K"
                            />
                            <FieldDescription>
                                Jan qty — alternating qty/amount pairs, Jan K →
                                Dec AG
                            </FieldDescription>
                        </Field>
                    )}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4">
                    <Field>
                        <FieldLabel htmlFor="ppmp-header-row">
                            Header Row *
                        </FieldLabel>
                        <Input
                            id="ppmp-header-row"
                            type="number"
                            value={headerRow ?? ''}
                            onChange={(e) =>
                                applyRow({
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
                            {headerRow === '' || headerRow == null
                                ? 'Required — 1-indexed header row'
                                : `Header ${headerRow}; data starts ${headerRow + 1}`}
                        </FieldDescription>
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="ppmp-additional-header-row">
                            Additional Items Header Row *
                        </FieldLabel>
                        <Input
                            id="ppmp-additional-header-row"
                            type="number"
                            value={cfg.rowConfig.additionalItemsHeaderRow ?? ''}
                            onChange={(e) =>
                                applyRow({
                                    additionalItemsHeaderRow: e.target.value
                                        ? Number(e.target.value)
                                        : '',
                                })
                            }
                            className="w-20"
                            placeholder="e.g. 85"
                        />
                        <FieldDescription>
                            {cfg.rowConfig.additionalItemsHeaderRow === '' ||
                            cfg.rowConfig.additionalItemsHeaderRow == null
                                ? 'Required'
                                : `Resumes at ${cfg.rowConfig.additionalItemsHeaderRow + 1}`}
                        </FieldDescription>
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="ppmp-nonproc-header-row">
                            Non-Procurement Header Row *
                        </FieldLabel>
                        <Input
                            id="ppmp-nonproc-header-row"
                            type="number"
                            value={cfg.rowConfig.nonProcurementHeaderRow ?? ''}
                            onChange={(e) =>
                                applyRow({
                                    nonProcurementHeaderRow: e.target.value
                                        ? Number(e.target.value)
                                        : '',
                                })
                            }
                            className="w-20"
                            placeholder="e.g. 1258"
                        />
                        <FieldDescription>
                            {cfg.rowConfig.nonProcurementHeaderRow === '' ||
                            cfg.rowConfig.nonProcurementHeaderRow == null
                                ? 'Required'
                                : `Starts at ${cfg.rowConfig.nonProcurementHeaderRow + 1}`}
                        </FieldDescription>
                    </Field>
                </div>

                {showCoaMatchField && (
                    <Field className="mt-4">
                        <FieldLabel>COA Match Field</FieldLabel>
                        <Select
                            value={cfg.coaMatchField ?? 'auto'}
                            onValueChange={(v) =>
                                applyCoaMatchField(v as PpmpCoaMatchField)
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
                )}

                <Field className="mt-4">
                    <FieldLabel>COA items format *</FieldLabel>
                    <ToggleGroup
                        variant="outline"
                        spacing={2}
                        value={[cfg.coaLabelMode]}
                        onValueChange={(value) => {
                            if (value.length > 0) {
                                applyCoaLabelMode(
                                    value[0] as TConfig['coaLabelMode'],
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
                        Choose the layout your sheets use.
                    </FieldDescription>
                </Field>

                {showGroupsSummary && (
                    <div className="text-muted-foreground mt-3 text-xs">
                        Groups: procurement [
                        {headerRow === '' || headerRow == null
                            ? '—'
                            : headerRow + 1}
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
                )}

                {showEffectiveBadges && (
                    <div className="mt-3 text-xs">
                        <span className="text-muted-foreground">
                            Effective for {selectedSheets.length} sheets:{' '}
                        </span>
                        {selectedSheets.map((sheet) => {
                            const c = calibrations[sheet] ?? sharedConfig;
                            const same =
                                c &&
                                c.rowConfig.headerRow ===
                                    cfg.rowConfig.headerRow &&
                                c.columnConfig.category ===
                                    cfg.columnConfig.category &&
                                c.columnConfig.coa === cfg.columnConfig.coa &&
                                c.coaLabelMode === cfg.coaLabelMode;

                            return (
                                <Badge
                                    key={sheet}
                                    variant={same ? 'secondary' : 'outline'}
                                    className="mr-1 text-xs"
                                >
                                    {sheet}:{' '}
                                    {c
                                        ? `${c.columnConfig.category}/${c.columnConfig.coa} H${c.rowConfig.headerRow} ${c.coaLabelMode === 'without-label' ? 'no-label' : 'label'}`
                                        : 'default'}
                                </Badge>
                            );
                        })}
                    </div>
                )}

                <div className="mt-4 flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetDefaults}
                    >
                        Reset to defaults
                    </Button>
                    <span className="text-muted-foreground self-center text-xs">
                        Column: D=COA, F=category → Row: header{' '}
                        {sharedHeaderLabel} → Mode: {cfg.coaLabelMode}
                    </span>
                </div>
            </div>

            <div className="flex justify-between">
                <Button variant="outline" onClick={onBack}>
                    {backLabel}
                </Button>
                <Button onClick={onNext} disabled={!canNext}>
                    {nextLabel}
                </Button>
            </div>
        </TabsContent>
    );
}
