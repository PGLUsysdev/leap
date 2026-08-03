import { router } from '@inertiajs/react';
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
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/base-ui-components/ui/dialog';
import {
    Field,
    FieldDescription,
    FieldLabel,
} from '@/components/base-ui-components/ui/field';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@/components/base-ui-components/ui/hover-card';
import { Input } from '@/components/base-ui-components/ui/input';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/base-ui-components/ui/select';
import { Spinner } from '@/components/base-ui-components/ui/spinner';
import { Switch } from '@/components/base-ui-components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/base-ui-components/ui/table';
import {
    ToggleGroup,
    ToggleGroupItem,
} from '@/components/base-ui-components/ui/toggle-group';
import type {
    ChartOfAccount,
    ChartOfAccountPpmpCategory,
    PpmpCategory,
} from '@/types';
import { extractData, extractQuantities } from './extract';
import type { ExtractResult, QuantityRow } from './extract';

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
    dbPairs: ChartOfAccountPpmpCategory[];
    priceListItems: Array<{
        id: number;
        description: string;
        unit_of_measurement: string;
        price: string;
    }>;
    fiscalYears: Array<{ id: number; year: number }>;
    ppas: Array<{
        id: number;
        name: string;
        fiscal_year_id: number | null;
    }>;
    fundingSources: Array<{ id: number; code: string; title: string }>;
}

// interface ResolvedItem {
//     chart_of_account_id: number;
//     ppmp_category_id: number;
//     description: string;
//     unit_of_measurement: string;
//     price: number;
// }

// interface Resolution {
//     resolved: ResolvedItem[];
//     totalItems: number;
//     matchedItems: number;
//     unmatchedChartOfAccounts: string[];
//     unmatchedCategories: string[];
// }

// function buildLookup<T>(items: T[], getName: (item: T) => string) {
//     const map = new Map<string, number>();
//
//     for (const item of items) {
//         map.set(getName(item).trim().toLowerCase(), item.id);
//     }
//
//     return map;
// }

// function computeResolution(
//     result: ExtractResult,
//     coaLookup: Map<string, number>,
//     catLookup: Map<string, number>,
//     manualCoa: Record<string, number>,
//     manualCat: Record<string, number>,
// ) {
//     const resolved: ResolvedItem[] = [];
//     const unmatchedCoaSet = new Set<string>();
//     const unmatchedCatSet = new Set<string>();

//     for (const item of result.items) {
//         const coaId =
//             manualCoa[item.chartOfAccount] ??
//             coaLookup.get(item.chartOfAccount.trim().toLowerCase());
//         const catId =
//             manualCat[item.category] ??
//             catLookup.get(item.category.trim().toLowerCase());

//         if (!coaId) {
//             unmatchedCoaSet.add(item.chartOfAccount);
//         }

//         if (!catId) {
//             unmatchedCatSet.add(item.category);
//         }

