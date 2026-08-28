import { Button } from "@/components/base-ui-components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/base-ui-components/ui/field";
import { Input } from "@/components/base-ui-components/ui/input";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/base-ui-components/ui/select";
import { Switch } from "@/components/base-ui-components/ui/switch";

const monthlyQtyColumns = [
    ["janQty", "Jan"],
    ["febQty", "Feb"],
    ["marQty", "Mar"],
    ["aprQty", "Apr"],
    ["mayQty", "May"],
    ["junQty", "Jun"],
    ["julQty", "Jul"],
    ["augQty", "Aug"],
    ["sepQty", "Sep"],
    ["octQty", "Oct"],
    ["novQty", "Nov"],
    ["decQty", "Dec"],
] as const;

export type MonthKey = (typeof monthlyQtyColumns)[number][0];

interface BaseColumnMap {
    chartOfAccount: string;
    category: string;
    description: string;
    unit: string;
    price: string;
    janQty: string;
    febQty: string;
    marQty: string;
    aprQty: string;
    mayQty: string;
    junQty: string;
    julQty: string;
    augQty: string;
    sepQty: string;
    octQty: string;
    novQty: string;
    decQty: string;
}

export interface PriceListColumnMap extends BaseColumnMap {
    itemNumber: string;
}

export interface QuantityColumnMap extends BaseColumnMap {
    total: string;
}

export interface SheetConfig {
    useCustom: boolean;
    startRow: number;
    endRow: number | undefined;
    nonProcurementStartRow: number | undefined;
    columnMap: PriceListColumnMap | QuantityColumnMap;
    excludeRows: string;
}

interface CalibrationPanelProps {
    mode: "price-list" | "quantities";
    selectedSheets: string[];
    calibrations: Record<string, SheetConfig>;
    currentSheet: string;
    onCurrentSheetChange: (sheet: string) => void;
    onUpdateSheet: (sheet: string, updates: Partial<SheetConfig>) => void;
    onExtract?: () => void;
    extractLabel?: string;
    disabled?: boolean;
}

