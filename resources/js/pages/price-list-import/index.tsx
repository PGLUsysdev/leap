import { Head, Link, router } from "@inertiajs/react";
import ExcelJS from "exceljs";
import { FileSpreadsheet } from "lucide-react";
import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/base-ui-components/ui/badge";
import { Button } from "@/components/base-ui-components/ui/button";
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/base-ui-components/ui/combobox";
import { Field, FieldDescription, FieldLabel } from "@/components/base-ui-components/ui/field";
import { Input } from "@/components/base-ui-components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/base-ui-components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/base-ui-components/ui/select";
import { Spinner } from "@/components/base-ui-components/ui/spinner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/base-ui-components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/base-ui-components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/base-ui-components/ui/toggle-group";
import { cellText } from "@/lib/excel/cell-helpers";
import { normalize, isTotalRow, getCategoryMatch, getCoaMatch } from "@/lib/ppmp/normalize";
import type { ExistingCategory, ExistingCoa } from "@/lib/ppmp/normalize";
import { getDefaultSharedConfig } from "@/lib/ppmp/sheet-config";
import type { SharedSheetConfig } from "@/lib/ppmp/sheet-config";

// Prices are in cols G (unit) H (price) + description/category in F, COA in D
// Reuse SharedSheetConfig which already has {category, coa, unit, price}
type PriceListSheetConfig = SharedSheetConfig;

function getDefaultPriceListConfig(): PriceListSheetConfig {
    return getDefaultSharedConfig();
}

type VerifyResult = {
    valid: boolean;
    message: string;
    errors: Array<{ row: number; message: string }>;
    details: string[];
};

type RawItem = {
    sheet: string;
    row: number;
    category: string;
    coa: string;
    description: string;
    unit: string;
    price: number | null;
    priceRaw: string | null;
};

type UniqueItem = {
    key: string;
    category: string;
    coa: string;
    description: string;
    unit: string;
    price: number | null;
    sheets: string[];
    rows: number[];
    count: number;
};

type VerifiedItem = UniqueItem & {
    catNorm: string;
    coaNorm: string;
    categoryId: number | null;
    coaId: number | null;
    mappingId: number | null;
    catExists: boolean;
    coaExists: boolean;
    mappingExists: boolean;
    priceListExists: boolean;
    junctionId: number | null;
    catMatchType: "strict" | "partial" | "none";
    coaMatchType: "strict" | "partial" | "none";
    catTopMatches: Array<{ category: ExistingCategory; score: number }>;
    coaTopMatches: Array<{ coa: ExistingCoa; score: number }>;
    catMatch: ExistingCategory | null;
    coaMatch: ExistingCoa | null;
    // effective after override (per row granular)
    effectiveCoa: ExistingCoa | null;
    effectiveCoaId: number | null;
    effectiveCoaExists: boolean;
    effectiveCoaMatchType: "strict" | "partial" | "none";
    effectiveJunctionId: number | null;
    effectiveMappingExists: boolean;
    effectivePriceListExists: boolean;
    overrideId: number | null;
    priceValid: boolean;
    unitValid: boolean;
    descriptionValid: boolean;
    status: "ready" | "update" | "error";
    message: string;
};

interface PriceListImportProps {
    existingCategories: ExistingCategory[];
    existingCoas: ExistingCoa[];
    existingMappings: Array<{ id: number; chart_of_account_id: number; ppmp_category_id: number }>;
    existingPriceLists: Array<{
        id: number;
        description: string;
        unit_of_measurement: string;
        price: string;
        chart_of_account_ppmp_category_id: number;
    }>;
}

