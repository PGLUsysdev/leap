import { router, usePage } from '@inertiajs/react';
import ExcelJS from 'exceljs';
import type { ChangeEvent } from 'react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/base-ui-components/ui/button';
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/components/base-ui-components/ui/combobox';
import {
    Field,
    FieldDescription,
    FieldLabel,
} from '@/components/base-ui-components/ui/field';
import { Input } from '@/components/base-ui-components/ui/input';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/base-ui-components/ui/select';
import {
    ToggleGroup,
    ToggleGroupItem,
} from '@/components/base-ui-components/ui/toggle-group';
import { Spinner } from '@/components/base-ui-components/ui/spinner';
import { Switch } from '@/components/base-ui-components/ui/switch';
import type { ChartOfAccount, PpmpCategory } from '@/types';
import { extractData } from './extract';
import type { ExtractResult } from './extract';

// interface ColumnMapping {
//     chartOfAccount: string;
//     category: string;
//     description: string;
//     unit: string;
//     price: string;
// }

// const defaultColumnMapping: ColumnMapping = {
//     chartOfAccount: 'D',
//     category: 'F',
//     description: 'F',
//     unit: 'G',
//     price: 'H',
// };

interface PriceListImportProps {
    chartOfAccounts: ChartOfAccount[];
    ppmpCategories: PpmpCategory[];
}

// interface ResolvedItem {
//     chart_of_account_id: number;
//     ppmp_category_id: number;
//     description: string;
//     unit_of_measurement: string;
//     price: number | null;
// }

// interface Resolution {
//     resolved: ResolvedItem[];
//     totalItems: number;
//     matchedItems: number;
//     unmatchedChartOfAccounts: string[];
//     unmatchedCategories: string[];
// }

// function normalize(s: string): string {
//     return s.toLowerCase().replace(/\s+/g, ' ').trim();
// }

// /** Build a normalized name → ID lookup map from a list of DB items. */
// function buildLookup<T>(
//     items: T[],
//     getName: (item: T) => string,
// ): Map<string, number> {
//     const map = new Map<string, number>();

//     for (const item of items) {
//         map.set(
//             normalize(getName(item)),
//             (item as unknown as { id: number }).id,
//         );
//     }

//     return map;
// }

// /** Compute resolution given auto-lookups + manual overrides. */
// function computeResolution(
//     result: ExtractResult,
//     coaLookup: Map<string, number>,
//     catLookup: Map<string, number>,
//     manualCoa: Record<string, number>,
//     manualCat: Record<string, number>,
// ): Resolution {
//     const resolved: ResolvedItem[] = [];
//     const unmatchedCoaSet = new Set<string>();
//     const unmatchedCatSet = new Set<string>();

//     for (const item of result.items) {
//         const coaId =
//             coaLookup.get(normalize(item.chartOfAccount)) ??
//             manualCoa[item.chartOfAccount];

//         if (!coaId) {
//             unmatchedCoaSet.add(item.chartOfAccount);

//             continue;
//         }

//         const catId =
//             catLookup.get(normalize(item.category)) ?? manualCat[item.category];

//         if (!catId) {
//             unmatchedCatSet.add(item.category);

//             continue;
//         }

//         resolved.push({
//             chart_of_account_id: coaId,
//             ppmp_category_id: catId,
//             description: item.description,
//             unit_of_measurement: item.unitOfMeasurement,
//             price: item.price ?? 0,
//         });
//     }

//     return {
//         resolved,
//         totalItems: result.items.length,
//         matchedItems: resolved.length,
//         unmatchedChartOfAccounts: [...unmatchedCoaSet].sort(),
//         unmatchedCategories: [...unmatchedCatSet].sort(),
//     };
// }

