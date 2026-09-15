// resources/js/components/imports/import-ppmp-calibrate-step.tsx
//
// Shared calibration step for every PPMP-format importer.
// Single-sheet mode: one `selectedSheet`, one `config`, no scope bar,
// no per-sheet editing, no apply-to-all.

import type { Dispatch, SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { TabsContent } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type {
    SheetColumnConfig,
    SheetRowConfig,
    SharedSheetConfig,
} from '@/lib/ppmp/sheet-config';

interface ImportPpmpCalibrateStepProps<TConfig extends SharedSheetConfig> {
    tabsValue?: string;

    /** The sheet being calibrated, or null if none selected. */
    selectedSheet: string | null;

    /** Current calibration config, or null when unset. */
    config: TConfig | null;
    setConfig: Dispatch<SetStateAction<TConfig | null>>;

    getDefaultConfig: () => TConfig;

    /** Reset downstream results after any field edit. */
    onInvalidate: () => void;

    // Opt-in sections
    showQtyStart?: boolean;
    showGroupsSummary?: boolean;

    // Footer
    onBack: () => void;
    onNext: () => void;
    canNext: boolean;
    backLabel?: string;
    nextLabel?: string;
}

export function ImportPpmpCalibrateStep<TConfig extends SharedSheetConfig>({
    tabsValue = 'calibrate',
    selectedSheet,
    config,
    setConfig,
    getDefaultConfig,
    onInvalidate,
    showQtyStart = false,
    showGroupsSummary = false,
    onBack,
    onNext,
    canNext,
    backLabel = 'Back',
    nextLabel = 'Next: Verify Format',
}: ImportPpmpCalibrateStepProps<TConfig>) {
    const cfg = config ?? getDefaultConfig();

    function applyPatch(patch: Partial<TConfig>) {
        setConfig((prev) => ({
            ...(prev ?? getDefaultConfig()),
            ...patch,
        }));
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

    function handleResetDefaults() {
        setConfig(getDefaultConfig());
        onInvalidate();
    }

    const headerRow = cfg.rowConfig.headerRow;
    const qtyStart =
        (cfg.columnConfig as SheetColumnConfig & { qtyStart?: string })
            .qtyStart ?? '';

    return (
        <TabsContent value={tabsValue} className="mt-4 flex flex-col gap-4">
            <div className="rounded-lg border p-4">
                <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
                    Calibration
                    {selectedSheet ? ` (– ${selectedSheet})` : ''}
                </p>
                <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
                    Columns
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
                        </Field>
                    )}
                </div>

                <p className="text-muted-foreground mt-4 mb-3 text-xs font-semibold tracking-wide uppercase">
                    Rows
                </p>
                <div className="grid grid-cols-3 gap-4">
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
                    </Field>
                </div>

                <Field className="mt-4">
                    <FieldLabel>COA items format *</FieldLabel>
                    <ToggleGroup
                        multiple={false}
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

                <div className="mt-4 flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetDefaults}
                    >
                        Reset to defaults
                    </Button>
                    <span className="text-muted-foreground self-center text-xs">
                        Column: D=COA, F=category → Mode: {cfg.coaLabelMode}
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
