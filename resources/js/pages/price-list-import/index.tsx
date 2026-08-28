import { router } from "@inertiajs/react";
import ExcelJS from "exceljs";
import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/base-ui-components/ui/badge";
import { Button } from "@/components/base-ui-components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/base-ui-components/ui/card";
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/base-ui-components/ui/combobox";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/base-ui-components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/base-ui-components/ui/field";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/base-ui-components/ui/hover-card";
import { Input } from "@/components/base-ui-components/ui/input";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/base-ui-components/ui/select";
import { Spinner } from "@/components/base-ui-components/ui/spinner";
import { Switch } from "@/components/base-ui-components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/base-ui-components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/base-ui-components/ui/toggle-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ChartOfAccount, ChartOfAccountPpmpCategory, PpmpCategory } from "@/types";
import { CalibrationPanel } from "./calibration-panel";
import type { SheetConfig } from "./calibration-panel";
import { extractData, extractQuantities, parseExcludeRows } from "./extract";
import type { ExtractResult, QuantityRow } from "./extract";
import { normalize, sanitizeCategory, sanitizeCoa } from "./normalize";

interface PriceListImportProps {
    chartOfAccounts: ChartOfAccount[];
    ppmpCategories: PpmpCategory[];
    dbPairs: ChartOfAccountPpmpCategory[];
    priceListItems: Array<{
        id: number;
        description: string;
        unit_of_measurement: string;
        price: string;
        chart_of_account_ppmp_category_id?: number;
    }>;
    fiscalYears: Array<{ id: number; year: number }>;
    ppas: Array<{
        id: number;
        name: string;
        fiscal_year_id: number | null;
    }>;
    fundingSources: Array<{ id: number; code: string; title: string }>;
}