export default function PriceListImport({
    existingCategories,
    existingCoas,
    existingMappings,
    existingPriceLists,
}: PriceListImportProps) {
    const [sheets, setSheets] = useState<string[]>([]);
    const [workbook, setWorkbook] = useState<ExcelJS.Workbook | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [calibrationMode, setCalibrationMode] = useState<"shared" | "per-sheet">("shared");
    const [sharedConfig, setSharedConfig] = useState<PriceListSheetConfig | null>(null);
    const [calibrations, setCalibrations] = useState<Record<string, PriceListSheetConfig>>({});
    const [currentSheet, setCurrentSheet] = useState<string>("");

    const [verifyResults, setVerifyResults] = useState<Record<string, VerifyResult>>({});
    const [activeVerifySheet, setActiveVerifySheet] = useState<string>("");
    const [rawItems, setRawItems] = useState<RawItem[]>([]);
    const [uniqueItems, setUniqueItems] = useState<UniqueItem[]>([]);
    const [step, setStep] = useState<"upload" | "calibrate" | "verify" | "review">("upload");
    const [importing, setImporting] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [coaOverrides, setCoaOverrides] = useState<Record<string, number>>({});
    const [reviewFilter, setReviewFilter] = useState<"all" | "errors" | "duplicates" | "longDesc">(
        "all",
    );
    const [showDuplicateDetails, setShowDuplicateDetails] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMounted(true);
    }, []);

    function getEffectiveConfig(sheet: string): PriceListSheetConfig {
        if (calibrationMode === "shared" && sharedConfig) return sharedConfig;

        return calibrations[sheet] ?? sharedConfig ?? getDefaultPriceListConfig();
    }

    const canCalibrate = selectedSheets.length > 0;
    const canVerify =
        canCalibrate &&
        !!workbook &&
        !!sharedConfig &&
        sharedConfig.rowConfig.headerRow !== "" &&
        sharedConfig.rowConfig.headerRow != null;
    const allVerifyValid =
        selectedSheets.length > 0 && selectedSheets.every((s) => verifyResults[s]?.valid);
    const hasAnyVerify = selectedSheets.some((s) => !!verifyResults[s]);
    const canReview = canVerify && hasAnyVerify && allVerifyValid;

    const junctionByPair = useMemo(() => {
        const m = new Map<string, number>();

        for (const mm of existingMappings) {
            m.set(`${mm.chart_of_account_id}|${mm.ppmp_category_id}`, mm.id);
        }

        return m;
    }, [existingMappings]);

    function handleCoaOverrideChange(rowKey: string, selectedValue: string | null) {
        if (!selectedValue) {
            setCoaOverrides((prev) => {
                const next = { ...prev };
                delete next[rowKey];

                return next;
            });

            return;
        }

        const idMatch = selectedValue.match(/^coa:(\d+)/);

        if (idMatch) {
            const id = Number(idMatch[1]);
            setCoaOverrides((prev) => ({ ...prev, [rowKey]: id }));
        } else {
            const found = existingCoas.find(
                (c) => `${c.path} — ${c.account_title}` === selectedValue,
            );

            if (found) setCoaOverrides((prev) => ({ ...prev, [rowKey]: found.id }));
        }
    }

    function handleClearOverride(rowKey: string) {
        setCoaOverrides((prev) => {
            const next = { ...prev };
            delete next[rowKey];

            return next;
        });
    }

    function handleClearAllOverrides() {
        setCoaOverrides({});
    }

    function handleTruncateDescription(rowKey: string) {
        setUniqueItems((prev) =>
            prev.map((u) => {
                if (u.key !== rowKey) return u;

                const truncated = u.description.trim().slice(0, 1000);

                return { ...u, description: truncated };
            }),
        );
    }

    function handleTruncateAllLongDescriptions() {
        setUniqueItems((prev) =>
            prev.map((u) => {
                if (u.description.trim().length <= 1000) return u;

                const truncated = u.description.trim().slice(0, 1000);

                return { ...u, description: truncated };
            }),
        );
    }

    const verifiedItems: VerifiedItem[] = useMemo(() => {
        if (uniqueItems.length === 0) return [];

        return uniqueItems.map((u) => {
            const catNorm = normalize(u.category);
            const coaNorm = normalize(u.coa);
            const catRes = getCategoryMatch(catNorm, existingCategories);
            const coaRes = getCoaMatch(coaNorm, existingCoas, "auto");
            const catExists = catRes.type === "strict";
            const coaExists = coaRes.type === "strict";
            const catId = catRes.match?.id ?? null;
            const coaId = coaRes.match?.id ?? null;

            // effective COA after per-row override
            const overrideId = coaOverrides[u.key] ?? null;
            const effectiveCoa = overrideId
                ? (existingCoas.find((c) => c.id === overrideId) ?? null)
                : (coaRes.match ?? null);
            const effectiveCoaExists = !!effectiveCoa;
            const effectiveCoaId = effectiveCoa?.id ?? null;
            const effectiveCoaMatchType: VerifiedItem["effectiveCoaMatchType"] = effectiveCoa
                ? "strict"
                : coaRes.type;
            const effectiveJunctionId =
                catId && effectiveCoaId
                    ? (junctionByPair.get(`${effectiveCoaId}|${catId}`) ?? null)
                    : null;
            const effectiveMappingExists = effectiveJunctionId !== null;

            const unitValid = u.unit.trim() !== "" && u.unit.trim().length <= 20;
            const priceValid = u.price !== null && u.price > 0;
            const descriptionValid =
                u.description.trim().length > 0 && u.description.trim().length <= 1000;
            // check price list exists (junction + normalized desc + uom) using effective junction
            let effectivePriceListExists = false;

            if (effectiveMappingExists && effectiveJunctionId) {
                effectivePriceListExists = existingPriceLists.some(
                    (p) =>
                        p.chart_of_account_ppmp_category_id === effectiveJunctionId &&
                        normalize(p.description) === normalize(u.description) &&
                        normalize(p.unit_of_measurement) === normalize(u.unit),
                );
            }

            let status: VerifiedItem["status"] = "ready";
            let message = "Ready to import";

            if (!catExists) {
                status = "error";
                message = "Category not found — create via Category Import";
            } else if (!effectiveCoaExists) {
                status = "error";
                message = "COA not found";
            } else if (!effectiveMappingExists) {
                status = "error";
                message = "Mapping not found — create via Category–COA Mappings";
            } else if (!descriptionValid) {
                status = "error";
                message =
                    u.description.trim().length === 0
                        ? "Description required"
                        : `Description >1000 chars (${u.description.trim().length}) — will be truncated or shorten`;
            } else if (!unitValid) {
                status = "error";
                message = u.unit.trim() === "" ? "Unit required" : "Unit >20 chars";
            } else if (!priceValid) {
                status = "error";
                message = "Price must be >0";
            } else if (effectivePriceListExists) {
                status = "update";
                message = "Exists — will update price";
            }

            return {
                ...u,
                catNorm,
                coaNorm,
                categoryId: catId,
                coaId,
                mappingId: effectiveJunctionId,
                junctionId: effectiveJunctionId,
                catExists,
                coaExists,
                mappingExists: effectiveMappingExists,
                priceListExists: effectivePriceListExists,
                catMatchType: catRes.type,
                coaMatchType: coaRes.type,
                catTopMatches: catRes.topMatches ?? [],
                coaTopMatches: coaRes.topMatches ?? [],
                catMatch: catRes.match ?? null,
                coaMatch: coaRes.match ?? null,
                effectiveCoa,
                effectiveCoaId,
                effectiveCoaExists,
                effectiveCoaMatchType,
                effectiveJunctionId,
                effectiveMappingExists,
                effectivePriceListExists,
                overrideId,
                unitValid,
                priceValid,
                descriptionValid,
                status,
                message,
            };
        });
    }, [
        uniqueItems,
        existingCategories,
        existingCoas,
        junctionByPair,
        existingPriceLists,
        coaOverrides,
    ]);

    const importable = verifiedItems.filter((v) => v.status === "ready" || v.status === "update");
    const importableSelected = importable.filter((v) => selected.has(v.key));
    const readyCount = importable.length;
    const errorCount = verifiedItems.filter((v) => v.status === "error").length;
    const updateCount = verifiedItems.filter((v) => v.status === "update").length;
    const insertCount = verifiedItems.filter((v) => v.status === "ready").length;
    const missingMappingCount = verifiedItems.filter(
        (v) => !v.effectiveMappingExists && v.catExists && v.effectiveCoaExists,
    ).length;

    const duplicateCount = rawItems.length - uniqueItems.length;
    const duplicateItems = useMemo(() => verifiedItems.filter((v) => v.count > 1), [verifiedItems]);
    const longDescriptionCount = verifiedItems.filter((v) => !v.descriptionValid).length;

    const filteredItems = useMemo(() => {
        if (reviewFilter === "duplicates") return verifiedItems.filter((v) => v.count > 1);

        if (reviewFilter === "errors") return verifiedItems.filter((v) => v.status === "error");

        if (reviewFilter === "longDesc") return verifiedItems.filter((v) => !v.descriptionValid);

        return verifiedItems;
    }, [verifiedItems, reviewFilter]);

    async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];

        if (!file) return;

        const isXlsx =
            file.name.toLowerCase().endsWith(".xlsx") ||
            file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

        if (!isXlsx) {
            setError("Only .xlsx files are allowed.");
            setSheets([]);
            setWorkbook(null);
            setSelectedSheets([]);
            setCurrentSheet("");
            setSharedConfig(null);
            setCalibrations({});
            setFileName(null);
            e.target.value = "";

            return;
        }

        setError(null);
        setLoading(true);
        setFileName(file.name);
        setSelectedSheets([]);
        setCurrentSheet("");
        setSharedConfig(null);
        setCalibrations({});
        setVerifyResults({});
        setActiveVerifySheet("");
        setRawItems([]);
        setUniqueItems([]);
        setSelected(new Set());
        setCoaOverrides({});
        setReviewFilter("all");
        setShowDuplicateDetails(false);
        setStep("upload");

        try {
            const wb = new ExcelJS.Workbook();
            const buf = await file.arrayBuffer();
            await wb.xlsx.load(buf);
            setWorkbook(wb);
            setSheets(wb.worksheets.map((ws) => ws.name));
        } catch {
            setError("Failed to parse .xlsx file.");
            setSheets([]);
            setWorkbook(null);
            setSelectedSheets([]);
            setFileName(null);
        } finally {
            setLoading(false);
        }
    }

    function handleSheetToggle(sheet: string) {
        setSelectedSheets((prev) => {
            const next = prev.includes(sheet) ? prev.filter((s) => s !== sheet) : [...prev, sheet];
            setVerifyResults({});
            setActiveVerifySheet(next[0] ?? "");
            setRawItems([]);
            setUniqueItems([]);
            setSelected(new Set());
            setCoaOverrides({});
            setReviewFilter("all");
            setShowDuplicateDetails(false);

            if (next.length > 0 && !next.includes(currentSheet)) setCurrentSheet(next[0]);

            if (next.length === 0) setCurrentSheet("");

            return next;
        });
    }

    function ensureCalibrationsInitialized() {
        if (sharedConfig) return;

        const def = getDefaultPriceListConfig();
        setSharedConfig(def);
        const clones: Record<string, PriceListSheetConfig> = {};

        for (const s of selectedSheets) {
            clones[s] = {
                ...def,
                columnConfig: { ...def.columnConfig },
                rowConfig: { ...def.rowConfig },
            };
        }

        setCalibrations(clones);

        if (!currentSheet && selectedSheets[0]) setCurrentSheet(selectedSheets[0]);
    }

    function handleApplySharedToAll() {
        if (!sharedConfig) return;

        const next: Record<string, PriceListSheetConfig> = {};

        for (const s of selectedSheets) {
            next[s] = {
                ...sharedConfig,
                columnConfig: { ...sharedConfig.columnConfig },
                rowConfig: { ...sharedConfig.rowConfig },
            };
        }

        setCalibrations(next);
    }

    function handleCopyCurrentToAll() {
        const src = calibrations[currentSheet] ?? sharedConfig;

        if (!src) return;

        const next: Record<string, PriceListSheetConfig> = {};

        for (const s of selectedSheets) {
            next[s] = {
                ...src,
                columnConfig: { ...src.columnConfig },
                rowConfig: { ...src.rowConfig },
            };
        }

        setCalibrations(next);
    }

    function updateSharedConfig(patch: Partial<PriceListSheetConfig>) {
        setSharedConfig((prev) => ({ ...(prev ?? getDefaultPriceListConfig()), ...patch }));
    }

    function updateCurrentCalibration(patch: Partial<PriceListSheetConfig>) {
        if (!currentSheet) return;

        setCalibrations((prev) => ({
            ...prev,
            [currentSheet]: {
                ...(prev[currentSheet] ?? sharedConfig ?? getDefaultPriceListConfig()),
                ...patch,
            },
        }));
    }

    function verifySheet(sheet: string, cfg: PriceListSheetConfig): VerifyResult {
        if (!workbook) {
            return {
                valid: false,
                message: "Workbook not loaded",
                errors: [{ row: 0, message: "Workbook not loaded" }],
                details: [],
            };
        }

        const ws = workbook.getWorksheet(sheet);

        if (!ws) {
            return {
                valid: false,
                message: `Worksheet "${sheet}" not found`,
                errors: [{ row: 0, message: `Worksheet "${sheet}" not found` }],
                details: [],
            };
        }

        const { category, coa, unit, price } = cfg.columnConfig;
        const { headerRow, additionalItemsHeaderRow, nonProcurementHeaderRow } = cfg.rowConfig;
        const { coaLabelMode } = cfg;
        const lastRow = ws.actualRowCount;

        if (headerRow === "" || headerRow == null) {
            return {
                valid: false,
                message: "Header Row is required",
                errors: [{ row: 0, message: "Header Row is required — check calibration" }],
                details: [],
            };
        }

        const procurementStart = headerRow + 1;
        const procurementEnd = additionalItemsHeaderRow
            ? additionalItemsHeaderRow - 1
            : nonProcurementHeaderRow
              ? nonProcurementHeaderRow - 1
              : lastRow;
        const additionalStart = additionalItemsHeaderRow ? additionalItemsHeaderRow + 1 : -1;
        const additionalEnd = nonProcurementHeaderRow ? nonProcurementHeaderRow - 1 : lastRow;
        const nonProcStart = nonProcurementHeaderRow ? nonProcurementHeaderRow + 1 : -1;
        const nonProcEnd = lastRow;

        const errors: Array<{ row: number; message: string }> = [];
        const details: string[] = [];
        details.push(`COA label mode: ${coaLabelMode}`);
        details.push(
            `Ranges: procurement [${procurementStart}..${procurementEnd}] additional [${additionalStart}..${additionalEnd}] non-proc [${nonProcStart}..${nonProcEnd}]`,
        );

        const countData = (s: number, e: number) => {
            if (s < 0 || e < 0 || s > e) return 0;

            let c = 0;

            for (let r = s; r <= e && r <= lastRow; r++) {
                if (cellText(ws.getRow(r).getCell(category))) c++;
            }

            return c;
        };
        const groups = {
            procurement: countData(procurementStart, procurementEnd),
            additional: additionalItemsHeaderRow ? countData(additionalStart, additionalEnd) : 0,
            nonProcurement: nonProcurementHeaderRow ? countData(nonProcStart, nonProcEnd) : 0,
        };

        if (!additionalItemsHeaderRow) {
            details.push("Additional Items header not calibrated — skipping additional check");
        }

        if (!nonProcurementHeaderRow) {
            details.push("Non-Procurement header not calibrated — skipping non-proc check");
        }

        if (procurementStart > procurementEnd) {
            errors.push({
                row: procurementStart,
                message: `Procurement range invalid [${procurementStart}..${procurementEnd}]`,
            });
        } else if (groups.procurement === 0) {
            errors.push({ row: procurementStart, message: "No data found in procurement group" });
        }

        const verifySection = (
            sectionName: "procurement" | "additional" | "non-procurement",
            startRow: number,
            endRow: number,
        ) => {
            if (startRow < 0 || endRow < 0 || startRow > endRow) return;

            if (sectionName === "additional" || sectionName === "non-procurement") {
                let itemCount = 0;

                for (let r = startRow; r <= endRow && r <= lastRow; r++) {
                    const row = ws.getRow(r);
                    const coaRaw = cellText(row.getCell(coa));
                    const dataRaw = cellText(row.getCell(category));
                    const unitRaw = cellText(row.getCell(unit));
                    const priceRaw = cellText(row.getCell(price));

                    if (!dataRaw && !coaRaw && !unitRaw && !priceRaw) continue;

                    const dataNorm = dataRaw ? normalize(dataRaw) : null;

                    if (!dataNorm) continue;

                    if (dataNorm === "description") continue;

                    if (
                        [
                            "additional items for procurement",
                            "additional items",
                            "non-procurement requirements",
                            "non - procurement requirements",
                            "additional items for procurement - total",
                            "non-procurement requirements - total",
                            "non-procurement - total",
                        ].includes(dataNorm) ||
                        isTotalRow(dataNorm)
                    ) {
                        continue;
                    }

                    const coaNorm = coaRaw ? normalize(coaRaw) : null;
                    const isFalsy = (v: string | null) =>
                        !v ||
                        normalize(v) === "0" ||
                        normalize(v) === "-" ||
                        normalize(v) === "0.00";
                    const priceNum = priceRaw ? Number(priceRaw.replace(/,/g, "")) : NaN;
                    const isFalsyPrice =
                        !priceRaw || Number.isNaN(priceNum) || priceNum === 0 || isFalsy(priceRaw);
                    const isFalsyUnit = isFalsy(unitRaw);
                    const isFalsyCoa = !coaNorm;

                    if (isFalsyCoa && isFalsyUnit && isFalsyPrice) continue;

                    if (coaNorm && dataRaw) {
                        itemCount++;
                        continue;
                    }

                    if (dataRaw && !coaNorm) {
                        errors.push({
                            row: r,
                            message: `${sectionName} item at row ${r} ("${dataRaw}") missing COA (D)`,
                        });
                    }
                }

                details.push(`${sectionName} items: ${itemCount} rows checked`);

                return;
            }

            // procurement strict cat -> coa -> items -> total
            type CatGroup = {
                cat: string;
                catRow: number;
                coas: Array<{ coa: string; coaRow: number; items: number }>;
                totalRow?: number;
            };
            const catGroups: CatGroup[] = [];
            let currentCat: CatGroup | null = null;
            let currentCoa: { coa: string; coaRow: number; items: number } | null = null;
            const flushCat = (totalRow?: number) => {
                if (currentCat) {
                    if (currentCoa) {
                        currentCat.coas.push(currentCoa);
                        currentCoa = null;
                    }

                    if (totalRow) currentCat.totalRow = totalRow;

                    catGroups.push(currentCat);
                    currentCat = null;
                }
            };

            for (let r = startRow; r <= endRow && r <= lastRow; r++) {
                const row = ws.getRow(r);
                const coaRaw = cellText(row.getCell(coa));
                const dataRaw = cellText(row.getCell(category));

                if (!dataRaw && !coaRaw) continue;

                const coaNorm = coaRaw ? normalize(coaRaw) : null;
                const dataNorm = dataRaw ? normalize(dataRaw) : null;

                if (dataNorm === "description") continue;

                if (coaNorm && dataRaw) {
                    if (!currentCat) {
                        errors.push({
                            row: r,
                            message: `Item at row ${r} ("${dataRaw}") without active category`,
                        });
                        continue;
                    }

                    if (coaLabelMode === "without-label") {
                        if (!currentCoa || coaNorm !== normalize(currentCoa.coa)) {
                            if (currentCoa) {
                                if (currentCoa.items === 0) {
                                    errors.push({
                                        row: currentCoa.coaRow,
                                        message: `COA "${currentCoa.coa}" at row ${currentCoa.coaRow} has no items before next COA`,
                                    });
                                }

                                currentCat.coas.push(currentCoa);
                            }

                            currentCoa = { coa: coaRaw!, coaRow: r, items: 1 };
                        } else {
                            currentCoa.items += 1;
                        }

                        continue;
                    } else {
                        if (!currentCoa) {
                            errors.push({
                                row: r,
                                message: `Item at row ${r} ("${dataRaw}") without active COA in cat "${currentCat.cat}"`,
                            });
                            continue;
                        }

                        if (coaNorm !== normalize(currentCoa.coa)) {
                            errors.push({
                                row: r,
                                message: `Item COA mismatch at row ${r}: D="${coaRaw}" != current COA "${currentCoa.coa}"`,
                            });
                        }

                        currentCoa.items += 1;
                        continue;
                    }
                }

                if (!dataRaw || !dataNorm) continue;

                if (isTotalRow(dataNorm)) {
                    const expected = currentCat ? normalize(`${currentCat.cat} - total`) : null;

                    if (!currentCat) {
                        errors.push({
                            row: r,
                            message: `Total "${dataRaw}" at row ${r} without active category`,
                        });
                    } else if (expected && dataNorm !== expected) {
                        errors.push({
                            row: r,
                            message: `Total mismatch at row ${r}: got "${dataRaw}" expected "${currentCat.cat} - TOTAL"`,
                        });
                    }

                    if (currentCat) {
                        if (currentCoa) {
                            currentCat.coas.push(currentCoa);
                            currentCoa = null;
                        }

                        if (currentCat.coas.length === 0) {
                            errors.push({
                                row: r,
                                message: `Category "${currentCat.cat}" has no COA groups before total`,
                            });
                        } else {
                            for (const c of currentCat.coas) {
                                if (c.items === 0) {
                                    errors.push({
                                        row: c.coaRow,
                                        message: `COA "${c.coa}" has no items`,
                                    });
                                }
                            }
                        }

                        flushCat(r);
                    }

                    continue;
                }

                if (coaLabelMode === "with-label") {
                    let isCoaLabel = false;
                    let nextCoaRaw: string | null = null;
                    let nextCoaNorm: string | null = null;

                    if (r + 1 <= lastRow) {
                        nextCoaRaw = cellText(ws.getRow(r + 1).getCell(coa));
                        nextCoaNorm = nextCoaRaw ? normalize(nextCoaRaw) : null;

                        if (nextCoaNorm && dataNorm && nextCoaNorm === dataNorm) isCoaLabel = true;
                    }

                    if (isCoaLabel) {
                        if (!currentCat) {
                            errors.push({
                                row: r,
                                message: `COA "${dataRaw}" at row ${r} without active category`,
                            });
                            continue;
                        }

                        if (currentCoa) {
                            if (currentCoa.items === 0) {
                                errors.push({
                                    row: currentCoa.coaRow,
                                    message: `COA "${currentCoa.coa}" has no items before next COA`,
                                });
                            }

                            currentCat.coas.push(currentCoa);
                        }

                        currentCoa = { coa: dataRaw, coaRow: r, items: 0 };
                        continue;
                    }
                }

                if (currentCat) {
                    errors.push({
                        row: r,
                        message: `Category "${dataRaw}" at row ${r} started before previous cat "${currentCat.cat}" closed with " - TOTAL"`,
                    });

                    if (currentCoa) {
                        if (currentCoa.items === 0) {
                            errors.push({
                                row: currentCoa.coaRow,
                                message: `COA "${currentCoa.coa}" has no items`,
                            });
                        }

                        currentCat.coas.push(currentCoa);
                        currentCoa = null;
                    }

                    catGroups.push(currentCat);
                }

                currentCat = { cat: dataRaw, catRow: r, coas: [] };
                currentCoa = null;
            }

            if (currentCat) {
                if (currentCoa) {
                    if (currentCoa.items === 0) {
                        errors.push({
                            row: currentCoa.coaRow,
                            message: `COA "${currentCoa.coa}" has no items at end`,
                        });
                    }

                    currentCat.coas.push(currentCoa);
                }

                if (!currentCat.totalRow) {
                    errors.push({
                        row: currentCat.catRow,
                        message: `Category "${currentCat.cat}" missing closing "${currentCat.cat} - TOTAL"`,
                    });
                } else if (currentCat.coas.length === 0) {
                    errors.push({
                        row: currentCat.catRow,
                        message: `Category "${currentCat.cat}" has no COAs`,
                    });
                }

                catGroups.push(currentCat);
            }

            if (catGroups.length) {
                details.push(`${sectionName} groups: ${catGroups.length} cat(s) verified`);

                for (const g of catGroups) {
                    details.push(
                        `  Cat "${g.cat}" row ${g.catRow}: ${g.coas.length} COA(s)${g.totalRow ? ` → total at ${g.totalRow}` : " MISSING total"}`,
                    );
                }
            }
        };
        verifySection("procurement", procurementStart, procurementEnd);

        if (additionalItemsHeaderRow) verifySection("additional", additionalStart, additionalEnd);

        if (nonProcurementHeaderRow) verifySection("non-procurement", nonProcStart, nonProcEnd);

        const valid = errors.length === 0;
        const message = valid ? `✅ Format OK` : `❌ Found ${errors.length} issue(s)`;

        return { valid, message, errors, details };
    }

    function handleVerify() {
        if (!workbook || selectedSheets.length === 0) return;

        if (!sharedConfig) ensureCalibrationsInitialized();

        const next: Record<string, VerifyResult> = {};

        for (const sheet of selectedSheets) {
            const cfg = getEffectiveConfig(sheet);
            const r = verifySheet(sheet, cfg);
            next[sheet] = r;
        }

        setVerifyResults(next);
        const firstInvalid = selectedSheets.find((s) => !next[s]?.valid);
        setActiveVerifySheet(firstInvalid ?? selectedSheets[0] ?? "");
        setRawItems([]);
        setUniqueItems([]);
        setSelected(new Set());
        setCoaOverrides({});
        setReviewFilter("all");
        setShowDuplicateDetails(false);
    }

    function extractItemsForSection(
        ws: ExcelJS.Worksheet,
        cfg: PriceListSheetConfig,
        sectionName: "procurement" | "additional" | "non-procurement",
        startRow: number,
        endRow: number,
    ): RawItem[] {
        const out: RawItem[] = [];
        const dataColumn = cfg.columnConfig.category;
        const coaColumn = cfg.columnConfig.coa;
        const unitColumn = cfg.columnConfig.unit;
        const priceColumn = cfg.columnConfig.price;
        const coaLabelMode = cfg.coaLabelMode;
        type CatGroup = { cat: string; catRow: number };
        let currentCat: CatGroup | null = null;
        let currentCoa: { coa: string; coaRow: number } | null = null;
        const lastRow = ws.actualRowCount;
        const sheetName = ws.name;

        for (let r = startRow; r <= endRow && r <= lastRow; r++) {
            const row = ws.getRow(r);
            const coaRaw = cellText(row.getCell(coaColumn));
            const dataRaw = cellText(row.getCell(dataColumn));

            if (!dataRaw && !coaRaw) continue;

            const coaNorm = coaRaw ? normalize(coaRaw) : null;
            const dataNorm = dataRaw ? normalize(dataRaw) : null;

            if (dataNorm === "description") continue;

            const unitRaw = cellText(row.getCell(unitColumn)) ?? "";
            const priceRaw = cellText(row.getCell(priceColumn));
            const priceNum = priceRaw ? Number(priceRaw.replace(/,/g, "")) : null;
            const isFalsy = (v: string | null) =>
                !v || normalize(v) === "0" || normalize(v) === "-" || normalize(v) === "0.00";
            const isFalsyPrice =
                !priceRaw ||
                priceNum === 0 ||
                Number.isNaN(priceNum as number) ||
                isFalsy(priceRaw);
            const isFalsyUnit = isFalsy(unitRaw);
            const isFalsyCoa = !coaNorm;

            if (isFalsyCoa && isFalsyUnit && isFalsyPrice && dataRaw) {
                if (sectionName === "additional" || sectionName === "non-procurement") continue;
            }

            if (coaNorm && dataRaw) {
                if (!currentCat) {
                    if (sectionName === "additional") {
                        currentCat = { cat: "Additional Items (Uncategorized)", catRow: r };
                    } else if (sectionName === "non-procurement") {
                        currentCat = { cat: "Non-Procurement (Uncategorized)", catRow: r };
                    } else continue;
                }

                if (coaLabelMode === "without-label") {
                    if (!currentCoa || coaNorm !== normalize(currentCoa.coa)) {
                        currentCoa = { coa: coaRaw!, coaRow: r };
                    }
                } else {
                    if (!currentCoa) {
                        currentCoa = { coa: coaRaw!, coaRow: r };
                    } else if (coaNorm !== normalize(currentCoa.coa)) {
                        currentCoa = { coa: coaRaw!, coaRow: r };
                    }
                }

                // For without-label, item COA is coaRaw itself; for with-label, also coaRaw (since D has COA)
                // But we prefer currentCoa.coa
                const effectiveCoa = currentCoa?.coa ?? coaRaw!;
                const effectiveCat = currentCat.cat;
                // skip if description is same as COA label? Already handled
                out.push({
                    sheet: sheetName,
                    row: r,
                    category: effectiveCat,
                    coa: effectiveCoa,
                    description: dataRaw,
                    unit: unitRaw,
                    price: priceNum !== null && !Number.isNaN(priceNum) ? priceNum : null,
                    priceRaw,
                });
                continue;
            }

            if (!dataRaw || !dataNorm) continue;

            if (isTotalRow(dataNorm)) {
                if (currentCat) {
                    // flush – but for price list extraction we just keep cat until next
                    // total indicates end of currentCat
                    if (currentCoa) currentCoa = null;

                    // keep currentCat until next cat overwrites? Instead null to avoid stray items
                    // For simplicity, keep cat until overwritten; but total means next rows are new cat or end
                    // We'll set a flag: after total, next item without cat should not be captured until new cat
                    // So clear currentCat only if next cat will be set; for now keep but will be overwritten
                    // To align with grouping, clear after total
                    currentCat = null;
                    currentCoa = null;
                }

                continue;
            }

            if (coaLabelMode === "with-label") {
                let isCoaLabel = false;
                let nextCoaRaw: string | null = null;
                let nextCoaNorm: string | null = null;

                if (r + 1 <= lastRow) {
                    nextCoaRaw = cellText(ws.getRow(r + 1).getCell(coaColumn));
                    nextCoaNorm = nextCoaRaw ? normalize(nextCoaRaw) : null;

                    if (nextCoaNorm && dataNorm && nextCoaNorm === dataNorm) isCoaLabel = true;
                }

                if (isCoaLabel) {
                    if (!currentCat) {
                        if (sectionName === "additional") {
                            currentCat = { cat: "Additional Items (Uncategorized)", catRow: r };
                        } else if (sectionName === "non-procurement") {
                            currentCat = { cat: "Non-Procurement (Uncategorized)", catRow: r };
                        } else continue;
                    }

                    currentCoa = { coa: dataRaw, coaRow: r };
                    continue;
                }
            }

            // category header
            if (currentCat) {
                /* push previous cat done */
            }

            currentCat = { cat: dataRaw, catRow: r };
            currentCoa = null;
        }

        return out;
    }

    function handleExtract() {
        if (!workbook || selectedSheets.length === 0) return;

        const all: RawItem[] = [];

        for (const sheet of selectedSheets) {
            const ws = workbook.getWorksheet(sheet);

            if (!ws) continue;

            const cfg = getEffectiveConfig(sheet);

            if (cfg.rowConfig.headerRow === "" || cfg.rowConfig.headerRow == null) continue;

            const lastRow = ws.actualRowCount;
            const procurementStart = cfg.rowConfig.headerRow + 1;
            const procurementEnd = cfg.rowConfig.additionalItemsHeaderRow
                ? cfg.rowConfig.additionalItemsHeaderRow - 1
                : cfg.rowConfig.nonProcurementHeaderRow
                  ? cfg.rowConfig.nonProcurementHeaderRow - 1
                  : lastRow;
            const additionalStart = cfg.rowConfig.additionalItemsHeaderRow
                ? cfg.rowConfig.additionalItemsHeaderRow + 1
                : -1;
            const additionalEnd = cfg.rowConfig.nonProcurementHeaderRow
                ? cfg.rowConfig.nonProcurementHeaderRow - 1
                : lastRow;
            const nonProcStart = cfg.rowConfig.nonProcurementHeaderRow
                ? cfg.rowConfig.nonProcurementHeaderRow + 1
                : -1;
            const nonProcEnd = lastRow;
            all.push(
                ...extractItemsForSection(ws, cfg, "procurement", procurementStart, procurementEnd),
            );

            if (cfg.rowConfig.additionalItemsHeaderRow) {
                all.push(
                    ...extractItemsForSection(
                        ws,
                        cfg,
                        "additional",
                        additionalStart,
                        additionalEnd,
                    ),
                );
            }

            if (cfg.rowConfig.nonProcurementHeaderRow) {
                all.push(
                    ...extractItemsForSection(ws, cfg, "non-procurement", nonProcStart, nonProcEnd),
                );
            }
        }

        setRawItems(all);
        // dedupe by normalize(category|coa|description+unit)
        const seen = new Map<string, UniqueItem>();

        for (const it of all) {
            const key = `${normalize(it.category)}|${normalize(it.coa)}|${normalize(it.description)}|${normalize(it.unit)}`;
            const existing = seen.get(key);

            if (!existing) {
                seen.set(key, {
                    key,
                    category: it.category,
                    coa: it.coa,
                    description: it.description,
                    unit: it.unit,
                    price: it.price,
                    sheets: [it.sheet],
                    rows: [it.row],
                    count: 1,
                });
            } else {
                existing.count += 1;

                if (!existing.sheets.includes(it.sheet)) existing.sheets.push(it.sheet);

                existing.rows.push(it.row);

                // keep first price, but if existing price null and new has price, update
                if (existing.price === null && it.price !== null) existing.price = it.price;
            }
        }

        const unique = [...seen.values()].sort((a, b) =>
            a.description.localeCompare(b.description),
        );
        setUniqueItems(unique);
        setSelected(new Set(unique.map((u) => u.key)));
        setCoaOverrides({});
        setReviewFilter("all");
        setShowDuplicateDetails(false);
        console.log("Extract price-list", {
            raw: all.length,
            uniqueCount: unique.length,
            all,
            unique,
        });
    }

    function handleImport() {
        const toImport = verifiedItems.filter(
            (v) => selected.has(v.key) && (v.status === "ready" || v.status === "update"),
        );

        if (toImport.length === 0) {
            console.warn(
                "PriceListImport: nothing to import — selected",
                [...selected],
                "verified",
                verifiedItems.length,
            );

            return;
        }

        console.log("PriceListImport: posting", toImport.length, toImport.slice(0, 3));

        setImporting(true);
        router.post(
            "/price-list-import" as const,
            {
                items: toImport.map((v) => ({
                    chart_of_account_id: v.effectiveCoaId!,
                    ppmp_category_id: v.categoryId!,
                    description: v.description,
                    unit_of_measurement: v.unit,
                    price: v.price!,
                })),
            } as never,
            {
                onFinish: () => setImporting(false),
                onError: (errors) => {
                    console.error("PriceListImport: validation 422", errors);
                    setImporting(false);
                },
                onSuccess: (page) => {
                    console.log(
                        "PriceListImport: success",
                        (page.props as unknown as Record<string, unknown>)?.flash,
                    );
                },
            },
        );
    }

    return (
        <ScrollArea className="h-[calc(100vh-3rem)]" suppressHydrationWarning>
            <Head title="Price List Import" />
            <div className="flex flex-col gap-4 p-4" suppressHydrationWarning>
                <h1 className="text-2xl font-semibold">Price List Import</h1>
                <p className="text-sm text-muted-foreground">
                    Imports <strong>price list only</strong> (no quantities). Requires official{" "}
                    <Link href="/category-import" className="underline">
                        Category Import
                    </Link>{" "}
                    and{" "}
                    <Link href="/category-coa-mapping" className="underline">
                        Category–COA Mappings
                    </Link>{" "}
                    to exist first.
                </p>

                {fileName && !loading && (
                    <div className="sticky top-0 z-10 flex items-center gap-2 rounded-md border px-3 py-2 text-sm backdrop-blur">
                        <FileSpreadsheet className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="max-w-[42ch] truncate font-medium" title={fileName}>
                            {fileName}
                        </span>
                        <span className="hidden text-muted-foreground sm:inline">•</span>
                        <span className="truncate text-muted-foreground">
                            {selectedSheets.length > 0
                                ? `${selectedSheets.length}/${sheets.length} sheets: ${selectedSheets.join(", ")}`
                                : `${sheets.length} sheets found`}
                        </span>
                    </div>
                )}

                <Tabs
                    value={step}
                    onValueChange={(v) => setStep(v as typeof step)}
                    suppressHydrationWarning
                >
                    <TabsList variant="line" className="w-full" suppressHydrationWarning>
                        <TabsTrigger value="upload" className="flex-1">
                            1. Upload & Sheets{" "}
                            {selectedSheets.length > 0 && (
                                <span className="ml-1 text-xs text-muted-foreground">
                                    {selectedSheets.length}✓
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="calibrate" disabled={!canCalibrate} className="flex-1">
                            2. Calibrate{" "}
                            {sharedConfig && (
                                <span className="ml-1 text-xs text-muted-foreground">
                                    {calibrationMode}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="verify" disabled={!canVerify} className="flex-1">
                            3. Verify Format{" "}
                            {allVerifyValid && (
                                <span className="ml-1 text-xs text-green-600">
                                    ✓{selectedSheets.length}
                                </span>
                            )}
                            {!allVerifyValid && hasAnyVerify && (
                                <span className="ml-1 text-xs text-amber-600">
                                    {Object.values(verifyResults).filter((r) => r.valid).length}/
                                    {selectedSheets.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="review" disabled={!canReview} className="flex-1">
                            4. Review & Import{" "}
                            {uniqueItems.length > 0 && (
                                <span className="ml-1 text-xs text-muted-foreground">
                                    {uniqueItems.length}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="upload" className="mt-4 flex flex-col gap-4">
                        <Field>
                            <FieldLabel htmlFor="price-list-file">
                                Excel File (.xlsx only)
                            </FieldLabel>
                            <Input
                                id="price-list-file"
                                type="file"
                                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                onChange={handleFileChange}
                                disabled={loading}
                            />
                            <FieldDescription>
                                Select an .xlsx price list export (PPMP template).
                            </FieldDescription>
                            {error && <p className="text-sm text-destructive">{error}</p>}
                        </Field>
                        {loading && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Spinner /> Parsing workbook...
                            </div>
                        )}
                        {!loading && sheets.length > 0 && (
                            <Field>
                                <FieldLabel>Sheets — click to select one or more</FieldLabel>
                                <div className="flex flex-wrap gap-2 rounded-lg border p-3">
                                    {sheets.map((sheet) => {
                                        const isSelected = selectedSheets.includes(sheet);

                                        return (
                                            <Badge
                                                key={sheet}
                                                variant={isSelected ? "default" : "secondary"}
                                                className="cursor-pointer text-sm hover:opacity-80"
                                                onClick={() => handleSheetToggle(sheet)}
                                            >
                                                {sheet} {isSelected && "✓"}
                                            </Badge>
                                        );
                                    })}
                                </div>
                                <FieldDescription>
                                    Selected:{" "}
                                    <span className="font-medium text-foreground">
                                        {selectedSheets.length > 0
                                            ? selectedSheets.join(", ")
                                            : "none"}
                                    </span>{" "}
                                    — {selectedSheets.length}/{sheets.length} sheets
                                </FieldDescription>
                            </Field>
                        )}
                        <div className="flex justify-end">
                            <Button
                                suppressHydrationWarning
                                disabled={isMounted ? selectedSheets.length === 0 : false}
                                onClick={() => {
                                    ensureCalibrationsInitialized();
                                    setStep("calibrate");
                                }}
                            >
                                Next: Calibrate{" "}
                                {selectedSheets.length > 0 && `(${selectedSheets.length} sheets)`}
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="calibrate" className="mt-4 flex flex-col gap-4">
                        <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
                            <span className="text-sm font-medium">Scope:</span>
                            <div className="flex gap-2">
                                <Button
                                    variant={calibrationMode === "shared" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => {
                                        if (
                                            calibrationMode === "per-sheet" &&
                                            calibrations[currentSheet]
                                        ) {
                                            setSharedConfig({ ...calibrations[currentSheet] });
                                        } else if (!sharedConfig) ensureCalibrationsInitialized();

                                        setCalibrationMode("shared");
                                    }}
                                >
                                    Shared — all {selectedSheets.length} sheets
                                </Button>
                                <Button
                                    variant={
                                        calibrationMode === "per-sheet" ? "default" : "outline"
                                    }
                                    size="sm"
                                    onClick={() => {
                                        if (sharedConfig) {
                                            const next: Record<string, PriceListSheetConfig> = {};

                                            for (const s of selectedSheets) {
                                                next[s] = {
                                                    ...sharedConfig,
                                                    columnConfig: {
                                                        ...sharedConfig.columnConfig,
                                                    },
                                                    rowConfig: { ...sharedConfig.rowConfig },
                                                };
                                            }

                                            setCalibrations(next);

                                            if (!currentSheet && selectedSheets[0]) {
                                                setCurrentSheet(selectedSheets[0]);
                                            }
                                        }

                                        setCalibrationMode("per-sheet");
                                    }}
                                >
                                    Per-sheet
                                </Button>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {calibrationMode === "shared"
                                    ? `Header row ${sharedConfig?.rowConfig.headerRow === "" || sharedConfig?.rowConfig.headerRow == null ? 7 : sharedConfig.rowConfig.headerRow} applies to every sheet`
                                    : `Editing ${currentSheet || "—"} only affects that sheet`}
                            </span>
                            {calibrationMode === "shared" ? (
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

                        {calibrationMode === "per-sheet" && selectedSheets.length > 1 && (
                            <Field>
                                <FieldLabel>Editing sheet</FieldLabel>
                                <Select
                                    value={currentSheet}
                                    onValueChange={(v) => setCurrentSheet(v ?? "")}
                                >
                                    <SelectTrigger className="w-[260px]">
                                        <SelectValue placeholder="Select sheet to edit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {selectedSheets.map((s) => (
                                                <SelectItem key={s} value={s}>
                                                    {s}{" "}
                                                    {verifyResults[s]?.valid
                                                        ? "✓"
                                                        : verifyResults[s]
                                                          ? "❌"
                                                          : ""}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </Field>
                        )}

                        {(() => {
                            const cfg =
                                calibrationMode === "shared"
                                    ? (sharedConfig ?? getDefaultPriceListConfig())
                                    : (calibrations[currentSheet] ??
                                      sharedConfig ??
                                      getDefaultPriceListConfig());
                            const onChange = (patch: Partial<PriceListSheetConfig>) => {
                                if (calibrationMode === "shared") updateSharedConfig(patch);
                                else updateCurrentCalibration(patch);

                                setVerifyResults({});
                                setRawItems([]);
                                setUniqueItems([]);
                                setSelected(new Set());
                                setCoaOverrides({});
                                setReviewFilter("all");
                                setShowDuplicateDetails(false);
                            };
                            const onColumn = (
                                patch: Partial<SharedSheetConfig["columnConfig"]>,
                            ) => {
                                const next = { ...cfg.columnConfig, ...patch };
                                onChange({
                                    columnConfig: next,
                                } as Partial<PriceListSheetConfig>);
                            };
                            const onRow = (patch: Partial<SharedSheetConfig["rowConfig"]>) => {
                                const next = { ...cfg.rowConfig, ...patch };
                                onChange({
                                    rowConfig: next,
                                } as unknown as Partial<PriceListSheetConfig>);
                            };

                            return (
                                <div className="rounded-lg border p-4">
                                    <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        Calibration{" "}
                                        {calibrationMode === "shared"
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
                                    </div>
                                    <div className="mt-4 grid grid-cols-3 gap-4">
                                        <Field>
                                            <FieldLabel>Header Row</FieldLabel>
                                            <Input
                                                type="number"
                                                value={cfg.rowConfig.headerRow ?? ""}
                                                onChange={(e) =>
                                                    onRow({
                                                        headerRow:
                                                            e.target.value === ""
                                                                ? ""
                                                                : Number(e.target.value),
                                                    })
                                                }
                                                className="w-20"
                                                placeholder="7"
                                            />
                                            <FieldDescription>
                                                Header{" "}
                                                {cfg.rowConfig.headerRow === "" ||
                                                cfg.rowConfig.headerRow == null
                                                    ? "—"
                                                    : cfg.rowConfig.headerRow}
                                                ; data starts{" "}
                                                {cfg.rowConfig.headerRow === "" ||
                                                cfg.rowConfig.headerRow == null
                                                    ? "—"
                                                    : cfg.rowConfig.headerRow + 1}
                                            </FieldDescription>
                                        </Field>
                                        <Field>
                                            <FieldLabel>
                                                Additional Items Header Row (optional)
                                            </FieldLabel>
                                            <Input
                                                type="number"
                                                value={cfg.rowConfig.additionalItemsHeaderRow ?? ""}
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
                                                value={cfg.rowConfig.nonProcurementHeaderRow ?? ""}
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
                                                            value[0] as PriceListSheetConfig["coaLabelMode"],
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
                                                <span className="text-xs font-normal text-muted-foreground">
                                                    Category → COA label in F (next D same) → Items
                                                    with D=COA
                                                </span>
                                                <span className="font-mono text-xs text-muted-foreground/70">
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
                                                <span className="text-xs font-normal text-muted-foreground">
                                                    Items already have D=COA directly, no label rows
                                                </span>
                                                <span className="font-mono text-xs text-muted-foreground/70">
                                                    Cat → items (D=coa) → Cat - Total
                                                </span>
                                            </ToggleGroupItem>
                                        </ToggleGroup>
                                    </Field>
                                </div>
                            );
                        })()}
                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep("upload")}>
                                Back
                            </Button>
                            <Button
                                suppressHydrationWarning
                                onClick={() => setStep("verify")}
                                disabled={isMounted ? !sharedConfig : false}
                            >
                                Next: Verify Format
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="verify" className="mt-4 flex flex-col gap-4">
                        <div className="flex gap-2">
                            <Button onClick={handleVerify}>
                                Run Verify ({selectedSheets.length} sheets)
                            </Button>
                            {hasAnyVerify && allVerifyValid && (
                                <Badge variant="default" className="self-center">
                                    All valid ✓
                                </Badge>
                            )}
                            {hasAnyVerify && !allVerifyValid && (
                                <Badge variant="destructive" className="self-center">
                                    {Object.values(verifyResults).filter((r) => r.valid).length}/
                                    {selectedSheets.length} valid
                                </Badge>
                            )}
                        </div>
                        {hasAnyVerify && (
                            <>
                                {selectedSheets.length > 1 && (
                                    <div className="flex gap-2">
                                        {selectedSheets.map((s) => (
                                            <Badge
                                                key={s}
                                                variant={
                                                    verifyResults[s]?.valid
                                                        ? "default"
                                                        : "secondary"
                                                }
                                                className="cursor-pointer"
                                                onClick={() => setActiveVerifySheet(s)}
                                            >
                                                {s} {verifyResults[s]?.valid ? "✓" : "❌"}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                                {(() => {
                                    const active = activeVerifySheet || selectedSheets[0];
                                    const r = verifyResults[active];

                                    if (!r) return null;

                                    return (
                                        <div className="rounded-lg border p-4">
                                            <p
                                                className={`text-sm font-medium ${r.valid ? "text-green-600" : "text-destructive"}`}
                                            >
                                                {r.message} — {active}
                                            </p>
                                            {r.errors.length > 0 && (
                                                <div className="mt-2 max-h-48 overflow-auto rounded border p-2 text-xs">
                                                    {r.errors.map((e, i) => (
                                                        <div key={i}>
                                                            Row {e.row}: {e.message}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {r.details.length > 0 && (
                                                <div className="mt-2 text-xs text-muted-foreground">
                                                    {r.details.map((d, i) => (
                                                        <div key={i}>{d}</div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </>
                        )}
                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep("calibrate")}>
                                Back
                            </Button>
                            <Button
                                suppressHydrationWarning
                                disabled={isMounted ? !allVerifyValid : false}
                                onClick={() => {
                                    handleExtract();
                                    setStep("review");
                                }}
                            >
                                Next: Extract {allVerifyValid ? "✓" : "(fix errors first)"}
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="review" className="mt-4 flex flex-col gap-4">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                            <Badge variant="secondary">Raw items: {rawItems.length}</Badge>
                            <Badge variant="secondary">Unique: {uniqueItems.length}</Badge>
                            <Badge variant="default">
                                Ready: {insertCount} + Updates: {updateCount} = {readyCount}
                            </Badge>
                            {errorCount > 0 && (
                                <Badge variant="destructive">
                                    {errorCount} errors (missing official mapping)
                                </Badge>
                            )}
                            {missingMappingCount > 0 && (
                                <Badge
                                    variant="outline"
                                    className="border-amber-500 text-amber-600"
                                >
                                    {missingMappingCount} missing mapping
                                </Badge>
                            )}
                            {longDescriptionCount > 0 && (
                                <Badge variant="destructive">
                                    {longDescriptionCount} description &gt;1000
                                </Badge>
                            )}
                            {longDescriptionCount > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleTruncateAllLongDescriptions}
                                    className="h-6 border-amber-600 text-xs text-amber-700"
                                    title="Truncate all long descriptions to 1000 characters"
                                >
                                    Truncate all to 1000
                                </Button>
                            )}
                            {duplicateCount > 0 && (
                                <Badge
                                    variant="outline"
                                    className="border-amber-500 text-amber-600"
                                >
                                    {duplicateCount} duplicate{duplicateCount > 1 ? "s" : ""} (
                                    {duplicateItems.length} unique)
                                </Badge>
                            )}
                            {(errorCount > 0 || duplicateCount > 0 || longDescriptionCount > 0) && (
                                <ToggleGroup
                                    value={[reviewFilter]}
                                    onValueChange={(v) => {
                                        const next = (v as unknown as string[])[0] as
                                            typeof reviewFilter | undefined;

                                        if (next) {
                                            setReviewFilter(next);
                                            setShowDuplicateDetails(false);
                                        } else {
                                            setReviewFilter("all");
                                        }
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="gap-1"
                                >
                                    <ToggleGroupItem value="all" aria-label="Show all">
                                        All ({verifiedItems.length})
                                    </ToggleGroupItem>
                                    <ToggleGroupItem
                                        value="errors"
                                        aria-label="Show only errors"
                                        disabled={errorCount === 0}
                                    >
                                        Errors ({errorCount})
                                    </ToggleGroupItem>
                                    <ToggleGroupItem
                                        value="duplicates"
                                        aria-label="Show only duplicates"
                                        disabled={duplicateCount === 0}
                                    >
                                        Duplicates ({duplicateItems.length})
                                    </ToggleGroupItem>
                                    <ToggleGroupItem
                                        value="longDesc"
                                        aria-label="Show only long descriptions"
                                        disabled={longDescriptionCount === 0}
                                    >
                                        Long desc ({longDescriptionCount})
                                    </ToggleGroupItem>
                                </ToggleGroup>
                            )}
                            {duplicateCount > 0 && reviewFilter !== "duplicates" && (
                                <Button
                                    variant={showDuplicateDetails ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setShowDuplicateDetails((v) => !v)}
                                    className="h-6 text-xs"
                                >
                                    {showDuplicateDetails
                                        ? "Hide duplicate details"
                                        : "Show duplicate details"}
                                </Button>
                            )}
                            {Object.keys(coaOverrides).length > 0 && (
                                <Badge
                                    variant="outline"
                                    className="border-amber-500 text-amber-600"
                                >
                                    {Object.keys(coaOverrides).length} COA override(s)
                                </Badge>
                            )}
                            {Object.keys(coaOverrides).length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleClearAllOverrides}
                                    className="h-6 text-xs"
                                >
                                    Clear overrides
                                </Button>
                            )}
                        </div>
                        {Object.keys(coaOverrides).length > 0 && (
                            <p className="text-xs text-amber-600">
                                Overrides are per unique price-list row
                                (`category|coa|description|unit`). Counts reflect overridden COAs.
                            </p>
                        )}
                        {reviewFilter === "errors" && (
                            <p className="text-xs text-muted-foreground">
                                Showing {filteredItems.length} of {verifiedItems.length} — only rows
                                with errors (COA not found, category not found, mapping missing,
                                description &gt;1000, etc.). Select “All” to see all. COA dropdowns
                                let you fix partial matches per row (e.g., row 468).
                            </p>
                        )}
                        {reviewFilter === "duplicates" && (
                            <p className="text-xs text-amber-600">
                                Showing {filteredItems.length} duplicate unique row
                                {filteredItems.length === 1 ? "" : "s"} ({duplicateCount} extra raw
                                row{duplicateCount === 1 ? "" : "s"}) — same
                                category|coa|description|unit appears multiple times. Select “All”
                                to see all.
                            </p>
                        )}
                        {reviewFilter === "longDesc" && (
                            <p className="text-xs text-amber-600">
                                Showing {filteredItems.length} of {verifiedItems.length} — only rows
                                with description &gt;1000 chars. Use “Truncate” per row or “Truncate
                                all to 1000” above. Select “All” to see all.
                            </p>
                        )}
                        {showDuplicateDetails && duplicateItems.length > 0 && (
                            <div className="rounded-lg border p-3">
                                <p className="mb-2 text-xs font-semibold">
                                    Duplicate details — {duplicateItems.length} unique duplicate(s),{" "}
                                    {duplicateCount} extra raw row
                                    {duplicateCount === 1 ? "" : "s"} (Raw {rawItems.length} →
                                    Unique {uniqueItems.length})
                                </p>
                                <div className="max-h-64 overflow-auto rounded border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Category</TableHead>
                                                <TableHead>COA</TableHead>
                                                <TableHead>Unit</TableHead>
                                                <TableHead>Price</TableHead>
                                                <TableHead>Count</TableHead>
                                                <TableHead>Sheets / Rows</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {duplicateItems.map((it) => (
                                                <TableRow key={it.key}>
                                                    <TableCell
                                                        className="max-w-[24ch] truncate text-xs"
                                                        title={it.description}
                                                    >
                                                        {it.description}
                                                    </TableCell>
                                                    <TableCell
                                                        className="max-w-[16ch] truncate text-xs"
                                                        title={it.category}
                                                    >
                                                        {it.category}
                                                    </TableCell>
                                                    <TableCell
                                                        className="max-w-[16ch] truncate text-xs"
                                                        title={it.coa}
                                                    >
                                                        {it.coa}
                                                    </TableCell>
                                                    <TableCell className="text-xs">
                                                        {it.unit}
                                                    </TableCell>
                                                    <TableCell className="text-xs">
                                                        {it.price !== null
                                                            ? `₱${it.price.toLocaleString()}`
                                                            : "—"}
                                                    </TableCell>
                                                    <TableCell className="text-xs">
                                                        <Badge
                                                            variant="outline"
                                                            className="border-amber-500 text-amber-600"
                                                        >
                                                            ×{it.count}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-[10px] text-muted-foreground">
                                                        {it.sheets.join(", ")} row{" "}
                                                        {it.rows.join(", ")}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <p className="mt-2 text-[10px] text-muted-foreground">
                                    Duplicates are deduped by normalized
                                    category|coa|description|unit. Raw rows with same key are
                                    merged; count shows how many raw rows collapsed.
                                </p>
                            </div>
                        )}
                        {verifiedItems.length > 0 ? (
                            <>
                                <div className="rounded-lg border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-8">
                                                    <Input
                                                        type="checkbox"
                                                        checked={
                                                            filteredItems.length > 0 &&
                                                            filteredItems.every(
                                                                (v) =>
                                                                    selected.has(v.key) ||
                                                                    v.status === "error",
                                                            )
                                                        }
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                const toAdd = filteredItems
                                                                    .filter(
                                                                        (v) => v.status !== "error",
                                                                    )
                                                                    .map((v) => v.key);
                                                                setSelected(
                                                                    (prev) =>
                                                                        new Set([
                                                                            ...prev,
                                                                            ...toAdd,
                                                                        ]),
                                                                );
                                                            } else {
                                                                const filteredKeys = new Set(
                                                                    filteredItems.map((v) => v.key),
                                                                );
                                                                setSelected(
                                                                    (prev) =>
                                                                        new Set(
                                                                            [...prev].filter(
                                                                                (k) =>
                                                                                    !filteredKeys.has(
                                                                                        k,
                                                                                    ),
                                                                            ),
                                                                        ),
                                                                );
                                                            }
                                                        }}
                                                    />
                                                </TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Category</TableHead>
                                                <TableHead className="min-w-[320px]">
                                                    COA (Excel → DB)
                                                </TableHead>
                                                <TableHead>Unit</TableHead>
                                                <TableHead>Price</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredItems.length === 0 ? (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={7}
                                                        className="p-8 text-center text-sm text-muted-foreground"
                                                    >
                                                        {reviewFilter === "duplicates"
                                                            ? "No duplicates — all rows are unique. Select “All” to see all items."
                                                            : reviewFilter === "errors"
                                                              ? "No errors — all rows are ready or updates. Select “All” to see all items."
                                                              : reviewFilter === "longDesc"
                                                                ? "No long descriptions — all descriptions ≤1000 chars. Select “All” to see all items."
                                                                : "No items match filter."}
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredItems.map((it) => {
                                                    const isOverridden = it.overrideId !== null;
                                                    const selectedDisplay = it.effectiveCoa
                                                        ? `coa:${it.effectiveCoa.id}:${it.effectiveCoa.path} — ${it.effectiveCoa.account_title}`
                                                        : "";
                                                    const suggestedIds = new Set(
                                                        it.coaTopMatches.map((m) => m.coa.id),
                                                    );
                                                    const suggestedCoas = it.coaTopMatches.map(
                                                        (m) => m.coa,
                                                    );
                                                    const remainingCoas = existingCoas.filter(
                                                        (c) => !suggestedIds.has(c.id),
                                                    );
                                                    const itemsForRow =
                                                        it.coaMatchType === "partial" &&
                                                        suggestedCoas.length > 0
                                                            ? [
                                                                  ...suggestedCoas.map(
                                                                      (c) =>
                                                                          `coa:${c.id}:${c.path} — ${c.account_title}`,
                                                                  ),
                                                                  ...remainingCoas.map(
                                                                      (c) =>
                                                                          `coa:${c.id}:${c.path} — ${c.account_title}`,
                                                                  ),
                                                              ]
                                                            : existingCoas.map(
                                                                  (c) =>
                                                                      `coa:${c.id}:${c.path} — ${c.account_title}`,
                                                              );

                                                    return (
                                                        <TableRow key={it.key}>
                                                            <TableCell>
                                                                <Input
                                                                    type="checkbox"
                                                                    checked={selected.has(it.key)}
                                                                    onChange={(e) => {
                                                                        const n = new Set(selected);

                                                                        if (e.target.checked) {
                                                                            n.add(it.key);
                                                                        } else {
                                                                            n.delete(it.key);
                                                                        }

                                                                        setSelected(n);
                                                                    }}
                                                                    disabled={it.status === "error"}
                                                                />
                                                            </TableCell>
                                                            <TableCell
                                                                className="max-w-[28ch] truncate"
                                                                title={it.description}
                                                            >
                                                                <span className="flex items-center gap-1">
                                                                    <span className="truncate">
                                                                        {it.description}
                                                                    </span>
                                                                    {it.count > 1 && (
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="h-4 border-amber-500 px-1 text-[10px] text-amber-600"
                                                                        >
                                                                            ×{it.count}
                                                                        </Badge>
                                                                    )}
                                                                    {!it.descriptionValid && (
                                                                        <Badge
                                                                            variant="destructive"
                                                                            className="h-4 px-1 text-[10px]"
                                                                            title={`Length ${it.description.trim().length} > 1000`}
                                                                        >
                                                                            {
                                                                                it.description.trim()
                                                                                    .length
                                                                            }
                                                                            /1000
                                                                        </Badge>
                                                                    )}
                                                                </span>
                                                                {!it.descriptionValid && (
                                                                    <div className="mt-1 flex gap-1">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() =>
                                                                                handleTruncateDescription(
                                                                                    it.key,
                                                                                )
                                                                            }
                                                                            className="h-5 px-1 text-[10px] text-amber-600 hover:text-amber-700"
                                                                        >
                                                                            Truncate to 1000
                                                                        </Button>
                                                                        <span className="self-center text-[10px] text-muted-foreground">
                                                                            will cut to &quot;
                                                                            {it.description
                                                                                .trim()
                                                                                .slice(0, 1000)
                                                                                .slice(-20)}
                                                                            &quot;
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </TableCell>

                                                            <TableCell className="text-xs">
                                                                <div className="flex items-center gap-1">
                                                                    <span
                                                                        className="truncate"
                                                                        title={it.category}
                                                                    >
                                                                        {it.category}
                                                                    </span>
                                                                    {it.catExists ? (
                                                                        <Badge
                                                                            variant="secondary"
                                                                            className="h-4 px-1 text-[10px]"
                                                                        >
                                                                            ✓
                                                                        </Badge>
                                                                    ) : it.catMatchType ===
                                                                      "partial" ? (
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="h-4 px-1 text-[10px]"
                                                                        >
                                                                            ~
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge
                                                                            variant="secondary"
                                                                            className="h-4 px-1 text-[10px]"
                                                                        >
                                                                            ❌
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-xs">
                                                                <div className="flex flex-col gap-1">
                                                                    <span
                                                                        className="truncate text-[10px] text-muted-foreground"
                                                                        title={`Excel: ${it.coa}`}
                                                                    >
                                                                        Excel: {it.coa}{" "}
                                                                        {it.coaExists
                                                                            ? "✓"
                                                                            : it.coaMatchType ===
                                                                                "partial"
                                                                              ? "~ partial"
                                                                              : "❌"}
                                                                    </span>
                                                                    <div className="flex items-center gap-1">
                                                                        <Combobox
                                                                            items={itemsForRow}
                                                                            value={selectedDisplay}
                                                                            onValueChange={(val) =>
                                                                                handleCoaOverrideChange(
                                                                                    it.key,
                                                                                    val as
                                                                                        | string
                                                                                        | null,
                                                                                )
                                                                            }
                                                                        >
                                                                            <ComboboxInput
                                                                                placeholder={
                                                                                    it.coaMatchType ===
                                                                                    "partial"
                                                                                        ? "★ Suggested at top — search..."
                                                                                        : "Search COA..."
                                                                                }
                                                                                className="h-7 text-xs"
                                                                            />
                                                                            <ComboboxContent>
                                                                                <ComboboxEmpty>
                                                                                    No COA found.
                                                                                </ComboboxEmpty>
                                                                                <ComboboxList>
                                                                                    {(
                                                                                        item: string,
                                                                                    ) => {
                                                                                        const isSuggested =
                                                                                            it.coaTopMatches.some(
                                                                                                (
                                                                                                    m,
                                                                                                ) =>
                                                                                                    item.includes(
                                                                                                        `coa:${m.coa.id}:`,
                                                                                                    ),
                                                                                            );

                                                                                        return (
                                                                                            <ComboboxItem
                                                                                                key={
                                                                                                    item
                                                                                                }
                                                                                                value={
                                                                                                    item
                                                                                                }
                                                                                                className={
                                                                                                    isSuggested
                                                                                                        ? "font-medium"
                                                                                                        : ""
                                                                                                }
                                                                                            >
                                                                                                {isSuggested
                                                                                                    ? "★ "
                                                                                                    : ""}
                                                                                                {item.replace(
                                                                                                    /^coa:\d+:/,
                                                                                                    "",
                                                                                                )}
                                                                                            </ComboboxItem>
                                                                                        );
                                                                                    }}
                                                                                </ComboboxList>
                                                                            </ComboboxContent>
                                                                        </Combobox>
                                                                        {isOverridden && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-7 px-1 text-xs"
                                                                                onClick={() =>
                                                                                    handleClearOverride(
                                                                                        it.key,
                                                                                    )
                                                                                }
                                                                            >
                                                                                ✕
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                    {it.effectiveCoa ? (
                                                                        <div
                                                                            className="truncate text-xs text-green-600"
                                                                            title={`${it.effectiveCoa.path} — ${it.effectiveCoa.account_title}`}
                                                                        >
                                                                            → {it.effectiveCoa.path}{" "}
                                                                            —{" "}
                                                                            {
                                                                                it.effectiveCoa
                                                                                    .account_title
                                                                            }
                                                                        </div>
                                                                    ) : it.coaTopMatches.length >
                                                                      0 ? (
                                                                        <div
                                                                            className="truncate text-xs text-muted-foreground"
                                                                            title={it.coaTopMatches
                                                                                .map(
                                                                                    (m) =>
                                                                                        `${m.coa.path} — ${m.coa.account_title} (score ${m.score})`,
                                                                                )
                                                                                .join(" | ")}
                                                                        >
                                                                            Suggest:{" "}
                                                                            {
                                                                                it.coaTopMatches[0]
                                                                                    .coa.path
                                                                            }{" "}
                                                                            —{" "}
                                                                            {
                                                                                it.coaTopMatches[0]
                                                                                    .coa
                                                                                    .account_title
                                                                            }
                                                                        </div>
                                                                    ) : null}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>{it.unit}</TableCell>
                                                            <TableCell>
                                                                {it.price !== null
                                                                    ? `₱${it.price.toLocaleString()}`
                                                                    : "—"}
                                                            </TableCell>
                                                            <TableCell className="text-xs">
                                                                {it.status === "error" ? (
                                                                    <span className="text-destructive">
                                                                        {it.message}{" "}
                                                                        {!it.catExists && (
                                                                            <Link
                                                                                href="/category-import"
                                                                                className="underline"
                                                                            >
                                                                                Category Import
                                                                            </Link>
                                                                        )}{" "}
                                                                        {!it.effectiveCoaExists &&
                                                                            " "}{" "}
                                                                        {!it.effectiveMappingExists &&
                                                                            it.catExists &&
                                                                            it.effectiveCoaExists && (
                                                                                <Link
                                                                                    href="/category-coa-mapping"
                                                                                    className="underline"
                                                                                >
                                                                                    → Map
                                                                                </Link>
                                                                            )}
                                                                    </span>
                                                                ) : it.status === "update" ? (
                                                                    <span className="text-amber-600">
                                                                        {it.message}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-green-600">
                                                                        {it.message}
                                                                    </span>
                                                                )}
                                                                <div className="text-[10px] text-muted-foreground">
                                                                    {it.sheets.join(", ")} row{" "}
                                                                    {it.rows.join(", ")}{" "}
                                                                    {it.count > 1 && `×${it.count}`}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="flex justify-between">
                                    <Button variant="outline" onClick={() => setStep("verify")}>
                                        Back
                                    </Button>
                                    <Button
                                        suppressHydrationWarning
                                        disabled={
                                            isMounted
                                                ? importableSelected.length === 0 || importing
                                                : false
                                        }
                                        onClick={handleImport}
                                    >
                                        {importing
                                            ? "Importing..."
                                            : `Import ${importableSelected.length} price lists (${insertCount} new + ${updateCount} updates)`}
                                    </Button>
                                </div>
                                {importableSelected.length === 0 &&
                                    !importing &&
                                    verifiedItems.length > 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            {importable.length === 0
                                                ? `No importable rows — all ${errorCount} rows are errors. Fix Category/COA via dropdowns or create mappings in Category–COA Mappings.`
                                                : `No rows selected — ${importable.length} importable available. Check a row or click header checkbox. Selected: ${selected.size}/${verifiedItems.length}`}
                                        </p>
                                    )}
                                {selected.size > 0 &&
                                    importableSelected.length === 0 &&
                                    importable.length > 0 && (
                                        <p className="text-xs text-amber-600">
                                            Selected rows are all errors and cannot be imported.
                                            Select only Ready/Update rows (green/amber).
                                        </p>
                                    )}
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Run Verify, then Extract to see items. Items require existing
                                Category (via{" "}
                                <Link href="/category-import" className="underline">
                                    Category Import
                                </Link>
                                ) and Mapping (via{" "}
                                <Link href="/category-coa-mapping" className="underline">
                                    Category–COA Mappings
                                </Link>
                                ).
                            </p>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            <ScrollBar orientation="vertical" />
        </ScrollArea>
    );
}

PriceListImport.layout = {
    breadcrumbs: [
        { title: "Imports", href: "/imports" },
        { title: "Price List Import", href: "/price-list-import" },
    ],
};