export default function PriceListImport({
    chartOfAccounts,
    ppmpCategories,
}: PriceListImportProps) {
    const [sheets, setSheets] = useState<string[]>([]);
    const [_workbook, setWorkbook] = useState<ExcelJS.Workbook | null>(null);
    const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
    // const [startRow, setStartRow] = useState(9);
    // const [endRow, setEndRow] = useState<number | undefined>(1233);
    // const [columnMap, setColumnMap] =
    //     useState<ColumnMapping>(defaultColumnMapping);
    const [result, setResult] = useState<ExtractResult | null>(null);
    const [importing, setImporting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [calibratingSheet, setCalibratingSheet] = useState('');
    const [sheetConfigs, setSheetConfigs] = useState<
        Record<
            string,
            {
                useCustom: boolean;
                startRow: number;
                endRow: number | undefined;
                columnMap: {
                    chartOfAccount: string;
                    category: string;
                    description: string;
                    unit: string;
                    price: string;
                    itemNumber: string;
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
                };
            }
        >
    >({});

    const defaultConfig = {
        useCustom: false,
        startRow: 8,
        endRow: 1255 as number | undefined,
        columnMap: {
            chartOfAccount: 'D',
            category: 'F',
            description: 'F',
            unit: 'G',
            price: 'H',
            itemNumber: 'E',
            janQty: 'K',
            febQty: 'M',
            marQty: 'O',
            aprQty: 'Q',
            mayQty: 'S',
            junQty: 'U',
            julQty: 'W',
            augQty: 'Y',
            sepQty: 'AA',
            octQty: 'AC',
            novQty: 'AE',
            decQty: 'AG',
        },
    };

    // Manual mappings for names that didn't auto-match
    const [manualCoa, setManualCoa] = useState<Record<string, number>>({});
    const [manualCat, setManualCat] = useState<Record<string, number>>({});

    // Auto-lookup maps (stable across renders)
    // const coaLookup = useMemo(
    //     () =>
    //         buildLookup(
    //             chartOfAccounts,
    //             (coa: ChartOfAccount) => coa.account_title,
    //         ),
    //     [chartOfAccounts],
    // );

    // const catLookup = useMemo(
    //     () => buildLookup(ppmpCategories, (cat: PpmpCategory) => cat.name),
    //     [ppmpCategories],
    // );

    // // Maps for Combobox: name ↔ ID lookup (unprefixed)
    // const coaNameToId = useMemo(() => {
    //     const m = new Map<string, number>();

    //     for (const coa of chartOfAccounts) {
    //         m.set(coa.account_title, coa.id);
    //     }

    //     return m;
    // }, [chartOfAccounts]);

    // const idToCoaTitle = useMemo(() => {
    //     const m = new Map<number, string>();

    //     for (const coa of chartOfAccounts) {
    //         m.set(coa.id, coa.account_title);
    //     }

    //     return m;
    // }, [chartOfAccounts]);

    // const catNameToId = useMemo(() => {
    //     const m = new Map<string, number>();

    //     for (const cat of ppmpCategories) {
    //         m.set(cat.name, cat.id);
    //     }

    //     return m;
    // }, [ppmpCategories]);

    // const idToCatName = useMemo(() => {
    //     const m = new Map<number, string>();

    //     for (const cat of ppmpCategories) {
    //         m.set(cat.id, cat.name);
    //     }

    //     return m;
    // }, [ppmpCategories]);

    // // Combobox items with type prefix to avoid ComboboxCollection key collision
    // const coaComboboxItems = useMemo(
    //     () => chartOfAccounts.map((coa) => `coa:${coa.account_title}`),
    //     [chartOfAccounts],
    // );

    // const catComboboxItems = useMemo(
    //     () => ppmpCategories.map((cat) => `cat:${cat.name}`),
    //     [ppmpCategories],
    // );

    // Resolution re-computes whenever result, manualCoa, or manualCat changes
    // const resolution: Resolution | null = useMemo(() => {
    //     if (!result) {
    //         return null;
    //     }

    //     return computeResolution(
    //         result,
    //         coaLookup,
    //         catLookup,
    //         manualCoa,
    //         manualCat,
    //     );
    // }, [result, coaLookup, catLookup, manualCoa, manualCat]);

    async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        setLoading(true);

        const wb = new ExcelJS.Workbook();
        const arrayBuffer = await file.arrayBuffer();
        await wb.xlsx.load(arrayBuffer);

        setWorkbook(wb);
        setSheets(wb.worksheets.map((ws) => ws.name));
        setSelectedSheets([]);
        setResult(null);
        setManualCoa({});
        setManualCat({});
        setLoading(false);
        setConfirmed(false);
    }

    function handleSheetsChange(sheets: string[]) {
        setSelectedSheets(sheets);
        setConfirmed(false);
    }

    function handleConfirm() {
        const configs: Record<string, typeof defaultConfig> = {};

        for (const sheet of selectedSheets) {
            configs[sheet] = {
                ...defaultConfig,
                columnMap: { ...defaultConfig.columnMap },
            };
        }

        setSheetConfigs(configs);
        setCalibratingSheet(selectedSheets[0] ?? '');
        setConfirmed(true);
    }

    function handleExtractCoas() {
        if (!_workbook) return;

        for (const sheet of selectedSheets) {
            const ws = _workbook.getWorksheet(sheet);

            if (!ws) continue;

            const config = sheetConfigs[sheet] ?? defaultConfig;
            const effective = config.useCustom ? config : defaultConfig;
            const result = extractData({
                worksheet: ws,
                startRow: effective.startRow,
                endRow: effective.endRow,
                columnMap: effective.columnMap,
            });

            console.log(
                `=== COAs: ${sheet} (${result.uniqueChartOfAccounts.length}) ===`,
            );
            console.log(result.uniqueChartOfAccounts.join(', '));
        }
    }

    function handleExtractCategories() {
        if (!_workbook) return;

        for (const sheet of selectedSheets) {
            const ws = _workbook.getWorksheet(sheet);

            if (!ws) continue;

            const config = sheetConfigs[sheet] ?? defaultConfig;
            const effective = config.useCustom ? config : defaultConfig;
            const result = extractData({
                worksheet: ws,
                startRow: effective.startRow,
                endRow: effective.endRow,
                columnMap: effective.columnMap,
            });

            console.log(
                `=== Categories: ${sheet} (${result.uniqueCategories.length}) ===`,
            );
            console.log(result.uniqueCategories.join(', '));
        }
    }

    function handleLogCoaSummary() {
        if (!_workbook) return;

        const nameToSheets = new Map<string, Set<string>>();

        for (const sheet of selectedSheets) {
            const ws = _workbook.getWorksheet(sheet);

            if (!ws) continue;

            const config = sheetConfigs[sheet] ?? defaultConfig;
            const effective = config.useCustom ? config : defaultConfig;
            const result = extractData({
                worksheet: ws,
                startRow: effective.startRow,
                endRow: effective.endRow,
                columnMap: effective.columnMap,
            });

            for (const coa of result.uniqueChartOfAccounts) {
                if (!nameToSheets.has(coa)) {
                    nameToSheets.set(coa, new Set());
                }

                nameToSheets.get(coa)!.add(sheet);
            }
        }

        const total = selectedSheets.length;

        const lines = [...nameToSheets.entries()]
            .sort((a, b) => b[1].size - a[1].size)
            .map(([name, sheets]) =>
                sheets.size === total
                    ? `${name} ${total} — all sheets`
                    : `${name} ${sheets.size} — ${[...sheets].join(', ')}`,
            )
            .join('\n');

        console.log(
            `=== COA Summary (total sheets: ${total}) ===`,
        );
        console.log(lines);
    }

    function handleLogCategorySummary() {
        if (!_workbook) return;

        const nameToSheets = new Map<string, Set<string>>();

        for (const sheet of selectedSheets) {
            const ws = _workbook.getWorksheet(sheet);

            if (!ws) continue;

            const config = sheetConfigs[sheet] ?? defaultConfig;
            const effective = config.useCustom ? config : defaultConfig;
            const result = extractData({
                worksheet: ws,
                startRow: effective.startRow,
                endRow: effective.endRow,
                columnMap: effective.columnMap,
            });

            for (const cat of result.uniqueCategories) {
                if (!nameToSheets.has(cat)) {
                    nameToSheets.set(cat, new Set());
                }

                nameToSheets.get(cat)!.add(sheet);
            }
        }

        const total = selectedSheets.length;

        const lines = [...nameToSheets.entries()]
            .sort((a, b) => b[1].size - a[1].size)
            .map(([name, sheets]) =>
                sheets.size === total
                    ? `${name} ${total} — all sheets`
                    : `${name} ${sheets.size} — ${[...sheets].join(', ')}`,
            )
            .join('\n');

        console.log(
            `=== Category Summary (total sheets: ${total}) ===`,
        );
        console.log(lines);
    }

    // function handleExtract() {
    //     if (!_workbook || !selectedSheet) {
    //         return;
    //     }

    //     const ws = _workbook.getWorksheet(selectedSheet);

    //     if (!ws) {
    //         return;
    //     }

    //     const data = extractData({
    //         worksheet: ws,
    //         startRow,
    //         endRow,
    //         columnMap,
    //     });

    //     setResult(data);
    //     setManualCoa({});
    //     setManualCat({});
    // }

    // function updateColumn(key: keyof ColumnMapping, value: string) {
    //     setColumnMap((prev) => ({ ...prev, [key]: value.toUpperCase() }));
    // }

    // function handleImport() {
    //     if (!resolution || resolution.resolved.length === 0 || importing) {
    //         return;
    //     }

    //     console.log('Importing items:', resolution.resolved);
    //     console.log('Item count:', resolution.resolved.length);

    //     if (resolution.resolved.length > 0) {
    //         const first = resolution.resolved[0];
    //         console.log('First item sample:', first);
    //         console.log(
    //             'unit_of_measurement value:',
    //             JSON.stringify(first.unit_of_measurement),
    //         );
    //         console.log(
    //             'unit_of_measurement length:',
    //             first.unit_of_measurement?.length,
    //         );
    //     }

    //     setImporting(true);

    //     router.post(
    //         '/price-list-import' as const,
    //         { items: resolution.resolved } as never,
    //         {
    //             onFinish: () => setImporting(false),
    //             onError: (importErrors) => {
    //                 console.error('Import validation errors:', importErrors);

    //                 // Log the actual items that failed validation
    //                 for (const key of Object.keys(importErrors)) {
    //                     const match = key.match(/^items\.(\d+)\.(\w+)$/);

    //                     if (match) {
    //                         const idx = Number(match[1]);
    //                         const field = match[2];
    //                         const item = resolution.resolved[idx];

    //                         if (item) {
    //                             console.log(
    //                                 `Failing item [${idx}].${field}:`,
    //                                 item,
    //                             );
    //                         }
    //                     }
    //                 }
    //             },
    //         },
    //     );
    // }

    // const { errors } = usePage().props;

    return (
        <div className="flex flex-col gap-4 p-4">
            <Field>
                <FieldLabel htmlFor="file">Excel File</FieldLabel>
                <Input
                    id="file"
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileChange}
                    disabled={loading}
                />
                {loading ? (
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <Spinner /> Parsing workbook...
                    </div>
                ) : (
                    <FieldDescription>Select an Excel file.</FieldDescription>
                )}
            </Field>

            {sheets.length > 0 && (
                <Field>
                    <FieldLabel>Sheets</FieldLabel>
                    <ToggleGroup
                        multiple
                        value={selectedSheets}
                        onValueChange={handleSheetsChange}
                        orientation="horizontal"
                        className="flex-wrap"
                    >
                        {sheets.map((sheet) => (
                            <ToggleGroupItem
                                key={sheet}
                                value={sheet}
                                className="border"
                            >
                                {sheet}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                </Field>
            )}

            {selectedSheets.length > 0 && !confirmed && (
                <div className="mt-2">
                    <Button onClick={handleConfirm}>Confirm Selection</Button>
                </div>
            )}

            {confirmed && selectedSheets.length > 0 && (
                <div className="mt-4 space-y-4">
                    <Field>
                        <FieldLabel>Sheet to calibrate</FieldLabel>
                        <Select
                            value={calibratingSheet}
                            onValueChange={(v) => v && setCalibratingSheet(v)}
                        >
                            <SelectTrigger className="w-60">
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

                    {calibratingSheet && sheetConfigs[calibratingSheet] && (
                        <div className="rounded-lg border p-4">
                            <div className="flex items-center justify-between">
                                <span className="font-medium">
                                    {calibratingSheet}
                                </span>
                                <label className="flex cursor-pointer items-center gap-2 text-sm">
                                    Use Defaults
                                    <Switch
                                        checked={
                                            !sheetConfigs[calibratingSheet]
                                                .useCustom
                                        }
                                        onCheckedChange={(checked) =>
                                            setSheetConfigs((prev) => ({
                                                ...prev,
                                                [calibratingSheet]: {
                                                    ...prev[calibratingSheet],
                                                    useCustom: !checked,
                                                },
                                            }))
                                        }
                                        size="sm"
                                    />
                                </label>
                            </div>

                            <fieldset
                                disabled={
                                    !sheetConfigs[calibratingSheet].useCustom
                                }
                            >
                                <div className="mt-4 flex gap-4">
                                    <Field>
                                        <FieldLabel>Start Row</FieldLabel>
                                        <Input
                                            type="number"
                                            value={
                                                sheetConfigs[calibratingSheet]
                                                    .startRow
                                            }
                                            onChange={(e) =>
                                                setSheetConfigs((prev) => ({
                                                    ...prev,
                                                    [calibratingSheet]: {
                                                        ...prev[
                                                            calibratingSheet
                                                        ],
                                                        startRow: Number(
                                                            e.target.value,
                                                        ),
                                                    },
                                                }))
                                            }
                                            className="w-20"
                                        />
                                    </Field>
                                    <Field>
                                        <FieldLabel>End Row</FieldLabel>
                                        <Input
                                            type="number"
                                            value={
                                                sheetConfigs[calibratingSheet]
                                                    .endRow ?? ''
                                            }
                                            onChange={(e) =>
                                                setSheetConfigs((prev) => ({
                                                    ...prev,
                                                    [calibratingSheet]: {
                                                        ...prev[
                                                            calibratingSheet
                                                        ],
                                                        endRow: e.target.value
                                                            ? Number(
                                                                  e.target
                                                                      .value,
                                                              )
                                                            : undefined,
                                                    },
                                                }))
                                            }
                                            className="w-20"
                                        />
                                    </Field>
                                </div>

                                <div className="mt-4 grid grid-cols-6 gap-2">
                                    <Field>
                                        <FieldLabel>COA</FieldLabel>
                                        <Input
                                            value={
                                                sheetConfigs[calibratingSheet]
                                                    .columnMap.chartOfAccount
                                            }
                                            onChange={(e) =>
                                                setSheetConfigs((prev) => ({
                                                    ...prev,
                                                    [calibratingSheet]: {
                                                        ...prev[
                                                            calibratingSheet
                                                        ],
                                                        columnMap: {
                                                            ...prev[
                                                                calibratingSheet
                                                            ].columnMap,
                                                            chartOfAccount:
                                                                e.target.value.toUpperCase(),
                                                        },
                                                    },
                                                }))
                                            }
                                            className="w-16"
                                        />
                                    </Field>
                                    <Field>
                                        <FieldLabel>Item#</FieldLabel>
                                        <Input
                                            value={
                                                sheetConfigs[calibratingSheet]
                                                    .columnMap.itemNumber
                                            }
                                            onChange={(e) =>
                                                setSheetConfigs((prev) => ({
                                                    ...prev,
                                                    [calibratingSheet]: {
                                                        ...prev[
                                                            calibratingSheet
                                                        ],
                                                        columnMap: {
                                                            ...prev[
                                                                calibratingSheet
                                                            ].columnMap,
                                                            itemNumber:
                                                                e.target.value.toUpperCase(),
                                                        },
                                                    },
                                                }))
                                            }
                                            className="w-16"
                                        />
                                    </Field>
                                    <Field>
                                        <FieldLabel>Cat</FieldLabel>
                                        <Input
                                            value={
                                                sheetConfigs[calibratingSheet]
                                                    .columnMap.category
                                            }
                                            onChange={(e) =>
                                                setSheetConfigs((prev) => ({
                                                    ...prev,
                                                    [calibratingSheet]: {
                                                        ...prev[
                                                            calibratingSheet
                                                        ],
                                                        columnMap: {
                                                            ...prev[
                                                                calibratingSheet
                                                            ].columnMap,
                                                            category:
                                                                e.target.value.toUpperCase(),
                                                        },
                                                    },
                                                }))
                                            }
                                            className="w-16"
                                        />
                                    </Field>
                                    <Field>
                                        <FieldLabel>Desc</FieldLabel>
                                        <Input
                                            value={
                                                sheetConfigs[calibratingSheet]
                                                    .columnMap.description
                                            }
                                            onChange={(e) =>
                                                setSheetConfigs((prev) => ({
                                                    ...prev,
                                                    [calibratingSheet]: {
                                                        ...prev[
                                                            calibratingSheet
                                                        ],
                                                        columnMap: {
                                                            ...prev[
                                                                calibratingSheet
                                                            ].columnMap,
                                                            description:
                                                                e.target.value.toUpperCase(),
                                                        },
                                                    },
                                                }))
                                            }
                                            className="w-16"
                                        />
                                    </Field>
                                    <Field>
                                        <FieldLabel>Unit</FieldLabel>
                                        <Input
                                            value={
                                                sheetConfigs[calibratingSheet]
                                                    .columnMap.unit
                                            }
                                            onChange={(e) =>
                                                setSheetConfigs((prev) => ({
                                                    ...prev,
                                                    [calibratingSheet]: {
                                                        ...prev[
                                                            calibratingSheet
                                                        ],
                                                        columnMap: {
                                                            ...prev[
                                                                calibratingSheet
                                                            ].columnMap,
                                                            unit: e.target.value.toUpperCase(),
                                                        },
                                                    },
                                                }))
                                            }
                                            className="w-16"
                                        />
                                    </Field>
                                    <Field>
                                        <FieldLabel>Price</FieldLabel>
                                        <Input
                                            value={
                                                sheetConfigs[calibratingSheet]
                                                    .columnMap.price
                                            }
                                            onChange={(e) =>
                                                setSheetConfigs((prev) => ({
                                                    ...prev,
                                                    [calibratingSheet]: {
                                                        ...prev[
                                                            calibratingSheet
                                                        ],
                                                        columnMap: {
                                                            ...prev[
                                                                calibratingSheet
                                                            ].columnMap,
                                                            price: e.target.value.toUpperCase(),
                                                        },
                                                    },
                                                }))
                                            }
                                            className="w-16"
                                        />
                                    </Field>
                                </div>

                                <div className="mt-4">
                                    <p className="mb-2 text-sm font-medium text-muted-foreground">
                                        Monthly Quantities
                                    </p>
                                    <div className="grid grid-cols-4 gap-2">
                                        <Field>
                                            <FieldLabel>Jan</FieldLabel>
                                            <Input
                                                value={
                                                    sheetConfigs[
                                                        calibratingSheet
                                                    ].columnMap.janQty
                                                }
                                                onChange={(e) =>
                                                    setSheetConfigs((prev) => ({
                                                        ...prev,
                                                        [calibratingSheet]: {
                                                            ...prev[
                                                                calibratingSheet
                                                            ],
                                                            columnMap: {
                                                                ...prev[
                                                                    calibratingSheet
                                                                ].columnMap,
                                                                janQty: e.target.value.toUpperCase(),
                                                            },
                                                        },
                                                    }))
                                                }
                                                className="w-16"
                                            />
                                        </Field>
                                        <Field>
                                            <FieldLabel>Feb</FieldLabel>
                                            <Input
                                                value={
                                                    sheetConfigs[
                                                        calibratingSheet
                                                    ].columnMap.febQty
                                                }
                                                onChange={(e) =>
                                                    setSheetConfigs((prev) => ({
                                                        ...prev,
                                                        [calibratingSheet]: {
                                                            ...prev[
                                                                calibratingSheet
                                                            ],
                                                            columnMap: {
                                                                ...prev[
                                                                    calibratingSheet
                                                                ].columnMap,
                                                                febQty: e.target.value.toUpperCase(),
                                                            },
                                                        },
                                                    }))
                                                }
                                                className="w-16"
                                            />
                                        </Field>
                                        <Field>
                                            <FieldLabel>Mar</FieldLabel>
                                            <Input
                                                value={
                                                    sheetConfigs[
                                                        calibratingSheet
                                                    ].columnMap.marQty
                                                }
                                                onChange={(e) =>
                                                    setSheetConfigs((prev) => ({
                                                        ...prev,
                                                        [calibratingSheet]: {
                                                            ...prev[
                                                                calibratingSheet
                                                            ],
                                                            columnMap: {
                                                                ...prev[
                                                                    calibratingSheet
                                                                ].columnMap,
                                                                marQty: e.target.value.toUpperCase(),
                                                            },
                                                        },
                                                    }))
                                                }
                                                className="w-16"
                                            />
                                        </Field>
                                        <Field>
                                            <FieldLabel>Apr</FieldLabel>
                                            <Input
                                                value={
                                                    sheetConfigs[
                                                        calibratingSheet
                                                    ].columnMap.aprQty
                                                }
                                                onChange={(e) =>
                                                    setSheetConfigs((prev) => ({
                                                        ...prev,
                                                        [calibratingSheet]: {
                                                            ...prev[
                                                                calibratingSheet
                                                            ],
                                                            columnMap: {
                                                                ...prev[
                                                                    calibratingSheet
                                                                ].columnMap,
                                                                aprQty: e.target.value.toUpperCase(),
                                                            },
                                                        },
                                                    }))
                                                }
                                                className="w-16"
                                            />
                                        </Field>
                                        <Field>
                                            <FieldLabel>May</FieldLabel>
                                            <Input
                                                value={
                                                    sheetConfigs[
                                                        calibratingSheet
                                                    ].columnMap.mayQty
                                                }
                                                onChange={(e) =>
                                                    setSheetConfigs((prev) => ({
                                                        ...prev,
                                                        [calibratingSheet]: {
                                                            ...prev[
                                                                calibratingSheet
                                                            ],
                                                            columnMap: {
                                                                ...prev[
                                                                    calibratingSheet
                                                                ].columnMap,
                                                                mayQty: e.target.value.toUpperCase(),
                                                            },
                                                        },
                                                    }))
                                                }
                                                className="w-16"
                                            />
                                        </Field>
                                        <Field>
                                            <FieldLabel>Jun</FieldLabel>
                                            <Input
                                                value={
                                                    sheetConfigs[
                                                        calibratingSheet
                                                    ].columnMap.junQty
                                                }
                                                onChange={(e) =>
                                                    setSheetConfigs((prev) => ({
                                                        ...prev,
                                                        [calibratingSheet]: {
                                                            ...prev[
                                                                calibratingSheet
                                                            ],
                                                            columnMap: {
                                                                ...prev[
                                                                    calibratingSheet
                                                                ].columnMap,
                                                                junQty: e.target.value.toUpperCase(),
                                                            },
                                                        },
                                                    }))
                                                }
                                                className="w-16"
                                            />
                                        </Field>
                                        <Field>
                                            <FieldLabel>Jul</FieldLabel>
                                            <Input
                                                value={
                                                    sheetConfigs[
                                                        calibratingSheet
                                                    ].columnMap.julQty
                                                }
                                                onChange={(e) =>
                                                    setSheetConfigs((prev) => ({
                                                        ...prev,
                                                        [calibratingSheet]: {
                                                            ...prev[
                                                                calibratingSheet
                                                            ],
                                                            columnMap: {
                                                                ...prev[
                                                                    calibratingSheet
                                                                ].columnMap,
                                                                julQty: e.target.value.toUpperCase(),
                                                            },
                                                        },
                                                    }))
                                                }
                                                className="w-16"
                                            />
                                        </Field>
                                        <Field>
                                            <FieldLabel>Aug</FieldLabel>
                                            <Input
                                                value={
                                                    sheetConfigs[
                                                        calibratingSheet
                                                    ].columnMap.augQty
                                                }
                                                onChange={(e) =>
                                                    setSheetConfigs((prev) => ({
                                                        ...prev,
                                                        [calibratingSheet]: {
                                                            ...prev[
                                                                calibratingSheet
                                                            ],
                                                            columnMap: {
                                                                ...prev[
                                                                    calibratingSheet
                                                                ].columnMap,
                                                                augQty: e.target.value.toUpperCase(),
                                                            },
                                                        },
                                                    }))
                                                }
                                                className="w-16"
                                            />
                                        </Field>
                                        <Field>
                                            <FieldLabel>Sep</FieldLabel>
                                            <Input
                                                value={
                                                    sheetConfigs[
                                                        calibratingSheet
                                                    ].columnMap.sepQty
                                                }
                                                onChange={(e) =>
                                                    setSheetConfigs((prev) => ({
                                                        ...prev,
                                                        [calibratingSheet]: {
                                                            ...prev[
                                                                calibratingSheet
                                                            ],
                                                            columnMap: {
                                                                ...prev[
                                                                    calibratingSheet
                                                                ].columnMap,
                                                                sepQty: e.target.value.toUpperCase(),
                                                            },
                                                        },
                                                    }))
                                                }
                                                className="w-16"
                                            />
                                        </Field>
                                        <Field>
                                            <FieldLabel>Oct</FieldLabel>
                                            <Input
                                                value={
                                                    sheetConfigs[
                                                        calibratingSheet
                                                    ].columnMap.octQty
                                                }
                                                onChange={(e) =>
                                                    setSheetConfigs((prev) => ({
                                                        ...prev,
                                                        [calibratingSheet]: {
                                                            ...prev[
                                                                calibratingSheet
                                                            ],
                                                            columnMap: {
                                                                ...prev[
                                                                    calibratingSheet
                                                                ].columnMap,
                                                                octQty: e.target.value.toUpperCase(),
                                                            },
                                                        },
                                                    }))
                                                }
                                                className="w-16"
                                            />
                                        </Field>
                                        <Field>
                                            <FieldLabel>Nov</FieldLabel>
                                            <Input
                                                value={
                                                    sheetConfigs[
                                                        calibratingSheet
                                                    ].columnMap.novQty
                                                }
                                                onChange={(e) =>
                                                    setSheetConfigs((prev) => ({
                                                        ...prev,
                                                        [calibratingSheet]: {
                                                            ...prev[
                                                                calibratingSheet
                                                            ],
                                                            columnMap: {
                                                                ...prev[
                                                                    calibratingSheet
                                                                ].columnMap,
                                                                novQty: e.target.value.toUpperCase(),
                                                            },
                                                        },
                                                    }))
                                                }
                                                className="w-16"
                                            />
                                        </Field>
                                        <Field>
                                            <FieldLabel>Dec</FieldLabel>
                                            <Input
                                                value={
                                                    sheetConfigs[
                                                        calibratingSheet
                                                    ].columnMap.decQty
                                                }
                                                onChange={(e) =>
                                                    setSheetConfigs((prev) => ({
                                                        ...prev,
                                                        [calibratingSheet]: {
                                                            ...prev[
                                                                calibratingSheet
                                                            ],
                                                            columnMap: {
                                                                ...prev[
                                                                    calibratingSheet
                                                                ].columnMap,
                                                                decQty: e.target.value.toUpperCase(),
                                                            },
                                                        },
                                                    }))
                                                }
                                                className="w-16"
                                            />
                                        </Field>
                                    </div>
                                </div>
                            </fieldset>
                        </div>
                    )}

                    <div className="mt-4 flex gap-2">
                        <Button variant="outline" onClick={handleExtractCoas}>
                            Extract COAs
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleExtractCategories}
                        >
                            Extract Categories
                        </Button>
                        <Button>Extract</Button>
                        <Button
                            variant="outline"
                            onClick={handleLogCoaSummary}
                        >
                            Log COA Summary
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleLogCategorySummary}
                        >
                            Log Category Summary
                        </Button>
                    </div>
                </div>
            )}

            {/* {sheets.length > 0 && (
                <>
                    <div className="mt-4 flex gap-4">
                        <Field>
                            <FieldLabel htmlFor="startRow">
                                Start Row
                            </FieldLabel>
                            <Input
                                id="startRow"
                                type="number"
                                value={startRow}
                                onChange={(e) =>
                                    setStartRow(Number(e.target.value))
                                }
                            />
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="endRow">
                                End Row (optional)
                            </FieldLabel>
                            <Input
                                id="endRow"
                                type="number"
                                value={endRow ?? ''}
                                onChange={(e) =>
                                    setEndRow(
                                        e.target.value
                                            ? Number(e.target.value)
                                            : undefined,
                                    )
                                }
                            />
                            <FieldDescription>
                                Leave empty to read to the last row.
                            </FieldDescription>
                        </Field>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <Field>
                            <FieldLabel>Chart of Account</FieldLabel>
                            <Input
                                value={columnMap.chartOfAccount}
                                onChange={(e) =>
                                    updateColumn(
                                        'chartOfAccount',
                                        e.target.value,
                                    )
                                }
                                className="w-16"
                            />
                        </Field>
                        <Field>
                            <FieldLabel>Category</FieldLabel>
                            <Input
                                value={columnMap.category}
                                onChange={(e) =>
                                    updateColumn('category', e.target.value)
                                }
                                className="w-16"
                            />
                        </Field>
                        <Field>
                            <FieldLabel>Description</FieldLabel>
                            <Input
                                value={columnMap.description}
                                onChange={(e) =>
                                    updateColumn('description', e.target.value)
                                }
                                className="w-16"
                            />
                        </Field>
                        <Field>
                            <FieldLabel>Unit of Measure</FieldLabel>
                            <Input
                                value={columnMap.unit}
                                onChange={(e) =>
                                    updateColumn('unit', e.target.value)
                                }
                                className="w-16"
                            />
                        </Field>
                        <Field>
                            <FieldLabel>Price</FieldLabel>
                            <Input
                                value={columnMap.price}
                                onChange={(e) =>
                                    updateColumn('price', e.target.value)
                                }
                                className="w-16"
                            />
                        </Field>
                    </div>

                    {selectedSheet && (
                        <div className="mt-6">
                            <Button onClick={handleExtract}>Extract</Button>
                        </div>
                    )}

                    {result && resolution && (
                        <div className="mt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const pairs = new Set<string>();

                                    for (const item of result.items) {
                                        pairs.add(
                                            `${item.category} → ${item.chartOfAccount}`,
                                        );
                                    }

                                    console.log('=== Category → COA Pairs ===');
                                    console.log([...pairs].sort().join('\n'));
                                    console.log(
                                        `Total unique pairs: ${pairs.size}`,
                                    );
                                }}
                            >
                                Log Category–COA Pairs
                            </Button>
                        </div>
                    )}

                    {result && resolution && (
                        <div className="mt-4 space-y-3">
                            <div className="text-sm text-muted-foreground">
                                Found {result.items.length} items,{' '}
                                {result.uniqueChartOfAccounts.length} unique
                                chart of accounts,{' '}
                                {result.uniqueCategories.length} unique
                                categories.
                            </div>

                            <div className="text-sm">
                                <span className="font-medium">
                                    {resolution.matchedItems}/
                                    {resolution.totalItems}
                                </span>{' '}
                                items matched to database entries.
                            </div>

                            {---- Chart of Account Mapping ----}
                            <div className="overflow-hidden rounded-lg border">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-muted/50">
                                            <th className="px-3 py-2 text-left font-medium">
                                                Chart of Account
                                            </th>
                                            <th className="px-3 py-2 text-left font-medium">
                                                Map to DB Entry
                                            </th>
                                            <th className="px-3 py-2 text-center font-medium">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.uniqueChartOfAccounts.map(
                                            (excelName: string) => {
                                                const autoId = coaLookup.get(
                                                    normalize(excelName),
                                                );
                                                const currentId =
                                                    manualCoa[excelName] ??
                                                    autoId;
                                                const currentTitle = currentId
                                                    ? idToCoaTitle.get(
                                                          currentId,
                                                      )
                                                    : undefined;
                                                const comboboxValue =
                                                    currentTitle
                                                        ? `coa:${currentTitle}`
                                                        : '';
                                                const isManual =
                                                    excelName in manualCoa;
                                                let statusLabel: string;
                                                let statusClass: string;

                                                if (isManual) {
                                                    statusLabel = '✎ manual';
                                                    statusClass =
                                                        'text-blue-600';
                                                } else if (autoId) {
                                                    statusLabel = '✓ auto';
                                                    statusClass =
                                                        'text-green-600';
                                                } else {
                                                    statusLabel = '✗ unmapped';
                                                    statusClass =
                                                        'text-destructive';
                                                }

                                                return (
                                                    <tr
                                                        key={excelName}
                                                        className="border-t"
                                                    >
                                                        <td className="px-3 py-2 font-mono text-xs">
                                                            {excelName}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <Combobox
                                                                items={
                                                                    coaComboboxItems
                                                                }
                                                                value={
                                                                    comboboxValue
                                                                }
                                                                onValueChange={(
                                                                    v,
                                                                ) => {
                                                                    if (!v) {
                                                                        return;
                                                                    }

                                                                    const name =
                                                                        v.replace(
                                                                            /^[^:]+:/,
                                                                            '',
                                                                        );
                                                                    const id =
                                                                        coaNameToId.get(
                                                                            name,
                                                                        );

                                                                    if (id) {
                                                                        setManualCoa(
                                                                            (
                                                                                prev,
                                                                            ) => ({
                                                                                ...prev,
                                                                                [excelName]:
                                                                                    id,
                                                                            }),
                                                                        );
                                                                    }
                                                                }}
                                                            >
                                                                <ComboboxInput placeholder="Search chart of account..." />
                                                                <ComboboxContent>
                                                                    <ComboboxEmpty>
                                                                        No items
                                                                        found.
                                                                    </ComboboxEmpty>
                                                                    <ComboboxList>
                                                                        {(
                                                                            item,
                                                                        ) => (
                                                                            <ComboboxItem
                                                                                key={
                                                                                    item
                                                                                }
                                                                                value={
                                                                                    item
                                                                                }
                                                                            >
                                                                                {item.replace(
                                                                                    /^[^:]+:/,
                                                                                    '',
                                                                                )}
                                                                            </ComboboxItem>
                                                                        )}
                                                                    </ComboboxList>
                                                                </ComboboxContent>
                                                            </Combobox>
                                                        </td>
                                                        <td className="px-3 py-2 text-center text-xs">
                                                            <span
                                                                className={
                                                                    statusClass
                                                                }
                                                            >
                                                                {statusLabel}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            },
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {---- Category Mapping ----}
                            <div className="overflow-hidden rounded-lg border">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-muted/50">
                                            <th className="px-3 py-2 text-left font-medium">
                                                Category
                                            </th>
                                            <th className="px-3 py-2 text-left font-medium">
                                                Map to DB Entry
                                            </th>
                                            <th className="px-3 py-2 text-center font-medium">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.uniqueCategories.map(
                                            (excelName: string) => {
                                                const autoId = catLookup.get(
                                                    normalize(excelName),
                                                );
                                                const currentId =
                                                    manualCat[excelName] ??
                                                    autoId;
                                                const currentName = currentId
                                                    ? idToCatName.get(currentId)
                                                    : undefined;
                                                const comboboxValue =
                                                    currentName
                                                        ? `cat:${currentName}`
                                                        : '';
                                                const isManual =
                                                    excelName in manualCat;
                                                let statusLabel: string;
                                                let statusClass: string;

                                                if (isManual) {
                                                    statusLabel = '✎ manual';
                                                    statusClass =
                                                        'text-blue-600';
                                                } else if (autoId) {
                                                    statusLabel = '✓ auto';
                                                    statusClass =
                                                        'text-green-600';
                                                } else {
                                                    statusLabel = '✗ unmapped';
                                                    statusClass =
                                                        'text-destructive';
                                                }

                                                return (
                                                    <tr
                                                        key={excelName}
                                                        className="border-t"
                                                    >
                                                        <td className="px-3 py-2 font-mono text-xs">
                                                            {excelName}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <Combobox
                                                                items={
                                                                    catComboboxItems
                                                                }
                                                                value={
                                                                    comboboxValue
                                                                }
                                                                onValueChange={(
                                                                    v,
                                                                ) => {
                                                                    if (!v) {
                                                                        return;
                                                                    }

                                                                    const name =
                                                                        v.replace(
                                                                            /^[^:]+:/,
                                                                            '',
                                                                        );
                                                                    const id =
                                                                        catNameToId.get(
                                                                            name,
                                                                        );

                                                                    if (id) {
                                                                        setManualCat(
                                                                            (
                                                                                prev,
                                                                            ) => ({
                                                                                ...prev,
                                                                                [excelName]:
                                                                                    id,
                                                                            }),
                                                                        );
                                                                    }
                                                                }}
                                                            >
                                                                <ComboboxInput placeholder="Search category..." />
                                                                <ComboboxContent>
                                                                    <ComboboxEmpty>
                                                                        No items
                                                                        found.
                                                                    </ComboboxEmpty>
                                                                    <ComboboxList>
                                                                        {(
                                                                            item,
                                                                        ) => (
                                                                            <ComboboxItem
                                                                                key={
                                                                                    item
                                                                                }
                                                                                value={
                                                                                    item
                                                                                }
                                                                            >
                                                                                {item.replace(
                                                                                    /^[^:]+:/,
                                                                                    '',
                                                                                )}
                                                                            </ComboboxItem>
                                                                        )}
                                                                    </ComboboxList>
                                                                </ComboboxContent>
                                                            </Combobox>
                                                        </td>
                                                        <td className="px-3 py-2 text-center text-xs">
                                                            <span
                                                                className={
                                                                    statusClass
                                                                }
                                                            >
                                                                {statusLabel}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            },
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {errors?.import && (
                                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                                    <p className="font-medium text-destructive">
                                        {errors.import}
                                    </p>
                                </div>
                            )}

                            {typeof errors === 'object' &&
                                errors !== null &&
                                Object.keys(errors).length > 0 &&
                                !errors?.import && (
                                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                                        <p className="font-medium text-destructive">
                                            Validation failed. Check the browser
                                            console for details.
                                        </p>
                                    </div>
                                )}

                            {resolution.matchedItems > 0 && (
                                <div className="mt-4">
                                    <Button
                                        onClick={handleImport}
                                        disabled={importing}
                                    >
                                        {importing
                                            ? 'Importing...'
                                            : `Import ${resolution.matchedItems} Items`}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )} */}
        </div>
    );
}

PriceListImport.layout = {
    breadcrumbs: [
        {
            title: 'Price List Importer',
            href: '#',
        },
    ],
};