export default function PriceListImport({
    chartOfAccounts,
    ppmpCategories,
    dbPairs,
    priceListItems,
    fiscalYears,
    ppas,
    fundingSources,
}: PriceListImportProps) {
    const [mode, setMode] = useState<"price-list" | "quantities" | null>(null);
    const [sheets, setSheets] = useState<string[]>([]);
    const [_workbook, setWorkbook] = useState<ExcelJS.Workbook | null>(null);
    const [selectedSheets, setSelectedSheets] = useState<string[]>([]);

    // --- state for price-list import flow ---
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
    const [pairOverrides, setPairOverrides] = useState<Record<string, { coaId: number | null }>>(
        {},
    );
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

    // --- state for quantities flow ---
    const [quantityRows, setQuantityRows] = useState<QuantityRow[] | null>(null);
    const [quantityMatches, setQuantityMatches] = useState<
        Record<number, { itemId: number | null }>
    >({});
    const [quantityChecked, setQuantityChecked] = useState(false);
    const [quantityImportDialogOpen, setQuantityImportDialogOpen] = useState(false);
    const [quantityImporting, setQuantityImporting] = useState(false);
    const [targetFiscalYearId, setTargetFiscalYearId] = useState<number | null>(null);
    const [targetPpaId, setTargetPpaId] = useState<number | null>(null);
    const [targetFundingSourceId, setTargetFundingSourceId] = useState<number | null>(null);

    // --- core calibration state: per-sheet configs ---
    const [calibrations, setCalibrations] = useState<Record<string, SheetConfig>>({});
    const [currentSheet, setCurrentSheet] = useState<string>("");

    // --- common UI state ---
    const [loading, setLoading] = useState(false);
    const [refetching, setRefetching] = useState(false);
    const [confirmed, setConfirmed] = useState(false);

    // Manual mappings for names that didn't auto-match
    const [manualCoa, setManualCoa] = useState<Record<string, number>>({});
    const [manualCat, setManualCat] = useState<Record<string, number>>({});

    // --- preview / report state (Spec §6, §8) ---
    const [previewRows, setPreviewRows] = useState<Array<{
        row: number;
        description: string;
        category: string;
        chartOfAccount: string;
        unit: string;
        price: number | null;
        coaLayer: "strict" | "sanitized" | null;
        catLayer: "strict" | "sanitized" | null;
        status: "success" | "warning" | "error";
        message: string;
    }> | null>(null);
    const [importReport, setImportReport] = useState<{
        total: number;
        inserted: number;
        updated: number;
        warnings: number;
        errors: number;
        warningDetails?: any[];
        errorDetails?: any[];
        status: string;
    } | null>(null);
    const [headerPreview, setHeaderPreview] = useState<
        Array<{ col: string; header: string | null; sample: string | null }>
    >([]);

    // Stepper helper — which wizard step are we on (Spec friendly)
    const wizardStep = useMemo(() => {
        if (importReport) return 4;

        if (uniqueItems && mappedPairs) return 3;

        if (extracted) return 2;

        if (confirmed) return 1;

        return 0;
    }, [confirmed, extracted, mappedPairs, uniqueItems, importReport]);

    // Calibration mode — shared (default) applies one config to all 15 sheets, per-sheet keeps old behavior
    const [calibrationMode, setCalibrationMode] = useState<"shared" | "per-sheet">("shared");
    const [sharedConfig, setSharedConfig] = useState<SheetConfig | null>(null);

    // Helper: get default config for a given mode (startRow 9 = PPMPS header fix)
    function getDefaultConfig(mode: "price-list" | "quantities"): SheetConfig {
        const commonColumns = {
            chartOfAccount: "D",
            category: "F",
            description: "F",
            unit: "G",
            price: "H",
            janQty: "K",
            febQty: "M",
            marQty: "O",
            aprQty: "Q",
            mayQty: "S",
            junQty: "U",
            julQty: "W",
            augQty: "Y",
            sepQty: "AA",
            octQty: "AC",
            novQty: "AE",
            decQty: "AG",
        };
        const defaultStart = 9;
        const defaultEnd = 1280;
        const defaultNonProc = 1258;

        const columnMap =
            mode === "price-list"
                ? ({ ...commonColumns, itemNumber: "E" } as const)
                : ({ ...commonColumns, total: "J" } as const);

        return {
            useCustom: false,
            startRow: defaultStart,
            endRow: defaultEnd,
            nonProcurementStartRow: defaultNonProc,
            columnMap,
            excludeRows: "",
        };
    }

    function resolveCoa(raw: string): { id: number | null; layer: "strict" | "sanitized" | null } {
        const n = normalize(raw);

        if (coaLookup.has(n)) return { id: coaLookup.get(n)!, layer: "strict" };

        const s = sanitizeCoa(raw);

        if (coaSanitizedLookup.has(s)) {
            return { id: coaSanitizedLookup.get(s)!, layer: "sanitized" };
        }

        if (manualCoa[raw] != null) return { id: manualCoa[raw], layer: "strict" };

        return { id: null, layer: null };
    }

    function resolveCat(raw: string): { id: number | null; layer: "strict" | "sanitized" | null } {
        const n = normalize(raw);

        if (catLookup.has(n)) return { id: catLookup.get(n)!, layer: "strict" };

        const s = sanitizeCategory(raw);

        if (catSanitizedLookup.has(s)) {
            return { id: catSanitizedLookup.get(s)!, layer: "sanitized" };
        }

        if (manualCat[raw] != null) return { id: manualCat[raw], layer: "strict" };

        return { id: null, layer: null };
    }

    // Listen for backend importReport flash (Spec §8)
    useEffect(() => {
        const off = router.on("flash", (event: any) => {
            const flash = event.detail?.flash;

            if (flash?.importReport) {
                setImportReport(flash.importReport);
            }
        });

        return () => {
            try {
                (off as any)?.();
            } catch {}
        };
    }, []);

    // Header preview refresh when sheet/calibration changes (Spec §6) — supports shared mode
    useEffect(() => {
        const hasConfig = calibrationMode === "shared" ? !!sharedConfig : !!calibrations[currentSheet];
        if (confirmed && _workbook && currentSheet && hasConfig) {
            refreshHeaderPreview();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentSheet, calibrations, sharedConfig, calibrationMode, confirmed, _workbook]);

    // --- Auto-lookup maps (stable across renders) — 2-Layer (strict + sanitized) ---
    const coaLookup = useMemo(() => {
        const m = new Map<string, number>();

        for (const coa of chartOfAccounts) {
            m.set(normalize(coa.account_title), coa.id);
            m.set(normalize(coa.account_number), coa.id);
        }

        return m;
    }, [chartOfAccounts]);

    const coaSanitizedLookup = useMemo(() => {
        const m = new Map<string, number>();

        for (const coa of chartOfAccounts) {
            m.set(sanitizeCoa(coa.account_title), coa.id);
            m.set(sanitizeCoa(coa.account_number), coa.id);
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

    const catSanitizedLookup = useMemo(() => {
        const m = new Map<string, number>();

        for (const cat of ppmpCategories) {
            m.set(sanitizeCategory(cat.name), cat.id);
        }

        return m;
    }, [ppmpCategories]);

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

    const junctionByPair = useMemo(() => {
        const m = new Map<string, number>();

        for (const pair of dbPairs) {
            // @ts-ignore - id may be present now
            if ((pair as any).id) {
                m.set(`${pair.chart_of_account_id}|${pair.ppmp_category_id}`, (pair as any).id);
            }
        }

        return m;
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

    const pliComboboxItems = useMemo(
        () => priceListItems.map((item) => `pli:${item.description}`),
        [priceListItems],
    );
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
            ppas.filter((p) => p.fiscal_year_id === targetFiscalYearId).map((p) => `ppa:${p.name}`),
        [ppas, targetFiscalYearId],
    );

    // --- Import plans (memoized) — Spec §5 Upsert + §4 2-Layer + §9 validation ---
    const importPlan = useMemo(() => {
        if (!uniqueItems) return null;

        const items: Array<{
            chart_of_account_id: number;
            ppmp_category_id: number;
            description: string;
            unit_of_measurement: string;
            price: number;
            chart_of_account_raw: string;
            ppmp_category_raw: string;
        }> = [];
        let skippedNoMatch = 0;
        let skippedNoPrice = 0;
        let skippedMissingUnit = 0;
        let warnings = 0;
        let toUpdate = 0;
        let toInsert = 0;

        for (const item of uniqueItems) {
            const itemKey = `${item.description}|${item.category}|${item.chartOfAccount}`;

            if (itemMatches[itemKey]) continue;

            const catRes =
                manualCat[item.category] != null
                    ? { id: manualCat[item.category], layer: "strict" as const }
                    : (() => {
                          const n = normalize(item.category);

                          if (catLookup.has(n)) {
                              return { id: catLookup.get(n)!, layer: "strict" as const };
                          }

                          const s = sanitizeCategory(item.category);

                          if (catSanitizedLookup.has(s)) {
                              return {
                                  id: catSanitizedLookup.get(s)!,
                                  layer: "sanitized" as const,
                              };
                          }

                          return { id: null, layer: null as any };
                      })();
            const coaRes =
                pairOverrides[`${item.category}|${item.chartOfAccount}`]?.coaId != null
                    ? {
                          id: pairOverrides[`${item.category}|${item.chartOfAccount}`]!.coaId!,
                          layer: "strict" as const,
                      }
                    : (() => {
                          const fromManual = manualCoa[item.chartOfAccount];

                          if (fromManual != null) {
                              return { id: fromManual, layer: "strict" as const };
                          }

                          const n = normalize(item.chartOfAccount);

                          if (coaLookup.has(n)) {
                              return { id: coaLookup.get(n)!, layer: "strict" as const };
                          }

                          const s = sanitizeCoa(item.chartOfAccount);

                          if (coaSanitizedLookup.has(s)) {
                              return {
                                  id: coaSanitizedLookup.get(s)!,
                                  layer: "sanitized" as const,
                              };
                          }

                          return { id: null, layer: null as any };
                      })();
            const catId = catRes.id;
            const coaId = coaRes.id;

            if (catId == null || coaId == null || !dbPairsSet.has(`${coaId}|${catId}`)) {
                skippedNoMatch++;
                continue;
            }

            if (catRes.layer === "sanitized" || coaRes.layer === "sanitized") warnings++;

            if (item.price == null || item.price <= 0) {
                skippedNoPrice++;
                continue;
            }

            if (!item.unit_of_measurement.trim()) {
                skippedMissingUnit++;
                continue;
            }

            // Upsert preview: junction + desc+UOM (Spec §5)
            const junctionId = junctionByPair.get(`${coaId}|${catId}`) ?? null;
            const exists = priceListItems.some((p) => {
                const descMatch = normalize(p.description) === normalize(item.description);
                const uomMatch =
                    normalize(p.unit_of_measurement) === normalize(item.unit_of_measurement);

                if (!descMatch || !uomMatch) return false;

                if (junctionId != null && p.chart_of_account_ppmp_category_id != null) {
                    return p.chart_of_account_ppmp_category_id === junctionId;
                }

                return true; // fallback when junction not available
            });

            if (exists) toUpdate++;
            else toInsert++;

            items.push({
                chart_of_account_id: coaId,
                ppmp_category_id: catId,
                description: item.description.trim(),
                unit_of_measurement: item.unit_of_measurement.trim(),
                price: item.price,
                chart_of_account_raw: item.chartOfAccount,
                ppmp_category_raw: item.category,
            });
        }

        return {
            items,
            skippedNoMatch,
            skippedNoPrice,
            skippedMissingUnit,
            warnings,
            toInsert,
            toUpdate,
            total: uniqueItems.length,
        };
    }, [
        uniqueItems,
        itemMatches,
        manualCat,
        catLookup,
        catSanitizedLookup,
        manualCoa,
        coaLookup,
        coaSanitizedLookup,
        pairOverrides,
        dbPairsSet,
        priceListItems,
        junctionByPair,
    ]);

    const quantityImportPlan = useMemo(() => {
        if (!quantityRows) return null;

        const monthKeys = [
            "janQty",
            "febQty",
            "marQty",
            "aprQty",
            "mayQty",
            "junQty",
            "julQty",
            "augQty",
            "sepQty",
            "octQty",
            "novQty",
            "decQty",
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

            if (qtys.every((q) => q == null || q === 0)) {
                skippedNoQty++;
                continue;
            }

            const monthQty = (key: (typeof monthKeys)[number]) => row[key] ?? 0;
            rows.push({
                ppmp_price_list_id: itemId,
                jan_qty: monthQty("janQty"),
                feb_qty: monthQty("febQty"),
                mar_qty: monthQty("marQty"),
                apr_qty: monthQty("aprQty"),
                may_qty: monthQty("mayQty"),
                jun_qty: monthQty("junQty"),
                jul_qty: monthQty("julQty"),
                aug_qty: monthQty("augQty"),
                sep_qty: monthQty("sepQty"),
                oct_qty: monthQty("octQty"),
                nov_qty: monthQty("novQty"),
                dec_qty: monthQty("decQty"),
            });
        }

        return { rows, skippedNoQty, unmatched };
    }, [quantityRows, quantityMatches]);

    // --- Reset functions ---
    function resetAllStates() {
        setExtracted(null);
        setMappedPairs(null);
        setPairOverrides({});
        setUniqueItems(null);
        setItemMatches({});
        setHideExisting(false);
        setImportDialogOpen(false);
        setImporting(false);
        setManualCoa({});
        setManualCat({});
        setCalibrations({});
        setSharedConfig(null);
        // keep calibrationMode as shared (user preference) — don't reset
        setCurrentSheet("");
        setConfirmed(false);
        setPreviewRows(null);
        setImportReport(null);
        setHeaderPreview([]);
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
    }

    // --- Event handlers ---
    async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];

        if (!file) return;

        setLoading(true);
        const wb = new ExcelJS.Workbook();
        const arrayBuffer = await file.arrayBuffer();
        await wb.xlsx.load(arrayBuffer);

        setWorkbook(wb);
        setSheets(wb.worksheets.map((ws) => ws.name));
        setMode(null);
        setSelectedSheets([]);
        resetAllStates();
        setLoading(false);
    }

    function handleSheetsChange(sheets: string[]) {
        setSelectedSheets(sheets);
        resetAllStates();
    }

    function handleModeChange(nextMode: "price-list" | "quantities") {
        resetAllStates();
        setSelectedSheets([]);
        setMode(nextMode);
    }

    function handleConfirm() {
        const modeType = mode!;
        const base = getDefaultConfig(modeType);
        // Shared mode: one config for all sheets; per-sheet still clones for backward compat
        setSharedConfig({ ...base });
        const configs: Record<string, SheetConfig> = {};
        for (const sheet of selectedSheets) {
            configs[sheet] = { ...base, columnMap: { ...base.columnMap } };
        }
        setCalibrations(configs);
        setCurrentSheet(selectedSheets[0] ?? "");
        setConfirmed(true);
        resetQuantityCycle();
    }

    function handleApplySharedToAll() {
        if (!sharedConfig) return;
        const next: Record<string, SheetConfig> = {};
        for (const sheet of selectedSheets) {
            next[sheet] = { ...sharedConfig, columnMap: { ...sharedConfig.columnMap } };
        }
        setCalibrations(next);
        toast.success(`Applied shared calibration (start row ${sharedConfig.startRow}) to all ${selectedSheets.length} sheets`);
    }

    function handleCopyCurrentToAll() {
        const src = calibrations[currentSheet];
        if (!src) return;
        const next: Record<string, SheetConfig> = {};
        for (const sheet of selectedSheets) {
            next[sheet] = { ...src, columnMap: { ...src.columnMap } };
        }
        setCalibrations(next);
        if (sharedConfig) setSharedConfig({ ...src, columnMap: { ...src.columnMap } });
        toast.success(`Copied "${currentSheet}" calibration to all ${selectedSheets.length} sheets`);
    }

    // --- Extraction functions (shared vs per-sheet) ---
    function getEffectiveConfig(sheet: string, mode: "price-list" | "quantities"): SheetConfig {
        if (calibrationMode === "shared" && sharedConfig) {
            return sharedConfig.useCustom ? sharedConfig : getDefaultConfig(mode);
        }
        const cfg = calibrations[sheet];
        return cfg?.useCustom ? cfg : getDefaultConfig(mode);
    }

    function handleExtractCoaAndCategory() {
        if (!_workbook) return;

        if (calibrationMode === "shared") {
            if (!sharedConfig) {
                toast.error(`Missing shared calibration. Please confirm selection again.`);
                return;
            }
        } else {
            for (const sheet of selectedSheets) {
                if (!calibrations[sheet]) {
                    toast.error(`Missing calibration for sheet "${sheet}". Please confirm selection again.`);
                    return;
                }
            }
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
            if (!ws) continue;
            const effective = getEffectiveConfig(sheet, "price-list");
            const result = extractData({
                worksheet: ws,
                startRow: effective.startRow,
                endRow: effective.endRow,
                nonProcurementStartRow: effective.nonProcurementStartRow!,
                columnMap: effective.columnMap as any,
                excludeRows: parseExcludeRows(effective.excludeRows),
            });

            for (const coa of result.uniqueChartOfAccounts) {
                if (!coaSheets.has(coa)) coaSheets.set(coa, new Set());
                coaSheets.get(coa)!.add(sheet);
            }
            for (const cat of result.uniqueCategories) {
                if (!catSheets.has(cat)) catSheets.set(cat, new Set());
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
                .map(([name, sheets]) => ({ name, sheets: [...sheets] }))
                .sort((a, b) => a.name.localeCompare(b.name)),
            categories: [...catSheets.entries()]
                .map(([name, sheets]) => ({ name, sheets: [...sheets] }))
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
        if (!_workbook) return;
        if (calibrationMode === "shared") {
            if (!sharedConfig) { toast.error(`Missing shared calibration.`); return; }
        } else {
            for (const sheet of selectedSheets) {
                if (!calibrations[sheet]) { toast.error(`Missing calibration for sheet "${sheet}".`); return; }
            }
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
            if (!ws) continue;
            const effective = getEffectiveConfig(sheet, "price-list");
            const result = extractData({
                worksheet: ws,
                startRow: effective.startRow,
                endRow: effective.endRow,
                nonProcurementStartRow: effective.nonProcurementStartRow!,
                columnMap: effective.columnMap as any,
                excludeRows: parseExcludeRows(effective.excludeRows),
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

        const sorted = [...itemMap.values()]
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
            );
        setUniqueItems(sorted);

        // auto-preview if mapping already done (Spec §6)
        if (mappedPairs) {
            // defer to next tick to capture updated uniqueItems
            setTimeout(() => buildPreview(sorted), 0);
        }
    }

    function handleExtractQuantities() {
        if (!_workbook || selectedSheets.length === 0) {
            return;
        }

        const sheet = selectedSheets[0];
        // shared vs per-sheet for quantities (same config type)
        const effective = calibrationMode === "shared" && sharedConfig
            ? (sharedConfig.useCustom ? sharedConfig : getDefaultConfig("quantities"))
            : (() => {
                if (!calibrations[sheet]) { toast.error(`Missing calibration for sheet "${sheet}".`); return null as any; }
                const c = calibrations[sheet];
                return c.useCustom ? c : getDefaultConfig("quantities");
            })();
        if (!effective) return;
        const ws = _workbook.getWorksheet(sheet);
        if (!ws) return;
        const rows = extractQuantities({
            worksheet: ws,
            startRow: effective.startRow,
            endRow: effective.endRow,
            nonProcurementStartRow: effective.nonProcurementStartRow!,
            columnMap: effective.columnMap as any,
            excludeRows: parseExcludeRows(effective.excludeRows),
        });

        setQuantityRows(rows);
    }

    function handleCheckDbMatches() {
        if (!quantityRows) return;

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
        if (!importPlan || importPlan.items.length === 0 || importing) return;

        setImporting(true);
        router.post("/price-list-import" as const, { items: importPlan.items } as never, {
            onSuccess: () => setImportDialogOpen(false),
            onFinish: () => setImporting(false),
        });
    }

    function handleConfirmImportQuantities() {
        if (!quantityImportPlan || quantityImportPlan.rows.length === 0 || quantityImporting) {
            return;
        }

        setQuantityImporting(true);
        router.post(
            "/price-list-import/quantities" as const,
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
        if (!extracted) return;

        const mapped = extracted.pairs.map((pair) => {
            const catRes = resolveCat(pair.category);
            const coaRes = resolveCoa(pair.chartOfAccount);
            const catId = catRes.id;
            const coaId = coaRes.id;

            return {
                category: pair.category,
                chartOfAccount: pair.chartOfAccount,
                categoryId: catId ?? null,
                coaId: coaId ?? null,
                resolvedCategory: catId ? (idToCatName.get(catId) ?? null) : null,
                resolvedCoa: coaId ? (idToCoaTitle.get(coaId) ?? null) : null,
                catLayer: catRes.layer,
                coaLayer: coaRes.layer,
            } as any;
        });
        setMappedPairs(mapped);

        // Build preview for first 5 + last 5 unique items (Spec §6 preview)
        if (uniqueItems) {
            buildPreview(uniqueItems);
        }
    }

    function buildPreview(items: typeof uniqueItems) {
        if (!items || items.length === 0) return;

        const head = items.slice(0, 5);
        const tail = items.length > 10 ? items.slice(-5) : items.slice(5);
        const combined = [...head, ...tail];
        const rows = combined.map((it, idx) => {
            const catRes = resolveCat(it.category);
            const coaRes = resolveCoa(it.chartOfAccount);
            const catId = catRes.id;
            const coaId = coaRes.id;
            const hasPrice = it.price != null && it.price > 0;
            const hasUom = (it.unit_of_measurement ?? "").trim() !== "";
            const pairExists =
                catId != null && coaId != null && dbPairsSet.has(`${coaId}|${catId}`);
            let status: "success" | "warning" | "error" = "success";
            let msg = "Ready";

            if (!hasPrice) {
                status = "error";
                msg = "Price >0 required";
            } else if (!hasUom) {
                status = "error";
                msg = "UOM required";
            } else if (catId == null || coaId == null) {
                status = "error";
                msg = catId == null ? "Category not found" : "COA not found";
            } else if (!pairExists) {
                status = "error";
                msg = "COA/Category pair not found";
            } else if (catRes.layer === "sanitized" || coaRes.layer === "sanitized") {
                status = "warning";
                msg = `Auto-corrected${coaRes.layer === "sanitized" ? " COA" : ""}${catRes.layer === "sanitized" ? " Category" : ""}`;
            }

            // upsert preview: junction + desc+UOM (Spec §5)
            const jId =
                coaId != null && catId != null
                    ? (junctionByPair.get(`${coaId}|${catId}`) ?? null)
                    : null;
            const exists = priceListItems.some((p) => {
                if (
                    normalize(p.description) !== normalize(it.description) ||
                    normalize(p.unit_of_measurement) !== normalize(it.unit_of_measurement)
                ) {
                    return false;
                }

                if (jId != null && p.chart_of_account_ppmp_category_id != null) {
                    return p.chart_of_account_ppmp_category_id === jId;
                }

                return !!p.price;
            });

            if (status === "success" && exists) msg = "Will update existing";
            else if (status === "warning" && exists) msg += " — will update";

            return {
                row: idx + 1,
                description: it.description,
                category: it.category,
                chartOfAccount: it.chartOfAccount,
                unit: it.unit_of_measurement,
                price: it.price,
                coaLayer: coaRes.layer,
                catLayer: catRes.layer,
                status,
                message: msg,
            };
        });
        setPreviewRows(rows);
    }

    function refreshHeaderPreview() {
        if (!_workbook || !currentSheet) return;
        const ws = _workbook.getWorksheet(currentSheet);
        if (!ws) return;
        const config = calibrationMode === "shared" ? sharedConfig : calibrations[currentSheet];
        if (!config) return;
        const effective = config.useCustom ? config : getDefaultConfig("price-list");
        const colMap: any = effective.columnMap;
        const headerRow = ws.getRow(1);
        const cols: Array<{ col: string; header: string | null; sample: string | null }> = [];
        const fields: Array<[string, string]> = [
            ["COA", colMap.chartOfAccount],
            ["Category", colMap.category],
            ["Description", colMap.description],
            ["Unit", colMap.unit],
            ["Price", colMap.price],
            ["Item#", colMap.itemNumber ?? "E"],
        ];

        for (const [label, colLetter] of fields) {
            try {
                const headerCell = ws.getCell(`${colLetter}1`);
                let hv: any = headerCell.value;

                if (hv && typeof hv === "object" && "result" in hv) hv = (hv as any).result;

                const header = hv != null ? String(hv).trim() : null;
                const sampleRow = ws.getRow(effective.startRow);
                const sampleCell = sampleRow.getCell(colLetter);
                let sv: any = sampleCell.value;

                if (sv && typeof sv === "object" && "result" in sv) sv = (sv as any).result;

                const sample = sv != null ? String(sv).trim().substring(0, 40) : null;
                cols.push({ col: `${label} (${colLetter})`, header, sample });
            } catch {
                cols.push({ col: `${label} (${colLetter})`, header: null, sample: null });
            }
        }

        setHeaderPreview(cols);
    }

    function handleRefetch() {
        if (refetching) return;

        setRefetching(true);
        router.reload({ onFinish: () => setRefetching(false) });
    }

    // --- Render ---
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
                            variant={mode === "price-list" ? "default" : "outline"}
                            onClick={() => handleModeChange("price-list")}
                        >
                            Price List Import
                        </Button>
                        <Button
                            variant={mode === "quantities" ? "default" : "outline"}
                            onClick={() => handleModeChange("quantities")}
                        >
                            Monthly Quantities
                        </Button>
                    </div>
                </Field>
            )}

            {mode === "quantities" && !confirmed && (
                <p className="mt-2 text-sm text-muted-foreground">
                    Monthly Quantities import will import monthly quantities into the PPMP table for
                    a specific PPA, funding source, and fiscal year.
                </p>
            )}

            {mode && sheets.length > 0 && (
                <Field>
                    <FieldLabel>Sheets</FieldLabel>
                    {mode === "quantities" && (
                        <FieldDescription>Select one sheet.</FieldDescription>
                    )}
                    <ToggleGroup
                        multiple={mode !== "quantities"}
                        value={selectedSheets}
                        onValueChange={handleSheetsChange}
                        orientation="horizontal"
                        className="flex-wrap"
                    >
                        {sheets.map((sheet) => (
                            <ToggleGroupItem key={sheet} value={sheet} className="border">
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

            {mode === "quantities" && confirmed && selectedSheets.length > 0 && (
                <div className="mt-4 space-y-4">
                    <p className="text-sm">
                        Confirmed sheet: <span className="font-medium">{selectedSheets[0]}</span>
                    </p>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmed(false)}>
                        ← Change sheet selection
                    </Button>

                    <div className="rounded-lg border p-4">
                        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Target</h3>
                        <div className="grid grid-cols-5 gap-4">
                            <Field>
                                <FieldLabel>Fiscal Year</FieldLabel>
                                <Select
                                    value={targetFiscalYearId ? String(targetFiscalYearId) : ""}
                                    onValueChange={(v) => {
                                        setTargetFiscalYearId(v ? Number(v) : null);
                                        setTargetPpaId(null);
                                    }}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select fiscal year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {fiscalYears.map((fy) => (
                                                <SelectItem key={fy.id} value={String(fy.id)}>
                                                    {fy.year}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field className="col-span-2">
                                <FieldLabel>PPA</FieldLabel>
                                <Combobox
                                    items={ppaComboboxItems}
                                    value={
                                        targetPpaId
                                            ? `ppa:${ppas.find((p) => p.id === targetPpaId)?.name ?? ""}`
                                            : ""
                                    }
                                    onValueChange={(v) => {
                                        if (!v) {
                                            setTargetPpaId(null);

                                            return;
                                        }

                                        const name = v.replace(/^[^:]+:/, "");
                                        const ppa = ppas.find(
                                            (p) =>
                                                p.fiscal_year_id === targetFiscalYearId &&
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
                                        className="w-1000"
                                    />
                                    <ComboboxContent>
                                        <ComboboxEmpty>
                                            {targetFiscalYearId
                                                ? "No PPA found."
                                                : "Select a fiscal year first."}
                                        </ComboboxEmpty>
                                        <ComboboxList>
                                            {(item) => (
                                                <ComboboxItem key={item} value={item}>
                                                    {item.replace(/^[^:]+:/, "")}
                                                </ComboboxItem>
                                            )}
                                        </ComboboxList>
                                    </ComboboxContent>
                                </Combobox>
                            </Field>
                            <Field className="col-span-2">
                                <FieldLabel>Funding Source</FieldLabel>
                                <Select
                                    value={
                                        targetFundingSourceId ? String(targetFundingSourceId) : ""
                                    }
                                    onValueChange={(v) =>
                                        setTargetFundingSourceId(v ? Number(v) : null)
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select funding source" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {fundingSources.map((fs) => (
                                                <SelectItem key={fs.id} value={String(fs.id)}>
                                                    [{fs.code}] {fs.title}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </Field>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Resolved target:{" "}
                            {targetFiscalYearId && targetPpaId && targetFundingSourceId
                                ? `${fiscalYears.find((fy) => fy.id === targetFiscalYearId)?.year ?? "—"} — ${
                                      ppas.find((p) => p.id === targetPpaId)?.name ?? "—"
                                  } — [${
                                      fundingSources.find((fs) => fs.id === targetFundingSourceId)
                                          ?.code ?? "—"
                                  }]`
                                : "—"}
                        </p>
                    </div>

                    {calibrationMode === "shared" && sharedConfig ? (
                        <CalibrationPanel
                            mode="quantities"
                            selectedSheets={selectedSheets}
                            calibrations={{ [currentSheet]: sharedConfig } as any}
                            currentSheet={currentSheet}
                            onCurrentSheetChange={setCurrentSheet}
                            onUpdateSheet={(_, updates) => {
                                setSharedConfig((prev) => {
                                    if (!prev) return prev;
                                    const merged = {
                                        ...prev,
                                        ...updates,
                                        columnMap: updates.columnMap ? { ...prev.columnMap, ...(updates.columnMap as any) } : prev.columnMap,
                                    } as SheetConfig;
                                    setCalibrations((prevCal) => {
                                        const next: Record<string, SheetConfig> = {};
                                        for (const s of selectedSheets) {
                                            const base = prevCal[s] ?? prev;
                                            next[s] = {
                                                ...base,
                                                ...updates,
                                                columnMap: updates.columnMap ? { ...base.columnMap, ...(updates.columnMap as any) } : base.columnMap,
                                            } as SheetConfig;
                                        }
                                        return next;
                                    });
                                    return merged;
                                });
                            }}
                            onExtract={handleExtractQuantities}
                            extractLabel="Extract Quantities"
                            disabled={!selectedSheets.length}
                        />
                    ) : (
                        <CalibrationPanel
                            mode="quantities"
                            selectedSheets={selectedSheets}
                            calibrations={calibrations}
                            currentSheet={currentSheet}
                            onCurrentSheetChange={setCurrentSheet}
                            onUpdateSheet={(sheet, updates) => {
                                setCalibrations((prev) => ({
                                    ...prev,
                                    [sheet]: { ...prev[sheet], ...updates },
                                }));
                            }}
                            onExtract={handleExtractQuantities}
                            extractLabel="Extract Quantities"
                            disabled={!selectedSheets.length}
                        />
                    )}

                    {quantityRows && (
                        // ... (same table and import dialog as before)
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
                                        onClick={() => setQuantityImportDialogOpen(true)}
                                        disabled={
                                            !quantityImportPlan ||
                                            quantityImportPlan.rows.length === 0 ||
                                            quantityImportPlan.unmatched > 0 ||
                                            !targetFiscalYearId ||
                                            !targetPpaId ||
                                            !targetFundingSourceId ||
                                            quantityImporting
                                        }
                                    >
                                        {quantityImporting && <Spinner />}
                                        Import {quantityImportPlan?.rows.length ?? 0} Quantities
                                    </Button>
                                </div>
                            </div>
                            {quantityImportPlan && quantityImportPlan.unmatched > 0 && (
                                <p className="mb-2 text-sm text-destructive">
                                    {quantityImportPlan.unmatched} item(s) without a DB match —
                                    resolve them before importing.
                                </p>
                            )}
                            {quantityImportPlan && quantityImportPlan.skippedNoQty > 0 && (
                                <p className="mb-2 text-sm text-muted-foreground">
                                    {quantityImportPlan.skippedNoQty} row(s) with no quantities will
                                    be skipped.
                                </p>
                            )}
                            <div className="max-h-96 overflow-auto rounded-md border">
                                <Table>
                                    <TableHeader className="sticky top-0 z-10 bg-background">
                                        <TableRow>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Chart of Account</TableHead>
                                            <TableHead>Unit</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
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
                                            const match = quantityMatches[row.tempId];
                                            const matchedItem = match?.itemId
                                                ? priceListItems.find((p) => p.id === match.itemId)
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
                                                    <TableCell>{row.unitOfMeasurement}</TableCell>
                                                    <TableCell className="text-right">
                                                        {row.price ?? "—"}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {row.total ?? "—"}
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
                                                                            ✓ exists
                                                                        </span>
                                                                    }
                                                                />
                                                                <HoverCardContent>
                                                                    {matchedItem
                                                                        ? `${matchedItem.description}\n${matchedItem.unit_of_measurement} — ${matchedItem.price}`
                                                                        : ""}
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
                                                            items={pliComboboxItems}
                                                            value={
                                                                matchedItem
                                                                    ? `pli:${matchedItem.description}`
                                                                    : ""
                                                            }
                                                            onValueChange={(v) => {
                                                                setQuantityMatches((prev) => {
                                                                    const next = {
                                                                        ...prev,
                                                                    };

                                                                    if (!v) {
                                                                        next[row.tempId] = {
                                                                            itemId: null,
                                                                        };

                                                                        return next;
                                                                    }

                                                                    const name = v.replace(
                                                                        /^[^:]+:/,
                                                                        "",
                                                                    );
                                                                    const dbItem =
                                                                        priceListItems.find(
                                                                            (p) =>
                                                                                p.description ===
                                                                                name,
                                                                        );

                                                                    if (dbItem) {
                                                                        next[row.tempId] = {
                                                                            itemId: dbItem.id,
                                                                        };
                                                                    }

                                                                    return next;
                                                                });
                                                            }}
                                                        >
                                                            <ComboboxInput
                                                                placeholder="Search price list item..."
                                                                showClear
                                                            />
                                                            <ComboboxContent>
                                                                <ComboboxEmpty>
                                                                    No items found.
                                                                </ComboboxEmpty>
                                                                <ComboboxList>
                                                                    {(item) => (
                                                                        <ComboboxItem
                                                                            key={item}
                                                                            value={item}
                                                                        >
                                                                            {item.replace(
                                                                                /^[^:]+:/,
                                                                                "",
                                                                            )}
                                                                        </ComboboxItem>
                                                                    )}
                                                                </ComboboxList>
                                                            </ComboboxContent>
                                                        </Combobox>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {row.janQty ?? ""}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {row.febQty ?? ""}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {row.marQty ?? ""}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {row.aprQty ?? ""}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {row.mayQty ?? ""}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {row.junQty ?? ""}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {row.julQty ?? ""}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {row.augQty ?? ""}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {row.sepQty ?? ""}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {row.octQty ?? ""}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {row.novQty ?? ""}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {row.decQty ?? ""}
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
                                <DialogTitle>Confirm Quantity Import</DialogTitle>
                                <DialogDescription>
                                    You're about to import {quantityImportPlan?.rows.length ?? 0}{" "}
                                    monthly quantity row(s) for{" "}
                                    {targetFiscalYearId && targetPpaId && targetFundingSourceId
                                        ? `${fiscalYears.find((fy) => fy.id === targetFiscalYearId)?.year ?? "—"} — ${
                                              ppas.find((p) => p.id === targetPpaId)?.name ?? "—"
                                          } — [${
                                              fundingSources.find(
                                                  (fs) => fs.id === targetFundingSourceId,
                                              )?.code ?? "—"
                                          }]`
                                        : "the selected target"}
                                    . Existing monthly quantities for matched items will be
                                    overwritten.
                                </DialogDescription>
                            </DialogHeader>
                            {quantityImportPlan && quantityImportPlan.skippedNoQty > 0 && (
                                <div className="space-y-1 text-sm text-muted-foreground">
                                    Skipped:
                                    <p>{quantityImportPlan.skippedNoQty} — no monthly quantities</p>
                                </div>
                            )}
                            <DialogFooter>
                                <DialogClose render={<Button variant="outline">Cancel</Button>} />
                                <Button
                                    onClick={handleConfirmImportQuantities}
                                    disabled={
                                        !quantityImportPlan ||
                                        quantityImportPlan.rows.length === 0 ||
                                        quantityImporting
                                    }
                                >
                                    {quantityImporting ? "Importing..." : "Confirm"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            )}

            {mode === "price-list" && confirmed && selectedSheets.length > 0 && (
                <>
                    {/* Stepper — user-friendly progress */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Import price list — 4 steps</CardTitle>
                            <CardDescription>
                                Follow the steps. We explain what each table means so you know what
                                to do next.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { n: 1, label: "Calibrate", desc: "Tell us where data lives" },
                                    { n: 2, label: "Findings", desc: "What we found in Excel" },
                                    { n: 3, label: "Map & Preview", desc: "Fix names & preview" },
                                    { n: 4, label: "Import", desc: "Confirm & see results" },
                                ].map((s) => {
                                    const active = wizardStep === s.n;
                                    const done = wizardStep > s.n;

                                    return (
                                        <div
                                            key={s.n}
                                            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${active ? "border-primary bg-primary text-primary-foreground" : done ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "bg-muted text-muted-foreground"}`}
                                        >
                                            <span
                                                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${active ? "bg-white text-primary" : done ? "bg-emerald-600 text-white" : "border bg-background"}`}
                                            >
                                                {done ? "✓" : s.n}
                                            </span>
                                            <span className="font-medium">{s.label}</span>
                                            <span className="hidden opacity-70 sm:inline">
                                                — {s.desc}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                    1
                                </span>{" "}
                                Calibrate — Where is the data?
                            </CardTitle>
                            <CardDescription>
                                Check row numbers and column letters. Defaults now <span className="font-medium">Start Row 9</span> (was 8) for PPMPS. In <strong>Shared</strong> mode one change updates all {selectedSheets.length} sheets at once.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/20 p-3">
                                <span className="text-sm font-medium">Scope:</span>
                                <div className="flex gap-2">
                                    <Button
                                        variant={calibrationMode === "shared" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => {
                                            // sync current shared to all when switching to shared
                                            if (calibrationMode === "per-sheet" && calibrations[currentSheet]) {
                                                const src = calibrations[currentSheet];
                                                setSharedConfig({ ...src, columnMap: { ...src.columnMap } });
                                            }
                                            setCalibrationMode("shared");
                                        }}
                                    >
                                        Shared — all {selectedSheets.length} sheets
                                    </Button>
                                    <Button
                                        variant={calibrationMode === "per-sheet" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => {
                                            if (sharedConfig) {
                                                const next: Record<string, SheetConfig> = {};
                                                for (const s of selectedSheets) next[s] = { ...sharedConfig, columnMap: { ...sharedConfig.columnMap } };
                                                setCalibrations(next);
                                            }
                                            setCalibrationMode("per-sheet");
                                        }}
                                    >
                                        Per-sheet
                                    </Button>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {calibrationMode === "shared"
                                        ? `Start row ${sharedConfig?.startRow ?? 9} applies to every sheet — change once.`
                                        : `Each sheet can differ. Copy to sync.`}
                                </span>
                                {calibrationMode === "shared" ? (
                                    <Button variant="outline" size="sm" onClick={handleApplySharedToAll} disabled={!sharedConfig}>
                                        Apply to all ({selectedSheets.length})
                                    </Button>
                                ) : (
                                    <Button variant="outline" size="sm" onClick={handleCopyCurrentToAll} disabled={!calibrations[currentSheet]}>
                                        Copy “{currentSheet}” to all
                                    </Button>
                                )}
                            </div>

                            {calibrationMode === "shared" && sharedConfig ? (
                                <CalibrationPanel
                                    mode="price-list"
                                    selectedSheets={selectedSheets}
                                    calibrations={{ [currentSheet]: sharedConfig } as any}
                                    currentSheet={currentSheet}
                                    onCurrentSheetChange={setCurrentSheet}
                                    onUpdateSheet={(_, updates) => {
                                        setSharedConfig((prev) => {
                                            if (!prev) return prev;
                                            const merged = {
                                                ...prev,
                                                ...updates,
                                                columnMap: updates.columnMap ? { ...prev.columnMap, ...(updates.columnMap as any) } : prev.columnMap,
                                            } as SheetConfig;
                                            // keep per-sheet clones synced
                                            setCalibrations((prevCal) => {
                                                const next: Record<string, SheetConfig> = {};
                                                for (const s of selectedSheets) {
                                                    const base = prevCal[s] ?? prev;
                                                    next[s] = {
                                                        ...base,
                                                        ...updates,
                                                        columnMap: updates.columnMap ? { ...base.columnMap, ...(updates.columnMap as any) } : base.columnMap,
                                                    } as SheetConfig;
                                                }
                                                return next;
                                            });
                                            return merged;
                                        });
                                    }}
                                    onExtract={handleExtractCoaAndCategory}
                                    extractLabel="Extract COA & Category"
                                    disabled={!currentSheet}
                                />
                            ) : (
                                <CalibrationPanel
                                    mode="price-list"
                                    selectedSheets={selectedSheets}
                                    calibrations={calibrations}
                                    currentSheet={currentSheet}
                                    onCurrentSheetChange={setCurrentSheet}
                                    onUpdateSheet={(sheet, updates) => {
                                        setCalibrations((prev) => ({
                                            ...prev,
                                            [sheet]: { ...prev[sheet], ...updates },
                                        }));
                                    }}
                                    onExtract={handleExtractCoaAndCategory}
                                    extractLabel="Extract COA & Category"
                                    disabled={!currentSheet}
                                />
                            )}
                        </CardContent>
                    </Card>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                            variant={extracted ? "secondary" : "default"}
                            onClick={handleMapResolved}
                            disabled={!extracted}
                        >
                            {mappedPairs ? "✓ Mapped" : "2 — Map names to system"}
                        </Button>
                        <Button
                            variant={uniqueItems ? "secondary" : "outline"}
                            onClick={handleExtractUniqueItems}
                            disabled={!mappedPairs}
                        >
                            {uniqueItems
                                ? `✓ ${uniqueItems.length} items`
                                : "3 — Show items to import"}
                        </Button>
                        <Button variant="outline" onClick={handleRefetch} disabled={refetching}>
                            {refetching && <Spinner />}
                            Refetch DB Data
                        </Button>
                    </div>

                    {headerPreview.length > 0 && (
                        <Card className="mt-4">
                            <CardHeader>
                                <CardTitle className="text-sm">
                                    Header preview — Sheet: {currentSheet}
                                </CardTitle>
                                <CardDescription>
                                    We read the first row to show what’s in each calibrated column.
                                    If a header looks wrong, adjust the column letters above then
                                    re-extract.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    {headerPreview.map((h) => (
                                        <div key={h.col} className="rounded border bg-muted/20 p-2">
                                            <div className="font-medium">{h.col}</div>
                                            <div className="text-muted-foreground">
                                                Header: {h.header ?? "— empty —"}
                                            </div>
                                            <div className="truncate">
                                                Sample: {h.sample ?? "—"}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Tip: Description &amp; Category sharing column F is expected for
                                    this template.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {extracted && (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                            2
                                        </span>{" "}
                                        Step 2 — What we found in your file
                                    </CardTitle>
                                    <CardDescription>
                                        We read{" "}
                                        <Badge variant="secondary">
                                            {selectedSheets.length} sheet(s)
                                        </Badge>{" "}
                                        and found{" "}
                                        <Badge variant="outline">
                                            {extracted.categories.length} categories
                                        </Badge>{" "}
                                        <Badge variant="outline">
                                            {extracted.chartOfAccounts.length} COAs
                                        </Badge>{" "}
                                        <Badge variant="outline">
                                            {extracted.pairs.length} pairs
                                        </Badge>
                                        . The tables below show names from Excel and how they map to
                                        the system.{" "}
                                        <span className="font-medium">⚠️ = auto-corrected</span> via
                                        sanitization (Category: <code>-</code>→space, COA: remove{" "}
                                        <code>-./</code>).
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Tabs defaultValue="categories">
                                        <TabsList>
                                            <TabsTrigger value="categories">
                                                Categories ({extracted.categories.length})
                                            </TabsTrigger>
                                            <TabsTrigger value="coas">
                                                COAs ({extracted.chartOfAccounts.length})
                                            </TabsTrigger>
                                            <TabsTrigger value="pairs">
                                                Raw pairs ({extracted.pairs.length}) — debug
                                            </TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="categories" className="mt-4">
                                            <p className="mb-2 text-xs text-muted-foreground">
                                                Each row is a category name seen in column F (or
                                                synthetic from COA). If “Map to DB” is empty, fix it
                                                — otherwise the rows using it will be skipped.
                                            </p>
                                            <div className="max-h-80 overflow-y-auto rounded-md border">
                                                <Table>
                                                    <TableHeader className="sticky top-0 z-10 bg-background">
                                                        <TableRow>
                                                            <TableHead>
                                                                Category — from Excel
                                                            </TableHead>
                                                            <TableHead className="text-right">
                                                                Sheets
                                                            </TableHead>
                                                            <TableHead>
                                                                Map to DB — click to fix
                                                            </TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {extracted.categories.map((cat) => {
                                                            const strictId = catLookup.get(
                                                                normalize(cat.name),
                                                            );
                                                            const sanitizedId =
                                                                strictId ??
                                                                catSanitizedLookup.get(
                                                                    sanitizeCategory(cat.name),
                                                                );
                                                            const isSanitized =
                                                                strictId == null &&
                                                                sanitizedId != null;
                                                            const autoId = strictId ?? sanitizedId;
                                                            const currentId =
                                                                manualCat[cat.name] ?? autoId;
                                                            const currentName = currentId
                                                                ? idToCatName.get(currentId)
                                                                : undefined;
                                                            const comboboxValue = currentName
                                                                ? `cat:${currentName}`
                                                                : "";

                                                            return (
                                                                <TableRow key={cat.name}>
                                                                    <TableCell className="max-w-64 truncate">
                                                                        {cat.name}{" "}
                                                                        {isSanitized &&
                                                                            manualCat[cat.name] ==
                                                                                null && (
                                                                                <span
                                                                                    className="ml-1 text-amber-600"
                                                                                    title="Auto-corrected (hyphen → space)"
                                                                                >
                                                                                    ⚠️
                                                                                </span>
                                                                            )}
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
                                                                                {cat.sheets
                                                                                    .length ===
                                                                                selectedSheets.length
                                                                                    ? `Appears in ${cat.sheets.length} — all sheets`
                                                                                    : `Appears in: ${cat.sheets.join(", ")}`}
                                                                            </HoverCardContent>
                                                                        </HoverCard>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Combobox
                                                                            items={catComboboxItems}
                                                                            value={comboboxValue}
                                                                            onValueChange={(v) => {
                                                                                if (!v) return;

                                                                                const name =
                                                                                    v.replace(
                                                                                        /^[^:]+:/,
                                                                                        "",
                                                                                    );
                                                                                const id =
                                                                                    catNameToId.get(
                                                                                        name,
                                                                                    );

                                                                                if (id) {
                                                                                    setManualCat(
                                                                                        (prev) => ({
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
                                                                                    No items found.
                                                                                </ComboboxEmpty>
                                                                                <ComboboxList>
                                                                                    {(item) => (
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
                                                                                                "",
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
                                        </TabsContent>
                                        <TabsContent value="coas" className="mt-4">
                                            <p className="mb-2 text-xs text-muted-foreground">
                                                COA is the account number/title from column D (e.g.
                                                5-02-03-010). Shown names are raw from Excel. Empty
                                                “Map to DB” means no strict or sanitized match — fix
                                                it or rows using it will be skipped. ⚠️ =
                                                auto-corrected by removing <code>-./</code>.
                                            </p>
                                            <div className="max-h-80 overflow-y-auto rounded-md border">
                                                <Table>
                                                    <TableHeader className="sticky top-0 z-10 bg-background">
                                                        <TableRow>
                                                            <TableHead>
                                                                Chart of Account — from Excel
                                                            </TableHead>
                                                            <TableHead className="text-right">
                                                                Sheets
                                                            </TableHead>
                                                            <TableHead>Map to DB</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {extracted.chartOfAccounts.map((coa) => {
                                                            const strictId = coaLookup.get(
                                                                normalize(coa.name),
                                                            );
                                                            const sanitizedId =
                                                                strictId ??
                                                                coaSanitizedLookup.get(
                                                                    sanitizeCoa(coa.name),
                                                                );
                                                            const isSanitized =
                                                                strictId == null &&
                                                                sanitizedId != null;
                                                            const autoId = strictId ?? sanitizedId;
                                                            const currentId =
                                                                manualCoa[coa.name] ?? autoId;
                                                            const currentTitle = currentId
                                                                ? idToCoaTitle.get(currentId)
                                                                : undefined;
                                                            const comboboxValue = currentTitle
                                                                ? `coa:${currentTitle}`
                                                                : "";

                                                            return (
                                                                <TableRow key={coa.name}>
                                                                    <TableCell className="max-w-64 truncate">
                                                                        {coa.name}{" "}
                                                                        {isSanitized &&
                                                                            manualCoa[coa.name] ==
                                                                                null && (
                                                                                <span
                                                                                    className="ml-1 text-amber-600"
                                                                                    title="Auto-corrected (removed -./)"
                                                                                >
                                                                                    ⚠️
                                                                                </span>
                                                                            )}
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
                                                                                {coa.sheets
                                                                                    .length ===
                                                                                selectedSheets.length
                                                                                    ? `Appears in ${coa.sheets.length} — all sheets`
                                                                                    : `Appears in: ${coa.sheets.join(", ")}`}
                                                                            </HoverCardContent>
                                                                        </HoverCard>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Combobox
                                                                            items={coaComboboxItems}
                                                                            value={comboboxValue}
                                                                            onValueChange={(v) => {
                                                                                if (!v) return;

                                                                                const name =
                                                                                    v.replace(
                                                                                        /^[^:]+:/,
                                                                                        "",
                                                                                    );
                                                                                const id =
                                                                                    coaNameToId.get(
                                                                                        name,
                                                                                    );

                                                                                if (id) {
                                                                                    setManualCoa(
                                                                                        (prev) => ({
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
                                                                                    No items found.
                                                                                </ComboboxEmpty>
                                                                                <ComboboxList>
                                                                                    {(item) => (
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
                                                                                                "",
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
                                        </TabsContent>
                                        <TabsContent value="pairs" className="mt-4">
                                            <p className="mb-2 text-xs text-muted-foreground">
                                                Debug view — every distinct Category·COA combination
                                                we saw ({extracted.pairs.length}). Useful if counts
                                                look off (e.g., many “Non-Procurement Items — …”
                                                inflated by the extraction heuristic in{" "}
                                                <code>extract.ts:207</code>). You don’t need to act
                                                on this table; fix names in the two tabs above.
                                            </p>
                                            <details className="rounded-md border p-3">
                                                <summary className="cursor-pointer text-sm font-medium">
                                                    Show raw pairs ({extracted.pairs.length}) —
                                                    collapsed by default
                                                </summary>
                                                <div className="mt-3 max-h-80 overflow-y-auto rounded-md border">
                                                    <Table>
                                                        <TableHeader className="sticky top-0 z-10 bg-background">
                                                            <TableRow>
                                                                <TableHead>Category</TableHead>
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
                                                                        {pair.chartOfAccount}
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
                                                                                    : `Appears in: ${pair.sheets.join(", ")}`}
                                                                            </HoverCardContent>
                                                                        </HoverCard>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </details>
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {previewRows && previewRows.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                        3
                                    </span>{" "}
                                    Preview — First 5 + Last 5 rows
                                </CardTitle>
                                <CardDescription>
                                    We took the first 5 and last 5 items after your mapping.{" "}
                                    <span className="font-medium text-emerald-700">✅ Success</span>{" "}
                                    = will insert or update,{" "}
                                    <span className="font-medium text-amber-600">⚠️ Warning</span> =
                                    auto-corrected but will still import,{" "}
                                    <span className="font-medium text-destructive">❌ Error</span> =
                                    will be skipped. Fix errors in Excel or mapping, then
                                    re-extract.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="max-h-64 overflow-auto rounded-md border">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-background">
                                            <TableRow>
                                                <TableHead>#</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Category</TableHead>
                                                <TableHead>COA</TableHead>
                                                <TableHead>Price</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Message</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {previewRows.map((r) => (
                                                <TableRow key={`${r.row}-${r.description}`}>
                                                    <TableCell>{r.row}</TableCell>
                                                    <TableCell className="max-w-40 truncate">
                                                        {r.description}
                                                    </TableCell>
                                                    <TableCell>
                                                        {r.category}
                                                        {r.catLayer === "sanitized" ? " ⚠️" : ""}
                                                    </TableCell>
                                                    <TableCell>
                                                        {r.chartOfAccount}
                                                        {r.coaLayer === "sanitized" ? " ⚠️" : ""}
                                                    </TableCell>
                                                    <TableCell>{r.price ?? "—"}</TableCell>
                                                    <TableCell>
                                                        {r.status === "success" ? (
                                                            <span className="text-emerald-600">
                                                                ✅ {r.status}
                                                            </span>
                                                        ) : r.status === "warning" ? (
                                                            <span className="text-amber-600">
                                                                ⚠️ {r.status}
                                                            </span>
                                                        ) : (
                                                            <span className="text-destructive">
                                                                ❌ {r.status}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-xs">
                                                        {r.message}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {uniqueItems && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                        3
                                    </span>{" "}
                                    Items to import — Unique list{" "}
                                    <Badge variant="outline">{uniqueItems.length} total</Badge>{" "}
                                    <Badge variant="secondary">
                                        {importPlan?.toInsert ?? 0} new
                                    </Badge>{" "}
                                    <Badge variant="secondary">
                                        {importPlan?.toUpdate ?? 0} update
                                    </Badge>
                                </CardTitle>
                                <CardDescription>
                                    Each row is one distinct item (description + category + COA)
                                    across all selected sheets. We will{" "}
                                    <span className="font-medium">insert</span> if new, or{" "}
                                    <span className="font-medium">update price</span> if the same
                                    description + unit already exists (upsert). Use “Map to DB” to
                                    fix names, or “Hide exists” to hide items that would just
                                    update.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-muted-foreground">
                                        Unique Items — showing (
                                        {hideExisting
                                            ? uniqueItems.filter((item) => {
                                                  const k = `${item.description}|${item.category}|${item.chartOfAccount}`;

                                                  if (itemMatches[k]) return false;

                                                  return !priceListItems.some(
                                                      (p) =>
                                                          normalize(p.description) ===
                                                              normalize(item.description) &&
                                                          normalize(p.unit_of_measurement) ===
                                                              normalize(item.unit_of_measurement),
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
                                                onCheckedChange={setHideExisting}
                                                size="sm"
                                            />
                                        </label>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setImportDialogOpen(true)}
                                            disabled={
                                                !importPlan ||
                                                importPlan.items.length === 0 ||
                                                importing
                                            }
                                        >
                                            {importing && <Spinner />}
                                            Upsert {importPlan?.items.length ?? 0} (
                                            {importPlan?.toInsert ?? 0} new,{" "}
                                            {importPlan?.toUpdate ?? 0} upd)
                                        </Button>
                                    </div>
                                </div>
                                <div className="max-h-80 overflow-y-auto rounded-md border">
                                    <Table>
                                        <TableHeader className="sticky top-0 z-10 bg-background">
                                            <TableRow>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Category</TableHead>
                                                <TableHead>Chart of Account</TableHead>
                                                <TableHead className="text-right">Sheets</TableHead>
                                                <TableHead>In DB</TableHead>
                                                <TableHead>Match</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {uniqueItems
                                                .filter((item) => {
                                                    if (!hideExisting) return true;

                                                    const itemKey = `${item.description}|${item.category}|${item.chartOfAccount}`;
                                                    const existsExact = priceListItems.some(
                                                        (p) =>
                                                            normalize(p.description) ===
                                                                normalize(item.description) &&
                                                            normalize(p.unit_of_measurement) ===
                                                                normalize(item.unit_of_measurement),
                                                    );

                                                    return !itemMatches[itemKey] && !existsExact;
                                                })
                                                .map((item) => {
                                                    const itemKey = `${item.description}|${item.category}|${item.chartOfAccount}`;
                                                    const matchedId = itemMatches[itemKey];
                                                    const matchedItem = matchedId
                                                        ? pliById.get(matchedId)
                                                        : null;
                                                    const exactInDb = priceListItems.some(
                                                        (p) =>
                                                            normalize(p.description) ===
                                                                normalize(item.description) &&
                                                            normalize(p.unit_of_measurement) ===
                                                                normalize(item.unit_of_measurement),
                                                    );
                                                    const inDb = matchedId ? true : exactInDb;
                                                    const comboboxValue = matchedItem
                                                        ? `pli:${matchedItem.description}`
                                                        : exactInDb
                                                          ? `pli:${item.description}`
                                                          : "";

                                                    return (
                                                        <TableRow key={itemKey}>
                                                            <TableCell className="max-w-64 truncate">
                                                                {item.description}
                                                            </TableCell>
                                                            <TableCell className="max-w-40 truncate">
                                                                {item.category}
                                                            </TableCell>
                                                            <TableCell className="max-w-48 truncate">
                                                                {item.chartOfAccount}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <HoverCard>
                                                                    <HoverCardTrigger
                                                                        render={
                                                                            <span className="cursor-pointer text-xs text-muted-foreground">
                                                                                {item.sheets.length}
                                                                                /
                                                                                {
                                                                                    selectedSheets.length
                                                                                }
                                                                            </span>
                                                                        }
                                                                    />
                                                                    <HoverCardContent>
                                                                        {item.sheets.length ===
                                                                        selectedSheets.length
                                                                            ? `Appears in ${item.sheets.length} — all sheets`
                                                                            : `Appears in: ${item.sheets.join(", ")}`}
                                                                    </HoverCardContent>
                                                                </HoverCard>
                                                            </TableCell>
                                                            <TableCell>
                                                                {matchedId ? (
                                                                    <HoverCard>
                                                                        <HoverCardTrigger
                                                                            render={
                                                                                <span className="cursor-pointer text-blue-600">
                                                                                    ✓ matched
                                                                                </span>
                                                                            }
                                                                        />
                                                                        <HoverCardContent>
                                                                            {matchedItem
                                                                                ? `${matchedItem.description}\n${matchedItem.unit_of_measurement} — ${matchedItem.price}`
                                                                                : ""}
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
                                                                    items={pliComboboxItems}
                                                                    value={comboboxValue}
                                                                    onValueChange={(v) => {
                                                                        setItemMatches((prev) => {
                                                                            const next = {
                                                                                ...prev,
                                                                            };

                                                                            if (!v) {
                                                                                delete next[
                                                                                    itemKey
                                                                                ];

                                                                                return next;
                                                                            }

                                                                            const name = v.replace(
                                                                                /^[^:]+:/,
                                                                                "",
                                                                            );
                                                                            const dbItem =
                                                                                priceListItems.find(
                                                                                    (p) =>
                                                                                        p.description ===
                                                                                        name,
                                                                                );

                                                                            if (dbItem) {
                                                                                next[itemKey] =
                                                                                    dbItem.id;
                                                                            }

                                                                            return next;
                                                                        });
                                                                    }}
                                                                >
                                                                    <ComboboxInput
                                                                        placeholder="Search price list item..."
                                                                        showClear
                                                                    />
                                                                    <ComboboxContent>
                                                                        <ComboboxEmpty>
                                                                            No items found.
                                                                        </ComboboxEmpty>
                                                                        <ComboboxList>
                                                                            {(item) => (
                                                                                <ComboboxItem
                                                                                    key={item}
                                                                                    value={item}
                                                                                >
                                                                                    {item.replace(
                                                                                        /^[^:]+:/,
                                                                                        "",
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
                            </CardContent>
                        </Card>
                    )}

                    <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Confirm Import</DialogTitle>
                                <DialogDescription>
                                    You're about to upsert {importPlan?.items.length ?? 0} item(s):{" "}
                                    {importPlan?.toInsert ?? 0} new, {importPlan?.toUpdate ?? 0}{" "}
                                    updates.
                                    {importPlan?.warnings
                                        ? ` ⚠️ ${importPlan.warnings} auto-corrected.`
                                        : ""}
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
                                                {importPlan.skippedNoMatch} — category/COA pair not
                                                in database
                                            </p>
                                        )}
                                        {importPlan.skippedNoPrice > 0 && (
                                            <p>{importPlan.skippedNoPrice} — no price / price ≤0</p>
                                        )}
                                        {importPlan.skippedMissingUnit > 0 && (
                                            <p>
                                                {importPlan.skippedMissingUnit} — no unit of
                                                measurement
                                            </p>
                                        )}
                                        {importPlan.warnings > 0 && (
                                            <p className="text-amber-700">
                                                {importPlan.warnings} — auto-corrected (sanitized
                                                matches, will still import with warning)
                                            </p>
                                        )}
                                    </div>
                                )}
                            <DialogFooter>
                                <DialogClose render={<Button variant="outline">Cancel</Button>} />
                                <Button
                                    onClick={handleConfirmImport}
                                    disabled={
                                        !importPlan || importPlan.items.length === 0 || importing
                                    }
                                >
                                    {importing ? "Importing..." : "Confirm"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {mappedPairs && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Resolved pairs — what will be written{" "}
                                    <Badge variant="outline">{mappedPairs.length} pairs</Badge>
                                </CardTitle>
                                <CardDescription>
                                    This is the <span className="font-medium">actionable</span> pair
                                    table. Each row shows the Excel Category + COA and how we
                                    resolved them to the system (strict first, then sanitized ⚠️).
                                    “Pair in DB” must be ✅ or rows using that pair will be skipped.
                                    Change the COA via the combobox if the auto-match is wrong — it
                                    overrides the category·COA mapping for all items using it.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="max-h-80 overflow-y-auto rounded-md border">
                                    <Table>
                                        <TableHeader className="sticky top-0 z-10 bg-background">
                                            <TableRow>
                                                <TableHead>Category — Excel</TableHead>
                                                <TableHead>→ Resolved</TableHead>
                                                <TableHead>COA — Excel</TableHead>
                                                <TableHead>→ Resolved (editable)</TableHead>
                                                <TableHead>Pair in DB</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {mappedPairs.map((pair) => {
                                                const overrideKey = `${pair.category}|${pair.chartOfAccount}`;
                                                const override = pairOverrides[overrideKey];
                                                const effCoaId = override?.coaId ?? pair.coaId;
                                                const effCatId = pair.categoryId;
                                                const effCoaTitle = effCoaId
                                                    ? (idToCoaTitle.get(effCoaId) ?? null)
                                                    : null;
                                                const comboboxValue = effCoaTitle
                                                    ? `coa:${effCoaTitle}`
                                                    : "";
                                                const pairExists =
                                                    effCoaId !== null &&
                                                    effCatId !== null &&
                                                    dbPairsSet.has(`${effCoaId}|${effCatId}`);
                                                const pairResolvable =
                                                    effCoaId !== null && effCatId !== null;

                                                return (
                                                    <TableRow key={overrideKey}>
                                                        <TableCell className="max-w-40 truncate">
                                                            {pair.category}
                                                        </TableCell>
                                                        <TableCell className="max-w-40 truncate">
                                                            {pair.resolvedCategory ?? "—"}
                                                        </TableCell>
                                                        <TableCell className="max-w-48 truncate">
                                                            {pair.chartOfAccount}
                                                        </TableCell>
                                                        <TableCell className="max-w-48 truncate">
                                                            <Combobox
                                                                items={coaComboboxItems}
                                                                value={comboboxValue}
                                                                onValueChange={(v) => {
                                                                    setPairOverrides((prev) => {
                                                                        const next = {
                                                                            ...prev,
                                                                        };

                                                                        if (!v) {
                                                                            delete next[
                                                                                overrideKey
                                                                            ];

                                                                            return next;
                                                                        }

                                                                        const name = v.replace(
                                                                            /^[^:]+:/,
                                                                            "",
                                                                        );
                                                                        const id =
                                                                            coaNameToId.get(name);

                                                                        if (id) {
                                                                            next[overrideKey] = {
                                                                                coaId: id,
                                                                            };
                                                                        }

                                                                        return next;
                                                                    });
                                                                }}
                                                            >
                                                                <ComboboxInput
                                                                    placeholder="Search chart of account..."
                                                                    showClear
                                                                />
                                                                <ComboboxContent>
                                                                    <ComboboxEmpty>
                                                                        No items found.
                                                                    </ComboboxEmpty>
                                                                    <ComboboxList>
                                                                        {(item) => (
                                                                            <ComboboxItem
                                                                                key={item}
                                                                                value={item}
                                                                            >
                                                                                {item.replace(
                                                                                    /^[^:]+:/,
                                                                                    "",
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
                                                                        ✗ not found
                                                                    </span>
                                                                )
                                                            ) : (
                                                                <span className="text-destructive">
                                                                    ⚠ unresolvable
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {importReport && (
                        <Card className="border-emerald-200 bg-emerald-50/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">
                                        4
                                    </span>{" "}
                                    Step 4 — Results: what happened
                                </CardTitle>
                                <CardDescription>
                                    Total rows processed, how many inserted vs updated, warnings
                                    (auto-corrected) and errors (skipped). Successful rows are
                                    already saved — fix errors in Excel and re-upload only those
                                    rows (or the whole file — upsert will skip existing).
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-5 gap-2 text-sm">
                                    <div>
                                        Total:{" "}
                                        <span className="font-bold">{importReport.total}</span>
                                    </div>
                                    <div className="text-emerald-700">
                                        Inserted: {importReport.inserted}
                                    </div>
                                    <div className="text-blue-700">
                                        Updated: {importReport.updated}
                                    </div>
                                    <div className="text-amber-700">
                                        Warnings: {importReport.warnings}
                                    </div>
                                    <div className="text-destructive">
                                        Errors: {importReport.errors}
                                    </div>
                                </div>
                                <div className="mt-1 text-xs">
                                    Status:{" "}
                                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono">
                                        {importReport.status}
                                    </span>
                                </div>
                                {importReport.errorDetails &&
                                    importReport.errorDetails.length > 0 && (
                                        <div className="mt-3 max-h-40 overflow-auto rounded border bg-background p-3 text-xs">
                                            <div className="mb-1 font-medium text-destructive">
                                                Errors — rows skipped (fix and re-upload):
                                            </div>
                                            {importReport.errorDetails
                                                .slice(0, 15)
                                                .map((e: any, i: number) => (
                                                    <div key={i} className="py-0.5">
                                                        Row {e.row}: {e.message}
                                                    </div>
                                                ))}
                                            {importReport.errorDetails.length > 15 && (
                                                <div className="text-muted-foreground">
                                                    …and {importReport.errorDetails.length - 15}{" "}
                                                    more
                                                </div>
                                            )}
                                        </div>
                                    )}
                                {importReport.warningDetails &&
                                    importReport.warningDetails.length > 0 && (
                                        <div className="mt-3 max-h-40 overflow-auto rounded border bg-background p-3 text-xs">
                                            <div className="mb-1 font-medium text-amber-700">
                                                Warnings — auto-corrected and imported:
                                            </div>
                                            {importReport.warningDetails
                                                .slice(0, 15)
                                                .map((w: any, i: number) => (
                                                    <div key={i} className="py-0.5">
                                                        Row {w.row} {w.field}: {w.message} — raw:{" "}
                                                        <code>
                                                            {String(w.raw).substring(0, 50)}
                                                        </code>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}

PriceListImport.layout = {
    breadcrumbs: [
        {
            title: "Price List Importer",
            href: "#",
        },
    ],
};
