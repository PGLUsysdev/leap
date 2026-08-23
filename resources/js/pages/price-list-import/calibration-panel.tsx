import { Button } from "@/components/base-ui-components/ui/button";
import { Field, FieldLabel } from "@/components/base-ui-components/ui/field";
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
                    </Field>
                ) : (
                    <div>
                        <FieldLabel>Calibrating sheet</FieldLabel>
                        <div className="mt-1 text-sm font-medium">{currentSheet}</div>
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
                </div>
            </div>

            <div className="rounded-lg border p-4">
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
                    </Field>
                </div>

                <div className="mt-4 grid grid-cols-6 gap-2">
                    <Field>
                        <FieldLabel>COA</FieldLabel>
                        <Input
                            value={currentColumns?.chartOfAccount ?? ""}
                            onChange={(e) => updateColumn("chartOfAccount", e.target.value)}
                            className="w-16"
                            disabled={!currentConfig.useCustom}
                        />
                    </Field>
                    <Field>
                        <FieldLabel>Category</FieldLabel>
                        <Input
                            value={currentColumns?.category ?? ""}
                            onChange={(e) => updateColumn("category", e.target.value)}
                            className="w-16"
                            disabled={!currentConfig.useCustom}
                        />
                    </Field>
                    <Field>
                        <FieldLabel>Description</FieldLabel>
                        <Input
                            value={currentColumns?.description ?? ""}
                            onChange={(e) => updateColumn("description", e.target.value)}
                            className="w-16"
                            disabled={!currentConfig.useCustom}
                        />
                    </Field>
                    <Field>
                        <FieldLabel>Unit</FieldLabel>
                        <Input
                            value={currentColumns?.unit ?? ""}
                            onChange={(e) => updateColumn("unit", e.target.value)}
                            className="w-16"
                            disabled={!currentConfig.useCustom}
                        />
                    </Field>
                    <Field>
                        <FieldLabel>Price</FieldLabel>
                        <Input
                            value={currentColumns?.price ?? ""}
                            onChange={(e) => updateColumn("price", e.target.value)}
                            className="w-16"
                            disabled={!currentConfig.useCustom}
                        />
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
                        </Field>
                    )}
                </div>

                <div className="mt-4">
                    <p className="mb-2 text-sm font-medium text-muted-foreground">
                        Monthly Quantities
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