//         if (coaId && catId) {
//             resolved.push({
//                 chart_of_account_id: coaId,
//                 ppmp_category_id: catId,
//                 description: item.description,
//                 unit_of_measurement: item.unit,
//                 price: item.price,
//             });
//         }
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
    dbPairs,
    priceListItems,
    fiscalYears,
    ppas,
    fundingSources,
}: PriceListImportProps) {
    console.log(chartOfAccounts);
    console.log(ppmpCategories);

    const [mode, setMode] = useState<'price-list' | 'quantities' | null>(null);
    const [sheets, setSheets] = useState<string[]>([]);
    const [_workbook, setWorkbook] = useState<ExcelJS.Workbook | null>(null);
    const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
    // const [startRow, setStartRow] = useState(9);
    // const [endRow, setEndRow] = useState<number | undefined>(1233);
    // const [columnMap, setColumnMap] =
    //     useState<ColumnMapping>(defaultColumnMapping);
    const [result, setResult] = useState<ExtractResult | null>(null);
    const [extracted, setExtracted] = useState<{
        chartOfAccounts: Array<{ name: string; sheets: string[] }>;
        categories: Array<{ name: string; sheets: string[] }>;
        pairs: Array<{
            category: string;
            chartOfAccount: string;
            sheets: string[];
        }>;
    } | null>(null);
    const [mappedPairs, setMappedPairs] = useState<Array<{
        category: string;
        chartOfAccount: string;
        categoryId: number | null;
        coaId: number | null;
        resolvedCategory: string | null;
        resolvedCoa: string | null;
    }> | null>(null);
    const [pairOverrides, setPairOverrides] = useState<
        Record<string, { coaId: number | null }>
    >({});
    const [uniqueItems, setUniqueItems] = useState<Array<{
        description: string;
        category: string;
        chartOfAccount: string;
        unit_of_measurement: string;
        price: number | null;
        sheets: string[];
    }> | null>(null);
    const [itemMatches, setItemMatches] = useState<Record<string, number>>({});
    const [hideExisting, setHideExisting] = useState(false);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [importing, setImporting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refetching, setRefetching] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [targetFiscalYearId, setTargetFiscalYearId] = useState<number | null>(
        null,
    );
    const [targetPpaId, setTargetPpaId] = useState<number | null>(null);
    const [targetFundingSourceId, setTargetFundingSourceId] = useState<
        number | null
    >(null);

    const monthlyQtyColumns = [
        ['janQty', 'Jan', 'K'],
        ['febQty', 'Feb', 'M'],
        ['marQty', 'Mar', 'O'],
        ['aprQty', 'Apr', 'Q'],
        ['mayQty', 'May', 'S'],
        ['junQty', 'Jun', 'U'],
        ['julQty', 'Jul', 'W'],
        ['augQty', 'Aug', 'Y'],
        ['sepQty', 'Sep', 'AA'],
        ['octQty', 'Oct', 'AC'],
        ['novQty', 'Nov', 'AE'],
        ['decQty', 'Dec', 'AG'],
    ] as const;

    const defaultQuantitiesColumns = {
        category: 'F',
        chartOfAccount: 'D',
        description: 'F',
        total: 'J',
        unit: 'G',
        price: 'H',
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
    };

    const [quantitiesConfig, setQuantitiesConfig] = useState({
        startRow: 8,
        endRow: undefined as number | undefined,
        columns: { ...defaultQuantitiesColumns },
    });
    const [quantityRows, setQuantityRows] = useState<QuantityRow[] | null>(
        null,
    );
    const [quantityMatches, setQuantityMatches] = useState<
        Record<number, { itemId: number | null }>
    >({});
    const [quantityChecked, setQuantityChecked] = useState(false);
    const [quantityImportDialogOpen, setQuantityImportDialogOpen] =
        useState(false);
    const [quantityImporting, setQuantityImporting] = useState(false);
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
    const coaLookup = useMemo(() => {
        const m = new Map<string, number>();

        for (const coa of chartOfAccounts) {
            m.set(normalize(coa.account_title), coa.id);
        }

        return m;
    }, [chartOfAccounts]);

    const catLookup = useMemo(() => {
        const m = new Map<string, number>();

        for (const cat of ppmpCategories) {
            m.set(normalize(cat.name), cat.id);
        }

        return m;
    }, [ppmpCategories]);

    // Maps for Combobox: name ↔ ID lookup (unprefixed)
    const coaNameToId = useMemo(() => {
        const m = new Map<string, number>();

        for (const coa of chartOfAccounts) {
            m.set(coa.account_title, coa.id);
        }

        return m;
    }, [chartOfAccounts]);

    const idToCoaTitle = useMemo(() => {
        const m = new Map<number, string>();

        for (const coa of chartOfAccounts) {
            m.set(coa.id, coa.account_title);
        }

        return m;
    }, [chartOfAccounts]);

    const catNameToId = useMemo(() => {
        const m = new Map<string, number>();

        for (const cat of ppmpCategories) {
            m.set(cat.name, cat.id);
        }

        return m;
    }, [ppmpCategories]);

    const idToCatName = useMemo(() => {
        const m = new Map<number, string>();

        for (const cat of ppmpCategories) {
            m.set(cat.id, cat.name);
        }

        return m;
    }, [ppmpCategories]);

    const dbPairsSet = useMemo(() => {
        const set = new Set<string>();

        for (const pair of dbPairs) {
            set.add(`${pair.chart_of_account_id}|${pair.ppmp_category_id}`);
        }

        return set;
    }, [dbPairs]);

    const dbDescriptionSet = useMemo(() => {
        const set = new Set<string>();

        for (const item of priceListItems) {
            set.add(normalize(item.description));
        }

        return set;
    }, [priceListItems]);

    const pliById = useMemo(() => {
        const m = new Map<number, (typeof priceListItems)[number]>();

        for (const item of priceListItems) {
            m.set(item.id, item);
        }

        return m;
    }, [priceListItems]);

    // Combobox items with type prefix to avoid ComboboxCollection key collision
    const pliComboboxItems = useMemo(
        () => priceListItems.map((item) => `pli:${item.description}`),
        [priceListItems],
    );

    // Combobox items with type prefix to avoid ComboboxCollection key collision
    const coaComboboxItems = useMemo(
        () => chartOfAccounts.map((coa) => `coa:${coa.account_title}`),
        [chartOfAccounts],
    );

    const catComboboxItems = useMemo(
        () => ppmpCategories.map((cat) => `cat:${cat.name}`),
        [ppmpCategories],
    );

    const ppaComboboxItems = useMemo(
        () =>
            ppas
                .filter((p) => p.fiscal_year_id === targetFiscalYearId)
                .map((p) => `ppa:${p.name}`),
        [ppas, targetFiscalYearId],
    );

    const importPlan = useMemo(() => {
        if (!uniqueItems) {
            return null;
        }

        const items: Array<{
            chart_of_account_id: number;
            ppmp_category_id: number;
            description: string;
            unit_of_measurement: string;
            price: number;
        }> = [];
        let skippedNoMatch = 0;
        let skippedNoPrice = 0;
        let skippedMissingUnit = 0;

        for (const item of uniqueItems) {
            const itemKey = `${item.description}|${item.category}|${item.chartOfAccount}`;

            if (itemMatches[itemKey]) {
                continue;
            }

            if (dbDescriptionSet.has(normalize(item.description))) {
                continue;
            }

            const catId =
                manualCat[item.category] ??
                catLookup.get(normalize(item.category));
            const coaId =
                pairOverrides[`${item.category}|${item.chartOfAccount}`]
                    ?.coaId ??
                manualCoa[item.chartOfAccount] ??
                coaLookup.get(normalize(item.chartOfAccount));

            if (
                catId === null ||
                catId === undefined ||
                coaId === null ||
                coaId === undefined ||
                !dbPairsSet.has(`${coaId}|${catId}`)
            ) {
                skippedNoMatch++;
                continue;
            }

            if (item.price === null || item.price === undefined) {
                skippedNoPrice++;
                continue;
            }

            if (!item.unit_of_measurement.trim()) {
                skippedMissingUnit++;
                continue;
            }

            items.push({
                chart_of_account_id: coaId,
                ppmp_category_id: catId,
                description: item.description,
                unit_of_measurement: item.unit_of_measurement,
                price: item.price,
            });
        }

        return { items, skippedNoMatch, skippedNoPrice, skippedMissingUnit };
    }, [
        uniqueItems,
        itemMatches,
        dbDescriptionSet,
        manualCat,
        catLookup,
        manualCoa,
        coaLookup,
        pairOverrides,
        dbPairsSet,
    ]);

    const quantityImportPlan = useMemo(() => {
        if (!quantityRows) {
            return null;
        }

        const monthKeys = [
            'janQty',
            'febQty',
            'marQty',
            'aprQty',
            'mayQty',
            'junQty',
            'julQty',
            'augQty',
            'sepQty',
            'octQty',
            'novQty',
            'decQty',
        ] as const;

        const rows: Array<{
            ppmp_price_list_id: number;
            jan_qty: number;
            feb_qty: number;
            mar_qty: number;
            apr_qty: number;
            may_qty: number;
            jun_qty: number;
            jul_qty: number;
            aug_qty: number;
            sep_qty: number;
            oct_qty: number;
            nov_qty: number;
            dec_qty: number;
        }> = [];
        let skippedNoQty = 0;
        let unmatched = 0;

        for (const row of quantityRows) {
            const itemId = quantityMatches[row.tempId]?.itemId ?? null;

            if (!itemId) {
                unmatched++;

                continue;
            }

            const qtys = monthKeys.map((key) => row[key]);

            if (qtys.every((q) => q === null || q === undefined || q === 0)) {
                skippedNoQty++;

                continue;
            }

            const monthQty = (key: (typeof monthKeys)[number]) =>
                row[key] ?? 0;

            rows.push({
                ppmp_price_list_id: itemId,
                jan_qty: monthQty('janQty'),
                feb_qty: monthQty('febQty'),
                mar_qty: monthQty('marQty'),
                apr_qty: monthQty('aprQty'),
                may_qty: monthQty('mayQty'),
                jun_qty: monthQty('junQty'),
                jul_qty: monthQty('julQty'),
                aug_qty: monthQty('augQty'),
                sep_qty: monthQty('sepQty'),
                oct_qty: monthQty('octQty'),
                nov_qty: monthQty('novQty'),
                dec_qty: monthQty('decQty'),
            });
        }

        return { rows, skippedNoQty, unmatched };
    }, [quantityRows, quantityMatches]);

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
        setMode(null);
        setSelectedSheets([]);
        setResult(null);
        setExtracted(null);
        setMappedPairs(null);
        setPairOverrides({});
        setUniqueItems(null);
        setItemMatches({});
        setManualCoa({});
        setManualCat({});
        setLoading(false);
        setConfirmed(false);
        resetQuantityCycle();
    }

    function resetQuantityCycle() {
        setQuantityRows(null);
        setQuantityMatches({});
        setQuantityChecked(false);
        setQuantityImportDialogOpen(false);
        setTargetFiscalYearId(null);
        setTargetPpaId(null);
        setTargetFundingSourceId(null);
        setQuantitiesConfig({
            startRow: 8,
            endRow: undefined,
            columns: { ...defaultQuantitiesColumns },
        });
    }

    function handleSheetsChange(sheets: string[]) {
        setSelectedSheets(sheets);
        setExtracted(null);
        setMappedPairs(null);
        setPairOverrides({});
        setUniqueItems(null);
        setItemMatches({});
        setConfirmed(false);
        resetQuantityCycle();
    }

    function handleModeChange(nextMode: 'price-list' | 'quantities') {
        if (nextMode === 'quantities') {
            setSelectedSheets((prev) => prev.slice(0, 1));
        }

        setConfirmed(false);
        setMode(nextMode);
        resetQuantityCycle();
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
        resetQuantityCycle();
    }

    function handleExtractCoaAndCategory() {
        if (!_workbook) {
            return;
        }

        const coaSheets = new Map<string, Set<string>>();
        const catSheets = new Map<string, Set<string>>();
        const pairSheets = new Map<
            string,
            {
                category: string;
                chartOfAccount: string;
                sheets: Set<string>;
            }
        >();

        for (const sheet of selectedSheets) {
            const ws = _workbook.getWorksheet(sheet);

            if (!ws) {
                continue;
            }

            const config = sheetConfigs[sheet] ?? defaultConfig;
            const effective = config.useCustom ? config : defaultConfig;
            const result = extractData({
                worksheet: ws,
                startRow: effective.startRow,
                endRow: effective.endRow,
                columnMap: effective.columnMap,
            });

            for (const coa of result.uniqueChartOfAccounts) {
                if (!coaSheets.has(coa)) {
                    coaSheets.set(coa, new Set());
                }

                coaSheets.get(coa)!.add(sheet);
            }

            for (const cat of result.uniqueCategories) {
                if (!catSheets.has(cat)) {
                    catSheets.set(cat, new Set());
                }

                catSheets.get(cat)!.add(sheet);
            }

            for (const pair of result.uniquePairs) {
                const key = `${pair.category}|${pair.chartOfAccount}`;

                if (!pairSheets.has(key)) {
                    pairSheets.set(key, {
                        category: pair.category,
                        chartOfAccount: pair.chartOfAccount,
                        sheets: new Set(),
                    });
                }

                pairSheets.get(key)!.sheets.add(sheet);
            }
        }

        setExtracted({
            chartOfAccounts: [...coaSheets.entries()]
                .map(([name, sheets]) => ({
                    name,
                    sheets: [...sheets],
                }))
                .sort((a, b) => a.name.localeCompare(b.name)),
            categories: [...catSheets.entries()]
                .map(([name, sheets]) => ({
                    name,
                    sheets: [...sheets],
                }))
                .sort((a, b) => a.name.localeCompare(b.name)),
            pairs: [...pairSheets.entries()]
                .map(([, pair]) => ({
                    category: pair.category,
                    chartOfAccount: pair.chartOfAccount,
                    sheets: [...pair.sheets],
                }))
                .sort(
                    (a, b) =>
                        a.category.localeCompare(b.category) ||
                        a.chartOfAccount.localeCompare(b.chartOfAccount),
                ),
        });
    }

    function handleExtractUniqueItems() {
        if (!_workbook) {
            return;
        }

        const itemMap = new Map<
            string,
            {
                description: string;
                category: string;
                chartOfAccount: string;
                unit_of_measurement: string;
                price: number | null;
                sheets: Set<string>;
            }
        >();

        for (const sheet of selectedSheets) {
            const ws = _workbook.getWorksheet(sheet);

            if (!ws) {
                continue;
            }

            const config = sheetConfigs[sheet] ?? defaultConfig;
            const effective = config.useCustom ? config : defaultConfig;
            const result = extractData({
                worksheet: ws,
                startRow: effective.startRow,
                endRow: effective.endRow,
                columnMap: effective.columnMap,
            });

            for (const item of result.items) {
                const key = `${normalize(item.description)}|${normalize(item.category)}|${normalize(item.chartOfAccount)}`;

                if (!itemMap.has(key)) {
                    itemMap.set(key, {
                        description: item.description,
                        category: item.category,
                        chartOfAccount: item.chartOfAccount,
                        unit_of_measurement: item.unitOfMeasurement,
                        price: item.price,
                        sheets: new Set(),
                    });
                }

                itemMap.get(key)!.sheets.add(sheet);
            }
        }

        setUniqueItems(
            [...itemMap.values()]
                .map((item) => ({
                    description: item.description,
                    category: item.category,
                    chartOfAccount: item.chartOfAccount,
                    unit_of_measurement: item.unit_of_measurement,
                    price: item.price,
                    sheets: [...item.sheets],
                }))
                .sort(
                    (a, b) =>
                        a.description.localeCompare(b.description) ||
                        a.category.localeCompare(b.category) ||
                        a.chartOfAccount.localeCompare(b.chartOfAccount),
                ),
        );
    }

    function handleExtractQuantities() {
        if (!_workbook || selectedSheets.length === 0) {
            return;
        }

        const ws = _workbook.getWorksheet(selectedSheets[0]);

        if (!ws) {
            return;
        }

        const rows = extractQuantities({
            worksheet: ws,
            startRow: quantitiesConfig.startRow,
            endRow: quantitiesConfig.endRow,
            columnMap: quantitiesConfig.columns,
        });

        setQuantityRows(rows);
    }

    function handleCheckDbMatches() {
        if (!quantityRows) {
            return;
        }

        const matches: Record<number, { itemId: number | null }> = {};

        for (const row of quantityRows) {
            const item = priceListItems.find(
                (p) => normalize(p.description) === normalize(row.description),
            );

            matches[row.tempId] = { itemId: item?.id ?? null };
        }

        setQuantityMatches(matches);
        setQuantityChecked(true);
    }

    function handleConfirmImport() {
        if (!importPlan || importPlan.items.length === 0 || importing) {
            return;
        }

        setImporting(true);

        router.post(
            '/price-list-import' as const,
            { items: importPlan.items } as never,
            {
                onSuccess: () => setImportDialogOpen(false),
                onFinish: () => setImporting(false),
            },
        );
    }

    function handleConfirmImportQuantities() {
        if (
            !quantityImportPlan ||
            quantityImportPlan.rows.length === 0 ||
            quantityImporting
        ) {
            return;
        }

        setQuantityImporting(true);

        router.post(
            '/price-list-import/quantities' as const,
            {
                fiscal_year_id: targetFiscalYearId,
                ppa_id: targetPpaId,
                funding_source_id: targetFundingSourceId,
                rows: quantityImportPlan.rows,
            } as never,
            {
                onSuccess: () => setQuantityImportDialogOpen(false),
                onFinish: () => setQuantityImporting(false),
            },
        );
    }

    function handleMapResolved() {
        if (!extracted) {
            return;
        }

        const mapped = extracted.pairs.map((pair) => {
            const catId =
                manualCat[pair.category] ??
                catLookup.get(normalize(pair.category));
            const coaId =
                manualCoa[pair.chartOfAccount] ??
                coaLookup.get(normalize(pair.chartOfAccount));

            return {
                category: pair.category,
                chartOfAccount: pair.chartOfAccount,
                categoryId: catId ?? null,
                coaId: coaId ?? null,
                resolvedCategory: catId
                    ? (idToCatName.get(catId) ?? null)
                    : null,
                resolvedCoa: coaId ? (idToCoaTitle.get(coaId) ?? null) : null,
            };
        });

        setMappedPairs(mapped);
    }

    function normalize(str: string) {
        return str.trim().toLowerCase();
    }

    function handleRefetch() {
        if (refetching) {
            return;
        }

        setRefetching(true);

        router.reload({
            onFinish: () => setRefetching(false),
        });
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
                    <FieldLabel>Import Route</FieldLabel>
                    <div className="flex gap-2">
                        <Button
                            variant={
                                mode === 'price-list' ? 'default' : 'outline'
                            }
                            onClick={() => handleModeChange('price-list')}
                        >
                            Price List Import
                        </Button>
                        <Button
                            variant={
                                mode === 'quantities' ? 'default' : 'outline'
                            }
                            onClick={() => handleModeChange('quantities')}
                        >
                            Monthly Quantities
                        </Button>
                    </div>
                </Field>
            )}

            {mode === 'quantities' && !confirmed && (
                <p className="mt-2 text-sm text-muted-foreground">
                    Monthly Quantities import is coming next. This path will
                    import the monthly quantities from the Excel into the PPMP
                    table for a specific PPA, funding source, and fiscal year.
                </p>
            )}

            {mode && sheets.length > 0 && (
                <Field>
                    <FieldLabel>Sheets</FieldLabel>
                    {mode === 'quantities' && (
                        <FieldDescription>Select one sheet.</FieldDescription>
                    )}
                    <ToggleGroup
                        multiple={mode !== 'quantities'}
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

            {mode === 'quantities' &&
                confirmed &&
                selectedSheets.length > 0 && (
                    <div className="mt-4 space-y-4">
                        <p className="text-sm">
                            Confirmed sheet:{' '}
                            <span className="font-medium">
                                {selectedSheets[0]}
                            </span>
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmed(false)}
                        >
                            ← Change sheet selection
                        </Button>

                        <div className="rounded-lg border p-4">
                            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                                Target
                            </h3>
                            <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
                                <Field>
                                    <FieldLabel>Fiscal Year</FieldLabel>
                                    <Select
                                        value={
                                            targetFiscalYearId
                                                ? String(targetFiscalYearId)
                                                : ''
                                        }
                                        onValueChange={(v) => {
                                            setTargetFiscalYearId(
                                                v ? Number(v) : null,
                                            );
                                            setTargetPpaId(null);
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select fiscal year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {fiscalYears.map((fy) => (
                                                    <SelectItem
                                                        key={fy.id}
                                                        value={String(fy.id)}
                                                    >
                                                        {fy.year}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field>
                                    <FieldLabel>PPA</FieldLabel>
                                    <Combobox
                                        items={ppaComboboxItems}
                                        value={
                                            targetPpaId
                                                ? `ppa:${ppas.find((p) => p.id === targetPpaId)?.name ?? ''}`
                                                : ''
                                        }
                                        onValueChange={(v) => {
                                            if (!v) {
                                                setTargetPpaId(null);

                                                return;
                                            }

                                            const name = v.replace(
                                                /^[^:]+:/,
                                                '',
                                            );
                                            const ppa = ppas.find(
                                                (p) =>
                                                    p.fiscal_year_id ===
                                                        targetFiscalYearId &&
                                                    p.name === name,
                                            );

                                            if (ppa) {
                                                setTargetPpaId(ppa.id);
                                            }
                                        }}
                                    >
                                        <ComboboxInput
                                            placeholder="Select PPA..."
                                            showClear
                                            disabled={!targetFiscalYearId}
                                        />
                                        <ComboboxContent>
                                            <ComboboxEmpty>
                                                {targetFiscalYearId
                                                    ? 'No PPA found.'
                                                    : 'Select a fiscal year first.'}
                                            </ComboboxEmpty>
                                            <ComboboxList>
                                                {(item) => (
                                                    <ComboboxItem
                                                        key={item}
                                                        value={item}
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
                                </Field>
                            <Field>
                                <FieldLabel>Funding Source</FieldLabel>
                                <Select
                                    value={
                                        targetFundingSourceId
                                            ? String(targetFundingSourceId)
                                            : ''
                                    }
                                    onValueChange={(v) =>
                                        setTargetFundingSourceId(
                                            v ? Number(v) : null,
                                        )
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select funding source" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {fundingSources.map((fs) => (
                                                <SelectItem
                                                    key={fs.id}
                                                    value={String(fs.id)}
                                                >
                                                    [{fs.code}] {fs.title}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </Field>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Resolved target:{' '}
                                {targetFiscalYearId &&
                                targetPpaId &&
                                targetFundingSourceId
                                    ? `${fiscalYears.find((fy) => fy.id === targetFiscalYearId)?.year ?? '—'} — ${ppas.find((p) => p.id === targetPpaId)?.name ?? '—'} — [${fundingSources.find((fs) => fs.id === targetFundingSourceId)?.code ?? '—'}]`
                                    : '—'}
                            </p>
                        </div>

                        <div className="rounded-lg border p-4">
                            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                                Calibration
                            </h3>
                            <div className="flex gap-4">
                                <Field>
                                    <FieldLabel>Start Row</FieldLabel>
                                    <Input
                                        type="number"
                                        value={quantitiesConfig.startRow}
                                        onChange={(e) =>
                                            setQuantitiesConfig((prev) => ({
                                                ...prev,
                                                startRow: Number(
                                                    e.target.value,
                                                ),
                                            }))
                                        }
                                        className="w-20"
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel>End Row</FieldLabel>
                                    <Input
                                        type="number"
                                        value={quantitiesConfig.endRow ?? ''}
                                        onChange={(e) =>
                                            setQuantitiesConfig((prev) => ({
                                                ...prev,
                                                endRow: e.target.value
                                                    ? Number(e.target.value)
                                                    : undefined,
                                            }))
                                        }
                                        className="w-20"
                                    />
                                </Field>
                            </div>
                            <div className="mt-4 grid grid-cols-6 gap-2">
                                <Field>
                                    <FieldLabel>Category</FieldLabel>
                                    <Input
                                        value={quantitiesConfig.columns.category}
                                        onChange={(e) =>
                                            setQuantitiesConfig((prev) => ({
                                                ...prev,
                                                columns: {
                                                    ...prev.columns,
                                                    category:
                                                        e.target.value.toUpperCase(),
                                                },
                                            }))
                                        }
                                        className="w-16"
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel>Chart of Account</FieldLabel>
                                    <Input
                                        value={
                                            quantitiesConfig.columns
                                                .chartOfAccount
                                        }
                                        onChange={(e) =>
                                            setQuantitiesConfig((prev) => ({
                                                ...prev,
                                                columns: {
                                                    ...prev.columns,
                                                    chartOfAccount:
                                                        e.target.value.toUpperCase(),
                                                },
                                            }))
                                        }
                                        className="w-16"
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel>Description</FieldLabel>
                                    <Input
                                        value={
                                            quantitiesConfig.columns.description
                                        }
                                        onChange={(e) =>
                                            setQuantitiesConfig((prev) => ({
                                                ...prev,
                                                columns: {
                                                    ...prev.columns,
                                                    description:
                                                        e.target.value.toUpperCase(),
                                                },
                                            }))
                                        }
                                        className="w-16"
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel>Total</FieldLabel>
                                    <Input
                                        value={quantitiesConfig.columns.total}
                                        onChange={(e) =>
                                            setQuantitiesConfig((prev) => ({
                                                ...prev,
                                                columns: {
                                                    ...prev.columns,
                                                    total: e.target.value.toUpperCase(),
                                                },
                                            }))
                                        }
                                        className="w-16"
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel>Unit</FieldLabel>
                                    <Input
                                        value={quantitiesConfig.columns.unit}
                                        onChange={(e) =>
                                            setQuantitiesConfig((prev) => ({
                                                ...prev,
                                                columns: {
                                                    ...prev.columns,
                                                    unit: e.target.value.toUpperCase(),
                                                },
                                            }))
                                        }
                                        className="w-16"
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel>Price</FieldLabel>
                                    <Input
                                        value={quantitiesConfig.columns.price}
                                        onChange={(e) =>
                                            setQuantitiesConfig((prev) => ({
                                                ...prev,
                                                columns: {
                                                    ...prev.columns,
                                                    price: e.target.value.toUpperCase(),
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
                                    {monthlyQtyColumns.map(([key, label]) => (
                                        <Field key={key}>
                                            <FieldLabel>{label}</FieldLabel>
                                            <Input
                                                value={
                                                    quantitiesConfig.columns[
                                                        key
                                                    ]
                                                }
                                                onChange={(e) =>
                                                    setQuantitiesConfig(
                                                        (prev) => ({
                                                            ...prev,
                                                            columns: {
                                                                ...prev.columns,
                                                                [key]: e.target.value.toUpperCase(),
                                                            },
                                                        }),
                                                    )
                                                }
                                                className="w-16"
                                            />
                                        </Field>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-4">
                                <Button onClick={handleExtractQuantities}>
                                    Extract
                                </Button>
                            </div>
                        </div>

                        {quantityRows && (
                            <div className="mt-6">
                                <div className="mb-2 flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-muted-foreground">
                                        Extracted Items ({quantityRows.length})
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCheckDbMatches}
                                        >
                                            Check DB Matches
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setQuantityImportDialogOpen(
                                                    true,
                                                )
                                            }
                                            disabled={
                                                !quantityImportPlan ||
                                                quantityImportPlan.rows.length ===
                                                    0 ||
                                                quantityImportPlan.unmatched > 0 ||
                                                !targetFiscalYearId ||
                                                !targetPpaId ||
                                                !targetFundingSourceId ||
                                                quantityImporting
                                            }
                                        >
                                            {quantityImporting && <Spinner />}
                                            Import{' '}
                                            {quantityImportPlan?.rows.length ?? 0}{' '}
                                            Quantities
                                        </Button>
                                    </div>
                                </div>
                                {quantityImportPlan &&
                                    quantityImportPlan.unmatched > 0 && (
                                        <p className="mb-2 text-sm text-destructive">
                                            {quantityImportPlan.unmatched}{' '}
                                            item(s) without a DB match —
                                            resolve them before importing.
                                        </p>
                                    )}
                                {quantityImportPlan &&
                                    quantityImportPlan.skippedNoQty > 0 && (
                                        <p className="mb-2 text-sm text-muted-foreground">
                                            {quantityImportPlan.skippedNoQty}{' '}
                                            row(s) with no quantities will be
                                            skipped.
                                        </p>
                                    )}
                                <div className="max-h-96 overflow-auto rounded-md border">
                                    <Table>
                                        <TableHeader className="sticky top-0 z-10 bg-background">
                                            <TableRow>
                                                <TableHead>
                                                    Description
                                                </TableHead>
                                                <TableHead>Category</TableHead>
                                                <TableHead>
                                                    Chart of Account
                                                </TableHead>
                                                <TableHead>Unit</TableHead>
                                                <TableHead className="text-right">
                                                    Price
                                                </TableHead>
                                                <TableHead className="text-right">
                                                    Total
                                                </TableHead>
                                                <TableHead>In DB</TableHead>
                                                <TableHead>Match</TableHead>
                                                <TableHead>Jan</TableHead>
                                                <TableHead>Feb</TableHead>
                                                <TableHead>Mar</TableHead>
                                                <TableHead>Apr</TableHead>
                                                <TableHead>May</TableHead>
                                                <TableHead>Jun</TableHead>
                                                <TableHead>Jul</TableHead>
                                                <TableHead>Aug</TableHead>
                                                <TableHead>Sep</TableHead>
                                                <TableHead>Oct</TableHead>
                                                <TableHead>Nov</TableHead>
                                                <TableHead>Dec</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {quantityRows.map((row) => {
                                                const match =
                                                    quantityMatches[row.tempId];
                                                const matchedItem = match?.itemId
                                                    ? priceListItems.find(
                                                          (p) =>
                                                              p.id ===
                                                              match.itemId,
                                                      )
                                                    : null;

                                                return (
                                                <TableRow key={row.tempId}>
                                                    <TableCell className="max-w-64 truncate">
                                                        {row.description}
                                                    </TableCell>
                                                    <TableCell className="max-w-40 truncate">
                                                        {row.category}
                                                    </TableCell>
                                                    <TableCell className="max-w-48 truncate">
                                                        {row.chartOfAccount}
                                                    </TableCell>
                                                    <TableCell>
                                                        {row.unitOfMeasurement}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {row.price ?? '—'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {row.total ?? '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {!quantityChecked ? (
                                                            <span className="text-muted-foreground">
                                                                —
                                                            </span>
                                                        ) : match?.itemId ? (
                                                            <HoverCard>
                                                                <HoverCardTrigger
                                                                    render={
                                                                        <span className="cursor-pointer text-emerald-600">
                                                                            ✓
                                                                            exists
                                                                        </span>
                                                                    }
                                                                />
                                                                <HoverCardContent>
                                                                    {matchedItem
                                                                        ? `${matchedItem.description}\n${matchedItem.unit_of_measurement} — ${matchedItem.price}`
                                                                        : ''}
                                                                </HoverCardContent>
                                                            </HoverCard>
                                                        ) : (
                                                            <span className="text-amber-600">
                                                                ✗ new
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Combobox
                                                            items={
                                                                pliComboboxItems
                                                            }
                                                            value={
                                                                matchedItem
                                                                    ? `pli:${matchedItem.description}`
                                                                    : ''
                                                            }
                                                            onValueChange={(
                                                                v,
                                                            ) => {
                                                                setQuantityMatches(
                                                                    (prev) => {
                                                                        const next =
                                                                            {
                                                                                ...prev,
                                                                            };

                                                                        if (
                                                                            !v
                                                                        ) {
                                                                            next[
                                                                                row.tempId
                                                                            ] = {
                                                                                itemId: null,
                                                                            };
                                                                            return next;
                                                                        }

                                                                        const name =
                                                                            v.replace(
                                                                                /^[^:]+:/,
                                                                                '',
                                                                            );
                                                                        const dbItem =
                                                                            priceListItems.find(
                                                                                (
                                                                                    p,
                                                                                ) =>
                                                                                    p.description ===
                                                                                    name,
                                                                            );

                                                                        if (
                                                                            dbItem
                                                                        ) {
                                                                            next[
                                                                                row.tempId
                                                                            ] = {
                                                                                itemId: dbItem.id,
                                                                            };
                                                                        }

                                                                        return next;
                                                                    },
                                                                );
                                                            }}
                                                        >
                                                            <ComboboxInput
                                                                placeholder="Search price list item..."
                                                                showClear
                                                            />
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
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {row.janQty ?? ''}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {row.febQty ?? ''}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {row.marQty ?? ''}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {row.aprQty ?? ''}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {row.mayQty ?? ''}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {row.junQty ?? ''}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {row.julQty ?? ''}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {row.augQty ?? ''}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {row.sepQty ?? ''}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {row.octQty ?? ''}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {row.novQty ?? ''}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {row.decQty ?? ''}
                                                    </TableCell>
                                                </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}

                        <Dialog
                            open={quantityImportDialogOpen}
                            onOpenChange={setQuantityImportDialogOpen}
                        >
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        Confirm Quantity Import
                                    </DialogTitle>
                                    <DialogDescription>
                                        You're about to import{' '}
                                        {quantityImportPlan?.rows.length ?? 0}{' '}
                                        monthly quantity row(s) for{' '}
                                        {targetFiscalYearId &&
                                        targetPpaId &&
                                        targetFundingSourceId
                                            ? `${fiscalYears.find((fy) => fy.id === targetFiscalYearId)?.year ?? '—'} — ${ppas.find((p) => p.id === targetPpaId)?.name ?? '—'} — [${fundingSources.find((fs) => fs.id === targetFundingSourceId)?.code ?? '—'}]`
                                            : 'the selected target'}
                                        . Existing monthly quantities for
                                        matched items will be overwritten.
                                    </DialogDescription>
                                </DialogHeader>
                                {quantityImportPlan &&
                                    quantityImportPlan.skippedNoQty > 0 && (
                                        <div className="space-y-1 text-sm text-muted-foreground">
                                            Skipped:
                                            <p>
                                                {quantityImportPlan.skippedNoQty}{' '}
                                                — no monthly quantities
                                            </p>
                                        </div>
                                    )}
                                <DialogFooter>
                                    <DialogClose
                                        render={
                                            <Button variant="outline">
                                                Cancel
                                            </Button>
                                        }
                                    />
                                    <Button
                                        onClick={handleConfirmImportQuantities}
                                        disabled={
                                            !quantityImportPlan ||
                                            quantityImportPlan.rows.length ===
                                                0 ||
                                            quantityImporting
                                        }
                                    >
                                        {quantityImporting
                                            ? 'Importing...'
                                            : 'Confirm'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}

            {mode === 'price-list' &&
                confirmed &&
                selectedSheets.length > 0 && (
                    <div className="mt-4 space-y-4">
                        <Field>
                            <FieldLabel>Sheet to calibrate</FieldLabel>
                            <Select
                                value={calibratingSheet}
                                onValueChange={(v) =>
                                    v && setCalibratingSheet(v)
                                }
                            >
                                <SelectTrigger className="w-60">
                                    <SelectValue placeholder="Select sheet" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {selectedSheets.map((sheet) => (
                                            <SelectItem
                                                key={sheet}
                                                value={sheet}
                                            >
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
                                                        ...prev[
                                                            calibratingSheet
                                                        ],
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
                                        !sheetConfigs[calibratingSheet]
                                            .useCustom
                                    }
                                >
                                    <div className="mt-4 flex gap-4">
                                        <Field>
                                            <FieldLabel>Start Row</FieldLabel>
                                            <Input
                                                type="number"
                                                value={
                                                    sheetConfigs[
                                                        calibratingSheet
                                                    ].startRow
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
                                                    sheetConfigs[
                                                        calibratingSheet
                                                    ].endRow ?? ''
                                                }
                                                onChange={(e) =>
                                                    setSheetConfigs((prev) => ({
                                                        ...prev,
                                                        [calibratingSheet]: {
                                                            ...prev[
                                                                calibratingSheet
                                                            ],
                                                            endRow: e.target
                                                                .value
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
                                                    sheetConfigs[
                                                        calibratingSheet
                                                    ].columnMap.chartOfAccount
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
                                                    sheetConfigs[
                                                        calibratingSheet
                                                    ].columnMap.itemNumber
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
                                                    sheetConfigs[
                                                        calibratingSheet
                                                    ].columnMap.category
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
                                                    sheetConfigs[
                                                        calibratingSheet
                                                    ].columnMap.description
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
                                                    sheetConfigs[
                                                        calibratingSheet
                                                    ].columnMap.unit
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
                                                    sheetConfigs[
                                                        calibratingSheet
                                                    ].columnMap.price
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
                                                        setSheetConfigs(
                                                            (prev) => ({
                                                                ...prev,
                                                                [calibratingSheet]:
                                                                    {
                                                                        ...prev[
                                                                            calibratingSheet
                                                                        ],
                                                                        columnMap:
                                                                            {
                                                                                ...prev[
                                                                                    calibratingSheet
                                                                                ]
                                                                                    .columnMap,
                                                                                janQty: e.target.value.toUpperCase(),
                                                                            },
                                                                    },
                                                            }),
                                                        )
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
                                                        setSheetConfigs(
                                                            (prev) => ({
                                                                ...prev,
                                                                [calibratingSheet]:
                                                                    {
                                                                        ...prev[
                                                                            calibratingSheet
                                                                        ],
                                                                        columnMap:
                                                                            {
                                                                                ...prev[
                                                                                    calibratingSheet
                                                                                ]
                                                                                    .columnMap,
                                                                                febQty: e.target.value.toUpperCase(),
                                                                            },
                                                                    },
                                                            }),
                                                        )
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
                                                        setSheetConfigs(
                                                            (prev) => ({
                                                                ...prev,
                                                                [calibratingSheet]:
                                                                    {
                                                                        ...prev[
                                                                            calibratingSheet
                                                                        ],
                                                                        columnMap:
                                                                            {
                                                                                ...prev[
                                                                                    calibratingSheet
                                                                                ]
                                                                                    .columnMap,
                                                                                marQty: e.target.value.toUpperCase(),
                                                                            },
                                                                    },
                                                            }),
                                                        )
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
                                                        setSheetConfigs(
                                                            (prev) => ({
                                                                ...prev,
                                                                [calibratingSheet]:
                                                                    {
                                                                        ...prev[
                                                                            calibratingSheet
                                                                        ],
                                                                        columnMap:
                                                                            {
                                                                                ...prev[
                                                                                    calibratingSheet
                                                                                ]
                                                                                    .columnMap,
                                                                                aprQty: e.target.value.toUpperCase(),
                                                                            },
                                                                    },
                                                            }),
                                                        )
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
                                                        setSheetConfigs(
                                                            (prev) => ({
                                                                ...prev,
                                                                [calibratingSheet]:
                                                                    {
                                                                        ...prev[
                                                                            calibratingSheet
                                                                        ],
                                                                        columnMap:
                                                                            {
                                                                                ...prev[
                                                                                    calibratingSheet
                                                                                ]
                                                                                    .columnMap,
                                                                                mayQty: e.target.value.toUpperCase(),
                                                                            },
                                                                    },
                                                            }),
                                                        )
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
                                                        setSheetConfigs(
                                                            (prev) => ({
                                                                ...prev,
                                                                [calibratingSheet]:
                                                                    {
                                                                        ...prev[
                                                                            calibratingSheet
                                                                        ],
                                                                        columnMap:
                                                                            {
                                                                                ...prev[
                                                                                    calibratingSheet
                                                                                ]
                                                                                    .columnMap,
                                                                                junQty: e.target.value.toUpperCase(),
                                                                            },
                                                                    },
                                                            }),
                                                        )
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
                                                        setSheetConfigs(
                                                            (prev) => ({
                                                                ...prev,
                                                                [calibratingSheet]:
                                                                    {
                                                                        ...prev[
                                                                            calibratingSheet
                                                                        ],
                                                                        columnMap:
                                                                            {
                                                                                ...prev[
                                                                                    calibratingSheet
                                                                                ]
                                                                                    .columnMap,
                                                                                julQty: e.target.value.toUpperCase(),
                                                                            },
                                                                    },
                                                            }),
                                                        )
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
                                                        setSheetConfigs(
                                                            (prev) => ({
                                                                ...prev,
                                                                [calibratingSheet]:
                                                                    {
                                                                        ...prev[
                                                                            calibratingSheet
                                                                        ],
                                                                        columnMap:
                                                                            {
                                                                                ...prev[
                                                                                    calibratingSheet
                                                                                ]
                                                                                    .columnMap,
                                                                                augQty: e.target.value.toUpperCase(),
                                                                            },
                                                                    },
                                                            }),
                                                        )
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
                                                        setSheetConfigs(
                                                            (prev) => ({
                                                                ...prev,
                                                                [calibratingSheet]:
                                                                    {
                                                                        ...prev[
                                                                            calibratingSheet
                                                                        ],
                                                                        columnMap:
                                                                            {
                                                                                ...prev[
                                                                                    calibratingSheet
                                                                                ]
                                                                                    .columnMap,
                                                                                sepQty: e.target.value.toUpperCase(),
                                                                            },
                                                                    },
                                                            }),
                                                        )
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
                                                        setSheetConfigs(
                                                            (prev) => ({
                                                                ...prev,
                                                                [calibratingSheet]:
                                                                    {
                                                                        ...prev[
                                                                            calibratingSheet
                                                                        ],
                                                                        columnMap:
                                                                            {
                                                                                ...prev[
                                                                                    calibratingSheet
                                                                                ]
                                                                                    .columnMap,
                                                                                octQty: e.target.value.toUpperCase(),
                                                                            },
                                                                    },
                                                            }),
                                                        )
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
                                                        setSheetConfigs(
                                                            (prev) => ({
                                                                ...prev,
                                                                [calibratingSheet]:
                                                                    {
                                                                        ...prev[
                                                                            calibratingSheet
                                                                        ],
                                                                        columnMap:
                                                                            {
                                                                                ...prev[
                                                                                    calibratingSheet
                                                                                ]
                                                                                    .columnMap,
                                                                                novQty: e.target.value.toUpperCase(),
                                                                            },
                                                                    },
                                                            }),
                                                        )
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
                                                        setSheetConfigs(
                                                            (prev) => ({
                                                                ...prev,
                                                                [calibratingSheet]:
                                                                    {
                                                                        ...prev[
                                                                            calibratingSheet
                                                                        ],
                                                                        columnMap:
                                                                            {
                                                                                ...prev[
                                                                                    calibratingSheet
                                                                                ]
                                                                                    .columnMap,
                                                                                decQty: e.target.value.toUpperCase(),
                                                                            },
                                                                    },
                                                            }),
                                                        )
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
                            <Button
                                variant="outline"
                                onClick={handleExtractCoaAndCategory}
                            >
                                Extract COA and Category
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleMapResolved}
                                disabled={!extracted}
                            >
                                Map Resolved
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleExtractUniqueItems}
                                disabled={!mappedPairs}
                            >
                                Show Unique Items
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleRefetch}
                                disabled={refetching}
                            >
                                {refetching && <Spinner />}
                                Refetch DB Data
                            </Button>
                        </div>

                        {extracted && (
                            <>
                                <div className="mt-6 grid grid-cols-2 gap-6">
                                    <div className="order-1">
                                        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                                            Categories (
                                            {extracted.categories.length})
                                        </h3>
                                        <div className="max-h-80 overflow-y-auto rounded-md border">
                                            <Table>
                                                <TableHeader className="sticky top-0 z-10 bg-background">
                                                    <TableRow>
                                                        <TableHead>
                                                            Category
                                                        </TableHead>
                                                        <TableHead className="text-right">
                                                            Sheets
                                                        </TableHead>
                                                        <TableHead>
                                                            Map to DB
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {extracted.categories.map(
                                                        (cat) => {
                                                            const autoId =
                                                                catLookup.get(
                                                                    normalize(
                                                                        cat.name,
                                                                    ),
                                                                );
                                                            const currentId =
                                                                manualCat[
                                                                    cat.name
                                                                ] ?? autoId;
                                                            const currentName =
                                                                currentId
                                                                    ? idToCatName.get(
                                                                          currentId,
                                                                      )
                                                                    : undefined;
                                                            const comboboxValue =
                                                                currentName
                                                                    ? `cat:${currentName}`
                                                                    : '';

                                                            return (
                                                                <TableRow
                                                                    key={
                                                                        cat.name
                                                                    }
                                                                >
                                                                    <TableCell className="max-w-64 truncate">
                                                                        {
                                                                            cat.name
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        <HoverCard>
                                                                            <HoverCardTrigger
                                                                                render={
                                                                                    <span className="cursor-pointer text-xs text-muted-foreground">
                                                                                        {
                                                                                            cat
                                                                                                .sheets
                                                                                                .length
                                                                                        }

                                                                                        /
                                                                                        {
                                                                                            selectedSheets.length
                                                                                        }
                                                                                    </span>
                                                                                }
                                                                            />
                                                                            <HoverCardContent>
                                                                                {cat
                                                                                    .sheets
                                                                                    .length ===
                                                                                selectedSheets.length
                                                                                    ? `Appears in ${cat.sheets.length} — all sheets`
                                                                                    : `Appears in: ${cat.sheets.join(', ')}`}
                                                                            </HoverCardContent>
                                                                        </HoverCard>
                                                                    </TableCell>
                                                                    <TableCell>
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
                                                                                if (
                                                                                    !v
                                                                                ) {
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

                                                                                if (
                                                                                    id
                                                                                ) {
                                                                                    setManualCat(
                                                                                        (
                                                                                            prev,
                                                                                        ) => ({
                                                                                            ...prev,
                                                                                            [cat.name]:
                                                                                                id,
                                                                                        }),
                                                                                    );
                                                                                }
                                                                            }}
                                                                        >
                                                                            <ComboboxInput placeholder="Search category..." />
                                                                            <ComboboxContent>
                                                                                <ComboboxEmpty>
                                                                                    No
                                                                                    items
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
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        },
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                    <div className="order-2">
                                        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                                            COAs (
                                            {extracted.chartOfAccounts.length})
                                        </h3>
                                        <div className="max-h-80 overflow-y-auto rounded-md border">
                                            <Table>
                                                <TableHeader className="sticky top-0 z-10 bg-background">
                                                    <TableRow>
                                                        <TableHead>
                                                            Chart of Account
                                                        </TableHead>
                                                        <TableHead className="text-right">
                                                            Sheets
                                                        </TableHead>
                                                        <TableHead>
                                                            Map to DB
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {extracted.chartOfAccounts.map(
                                                        (coa) => {
                                                            const autoId =
                                                                coaLookup.get(
                                                                    normalize(
                                                                        coa.name,
                                                                    ),
                                                                );
                                                            const currentId =
                                                                manualCoa[
                                                                    coa.name
                                                                ] ?? autoId;
                                                            const currentTitle =
                                                                currentId
                                                                    ? idToCoaTitle.get(
                                                                          currentId,
                                                                      )
                                                                    : undefined;
                                                            const comboboxValue =
                                                                currentTitle
                                                                    ? `coa:${currentTitle}`
                                                                    : '';

                                                            return (
                                                                <TableRow
                                                                    key={
                                                                        coa.name
                                                                    }
                                                                >
                                                                    <TableCell className="max-w-64 truncate">
                                                                        {
                                                                            coa.name
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        <HoverCard>
                                                                            <HoverCardTrigger
                                                                                render={
                                                                                    <span className="cursor-pointer text-xs text-muted-foreground">
                                                                                        {
                                                                                            coa
                                                                                                .sheets
                                                                                                .length
                                                                                        }

                                                                                        /
                                                                                        {
                                                                                            selectedSheets.length
                                                                                        }
                                                                                    </span>
                                                                                }
                                                                            />
                                                                            <HoverCardContent>
                                                                                {coa
                                                                                    .sheets
                                                                                    .length ===
                                                                                selectedSheets.length
                                                                                    ? `Appears in ${coa.sheets.length} — all sheets`
                                                                                    : `Appears in: ${coa.sheets.join(', ')}`}
                                                                            </HoverCardContent>
                                                                        </HoverCard>
                                                                    </TableCell>
                                                                    <TableCell>
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
                                                                                if (
                                                                                    !v
                                                                                ) {
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

                                                                                if (
                                                                                    id
                                                                                ) {
                                                                                    setManualCoa(
                                                                                        (
                                                                                            prev,
                                                                                        ) => ({
                                                                                            ...prev,
                                                                                            [coa.name]:
                                                                                                id,
                                                                                        }),
                                                                                    );
                                                                                }
                                                                            }}
                                                                        >
                                                                            <ComboboxInput placeholder="Search chart of account..." />
                                                                            <ComboboxContent>
                                                                                <ComboboxEmpty>
                                                                                    No
                                                                                    items
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
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        },
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                                        Category ↔ COA Pairs (
                                        {extracted.pairs.length})
                                    </h3>
                                    <div className="max-h-80 overflow-y-auto rounded-md border">
                                        <Table>
                                            <TableHeader className="sticky top-0 z-10 bg-background">
                                                <TableRow>
                                                    <TableHead>
                                                        Category
                                                    </TableHead>
                                                    <TableHead>
                                                        Chart of Account
                                                    </TableHead>
                                                    <TableHead className="text-right">
                                                        Sheets
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {extracted.pairs.map((pair) => (
                                                    <TableRow
                                                        key={`${pair.category}|${pair.chartOfAccount}`}
                                                    >
                                                        <TableCell className="max-w-40 truncate">
                                                            {pair.category}
                                                        </TableCell>
                                                        <TableCell className="max-w-48 truncate">
                                                            {
                                                                pair.chartOfAccount
                                                            }
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <HoverCard>
                                                                <HoverCardTrigger
                                                                    render={
                                                                        <span className="cursor-pointer text-xs text-muted-foreground">
                                                                            {
                                                                                pair
                                                                                    .sheets
                                                                                    .length
                                                                            }
                                                                            /
                                                                            {
                                                                                selectedSheets.length
                                                                            }
                                                                        </span>
                                                                    }
                                                                />
                                                                <HoverCardContent>
                                                                    {pair.sheets
                                                                        .length ===
                                                                    selectedSheets.length
                                                                        ? `Appears in ${pair.sheets.length} — all sheets`
                                                                        : `Appears in: ${pair.sheets.join(', ')}`}
                                                                </HoverCardContent>
                                                            </HoverCard>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </>
                        )}

                        {uniqueItems && (
                            <div className="mt-6">
                                <div className="mb-2 flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-muted-foreground">
                                        Unique Items (
                                        {hideExisting
                                            ? uniqueItems.filter((item) => {
                                                  const itemKey = `${item.description}|${item.category}|${item.chartOfAccount}`;

                                                  return (
                                                      !itemMatches[itemKey] &&
                                                      !dbDescriptionSet.has(
                                                          normalize(
                                                              item.description,
                                                          ),
                                                      )
                                                  );
                                              }).length
                                            : uniqueItems.length}
                                        )
                                    </h3>
                                    <div className="flex items-center gap-4">
                                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                                            Hide exists
                                            <Switch
                                                checked={hideExisting}
                                                onCheckedChange={
                                                    setHideExisting
                                                }
                                                size="sm"
                                            />
                                        </label>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setImportDialogOpen(true)
                                            }
                                            disabled={
                                                !importPlan ||
                                                importPlan.items.length === 0 ||
                                                importing
                                            }
                                        >
                                            {importing && <Spinner />}
                                            Import{' '}
                                            {importPlan?.items.length ?? 0} New
                                            Items
                                        </Button>
                                    </div>
                                </div>
                                <div className="max-h-80 overflow-y-auto rounded-md border">
                                    <Table>
                                        <TableHeader className="sticky top-0 z-10 bg-background">
                                            <TableRow>
                                                <TableHead>
                                                    Description
                                                </TableHead>
                                                <TableHead>Category</TableHead>
                                                <TableHead>
                                                    Chart of Account
                                                </TableHead>
                                                <TableHead className="text-right">
                                                    Sheets
                                                </TableHead>
                                                <TableHead>In DB</TableHead>
                                                <TableHead>Match</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {uniqueItems
                                                .filter((item) => {
                                                    if (!hideExisting) {
                                                        return true;
                                                    }

                                                    const itemKey = `${item.description}|${item.category}|${item.chartOfAccount}`;

                                                    return (
                                                        !itemMatches[itemKey] &&
                                                        !dbDescriptionSet.has(
                                                            normalize(
                                                                item.description,
                                                            ),
                                                        )
                                                    );
                                                })
                                                .map((item) => {
                                                    const itemKey = `${item.description}|${item.category}|${item.chartOfAccount}`;
                                                    const matchedId =
                                                        itemMatches[itemKey];
                                                    const matchedItem =
                                                        matchedId
                                                            ? pliById.get(
                                                                  matchedId,
                                                              )
                                                            : null;
                                                    const exactInDb =
                                                        dbDescriptionSet.has(
                                                            normalize(
                                                                item.description,
                                                            ),
                                                        );
                                                    const inDb = matchedId
                                                        ? true
                                                        : exactInDb;
                                                    const comboboxValue =
                                                        matchedItem
                                                            ? `pli:${matchedItem.description}`
                                                            : exactInDb
                                                              ? `pli:${item.description}`
                                                              : '';

                                                    return (
                                                        <TableRow key={itemKey}>
                                                            <TableCell className="max-w-64 truncate">
                                                                {
                                                                    item.description
                                                                }
                                                            </TableCell>
                                                            <TableCell className="max-w-40 truncate">
                                                                {item.category}
                                                            </TableCell>
                                                            <TableCell className="max-w-48 truncate">
                                                                {
                                                                    item.chartOfAccount
                                                                }
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <HoverCard>
                                                                    <HoverCardTrigger
                                                                        render={
                                                                            <span className="cursor-pointer text-xs text-muted-foreground">
                                                                                {
                                                                                    item
                                                                                        .sheets
                                                                                        .length
                                                                                }

                                                                                /
                                                                                {
                                                                                    selectedSheets.length
                                                                                }
                                                                            </span>
                                                                        }
                                                                    />
                                                                    <HoverCardContent>
                                                                        {item
                                                                            .sheets
                                                                            .length ===
                                                                        selectedSheets.length
                                                                            ? `Appears in ${item.sheets.length} — all sheets`
                                                                            : `Appears in: ${item.sheets.join(', ')}`}
                                                                    </HoverCardContent>
                                                                </HoverCard>
                                                            </TableCell>
                                                            <TableCell>
                                                                {matchedId ? (
                                                                    <HoverCard>
                                                                        <HoverCardTrigger
                                                                            render={
                                                                                <span className="cursor-pointer text-blue-600">
                                                                                    ✓
                                                                                    matched
                                                                                </span>
                                                                            }
                                                                        />
                                                                        <HoverCardContent>
                                                                            {matchedItem
                                                                                ? `${matchedItem.description}\n${matchedItem.unit_of_measurement} — ${matchedItem.price}`
                                                                                : ''}
                                                                        </HoverCardContent>
                                                                    </HoverCard>
                                                                ) : exactInDb ? (
                                                                    <span className="text-emerald-600">
                                                                        ✓ exists
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-amber-600">
                                                                        ✗ new
                                                                    </span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Combobox
                                                                    items={
                                                                        pliComboboxItems
                                                                    }
                                                                    value={
                                                                        comboboxValue
                                                                    }
                                                                    onValueChange={(
                                                                        v,
                                                                    ) => {
                                                                        setItemMatches(
                                                                            (
                                                                                prev,
                                                                            ) => {
                                                                                const next =
                                                                                    {
                                                                                        ...prev,
                                                                                    };

                                                                                if (
                                                                                    !v
                                                                                ) {
                                                                                    delete next[
                                                                                        itemKey
                                                                                    ];

                                                                                    return next;
                                                                                }

                                                                                const name =
                                                                                    v.replace(
                                                                                        /^[^:]+:/,
                                                                                        '',
                                                                                    );
                                                                                const dbItem =
                                                                                    priceListItems.find(
                                                                                        (
                                                                                            p,
                                                                                        ) =>
                                                                                            p.description ===
                                                                                            name,
                                                                                    );

                                                                                if (
                                                                                    dbItem
                                                                                ) {
                                                                                    next[
                                                                                        itemKey
                                                                                    ] =
                                                                                        dbItem.id;
                                                                                }

                                                                                return next;
                                                                            },
                                                                        );
                                                                    }}
                                                                >
                                                                    <ComboboxInput
                                                                        placeholder="Search price list item..."
                                                                        showClear
                                                                    />
                                                                    <ComboboxContent>
                                                                        <ComboboxEmpty>
                                                                            No
                                                                            items
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
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}

                        <Dialog
                            open={importDialogOpen}
                            onOpenChange={setImportDialogOpen}
                        >
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Confirm Import</DialogTitle>
                                    <DialogDescription>
                                        You're about to import{' '}
                                        {importPlan?.items.length ?? 0} new
                                        price list item(s) into the database.
                                    </DialogDescription>
                                </DialogHeader>
                                {importPlan &&
                                    (importPlan.skippedNoMatch > 0 ||
                                        importPlan.skippedNoPrice > 0 ||
                                        importPlan.skippedMissingUnit > 0) && (
                                        <div className="space-y-1 text-sm text-muted-foreground">
                                            Skipped:
                                            {importPlan.skippedNoMatch > 0 && (
                                                <p>
                                                    {importPlan.skippedNoMatch}{' '}
                                                    — category/COA pair not in
                                                    database
                                                </p>
                                            )}
                                            {importPlan.skippedNoPrice > 0 && (
                                                <p>
                                                    {importPlan.skippedNoPrice}{' '}
                                                    — no price
                                                </p>
                                            )}
                                            {importPlan.skippedMissingUnit >
                                                0 && (
                                                <p>
                                                    {
                                                        importPlan.skippedMissingUnit
                                                    }{' '}
                                                    — no unit of measurement
                                                </p>
                                            )}
                                        </div>
                                    )}
                                <DialogFooter>
                                    <DialogClose
                                        render={
                                            <Button variant="outline">
                                                Cancel
                                            </Button>
                                        }
                                    />
                                    <Button
                                        onClick={handleConfirmImport}
                                        disabled={
                                            !importPlan ||
                                            importPlan.items.length === 0 ||
                                            importing
                                        }
                                    >
                                        {importing ? 'Importing...' : 'Confirm'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {mappedPairs && (
                            <div className="mt-6">
                                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                                    Mapped Category ↔ COA Pairs (
                                    {mappedPairs.length})
                                </h3>
                                <div className="max-h-80 overflow-y-auto rounded-md border">
                                    <Table>
                                        <TableHeader className="sticky top-0 z-10 bg-background">
                                            <TableRow>
                                                <TableHead>Category</TableHead>
                                                <TableHead>
                                                    Resolved Category
                                                </TableHead>
                                                <TableHead>
                                                    Chart of Account
                                                </TableHead>
                                                <TableHead>
                                                    Resolved COA
                                                </TableHead>
                                                <TableHead>DB Pair</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {mappedPairs.map((pair) => {
                                                const overrideKey = `${pair.category}|${pair.chartOfAccount}`;
                                                const override =
                                                    pairOverrides[overrideKey];
                                                const effCoaId =
                                                    override?.coaId ??
                                                    pair.coaId;
                                                const effCatId =
                                                    pair.categoryId;
                                                const effCoaTitle = effCoaId
                                                    ? (idToCoaTitle.get(
                                                          effCoaId,
                                                      ) ?? null)
                                                    : null;
                                                const comboboxValue =
                                                    effCoaTitle
                                                        ? `coa:${effCoaTitle}`
                                                        : '';
                                                const pairExists =
                                                    effCoaId !== null &&
                                                    effCatId !== null &&
                                                    dbPairsSet.has(
                                                        `${effCoaId}|${effCatId}`,
                                                    );
                                                const pairResolvable =
                                                    effCoaId !== null &&
                                                    effCatId !== null;

                                                return (
                                                    <TableRow key={overrideKey}>
                                                        <TableCell className="max-w-40 truncate">
                                                            {pair.category}
                                                        </TableCell>
                                                        <TableCell className="max-w-40 truncate">
                                                            {pair.resolvedCategory ??
                                                                '—'}
                                                        </TableCell>
                                                        <TableCell className="max-w-48 truncate">
                                                            {
                                                                pair.chartOfAccount
                                                            }
                                                        </TableCell>
                                                        <TableCell className="max-w-48 truncate">
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
                                                                    setPairOverrides(
                                                                        (
                                                                            prev,
                                                                        ) => {
                                                                            const next =
                                                                                {
                                                                                    ...prev,
                                                                                };

                                                                            if (
                                                                                !v
                                                                            ) {
                                                                                delete next[
                                                                                    overrideKey
                                                                                ];

                                                                                return next;
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

                                                                            if (
                                                                                id
                                                                            ) {
                                                                                next[
                                                                                    overrideKey
                                                                                ] =
                                                                                    {
                                                                                        coaId: id,
                                                                                    };
                                                                            }

                                                                            return next;
                                                                        },
                                                                    );
                                                                }}
                                                            >
                                                                <ComboboxInput
                                                                    placeholder="Search chart of account..."
                                                                    showClear
                                                                />
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
                                                            {override && (
                                                                <span className="ml-2 text-xs text-blue-600">
                                                                    custom
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {pairResolvable ? (
                                                                pairExists ? (
                                                                    <span className="text-emerald-600">
                                                                        ✓ exists
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-amber-600">
                                                                        ✗ not
                                                                        found
                                                                    </span>
                                                                )
                                                            ) : (
                                                                <span className="text-destructive">
                                                                    ⚠
                                                                    unresolvable
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
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
                                    updateColumn(
                                        'description',
                                        e.target.value,
                                    )
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

                                    console.log(
                                        '=== Category → COA Pairs ===',
                                    );
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