export function CalibrationPanel({
    mode,
    selectedSheets,
    calibrations,
    currentSheet,
    onCurrentSheetChange,
    onUpdateSheet,
    onExtract,
    extractLabel = "Extract",
    disabled = false,
}: CalibrationPanelProps) {
    const currentConfig = calibrations[currentSheet];

    if (!currentConfig) {
        return <div className="text-muted-foreground">No calibration for selected sheet</div>;
    }

    const currentColumns = currentConfig.columnMap;

    const updateField = (field: keyof SheetConfig, value: any) => {
        onUpdateSheet(currentSheet, { [field]: value });
    };

    const updateColumn = (field: keyof (PriceListColumnMap | QuantityColumnMap), value: string) => {
        const upper = value.toUpperCase();
        onUpdateSheet(currentSheet, {
            columnMap: { ...currentColumns, [field]: upper },
        });
    };

    const handleUseDefaultToggle = (checked: boolean) => {
        onUpdateSheet(currentSheet, { useCustom: !checked });
    };

    const showSheetSelector = mode === "price-list" && selectedSheets.length > 1;

    return (
        <div className="space-y-4">
            <div className="rounded-lg border bg-muted/10 p-3 text-sm">
                <p className="font-medium">Where is your data?</p>
                <p className="text-muted-foreground">
                    Tell us which rows and columns to read. Defaults work for the standard template.
                </p>
            </div>
            <div className="flex items-center gap-4">
                {showSheetSelector ? (
                    <Field className="w-60">
                        <FieldLabel>Sheet to calibrate</FieldLabel>
                        <Select
                            value={currentSheet}
                            onValueChange={(v) => v && onCurrentSheetChange(v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select sheet" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    {selectedSheets.map((sheet) => (
                                        <SelectItem key={sheet} value={sheet}>
                                            {sheet}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <FieldDescription>
                            Pick which sheet these settings apply to
                        </FieldDescription>
                    </Field>
                ) : (
                    <div>
                        <FieldLabel>Calibrating sheet</FieldLabel>
                        <div className="mt-1 text-sm font-medium">{currentSheet}</div>
                        <p className="text-xs text-muted-foreground">
                            All settings below apply to this sheet
                        </p>
                    </div>
                )}

                <div className="flex items-center gap-2 self-end pb-1">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                        Use Defaults
                        <Switch
                            checked={!currentConfig.useCustom}
                            onCheckedChange={handleUseDefaultToggle}
                            size="sm"
                        />
                    </label>
                    <span className="text-xs text-muted-foreground">
                        {currentConfig.useCustom ? "Custom" : "Standard template"}
                    </span>
                </div>
            </div>

            <div className="rounded-lg border p-4">
                <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Row range — what to read
                </p>
                <div className="flex flex-wrap gap-4">
                    <Field>
                        <FieldLabel>Start Row</FieldLabel>
                        <Input
                            type="number"
                            value={currentConfig.startRow}
                            onChange={(e) => updateField("startRow", Number(e.target.value))}
                            className="w-20"
                            disabled={!currentConfig.useCustom}
                        />
                        <FieldDescription>
                            First data row (skips headers). Default 8
                        </FieldDescription>
                    </Field>
                    <Field>
                        <FieldLabel>Non‑Proc Start Row</FieldLabel>
                        <Input
                            type="number"
                            value={currentConfig.nonProcurementStartRow ?? ""}
                            onChange={(e) =>
                                updateField(
                                    "nonProcurementStartRow",
                                    e.target.value ? Number(e.target.value) : undefined,
                                )
                            }
                            className="w-20"
                            disabled={!currentConfig.useCustom}
                        />
                        <FieldDescription>
                            Where “Non-Procurement” section starts. Default 1258
                        </FieldDescription>
                    </Field>
                    <Field>
                        <FieldLabel>End Row</FieldLabel>
                        <Input
                            type="number"
                            value={currentConfig.endRow ?? ""}
                            onChange={(e) =>
                                updateField(
                                    "endRow",
                                    e.target.value ? Number(e.target.value) : undefined,
                                )
                            }
                            className="w-20"
                            disabled={!currentConfig.useCustom}
                        />
                        <FieldDescription>Last row to read. Blank = until end</FieldDescription>
                    </Field>
                    <Field>
                        <FieldLabel>Exclude Rows</FieldLabel>
                        <Input
                            value={currentConfig.excludeRows}
                            onChange={(e) => updateField("excludeRows", e.target.value)}
                            className="w-40"
                            placeholder="e.g. 1118, 1120"
                            disabled={!currentConfig.useCustom}
                        />
                        <FieldDescription>Comma-separated rows to skip (totals)</FieldDescription>
                    </Field>
                </div>

                <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Columns — which Excel column holds each field
                    </p>
                    <p className="mb-3 text-xs text-muted-foreground">
                        Letters refer to Excel columns (A, B, C…). Description &amp; Category often
                        share column F — that’s normal for this template.
                    </p>
                </div>
                <div className="mt-2 grid grid-cols-6 gap-3">
                    <Field>
                        <FieldLabel>COA</FieldLabel>
                        <Input
                            value={currentColumns?.chartOfAccount ?? ""}
                            onChange={(e) => updateColumn("chartOfAccount", e.target.value)}
                            className="w-16"
                            disabled={!currentConfig.useCustom}
                        />
                        <FieldDescription>Account no./title — col D</FieldDescription>
                    </Field>
                    <Field>
                        <FieldLabel>Category</FieldLabel>
                        <Input
                            value={currentColumns?.category ?? ""}
                            onChange={(e) => updateColumn("category", e.target.value)}
                            className="w-16"
                            disabled={!currentConfig.useCustom}
                        />
                        <FieldDescription>PPMP category — col F</FieldDescription>
                    </Field>
                    <Field>
                        <FieldLabel>Description</FieldLabel>
                        <Input
                            value={currentColumns?.description ?? ""}
                            onChange={(e) => updateColumn("description", e.target.value)}
                            className="w-16"
                            disabled={!currentConfig.useCustom}
                        />
                        <FieldDescription>Item name — col F</FieldDescription>
                    </Field>
                    <Field>
                        <FieldLabel>Unit</FieldLabel>
                        <Input
                            value={currentColumns?.unit ?? ""}
                            onChange={(e) => updateColumn("unit", e.target.value)}
                            className="w-16"
                            disabled={!currentConfig.useCustom}
                        />
                        <FieldDescription>pcs, box — col G</FieldDescription>
                    </Field>
                    <Field>
                        <FieldLabel>Price</FieldLabel>
                        <Input
                            value={currentColumns?.price ?? ""}
                            onChange={(e) => updateColumn("price", e.target.value)}
                            className="w-16"
                            disabled={!currentConfig.useCustom}
                        />
                        <FieldDescription>Unit price — col H</FieldDescription>
                    </Field>

                    {mode === "price-list" ? (
                        <Field>
                            <FieldLabel>Item#</FieldLabel>
                            <Input
                                value={(currentColumns as PriceListColumnMap)?.itemNumber ?? ""}
                                onChange={(e) => updateColumn("itemNumber", e.target.value)}
                                className="w-16"
                                disabled={!currentConfig.useCustom}
                            />
                            <FieldDescription>No. — col E</FieldDescription>
                        </Field>
                    ) : (
                        <Field>
                            <FieldLabel>Total</FieldLabel>
                            <Input
                                value={(currentColumns as QuantityColumnMap)?.total ?? ""}
                                onChange={(e) => updateColumn("total", e.target.value)}
                                className="w-16"
                                disabled={!currentConfig.useCustom}
                            />
                            <FieldDescription>Row total — col J</FieldDescription>
                        </Field>
                    )}
                </div>

                <div className="mt-4">
                    <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Monthly Quantities
                    </p>
                    <p className="mb-2 text-xs text-muted-foreground">
                        Each column is a month’s quantity (K=Jan, M=Feb … AG=Dec). Used only when
                        reading quantities, but kept here for alignment.
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                        {monthlyQtyColumns.map(([key, label]) => (
                            <Field key={key}>
                                <FieldLabel>{label}</FieldLabel>
                                <Input
                                    value={currentColumns?.[key as MonthKey] ?? ""}
                                    onChange={(e) => updateColumn(key as MonthKey, e.target.value)}
                                    className="w-16"
                                    disabled={!currentConfig.useCustom}
                                />
                                <FieldDescription>
                                    Col {currentColumns?.[key as MonthKey] ?? "—"}
                                </FieldDescription>
                            </Field>
                        ))}
                    </div>
                </div>

                {onExtract && (
                    <div className="mt-4">
                        <Button onClick={onExtract} disabled={disabled}>
                            {extractLabel}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
