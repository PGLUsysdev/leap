import { router } from "@inertiajs/react";
import ExcelJS from "exceljs";
import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/base-ui-components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/base-ui-components/ui/toggle-group";
import { cellText } from "@/lib/excel/cell-helpers";
import { normalize, isTotalRow, getCategoryMatch, getCoaMatch } from "@/lib/ppmp/normalize";
import type { ExistingCategory, ExistingCoa } from "@/lib/ppmp/normalize";
import { getDefaultMappingConfig } from "@/lib/ppmp/sheet-config";
import type {
    CategoryCoaSheetConfig,
    CategoryCoaColumnConfig,
    CategoryCoaRowConfig,
} from "@/lib/ppmp/sheet-config";
import { index as categoryCoaMappingIndex } from "@/routes/category-coa-mapping";
import { index as importsIndex } from "@/routes/imports";

type VerifyFormatResult = {
    valid: boolean;
    message: string;
    errors: Array<{ row: number; message: string }>;
    groups: { procurement: number; additional: number; nonProcurement: number };
    details: string[];
};

type ExistingMapping = { chart_of_account_id: number; ppmp_category_id: number };

interface CategoryCoaMappingProps {
    existingCategories?: ExistingCategory[];
    existingCoas?: ExistingCoa[];
    existingMappings?: ExistingMapping[];
}

export default function CategoryCoaMappingPage({
    existingCategories = [],
    existingCoas = [],
    existingMappings = [],
}: CategoryCoaMappingProps) {
    const [sheets, setSheets] = useState<string[]>([]);
    const [workbook, setWorkbook] = useState<ExcelJS.Workbook | null>(null);
    const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    // Calibration – shared + per-sheet (multi-sheet)
    const [calibrationMode, setCalibrationMode] = useState<"shared" | "per-sheet">("shared");
    const [sharedConfig, setSharedConfig] = useState<CategoryCoaSheetConfig | null>(null);
    const [calibrations, setCalibrations] = useState<Record<string, CategoryCoaSheetConfig>>({});
    const [currentSheet, setCurrentSheet] = useState<string>("");
    const [coaOverrides, setCoaOverrides] = useState<Record<string, number>>({});
    const [verification, setVerification] = useState<{
        total: number;
        catFound: number;
        coaFound: number;
        mappingFound: number;
        missingCat: number;
        missingCoa: number;
        missingMapping: number;
        verifiedPairs: Array<{
            category: string;
            coa: string;
            section: string;
            sheet: string;
            catRow: number;
            coaRow: number;
            items: number;
            catNorm: string;
            coaNorm: string;
            catExists: boolean;
            coaExists: boolean;
            mappingExists: boolean;
            catId: number | null;
            coaId: number | null;
            catMatchType: "strict" | "partial" | "none";
            coaMatchType: "strict" | "partial" | "none";
            catMatch: ExistingCategory | null;
            coaMatch: ExistingCoa | null;
            catTopMatches: Array<{ category: ExistingCategory; score: number }>;
            coaTopMatches: Array<{ coa: ExistingCoa; score: number }>;
        }>;
    } | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [step, setStep] = useState<
        "upload" | "calibrate" | "verifyFormat" | "verifyMap" | "review"
    >("upload");
    const [formatResults, setFormatResults] = useState<Record<string, VerifyFormatResult>>({});
    const [activeFormatSheet, setActiveFormatSheet] = useState<string>("");
    const [activeVerifySheet, setActiveVerifySheet] = useState<string>("");

    const canCalibrate = selectedSheets.length > 0;
    const canVerifyFormat = selectedSheets.length > 0 && !!workbook && !!sharedConfig;
    const hasFormatResult =
        selectedSheets.length > 0 && selectedSheets.every((s) => !!formatResults[s]);
    const formatValid =
        selectedSheets.length > 0 && selectedSheets.every((s) => formatResults[s]?.valid);
    const canVerifyMap = canVerifyFormat && hasFormatResult && formatValid;
    const canReview = canVerifyMap && !!verification && verification.total > 0;

    function getEffectiveConfig(sheet: string): CategoryCoaSheetConfig {
        if (calibrationMode === "shared" && sharedConfig) return sharedConfig;

        return calibrations[sheet] ?? sharedConfig ?? getDefaultMappingConfig();
    }

    function ensureCalibrationsInitialized() {
        if (sharedConfig) return;

        const def = getDefaultMappingConfig();
        setSharedConfig(def);
        const clones: Record<string, CategoryCoaSheetConfig> = {};

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

        const next: Record<string, CategoryCoaSheetConfig> = {};

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

        const next: Record<string, CategoryCoaSheetConfig> = {};

        for (const s of selectedSheets) {
            next[s] = {
                ...src,
                columnConfig: { ...src.columnConfig },
                rowConfig: { ...src.rowConfig },
            };
        }

        setCalibrations(next);
    }

    function updateSharedConfig(patch: Partial<CategoryCoaSheetConfig>) {
        setSharedConfig((prev) => ({ ...(prev ?? getDefaultMappingConfig()), ...patch }));
    }

    function updateCurrentCalibration(patch: Partial<CategoryCoaSheetConfig>) {
        if (!currentSheet) return;

        setCalibrations((prev) => ({
            ...prev,
            [currentSheet]: {
                ...(prev[currentSheet] ?? sharedConfig ?? getDefaultMappingConfig()),
                ...patch,
            },
        }));
    }

    function updateSharedColumnConfig(patch: Partial<CategoryCoaColumnConfig>) {
        updateSharedConfig({
            columnConfig: {
                ...(sharedConfig?.columnConfig ?? getDefaultMappingConfig().columnConfig),
                ...patch,
            },
        });
    }

    function updateSharedRowConfig(patch: Partial<CategoryCoaRowConfig>) {
        updateSharedConfig({
            rowConfig: {
                ...(sharedConfig?.rowConfig ?? getDefaultMappingConfig().rowConfig),
                ...patch,
            },
        });
    }

    const effectiveVerification = useMemo(() => {
        if (!verification) return null;

        const mappingSet = new Set(
            existingMappings.map((m) => `${m.ppmp_category_id}|${m.chart_of_account_id}`),
        );
        const effectivePairs = verification.verifiedPairs.map((v) => {
            const key = `${v.sheet}|${v.catRow}|${v.coaRow}`;
            const overrideId = coaOverrides[key] ?? null;
            const effectiveCoa = overrideId
                ? (existingCoas.find((c) => c.id === overrideId) ?? null)
                : v.coaMatch;
            const effectiveCoaExists = overrideId !== null ? true : v.coaExists;
            const effectiveCoaId = overrideId ?? v.coaId;
            const effectiveCoaMatchType =
                overrideId !== null ? ("strict" as const) : v.coaMatchType;
            const effectiveMappingExists =
                v.catId !== null &&
                effectiveCoaId !== null &&
                mappingSet.has(`${v.catId}|${effectiveCoaId}`);

            return {
                ...v,
                key,
                overrideId,
                effectiveCoa,
                effectiveCoaExists,
                effectiveCoaId,
                effectiveCoaMatchType,
                effectiveMappingExists,
            };
        });
        const effCoaFound = effectivePairs.filter((p) => p.effectiveCoaExists).length;
        const effMappingFound = effectivePairs.filter((p) => p.effectiveMappingExists).length;
        const effMissingMapping = effectivePairs.filter(
            (p) => p.catExists && p.effectiveCoaExists && !p.effectiveMappingExists,
        ).length;
        const effMissingCoa = effectivePairs.filter((p) => !p.effectiveCoaExists).length;

        return {
            ...verification,
            effectivePairs,
            effCoaFound,
            effMappingFound,
            effMissingMapping,
            effMissingCoa,
        };
    }, [verification, coaOverrides, existingCoas, existingMappings]);

    function handleCoaOverrideChange(rowKey: string, selectedValue: string | null) {
        if (!selectedValue) {
            setCoaOverrides((prev) => {
                const next = { ...prev };
                delete next[rowKey];

                return next;
            });

            return;
        }

        // selectedValue format: "coa:<id>:<path> — <title>" or just "coa:<id>"
        const idMatch = selectedValue.match(/^coa:(\d+)/);

        if (idMatch) {
            const id = Number(idMatch[1]);
            setCoaOverrides((prev) => ({ ...prev, [rowKey]: id }));
        } else {
            // fallback try find by path/title
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

    function handleBulkCreateMappings() {
        if (!effectiveVerification) return;

        const toCreate = effectiveVerification.effectivePairs
            .filter(
                (p) =>
                    p.catExists &&
                    p.effectiveCoaExists &&
                    !p.effectiveMappingExists &&
                    p.catId !== null &&
                    p.effectiveCoaId !== null,
            )
            .map((p) => ({ ppmp_category_id: p.catId!, chart_of_account_id: p.effectiveCoaId! }));

        if (toCreate.length === 0) return;

        // dedupe by ppmp_category_id|chart_of_account_id (same mapping may appear from multiple rows due to dedupe already)
        const seen = new Set<string>();
        const uniqueToCreate: typeof toCreate = [];

        for (const m of toCreate) {
            const k = `${m.ppmp_category_id}|${m.chart_of_account_id}`;

            if (!seen.has(k)) {
                seen.add(k);
                uniqueToCreate.push(m);
            }
        }

        setIsSaving(true);
        router.post("/category-coa-mappings/bulk" as never, { mappings: uniqueToCreate } as never, {
            onFinish: () => setIsSaving(false),
            // Keep overrides after success so UI still shows manual mapping; page will reload with new existingMappings
        });
    }

    function verifyFormatForSheet(sheet: string): VerifyFormatResult | null {
        if (!workbook || !sheet) return null;

        const ws = workbook.getWorksheet(sheet);

        if (!ws) {
            return {
                valid: false,
                message: `Worksheet "${sheet}" not found`,
                errors: [{ row: 0, message: `Worksheet "${sheet}" not found` }],
                groups: { procurement: 0, additional: 0, nonProcurement: 0 },
                details: [],
            };
        }

        const effective = getEffectiveConfig(sheet);

        if (effective.rowConfig.headerRow === "" || effective.rowConfig.headerRow == null) {
            return {
                valid: false,
                message: "Header Row is required",
                errors: [{ row: 0, message: "Header Row is required — check calibration" }],
                groups: { procurement: 0, additional: 0, nonProcurement: 0 },
                details: [],
            };
        }

        const { coaLabelMode } = effective;
        const dataColumn = effective.columnConfig.category;
        const coaColumn = effective.columnConfig.coa;
        const lastRow = ws.actualRowCount;
        const procurementStart = effective.rowConfig.headerRow + 1;
        const procurementEnd = effective.rowConfig.additionalItemsHeaderRow
            ? effective.rowConfig.additionalItemsHeaderRow - 1
            : effective.rowConfig.nonProcurementHeaderRow
              ? effective.rowConfig.nonProcurementHeaderRow - 1
              : lastRow;
        const additionalStart = effective.rowConfig.additionalItemsHeaderRow
            ? effective.rowConfig.additionalItemsHeaderRow + 1
            : -1;
        const additionalEnd = effective.rowConfig.nonProcurementHeaderRow
            ? effective.rowConfig.nonProcurementHeaderRow - 1
            : lastRow;
        const nonProcStart = effective.rowConfig.nonProcurementHeaderRow
            ? effective.rowConfig.nonProcurementHeaderRow + 1
            : -1;
        const nonProcEnd = lastRow;

        const errors: Array<{ row: number; message: string }> = [];
        const details: string[] = [];
        details.push(
            `COA label mode: ${coaLabelMode === "without-label" ? "Without label (COA on item rows)" : "With label (COA label rows)"}`,
        );
        details.push(
            `Ranges: procurement [${procurementStart}..${procurementEnd}] additional [${additionalStart}..${additionalEnd}] non-proc [${nonProcStart}..${nonProcEnd}]`,
        );

        const groups = { procurement: 0, additional: 0, nonProcurement: 0 };
        const countData = (s: number, e: number) => {
            if (s < 0 || e < 0 || s > e) return 0;

            let c = 0;

            for (let r = s; r <= e && r <= lastRow; r++) {
                const v = cellText(ws.getRow(r).getCell(dataColumn));

                if (v) c++;
            }

            return c;
        };
        groups.procurement = countData(procurementStart, procurementEnd);
        groups.additional = effective.rowConfig.additionalItemsHeaderRow
            ? countData(additionalStart, additionalEnd)
            : 0;
        groups.nonProcurement = effective.rowConfig.nonProcurementHeaderRow
            ? countData(nonProcStart, nonProcEnd)
            : 0;

        if (!effective.rowConfig.additionalItemsHeaderRow) {
            details.push(
                "Additional Items header not calibrated — skipping additional group check",
            );
        }

        if (!effective.rowConfig.nonProcurementHeaderRow) {
            details.push(
                "Non-Procurement header not calibrated — skipping non-procurement group check",
            );
        }

        if (procurementStart > procurementEnd) {
            errors.push({
                row: procurementStart,
                message: `Procurement range invalid [${procurementStart}..${procurementEnd}] — check header calibrations`,
            });
        } else if (groups.procurement === 0) {
            errors.push({
                row: procurementStart,
                message: "No data found in procurement group — check header calibration",
            });
        }

        if (effective.rowConfig.additionalItemsHeaderRow && groups.additional === 0) {
            errors.push({
                row: additionalStart,
                message: "No data found in additional items group",
            });
        }

        const verifySection = (
            sectionName: "procurement" | "additional" | "non-procurement",
            startRow: number,
            endRow: number,
        ) => {
            if (startRow < 0 || endRow < 0 || startRow > endRow) return;

            if (sectionName === "additional" || sectionName === "non-procurement") {
                // Item-only: header → items (F+D+G+H) → optional section total, no categories
                // If E/D/G/H all falsy, it's not a true pricelist (e.g., placeholder "Miscellaneous Goods..." with G/H 0) — skip
                let itemCount = 0;

                for (let r = startRow; r <= endRow && r <= lastRow; r++) {
                    const row = ws.getRow(r);
                    const coaRaw = cellText(row.getCell(coaColumn));
                    const dataRaw = cellText(row.getCell(dataColumn));
                    const unitRaw = cellText(row.getCell(effective.columnConfig.unit));
                    const priceRaw = cellText(row.getCell(effective.columnConfig.price));
                    const itemRaw = cellText(row.getCell(effective.columnConfig.itemNumber));

                    if (!dataRaw && !coaRaw && !unitRaw && !priceRaw) continue;

                    const dataNorm = dataRaw ? normalize(dataRaw) : null;

                    if (!dataNorm) continue;

                    if (dataNorm === "description") continue;

                    // Skip section header echo and section totals
                    if (
                        dataNorm === "additional items for procurement" ||
                        dataNorm === "additional items" ||
                        dataNorm === "non-procurement requirements" ||
                        dataNorm === "non - procurement requirements" ||
                        dataNorm === "additional items for procurement - total" ||
                        dataNorm === "non-procurement requirements - total" ||
                        dataNorm === "non-procurement - total" ||
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
                        !priceRaw || priceNum === 0 || Number.isNaN(priceNum) || isFalsy(priceRaw);
                    const isFalsyUnit = isFalsy(unitRaw);
                    const isFalsyCoa = !coaNorm;
                    const isFalsyItem = !itemRaw;

                    // If E/D/G/H all falsy, it's not a true pricelist (placeholder like Miscellaneous... with G/H 0) — skip, not an error
                    if (isFalsyItem && isFalsyCoa && isFalsyUnit && isFalsyPrice) continue;

                    if (coaNorm && dataRaw) {
                        itemCount++;
                        continue;
                    }

                    if (dataRaw && !coaNorm) {
                        errors.push({
                            row: r,
                            message: `${sectionName} item at row ${r} ("${dataRaw}") missing COA (D) in ${sectionName}`,
                        });
                    }
                }

                details.push(
                    `${sectionName} items: ${itemCount} pricelist rows checked (no categories) in rows [${startRow}..${endRow}]`,
                );

                return;
            }

            // Procurement: strict cat → coa → items → total
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
                const coaRaw = cellText(row.getCell(coaColumn));
                const dataRaw = cellText(row.getCell(dataColumn));

                if (!dataRaw && !coaRaw) continue;

                const coaNorm = coaRaw ? normalize(coaRaw) : null;
                const dataNorm = dataRaw ? normalize(dataRaw) : null;

                if (dataNorm === "description") continue;

                if (coaNorm && dataRaw) {
                    if (!currentCat) {
                        errors.push({
                            row: r,
                            message: `Item at row ${r} ("${dataRaw}") found without active category in ${sectionName}`,
                        });
                        continue;
                    }

                    if (coaLabelMode === "without-label") {
                        if (!currentCoa || coaNorm !== normalize(currentCoa.coa)) {
                            if (currentCoa) {
                                if (currentCoa.items === 0) {
                                    errors.push({
                                        row: currentCoa.coaRow,
                                        message: `COA "${currentCoa.coa}" at row ${currentCoa.coaRow} in cat "${currentCat.cat}" has no items before next COA (${sectionName})`,
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
                                message: `Item at row ${r} ("${dataRaw}") found without active COA in cat "${currentCat.cat}" (${sectionName})`,
                            });
                            continue;
                        }

                        if (coaNorm !== normalize(currentCoa.coa)) {
                            errors.push({
                                row: r,
                                message: `Item COA mismatch at row ${r}: D="${coaRaw}" != current COA "${currentCoa.coa}" in cat "${currentCat.cat}" (${sectionName})`,
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
                            message: `Total "${dataRaw}" at row ${r} without active category (${sectionName})`,
                        });
                    } else if (expected && dataNorm !== expected) {
                        errors.push({
                            row: r,
                            message: `Total mismatch at row ${r}: got "${dataRaw}" (norm "${dataNorm}") expected "${currentCat.cat} - TOTAL" (${sectionName})`,
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
                                message: `Category "${currentCat.cat}" at row ${currentCat.catRow} has no COA groups before total (${sectionName})`,
                            });
                        } else {
                            for (const c of currentCat.coas) {
                                if (c.items === 0) {
                                    errors.push({
                                        row: c.coaRow,
                                        message: `COA "${c.coa}" at row ${c.coaRow} in cat "${currentCat.cat}" has no items (${sectionName})`,
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
                        nextCoaRaw = cellText(ws.getRow(r + 1).getCell(coaColumn));
                        nextCoaNorm = nextCoaRaw ? normalize(nextCoaRaw) : null;

                        if (nextCoaNorm && dataNorm && nextCoaNorm === dataNorm) isCoaLabel = true;
                    }

                    if (isCoaLabel) {
                        if (!currentCat) {
                            errors.push({
                                row: r,
                                message: `COA "${dataRaw}" at row ${r} found without active category (${sectionName})`,
                            });
                            continue;
                        }

                        if (currentCoa) {
                            if (currentCoa.items === 0) {
                                errors.push({
                                    row: currentCoa.coaRow,
                                    message: `COA "${currentCoa.coa}" at row ${currentCoa.coaRow} in cat "${currentCat.cat}" has no items before next COA (${sectionName})`,
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
                        message: `Category "${dataRaw}" at row ${r} started before previous cat "${currentCat.cat}" (row ${currentCat.catRow}) closed with " - TOTAL" (${sectionName})`,
                    });

                    if (currentCoa) {
                        if (currentCoa.items === 0) {
                            errors.push({
                                row: currentCoa.coaRow,
                                message: `COA "${currentCoa.coa}" at row ${currentCoa.coaRow} in cat "${currentCat.cat}" has no items (${sectionName})`,
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
                            message: `COA "${currentCoa.coa}" at row ${currentCoa.coaRow} in cat "${currentCat.cat}" has no items at end (${sectionName})`,
                        });
                    }

                    currentCat.coas.push(currentCoa);
                }

                if (!currentCat.totalRow) {
                    errors.push({
                        row: currentCat.catRow,
                        message: `Category "${currentCat.cat}" at row ${currentCat.catRow} missing closing "${currentCat.cat} - TOTAL" (${sectionName}) (found ${currentCat.coas.length} COA(s))`,
                    });
                } else if (currentCat.coas.length === 0) {
                    errors.push({
                        row: currentCat.catRow,
                        message: `Category "${currentCat.cat}" has no COAs (${sectionName})`,
                    });
                }

                catGroups.push(currentCat);
            }

            if (catGroups.length) {
                details.push(
                    `${sectionName} groups: ${catGroups.length} cat(s) verified in rows [${startRow}..${endRow}]`,
                );

                for (const g of catGroups) {
                    details.push(
                        `  ${sectionName} Cat "${g.cat}" row ${g.catRow}: ${g.coas.length} COA(s)${g.totalRow ? ` → total at ${g.totalRow}` : " MISSING total"}`,
                    );
                }
            }
        };

        verifySection("procurement", procurementStart, procurementEnd);

        if (effective.rowConfig.additionalItemsHeaderRow) {
            verifySection("additional", additionalStart, additionalEnd);
        }

        if (effective.rowConfig.nonProcurementHeaderRow) {
            verifySection("non-procurement", nonProcStart, nonProcEnd);
        }

        const valid = errors.length === 0;
        const message = valid
            ? `✅ Format OK — ${groups.procurement} procurement, ${groups.additional} additional, ${groups.nonProcurement} non-proc cells checked`
            : `❌ Found ${errors.length} issue(s) in sheet format`;
        console.log(`[${sheet}] Format Verification`, message, errors, details);

        return { valid, message, errors, groups, details };
    }

    function handleVerifyFormat() {
        if (!workbook || selectedSheets.length === 0) return;

        const next: Record<string, VerifyFormatResult> = {};

        for (const sheet of selectedSheets) {
            const result = verifyFormatForSheet(sheet);

            if (result) next[sheet] = result;
        }

        setFormatResults(next);
        const firstInvalid = selectedSheets.find((s) => !next[s]?.valid);
        setActiveFormatSheet(firstInvalid ?? selectedSheets[0] ?? "");
        setVerification(null);
        setCoaOverrides({});
        setActiveVerifySheet(firstInvalid ?? selectedSheets[0] ?? "");

        if (Object.keys(next).length) {
            console.table(
                Object.entries(next).map(([sheet, r]) => ({
                    sheet,
                    valid: r.valid,
                    errors: r.errors.length,
                    message: r.message,
                })),
            );
        }
    }

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
            setFormatResults({});
            setActiveFormatSheet("");
            setActiveVerifySheet("");
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
        setFormatResults({});
        setActiveFormatSheet("");
        setActiveVerifySheet("");
        setVerification(null);
        setCoaOverrides({});
        setStep("upload");

        try {
            const wb = new ExcelJS.Workbook();
            const arrayBuffer = await file.arrayBuffer();
            await wb.xlsx.load(arrayBuffer);
            setWorkbook(wb);
            setSheets(wb.worksheets.map((ws) => ws.name));
        } catch {
            setError("Failed to parse .xlsx file.");
            setSheets([]);
            setWorkbook(null);
            setSelectedSheets([]);
            setCurrentSheet("");
            setSharedConfig(null);
            setCalibrations({});
            setFileName(null);
        } finally {
            setLoading(false);
        }
    }

    function handleSheetToggle(sheet: string) {
        setSelectedSheets((prev) => {
            const next = prev.includes(sheet) ? prev.filter((s) => s !== sheet) : [...prev, sheet];
            setFormatResults({});
            setActiveFormatSheet(next[0] ?? "");
            setActiveVerifySheet(next[0] ?? "");
            setVerification(null);
            setCoaOverrides({});

            if (next.length > 0 && !next.includes(currentSheet)) setCurrentSheet(next[0]);

            if (next.length === 0) setCurrentSheet("");

            return next;
        });
    }

    function handleSheetClick(sheet: string) {
        handleSheetToggle(sheet);
    }

    function handleRowConfigChange(patch: Partial<CategoryCoaRowConfig>) {
        if (calibrationMode === "shared") {
            setSharedConfig((prev) => {
                const base = prev ?? getDefaultMappingConfig();

                return { ...base, rowConfig: { ...base.rowConfig, ...patch } };
            });
        } else {
            if (!currentSheet) return;

            setCalibrations((prev) => ({
                ...prev,
                [currentSheet]: {
                    ...(prev[currentSheet] ?? sharedConfig ?? getDefaultMappingConfig()),
                    rowConfig: {
                        ...(prev[currentSheet] ?? sharedConfig ?? getDefaultMappingConfig())
                            .rowConfig,
                        ...patch,
                    },
                },
            }));
        }

        setVerification(null);
        setFormatResults({});
        setActiveFormatSheet(selectedSheets[0] ?? "");
        setActiveVerifySheet(selectedSheets[0] ?? "");
        setCoaOverrides({});
    }

    function handleColumnConfigChange(patch: Partial<CategoryCoaColumnConfig>) {
        if (calibrationMode === "shared") {
            setSharedConfig((prev) => {
                const base = prev ?? getDefaultMappingConfig();

                return { ...base, columnConfig: { ...base.columnConfig, ...patch } };
            });
        } else {
            if (!currentSheet) return;

            setCalibrations((prev) => ({
                ...prev,
                [currentSheet]: {
                    ...(prev[currentSheet] ?? sharedConfig ?? getDefaultMappingConfig()),
                    columnConfig: {
                        ...(prev[currentSheet] ?? sharedConfig ?? getDefaultMappingConfig())
                            .columnConfig,
                        ...patch,
                    },
                },
            }));
        }

        setVerification(null);
        setFormatResults({});
        setActiveFormatSheet(selectedSheets[0] ?? "");
        setActiveVerifySheet(selectedSheets[0] ?? "");
        setCoaOverrides({});
    }

    function handleMatchFieldChange(value: CategoryCoaSheetConfig["coaMatchField"]) {
        if (calibrationMode === "shared") {
            setSharedConfig((prev) => ({
                ...(prev ?? getDefaultMappingConfig()),
                coaMatchField: value,
            }));
        } else {
            if (!currentSheet) return;

            setCalibrations((prev) => ({
                ...prev,
                [currentSheet]: {
                    ...(prev[currentSheet] ?? sharedConfig ?? getDefaultMappingConfig()),
                    coaMatchField: value,
                },
            }));
        }

        setVerification(null);
        setFormatResults({});
        setActiveFormatSheet(selectedSheets[0] ?? "");
        setActiveVerifySheet(selectedSheets[0] ?? "");
        setCoaOverrides({});
    }

    function handleCoaLabelModeChange(value: CategoryCoaSheetConfig["coaLabelMode"]) {
        if (calibrationMode === "shared") {
            setSharedConfig((prev) => ({
                ...(prev ?? getDefaultMappingConfig()),
                coaLabelMode: value,
            }));
        } else {
            if (!currentSheet) return;

            setCalibrations((prev) => ({
                ...prev,
                [currentSheet]: {
                    ...(prev[currentSheet] ?? sharedConfig ?? getDefaultMappingConfig()),
                    coaLabelMode: value,
                },
            }));
        }

        setVerification(null);
        setFormatResults({});
        setActiveFormatSheet(selectedSheets[0] ?? "");
        setActiveVerifySheet(selectedSheets[0] ?? "");
        setCoaOverrides({});
    }

    function handleResetCalibration() {
        if (calibrationMode === "shared") {
            setSharedConfig(getDefaultMappingConfig());
        } else {
            if (currentSheet) {
                setCalibrations((prev) => ({ ...prev, [currentSheet]: getDefaultMappingConfig() }));
            }
        }

        setVerification(null);
        setFormatResults({});
        setActiveFormatSheet(selectedSheets[0] ?? "");
        setActiveVerifySheet(selectedSheets[0] ?? "");
        setCoaOverrides({});
    }

    // Relationship extraction – all sections, no verification (from scratch, mirrors category-import grouping)
    function extractRelationshipsForSection(
        ws: ExcelJS.Worksheet,
        cfg: CategoryCoaSheetConfig,
        sectionName: "procurement" | "additional" | "non-procurement",
        startRow: number,
        endRow: number,
    ) {
        type CatGroup = {
            cat: string;
            catRow: number;
            coas: Array<{ coa: string; coaRow: number; items: number }>;
            totalRow?: number;
        };
        const catGroups: CatGroup[] = [];
        let currentCat: CatGroup | null = null;
        let currentCoa: { coa: string; coaRow: number; items: number } | null = null;

        const dataColumn = cfg.columnConfig.category;
        const coaColumn = cfg.columnConfig.coa;
        const coaLabelMode = cfg.coaLabelMode;

        const flushCat = (totalRow?: number) => {
            if (currentCat) {
                if (currentCoa) {
                    currentCat.coas.push(currentCoa!);
                    currentCoa = null;
                }

                if (totalRow) currentCat.totalRow = totalRow;

                catGroups.push(currentCat);
                currentCat = null;
            }
        };

        const lastRow = ws.actualRowCount;

        for (let r = startRow; r <= endRow && r <= lastRow; r++) {
            const row = ws.getRow(r);
            const coaRaw = cellText(row.getCell(coaColumn));
            const dataRaw = cellText(row.getCell(dataColumn));

            if (!dataRaw && !coaRaw) continue;

            const coaNorm = coaRaw ? normalize(coaRaw) : null;
            const dataNorm = dataRaw ? normalize(dataRaw) : null;

            if (dataNorm === "description") continue;

            const unitRaw = cellText(row.getCell(cfg.columnConfig.unit));
            const priceRaw = cellText(row.getCell(cfg.columnConfig.price));
            const itemRaw = cellText(row.getCell(cfg.columnConfig.itemNumber));
            const isFalsy = (v: string | null) =>
                !v || normalize(v) === "0" || normalize(v) === "-" || normalize(v) === "0.00";
            const priceNum = priceRaw ? Number(priceRaw.replace(/,/g, "")) : NaN;
            const isFalsyPrice =
                !priceRaw || priceNum === 0 || Number.isNaN(priceNum) || isFalsy(priceRaw);
            const isFalsyUnit = isFalsy(unitRaw);
            const isFalsyCoa = !coaNorm;
            const isFalsyItem = !itemRaw;

            if (isFalsyItem && isFalsyCoa && isFalsyUnit && isFalsyPrice && dataRaw) {
                // Placeholder like Miscellaneous... with G/H 0 and no COA/item-no — not a true pricelist, skip for additional/non-proc
                if (sectionName === "additional" || sectionName === "non-procurement") continue;
            }

            // Item row: both F (description) + D (COA) present
            if (coaNorm && dataRaw) {
                // COA-only sentinel handling: create sentinel cat lazily if no currentCat in non-proc/additional
                if (!currentCat) {
                    if (sectionName === "additional") {
                        currentCat = {
                            cat: "Additional Items (Uncategorized)",
                            catRow: r,
                            coas: [],
                        };
                    } else if (sectionName === "non-procurement") {
                        currentCat = {
                            cat: "Non-Procurement (Uncategorized)",
                            catRow: r,
                            coas: [],
                        };
                    } else {
                        continue;
                    }
                }

                if (coaLabelMode === "without-label") {
                    if (!currentCoa || coaNorm !== normalize(currentCoa.coa)) {
                        if (currentCoa) {
                            currentCat.coas.push(currentCoa!);
                        }

                        currentCoa = { coa: coaRaw!, coaRow: r, items: 1 };
                    } else {
                        currentCoa.items += 1;
                    }

                    continue;
                } else {
                    if (!currentCoa) {
                        // with-label but item appears without prior label – treat as implicit COA group for mapping
                        // try to reuse existing coa in cat if same, else new
                        const existing = currentCat.coas.find((c) => normalize(c.coa) === coaNorm);

                        if (existing) {
                            // create transient currentCoa to count
                            if (currentCoa) currentCat.coas.push(currentCoa!);

                            currentCoa = { coa: coaRaw!, coaRow: r, items: 1 };
                        } else {
                            if (currentCoa) currentCat.coas.push(currentCoa!);

                            currentCoa = { coa: coaRaw!, coaRow: r, items: 1 };
                        }

                        continue;
                    }

                    if (coaNorm !== normalize(currentCoa.coa)) {
                        // COA mismatch -> start new group (label missing case)
                        currentCat.coas.push(currentCoa!);
                        currentCoa = { coa: coaRaw!, coaRow: r, items: 1 };
                    } else {
                        currentCoa.items += 1;
                    }

                    continue;
                }
            }

            if (!dataRaw || !dataNorm) continue;

            if (isTotalRow(dataNorm)) {
                const expected = currentCat ? normalize(`${currentCat.cat} - total`) : null;

                // For relationship log, we don't enforce expected, just flush if totals match or not
                if (currentCat) {
                    if (currentCoa) {
                        currentCat.coas.push(currentCoa!);
                        currentCoa = null;
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
                    nextCoaRaw = cellText(ws.getRow(r + 1).getCell(coaColumn));
                    nextCoaNorm = nextCoaRaw ? normalize(nextCoaRaw) : null;

                    if (nextCoaNorm && dataNorm && nextCoaNorm === dataNorm) isCoaLabel = true;
                }

                if (isCoaLabel) {
                    if (!currentCat) {
                        if (sectionName === "additional") {
                            currentCat = {
                                cat: "Additional Items (Uncategorized)",
                                catRow: r,
                                coas: [],
                            };
                        } else if (sectionName === "non-procurement") {
                            currentCat = {
                                cat: "Non-Procurement (Uncategorized)",
                                catRow: r,
                                coas: [],
                            };
                        } else {
                            continue;
                        }
                    }

                    if (currentCoa) {
                        currentCat.coas.push(currentCoa!);
                    }

                    currentCoa = { coa: dataRaw, coaRow: r, items: 0 };
                    continue;
                }
            }

            // Otherwise it's a category header
            if (currentCat) {
                if (currentCoa) {
                    currentCat.coas.push(currentCoa!);
                    currentCoa = null;
                }

                catGroups.push(currentCat);
            }

            currentCat = { cat: dataRaw, catRow: r, coas: [] };
            currentCoa = null;
        }

        if (currentCat) {
            if (currentCoa) {
                currentCat.coas.push(currentCoa!);
            }

            // totalRow optional for log
            catGroups.push(currentCat);
        }

        const pairs = catGroups.flatMap((g) =>
            g.coas.map((c) => ({
                category: g.cat,
                coa: c.coa,
                catRow: g.catRow,
                coaRow: c.coaRow,
                items: c.items,
                section: sectionName,
            })),
        );

        return { catGroups, pairs };
    }

    function handleLogRelationships() {
        if (!workbook || selectedSheets.length === 0) return;

        const allSheetData: Array<{
            sheet: string;
            sections: Record<string, any>;
            pairs: Array<{
                category: string;
                coa: string;
                catRow: number;
                coaRow: number;
                items: number;
                section: string;
                sheet: string;
            }>;
        }> = [];
        const combinedAllPairs: (typeof allSheetData)[0]["pairs"] = [];

        for (const sheet of selectedSheets) {
            const ws = workbook.getWorksheet(sheet);

            if (!ws) continue;

            const effective = getEffectiveConfig(sheet);

            if (effective.rowConfig.headerRow === "" || effective.rowConfig.headerRow == null) {
                continue;
            }

            const lastRow = ws.actualRowCount;
            const procurementStart = effective.rowConfig.headerRow + 1;
            const procurementEnd = effective.rowConfig.additionalItemsHeaderRow
                ? effective.rowConfig.additionalItemsHeaderRow - 1
                : effective.rowConfig.nonProcurementHeaderRow
                  ? effective.rowConfig.nonProcurementHeaderRow - 1
                  : lastRow;
            const additionalStart = effective.rowConfig.additionalItemsHeaderRow
                ? effective.rowConfig.additionalItemsHeaderRow + 1
                : -1;
            const additionalEnd = effective.rowConfig.nonProcurementHeaderRow
                ? effective.rowConfig.nonProcurementHeaderRow - 1
                : lastRow;
            const nonProcStart = effective.rowConfig.nonProcurementHeaderRow
                ? effective.rowConfig.nonProcurementHeaderRow + 1
                : -1;
            const nonProcEnd = lastRow;

            const sections: Record<string, any> = {};

            const proc = extractRelationshipsForSection(
                ws,
                effective,
                "procurement",
                procurementStart,
                procurementEnd,
            );
            const procPairsWithSheet = proc.pairs.map((p) => ({ ...p, sheet }));
            sections.procurement = {
                range: [procurementStart, procurementEnd],
                catGroups: proc.catGroups,
                pairs: procPairsWithSheet,
                count: procPairsWithSheet.length,
            };

            if (effective.rowConfig.additionalItemsHeaderRow) {
                const add = extractRelationshipsForSection(
                    ws,
                    effective,
                    "additional",
                    additionalStart,
                    additionalEnd,
                );
                const addPairsWithSheet = add.pairs.map((p) => ({ ...p, sheet }));
                sections.additional = {
                    range: [additionalStart, additionalEnd],
                    catGroups: add.catGroups,
                    pairs: addPairsWithSheet,
                    count: addPairsWithSheet.length,
                };
            } else {
                sections.additional = { skipped: "additionalItemsHeaderRow not calibrated" };
            }

            if (effective.rowConfig.nonProcurementHeaderRow) {
                const non = extractRelationshipsForSection(
                    ws,
                    effective,
                    "non-procurement",
                    nonProcStart,
                    nonProcEnd,
                );
                const nonPairsWithSheet = non.pairs.map((p) => ({ ...p, sheet }));
                sections["non-procurement"] = {
                    range: [nonProcStart, nonProcEnd],
                    catGroups: non.catGroups,
                    pairs: nonPairsWithSheet,
                    count: nonPairsWithSheet.length,
                };
            } else {
                sections["non-procurement"] = { skipped: "nonProcurementHeaderRow not calibrated" };
            }

            const pairsForSheet: typeof procPairsWithSheet = [];
            pairsForSheet.push(...procPairsWithSheet);

            if ((sections.additional as any).pairs) {
                pairsForSheet.push(...(sections.additional as any).pairs);
            }

            if ((sections["non-procurement"] as any).pairs) {
                pairsForSheet.push(...(sections["non-procurement"] as any).pairs);
            }

            allSheetData.push({ sheet, sections, pairs: pairsForSheet });
            combinedAllPairs.push(...pairsForSheet);
        }

        // dedupe across sheets and sections by normalized category|coa
        const seen = new Map<string, (typeof combinedAllPairs)[number]>();

        for (const p of combinedAllPairs) {
            const key = `${normalize(p.category)}|${normalize(p.coa)}`;

            if (!seen.has(key)) seen.set(key, p);
        }

        const uniquePairs = [...seen.values()];
        const duplicates = combinedAllPairs.length - uniquePairs.length;

        // DB verification: category exists, coa exists, mapping exists (global across sheets)
        const mappingSet = new Set(
            existingMappings.map((m) => `${m.ppmp_category_id}|${m.chart_of_account_id}`),
        );
        const verifiedPairs = uniquePairs.map((p) => {
            const catNorm = normalize(p.category);
            const coaNorm = normalize(p.coa);
            const sheetCfg = getEffectiveConfig((p as any).sheet);
            const catRes = getCategoryMatch(catNorm, existingCategories);
            const coaRes = getCoaMatch(coaNorm, existingCoas, sheetCfg.coaMatchField ?? "account_title");
            const catExists = catRes.type === "strict";
            const coaExists = coaRes.type === "strict";
            const catId = catRes.match?.id ?? null;
            const coaId = coaRes.match?.id ?? null;
            const mappingExists =
                catId !== null && coaId !== null && mappingSet.has(`${catId}|${coaId}`);

            return {
                ...p,
                catNorm,
                coaNorm,
                catMatchType: catRes.type,
                catMatch: catRes.match ?? null,
                catTopMatches: catRes.topMatches ?? [],
                coaMatchType: coaRes.type,
                coaMatch: coaRes.match ?? null,
                coaTopMatches: coaRes.topMatches ?? [],
                catExists,
                coaExists,
                catId,
                coaId,
                mappingExists,
            };
        });

        const catFound = verifiedPairs.filter((v) => v.catExists).length;
        const coaFound = verifiedPairs.filter((v) => v.coaExists).length;
        const mappingFound = verifiedPairs.filter((v) => v.mappingExists).length;
        const missingCat = verifiedPairs.filter((v) => !v.catExists).length;
        const missingCoa = verifiedPairs.filter((v) => !v.coaExists).length;
        const missingMapping = verifiedPairs.filter(
            (v) => v.catExists && v.coaExists && !v.mappingExists,
        ).length;

        setVerification({
            total: verifiedPairs.length,
            catFound,
            coaFound,
            mappingFound,
            missingCat,
            missingCoa,
            missingMapping,
            verifiedPairs,
        });

        setVerification({
            total: verifiedPairs.length,
            catFound,
            coaFound,
            mappingFound,
            missingCat,
            missingCoa,
            missingMapping,
            verifiedPairs,
        });
        setActiveVerifySheet(selectedSheets[0] ?? "");

        const result = {
            sheets: selectedSheets,
            file: fileName,
            sheetsData: allSheetData,
            combined: {
                totalPairs: combinedAllPairs.length,
                uniquePairs,
                uniqueCount: uniquePairs.length,
                duplicates,
                allPairs: combinedAllPairs,
            },
            db: {
                total: uniquePairs.length,
                catFound,
                coaFound,
                mappingFound,
                missingCat,
                missingCoa,
                missingMapping,
                verifiedPairs,
            },
        };

        console.log(
            `[Category COA Mapping] Relationships — ${selectedSheets.join(", ")} (all sheets, all sections)`,
            result,
        );

        for (const sd of allSheetData) {
            console.log(
                `Sheet ${sd.sheet} — Procurement pairs: ${sd.sections.procurement.count}`,
                sd.sections.procurement.pairs,
            );

            if ((sd.sections.additional as any).pairs) {
                console.log(
                    `Sheet ${sd.sheet} — Additional pairs: ${sd.sections.additional.count}`,
                    sd.sections.additional.pairs,
                );
            }

            if ((sd.sections["non-procurement"] as any).pairs) {
                console.log(
                    `Sheet ${sd.sheet} — Non-Procurement pairs: ${sd.sections["non-procurement"].count}`,
                    sd.sections["non-procurement"].pairs,
                );
            }
        }

        console.table(
            uniquePairs.map((p) => ({
                sheet: (p as any).sheet,
                section: p.section,
                category: p.category,
                coa: p.coa,
                catRow: p.catRow,
                coaRow: p.coaRow,
                items: p.items,
            })),
        );
        console.log(
            `Combined unique Category ↔ COA relationships: ${uniquePairs.length} (from ${combinedAllPairs.length} raw, ${duplicates} dupes) — flat list counts per sheet/section above`,
        );

        if (uniquePairs.some((p) => p.category.includes("Uncategorized"))) {
            console.log(
                "Sentinel usage: pairs with Additional/Non-Procurement (Uncategorized) are COA-only rows mapped to sentinels 276/277",
            );
        }

        // DB verification logs
        console.log(
            `[Category COA Mapping] DB Verification — ${selectedSheets.join(", ")} (multi-sheet) — ${verifiedPairs.length} unique pairs checked against DB`,
            {
                summary: {
                    totalUnique: verifiedPairs.length,
                    categoriesInDB: `${catFound}/${verifiedPairs.length}`,
                    coasInDB: `${coaFound}/${verifiedPairs.length}`,
                    mappingsInDB: `${mappingFound}/${verifiedPairs.length}`,
                    missingCategory: missingCat,
                    missingCoa: missingCoa,
                    missingMappingButBothExist: missingMapping,
                },
                existingCounts: {
                    categories: existingCategories.length,
                    coas: existingCoas.length,
                    mappings: existingMappings.length,
                },
                verifiedPairs,
            },
        );
        console.table(
            verifiedPairs.map((v) => ({
                sheet: (v as any).sheet,
                section: v.section,
                category: v.category,
                catExists: v.catExists
                    ? `✅ ${v.catId}`
                    : v.catMatchType === "partial"
                      ? `~ partial`
                      : "❌ missing",
                coa: v.coa,
                coaExists: v.coaExists
                    ? `✅ ${v.coaId} (${v.coaMatch?.path})`
                    : v.coaMatchType === "partial"
                      ? `~ partial`
                      : "❌ missing",
                mapping: v.mappingExists
                    ? "✅ exists"
                    : v.catExists && v.coaExists
                      ? "❌ not mapped"
                      : "—",
                catRow: v.catRow,
                coaRow: v.coaRow,
                items: v.items,
            })),
        );

        if (missingCat > 0) {
            console.log(
                `Missing categories (${missingCat}):`,
                verifiedPairs
                    .filter((v) => !v.catExists)
                    .map((v) => ({
                        sheet: (v as any).sheet,
                        category: v.category,
                        matchType: v.catMatchType,
                        topMatches: v.catTopMatches,
                    })),
            );
            console.table(
                verifiedPairs
                    .filter((v) => !v.catExists)
                    .map((v) => ({
                        sheet: (v as any).sheet,
                        category: v.category,
                        normalized: v.catNorm,
                        matchType: v.catMatchType,
                        topSuggestions:
                            v.catTopMatches
                                .map((m) => `${m.category.name} (lev ${m.score})`)
                                .join(" | ") || "—",
                    })),
            );
        }

        if (missingCoa > 0) {
            console.log(
                `Missing COAs (${missingCoa}):`,
                verifiedPairs
                    .filter((v) => !v.coaExists)
                    .map((v) => ({
                        sheet: (v as any).sheet,
                        coa: v.coa,
                        matchType: v.coaMatchType,
                        topMatches: v.coaTopMatches,
                    })),
            );
            console.table(
                verifiedPairs
                    .filter((v) => !v.coaExists)
                    .map((v) => ({
                        sheet: (v as any).sheet,
                        coa: v.coa,
                        normalized: v.coaNorm,
                        matchType: v.coaMatchType,
                        topSuggestions:
                            v.coaTopMatches
                                .map(
                                    (m: { coa: ExistingCoa; score: number }) =>
                                        `${m.coa.account_title} [${m.coa.path}] (score ${m.score})`,
                                )
                                .join(" | ") || "—",
                    })),
            );
        }

        if (missingMapping > 0) {
            console.log(
                `Mappings not yet in DB but both sides exist (${missingMapping}):`,
                verifiedPairs.filter((v) => v.catExists && v.coaExists && !v.mappingExists),
            );
            console.table(
                verifiedPairs
                    .filter((v) => v.catExists && v.coaExists && !v.mappingExists)
                    .map((v) => ({
                        sheet: (v as any).sheet,
                        category: `${v.category} [${v.catId}]`,
                        coa: `${v.coa} [${v.coaId}] ${v.coaMatch?.path}`,
                        section: v.section,
                    })),
            );
        }

        console.log(
            `DB Verify Summary: ${catFound}/${verifiedPairs.length} categories ✅, ${coaFound}/${verifiedPairs.length} COAs ✅, ${mappingFound}/${verifiedPairs.length} mappings ✅, ${missingMapping} mappings missing`,
        );
    }

    function handleLog() {
        if (!workbook || selectedSheets.length === 0) return;

        const sheet = currentSheet || selectedSheets[0];
        const ws = workbook.getWorksheet(sheet);
        const effective = getEffectiveConfig(sheet);
        console.log(`[Category COA Mapping] Sheet: ${sheet}`, ws);
        console.log(`Workbook sheets:`, sheets);
        console.log(`File:`, fileName);
        console.log(`Calibration (columnConfig):`, effective.columnConfig);
        console.log(`Calibration (rowConfig):`, effective.rowConfig);
        console.log(`Calibration (coaMatchField):`, effective.coaMatchField);
        console.log(`Calibration (coaLabelMode):`, effective.coaLabelMode);
        console.log(`Calibration (full):`, effective);

        if (ws) {
            console.log(`Row count:`, ws.rowCount, `Actual row count:`, ws.actualRowCount);
            console.log(
                `Preview with calibration — headerRow ${effective.rowConfig.headerRow === "" || effective.rowConfig.headerRow == null ? "—" : effective.rowConfig.headerRow} → data starts ${effective.rowConfig.headerRow === "" || effective.rowConfig.headerRow == null ? "—" : effective.rowConfig.headerRow + 1}, category ${effective.columnConfig.category}, coa ${effective.columnConfig.coa}, coaMatchField ${effective.coaMatchField}, coaLabelMode ${effective.coaLabelMode}, additional ${effective.rowConfig.additionalItemsHeaderRow ?? "—"}, nonProc ${effective.rowConfig.nonProcurementHeaderRow ?? "—"}`,
            );

            if (effective.rowConfig.headerRow === "" || effective.rowConfig.headerRow == null) {
                return;
            }

            const startRow = effective.rowConfig.headerRow + 1;
            const endRow = Math.min(startRow + 9, ws.rowCount);
            const rows: Array<{
                row: number;
                category: string | null;
                coa: string | null;
                sentinel: string | null;
                section: string;
            }> = [];

            for (let r = startRow; r <= endRow; r++) {
                if (
                    r === effective.rowConfig.additionalItemsHeaderRow ||
                    r === effective.rowConfig.nonProcurementHeaderRow
                ) {
                    rows.push({
                        row: r,
                        category: "[HEADER ROW]",
                        coa: "[HEADER ROW]",
                        sentinel: null,
                        section: "header",
                    });
                    continue;
                }

                const row = ws.getRow(r);
                const cat = cellText(row.getCell(effective.columnConfig.category));
                const coa = cellText(row.getCell(effective.columnConfig.coa));
                let sentinel: string | null = null;
                let section = "procurement";

                if (
                    effective.rowConfig.additionalItemsHeaderRow &&
                    r > effective.rowConfig.additionalItemsHeaderRow
                ) {
                    if (
                        effective.rowConfig.nonProcurementHeaderRow &&
                        r > effective.rowConfig.nonProcurementHeaderRow
                    ) {
                        section = "non-procurement";

                        if (!cat && coa) sentinel = "Non-Procurement (Uncategorized) [277]";
                    } else {
                        section = "additional";

                        if (!cat && coa) sentinel = "Additional Items (Uncategorized) [276]";
                    }
                } else if (
                    effective.rowConfig.nonProcurementHeaderRow &&
                    r > effective.rowConfig.nonProcurementHeaderRow
                ) {
                    section = "non-procurement";

                    if (!cat && coa) sentinel = "Non-Procurement (Uncategorized) [277]";
                }

                if (!cat && coa && !sentinel && section === "procurement") {
                    // procurement COA-only without category – would be invalid unless you intend sentinel mapping
                    sentinel = "— (no category, no sentinel)";
                }

                rows.push({ row: r, category: cat, coa, sentinel, section });
            }

            console.table(rows);
            console.log(
                "Sentinels: 276=Additional (is_additional), 277=Non-Proc (is_non_procurement+is_additional) — COA-only rows map to these when section headers calibrated",
            );

            // also log raw first 5 rows for reference
            for (let r = 1; r <= Math.min(5, ws.rowCount); r++) {
                const row = ws.getRow(r);
                const values = (row.values as unknown[])?.slice(1);
                console.log(`Row ${r} raw:`, values);
            }
        }
    }

    return (
        <ScrollArea className="h-[calc(100vh-3rem)] border">
            <div className="flex flex-col gap-4 p-4">
                <h1 className="text-2xl font-bold">Category COA Mapping</h1>

                {fileName && !loading && (
                    <div className="sticky top-0 z-10 flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm backdrop-blur supports-[backdrop-filter]:bg-muted/30">
                        <span className="max-w-[42ch] truncate font-medium" title={fileName}>
                            {fileName}
                        </span>
                        <span className="hidden text-muted-foreground sm:inline">•</span>
                        <span className="truncate text-muted-foreground">
                            {selectedSheets.length > 0
                                ? `${selectedSheets.length}/${sheets.length} sheets: ${selectedSheets.join(", ")}`
                                : `${sheets.length} sheet${sheets.length === 1 ? "" : "s"} found`}
                        </span>
                        {selectedSheets.length > 0 && selectedSheets.length !== sheets.length && (
                            <span className="hidden text-xs text-muted-foreground sm:inline">
                                ({sheets.length} total)
                            </span>
                        )}
                    </div>
                )}

                <Tabs value={step} onValueChange={(v) => setStep(v as typeof step)}>
                    <TabsList variant="line" className="w-full">
                        <TabsTrigger value="upload" className="flex-1">
                            1. Upload & Sheet{" "}
                            {selectedSheets.length > 0 && (
                                <span className="ml-1 text-xs text-muted-foreground">
                                    {selectedSheets.length}✓
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="calibrate" disabled={!canCalibrate} className="flex-1">
                            2. Calibrate{" "}
                            {sharedConfig ? (
                                <span className="ml-1 text-xs text-muted-foreground">
                                    H
                                    {sharedConfig.rowConfig.headerRow === "" ||
                                    sharedConfig.rowConfig.headerRow == null
                                        ? "—"
                                        : sharedConfig.rowConfig.headerRow}{" "}
                                    {calibrationMode === "shared" ? "shared" : "per-sheet"}
                                </span>
                            ) : null}
                        </TabsTrigger>
                        <TabsTrigger
                            value="verifyFormat"
                            disabled={!canVerifyFormat}
                            className="flex-1"
                        >
                            3. Verify Format{" "}
                            {hasFormatResult ? (
                                <span
                                    className={`ml-1 text-xs ${formatValid ? "text-green-600" : "text-amber-600"}`}
                                >
                                    {formatValid
                                        ? `✓ ${selectedSheets.length}`
                                        : `❌ ${Object.values(formatResults).filter((r) => !r.valid).length}/${selectedSheets.length}`}
                                </span>
                            ) : null}
                        </TabsTrigger>
                        <TabsTrigger value="verifyMap" disabled={!canVerifyMap} className="flex-1">
                            4. Verify & Map{" "}
                            {verification ? (
                                <span className="ml-1 text-xs text-muted-foreground">
                                    {verification.missingMapping} missing
                                </span>
                            ) : null}
                        </TabsTrigger>
                        <TabsTrigger value="review" disabled={!canReview} className="flex-1">
                            5. Review & Save{" "}
                            {effectiveVerification ? (
                                <span className="ml-1 text-xs text-muted-foreground">
                                    {effectiveVerification.effMissingMapping} to create
                                </span>
                            ) : null}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="upload" className="mt-4 flex flex-col gap-4">
                        <Field>
                            <FieldLabel htmlFor="file">Excel File</FieldLabel>
                            <Input
                                id="file"
                                type="file"
                                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                onChange={handleFileChange}
                                disabled={loading}
                            />
                            <FieldDescription>Select an .xlsx file.</FieldDescription>
                            {error && <p className="text-sm text-destructive">{error}</p>}
                        </Field>

                        {loading && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Spinner /> Parsing workbook...
                            </div>
                        )}

                        {!loading && sheets.length > 0 && (
                            <Field>
                                <FieldLabel>
                                    Sheets — click to select one or more (multi-sheet)
                                </FieldLabel>
                                <div className="flex flex-wrap gap-2 rounded-lg border p-3">
                                    {sheets.map((sheet) => {
                                        const isSelected = selectedSheets.includes(sheet);

                                        return (
                                            <Badge
                                                key={sheet}
                                                variant={isSelected ? "default" : "secondary"}
                                                className="cursor-pointer text-sm transition-colors hover:opacity-80"
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
                                {selectedSheets.length > 1 && (
                                    <p className="text-xs text-muted-foreground">
                                        Shared calibration will apply to all {selectedSheets.length}{" "}
                                        sheets; per-sheet mode lets you adjust individually.
                                    </p>
                                )}
                            </Field>
                        )}

                        <div className="flex justify-end">
                            <Button
                                disabled={selectedSheets.length === 0}
                                onClick={() => {
                                    ensureCalibrationsInitialized();
                                    setStep("calibrate");
                                }}
                            >
                                Next: Calibrate{" "}
                                {selectedSheets.length > 0
                                    ? `(${selectedSheets.length} sheets)`
                                    : ""}
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="calibrate" className="mt-4 flex flex-col gap-4">
                        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
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
                                            const next: Record<string, CategoryCoaSheetConfig> = {};

                                            for (const s of selectedSheets) {
                                                next[s] = {
                                                    ...sharedConfig,
                                                    ...(calibrations[s] ?? {}),
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
                                    ? `Shared — header ${sharedConfig?.rowConfig.headerRow === "" || sharedConfig?.rowConfig.headerRow == null ? 7 : sharedConfig.rowConfig.headerRow} applies to all ${selectedSheets.length} sheets.`
                                    : `Per-sheet — editing ${currentSheet || "—"} only.`}
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
                                                    {formatResults[s]?.valid
                                                        ? "✓"
                                                        : formatResults[s]
                                                          ? "❌"
                                                          : ""}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <FieldDescription>
                                    Per-sheet calibration — changes affect only the selected sheet.
                                </FieldDescription>
                            </Field>
                        )}

                        {(() => {
                            const cfg =
                                calibrationMode === "shared"
                                    ? (sharedConfig ?? getDefaultMappingConfig())
                                    : (calibrations[currentSheet] ??
                                      sharedConfig ??
                                      getDefaultMappingConfig());
                            const onColumnChange = (patch: Partial<CategoryCoaColumnConfig>) => {
                                if (calibrationMode === "shared") updateSharedColumnConfig(patch);
                                else handleColumnConfigChange(patch);
                                // handleColumnConfigChange already handles mode, but we need to ensure it uses correct mode
                            };

                            // Use existing handlers which already handle mode, so just use them
                            return null;
                        })()}

                        {(() => {
                            const cfg =
                                calibrationMode === "shared"
                                    ? (sharedConfig ?? getDefaultMappingConfig())
                                    : (calibrations[currentSheet] ??
                                      sharedConfig ??
                                      getDefaultMappingConfig());

                            return (
                                <div className="rounded-lg border p-4">
                                    <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        Calibration{" "}
                                        {calibrationMode === "shared"
                                            ? `(Shared – ${selectedSheets.length} sheets)`
                                            : `(Per-sheet – ${currentSheet || selectedSheets[0]})`}
                                    </p>
                                    <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        Calibration — Category ↔ COA mapping reference
                                    </p>
                                    <p className="mb-3 text-xs text-muted-foreground">
                                        Tell us where Category and COA live in the sheet. Data is
                                        read from{" "}
                                        <span className="font-medium">headerRow + 1 → end</span>.
                                        Sentinel categories for COA-only rows:{" "}
                                        <span className="font-medium">
                                            Additional Items (Uncategorized)
                                        </span>{" "}
                                        (id 276) and{" "}
                                        <span className="font-medium">
                                            Non-Procurement (Uncategorized)
                                        </span>{" "}
                                        (id 277) handle COA without category.
                                    </p>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="rounded-md border bg-card p-3">
                                            <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
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
                                                        COA — col {cfg.columnConfig.coa || "D"}
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
                                                        Category — col{" "}
                                                        {cfg.columnConfig.category || "F"}
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
                                                        Unit — col {cfg.columnConfig.unit || "G"}
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
                                                        Price — col {cfg.columnConfig.price || "H"}
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
                                                        Item no. — col{" "}
                                                        {cfg.columnConfig.itemNumber || "E"} —
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
                                                            v as CategoryCoaSheetConfig["coaMatchField"],
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

                                        <div className="rounded-md border bg-card p-3">
                                            <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
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
                                                        value={cfg.rowConfig.headerRow ?? ""}
                                                        onChange={(e) =>
                                                            handleRowConfigChange({
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
                                                    <FieldLabel htmlFor="additional-header-row">
                                                        Additional Items Header Row
                                                    </FieldLabel>
                                                    <Input
                                                        id="additional-header-row"
                                                        type="number"
                                                        value={
                                                            cfg.rowConfig
                                                                .additionalItemsHeaderRow ?? ""
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
                                                            ""
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
                                                        value[0] as CategoryCoaSheetConfig["coaLabelMode"],
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
                                                <span className="text-xs font-normal whitespace-normal text-muted-foreground">
                                                    Category → COA label in F (next D same) → Items
                                                    with D=COA
                                                </span>
                                                <span className="font-mono text-xs text-muted-foreground/70">
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
                                                <span className="text-xs font-normal whitespace-normal text-muted-foreground">
                                                    COA directly on item row — grouped by COA value
                                                </span>
                                                <span className="font-mono text-xs text-muted-foreground/70">
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
                                        <span className="self-center text-xs text-muted-foreground">
                                            Column: D=COA, F=category → Row: header 7 → Mode:{" "}
                                            {cfg.coaLabelMode}
                                        </span>
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep("upload")}>
                                Back
                            </Button>
                            <Button
                                onClick={() => setStep("verifyFormat")}
                                disabled={!canVerifyFormat}
                            >
                                Next: Verify Format
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="verifyFormat" className="mt-4 flex flex-col gap-4">
                        <div className="rounded-lg border p-4">
                            <p className="mb-2 text-sm font-medium">
                                Verify Sheet Format — check calibration and structure (all 3
                                sections)
                            </p>
                            <p className="mb-3 text-xs text-muted-foreground">
                                Checks {selectedSheets.length} sheet
                                {selectedSheets.length === 1 ? "" : "s"} with current calibration (
                                {calibrationMode === "shared"
                                    ? `shared header ${sharedConfig?.rowConfig.headerRow === "" || sharedConfig?.rowConfig.headerRow == null ? 7 : sharedConfig.rowConfig.headerRow}`
                                    : `per-sheet`}
                                ). Validates cat → coa(s) → items → cat - TOTAL per section.
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    onClick={handleVerifyFormat}
                                    disabled={!canVerifyFormat}
                                >
                                    Verify Format{" "}
                                    {selectedSheets.length > 1
                                        ? `(${selectedSheets.length} sheets)`
                                        : ""}
                                </Button>
                                {hasFormatResult && (
                                    <span
                                        className={`text-xs ${formatValid ? "text-green-600" : "text-amber-600"}`}
                                    >
                                        {formatValid
                                            ? `✅ All ${selectedSheets.length} valid`
                                            : `❌ ${Object.values(formatResults).filter((r) => !r.valid).length}/${selectedSheets.length} issues`}
                                    </span>
                                )}
                            </div>
                            {hasFormatResult && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {selectedSheets.map((s) => {
                                        const r = formatResults[s];

                                        if (!r) {
                                            return (
                                                <Badge key={s} variant="secondary">
                                                    {s}: —
                                                </Badge>
                                            );
                                        }

                                        return (
                                            <Badge
                                                key={s}
                                                variant={r.valid ? "default" : "secondary"}
                                                className={r.valid ? "bg-primary" : "bg-secondary"}
                                            >
                                                {s}: {r.valid ? "✅" : "❌"} {r.errors.length}{" "}
                                                issues
                                            </Badge>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {hasFormatResult && selectedSheets.length > 1 && (
                            <Tabs value={activeFormatSheet} onValueChange={setActiveFormatSheet}>
                                <TabsList variant="line" className="w-full">
                                    {selectedSheets.map((s) => {
                                        const r = formatResults[s];

                                        return (
                                            <TabsTrigger key={s} value={s} className="flex-1">
                                                {s}{" "}
                                                {r?.valid ? (
                                                    <span className="ml-1 text-xs text-green-600">
                                                        ✓
                                                    </span>
                                                ) : r ? (
                                                    <span className="ml-1 text-xs text-amber-600">
                                                        ❌ {r.errors.length}
                                                    </span>
                                                ) : null}
                                            </TabsTrigger>
                                        );
                                    })}
                                </TabsList>
                                {selectedSheets.map((s) => {
                                    const r = formatResults[s];

                                    if (!r) {
                                        return (
                                            <TabsContent key={s} value={s}>
                                                <div className="p-4 text-sm text-muted-foreground">
                                                    Not verified yet.
                                                </div>
                                            </TabsContent>
                                        );
                                    }

                                    return (
                                        <TabsContent key={s} value={s}>
                                            <div
                                                className={`rounded-lg border p-4 ${r.valid ? "border bg-card" : "border bg-card"}`}
                                            >
                                                <div className="flex flex-wrap gap-2 text-xs">
                                                    <Badge
                                                        variant={
                                                            r.groups.procurement
                                                                ? "default"
                                                                : "secondary"
                                                        }
                                                    >
                                                        Procurement: {r.groups.procurement} cells
                                                    </Badge>
                                                    <Badge
                                                        variant={
                                                            r.groups.additional
                                                                ? "default"
                                                                : "secondary"
                                                        }
                                                    >
                                                        Additional: {r.groups.additional} cells
                                                    </Badge>
                                                    <Badge
                                                        variant={
                                                            r.groups.nonProcurement
                                                                ? "default"
                                                                : "secondary"
                                                        }
                                                    >
                                                        Non-Proc: {r.groups.nonProcurement} cells
                                                    </Badge>
                                                </div>
                                                {r.details.length > 0 && (
                                                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs opacity-80">
                                                        {r.details.map((d, i) => (
                                                            <li key={i}>{d}</li>
                                                        ))}
                                                    </ul>
                                                )}
                                                {r.errors.length > 0 && (
                                                    <div className="mt-3">
                                                        <div className="text-xs font-semibold">
                                                            Issues ({r.errors.length}) in {s}:
                                                        </div>
                                                        <ul className="mt-1 max-h-48 list-disc overflow-auto pl-5 text-xs">
                                                            {r.errors.map((e, i) => (
                                                                <li key={i}>
                                                                    <span className="font-mono">
                                                                        Row {e.row}:
                                                                    </span>{" "}
                                                                    {e.message}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {!r.valid && (
                                                    <p className="mt-2 text-xs text-amber-800">
                                                        Fix calibration or sheet format — Next is
                                                        blocked until valid.
                                                    </p>
                                                )}
                                            </div>
                                        </TabsContent>
                                    );
                                })}
                            </Tabs>
                        )}

                        {hasFormatResult &&
                            selectedSheets.length === 1 &&
                            (() => {
                                const s = selectedSheets[0];
                                const r = formatResults[s];

                                if (!r) return null;

                                return (
                                    <div
                                        className={`rounded-lg border p-4 ${r.valid ? "border bg-card" : "border bg-card"}`}
                                    >
                                        <div className="flex flex-wrap gap-2 text-xs">
                                            <Badge
                                                variant={
                                                    r.groups.procurement ? "default" : "secondary"
                                                }
                                            >
                                                Procurement: {r.groups.procurement} cells
                                            </Badge>
                                            <Badge
                                                variant={
                                                    r.groups.additional ? "default" : "secondary"
                                                }
                                            >
                                                Additional: {r.groups.additional} cells
                                            </Badge>
                                            <Badge
                                                variant={
                                                    r.groups.nonProcurement
                                                        ? "default"
                                                        : "secondary"
                                                }
                                            >
                                                Non-Proc: {r.groups.nonProcurement} cells
                                            </Badge>
                                        </div>
                                        {r.details.length > 0 && (
                                            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs opacity-80">
                                                {r.details.map((d, i) => (
                                                    <li key={i}>{d}</li>
                                                ))}
                                            </ul>
                                        )}
                                        {r.errors.length > 0 && (
                                            <div className="mt-3">
                                                <div className="text-xs font-semibold">
                                                    Issues ({r.errors.length}):
                                                </div>
                                                <ul className="mt-1 max-h-48 list-disc overflow-auto pl-5 text-xs">
                                                    {r.errors.map((e, i) => (
                                                        <li key={i}>
                                                            <span className="font-mono">
                                                                Row {e.row}:
                                                            </span>{" "}
                                                            {e.message}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {!r.valid && (
                                            <p className="mt-2 text-xs text-amber-800">
                                                Fix calibration or sheet format — Next is blocked
                                                until valid.
                                            </p>
                                        )}
                                    </div>
                                );
                            })()}

                        {!hasFormatResult && (
                            <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
                                Click Verify Format to check sheet structure.
                            </div>
                        )}

                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep("calibrate")}>
                                Back
                            </Button>
                            <Button onClick={() => setStep("verifyMap")} disabled={!canVerifyMap}>
                                Next: Verify & Map{" "}
                                {hasFormatResult && !formatValid ? "(blocked)" : ""}
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="verifyMap" className="mt-4 flex flex-col gap-4">
                        <div className="rounded-lg border p-4">
                            <p className="mb-2 text-sm font-medium">
                                Verify & Map — extract relationships and check DB
                            </p>
                            <p className="mb-3 text-xs text-muted-foreground">
                                Click Log Unique Relationships to extract from{" "}
                                {selectedSheets.length} sheet
                                {selectedSheets.length === 1 ? "" : "s"} and verify against DB. Use
                                dropdowns for ~ partial / ❌ missing COAs.
                            </p>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={handleLog}>
                                    Log {(currentSheet || selectedSheets[0]) ?? "sheet"} +
                                    calibration
                                </Button>
                                <Button size="sm" onClick={handleLogRelationships}>
                                    Log Unique Relationships{" "}
                                    {selectedSheets.length > 1
                                        ? `(${selectedSheets.length} sheets)`
                                        : ""}
                                </Button>
                            </div>
                        </div>

                        {effectiveVerification ? (
                            <div className="rounded-lg border">
                                <div className="border-b p-3">
                                    <h3 className="text-sm font-semibold">
                                        DB Verification — {effectiveVerification.total} unique pairs
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Checked against {existingCategories.length} categories,{" "}
                                        {existingCoas.length} COAs (
                                        {(currentSheet
                                            ? getEffectiveConfig(currentSheet).coaMatchField
                                            : sharedConfig?.coaMatchField) ?? "account_title"}
                                        ), {existingMappings.length} existing mappings
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                        <Badge
                                            variant={
                                                effectiveVerification.catFound ===
                                                effectiveVerification.total
                                                    ? "default"
                                                    : "secondary"
                                            }
                                        >
                                            Categories: {effectiveVerification.catFound}/
                                            {effectiveVerification.total}{" "}
                                            {effectiveVerification.catFound ===
                                            effectiveVerification.total
                                                ? "✅"
                                                : `❌ ${effectiveVerification.missingCat} missing`}
                                        </Badge>
                                        <Badge
                                            variant={
                                                effectiveVerification.effCoaFound ===
                                                effectiveVerification.total
                                                    ? "default"
                                                    : "secondary"
                                            }
                                        >
                                            COAs: {effectiveVerification.effCoaFound}/
                                            {effectiveVerification.total}{" "}
                                            {effectiveVerification.effCoaFound ===
                                            effectiveVerification.total
                                                ? "✅"
                                                : `❌ ${effectiveVerification.effMissingCoa} missing`}
                                        </Badge>
                                        <Badge
                                            variant={
                                                effectiveVerification.effMappingFound ===
                                                effectiveVerification.total
                                                    ? "default"
                                                    : effectiveVerification.effMappingFound > 0
                                                      ? "secondary"
                                                      : "outline"
                                            }
                                        >
                                            Mappings: {effectiveVerification.effMappingFound}/
                                            {effectiveVerification.total}{" "}
                                            {effectiveVerification.effMappingFound ===
                                            effectiveVerification.total
                                                ? "✅ all mapped"
                                                : effectiveVerification.effMissingMapping > 0
                                                  ? `${effectiveVerification.effMissingMapping} missing`
                                                  : "—"}
                                        </Badge>
                                    </div>
                                    {Object.keys(coaOverrides).length > 0 && (
                                        <p className="mt-2 text-xs text-amber-600">
                                            {Object.keys(coaOverrides).length} COA override(s)
                                            selected — mapping counts reflect overrides.
                                        </p>
                                    )}
                                </div>
                                <div className="max-h-[480px] overflow-auto">
                                    <table className="w-full text-xs">
                                        <thead className="sticky top-0 bg-card text-muted-foreground">
                                            <tr className="border-b">
                                                <th className="p-2 text-left">Sheet</th>
                                                <th className="p-2 text-left">Section</th>
                                                <th className="p-2 text-left">Category</th>
                                                <th className="p-2 text-center">Cat DB</th>
                                                <th className="p-2 text-left">COA (Excel)</th>
                                                <th className="min-w-[280px] p-2 text-left">
                                                    COA DB
                                                </th>
                                                <th className="p-2 text-center">Mapping</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {effectiveVerification.effectivePairs.map((v) => {
                                                const needsDropdown = !v.coaExists;
                                                const isOverridden = v.overrideId !== null;
                                                const selectedDisplay = v.effectiveCoa
                                                    ? `coa:${v.effectiveCoa.id}:${v.effectiveCoa.path} — ${v.effectiveCoa.account_title}`
                                                    : "";
                                                // Build items per row: suggested + remaining
                                                const suggestedIds = new Set(
                                                    v.coaTopMatches.map((m) => m.coa.id),
                                                );
                                                const suggestedCoas = v.coaTopMatches.map(
                                                    (m) => m.coa,
                                                );
                                                const remainingCoas = existingCoas.filter(
                                                    (c) => !suggestedIds.has(c.id),
                                                );
                                                const itemsForRow =
                                                    v.coaMatchType === "partial" &&
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
                                                    <tr
                                                        key={v.key}
                                                        className="border-b hover:bg-accent"
                                                    >
                                                        <td className="p-2 text-muted-foreground">
                                                            {v.sheet}
                                                        </td>
                                                        <td className="p-2 text-muted-foreground">
                                                            {v.section}
                                                        </td>
                                                        <td
                                                            className="max-w-[16ch] truncate p-2"
                                                            title={v.category}
                                                        >
                                                            {v.category}
                                                        </td>
                                                        <td className="p-2 text-center">
                                                            {v.catExists ? (
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="bg-secondary text-secondary-foreground"
                                                                >
                                                                    ✅ {v.catId}
                                                                </Badge>
                                                            ) : v.catMatchType === "partial" ? (
                                                                <Badge
                                                                    variant="outline"
                                                                    title={v.catTopMatches
                                                                        .map(
                                                                            (m) =>
                                                                                `${m.category.name} (lev ${m.score})`,
                                                                        )
                                                                        .join(", ")}
                                                                >
                                                                    ~ partial
                                                                </Badge>
                                                            ) : (
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="bg-secondary text-secondary-foreground"
                                                                >
                                                                    ❌ missing
                                                                </Badge>
                                                            )}
                                                        </td>
                                                        <td
                                                            className="max-w-[18ch] truncate p-2"
                                                            title={v.coa}
                                                        >
                                                            {v.coa}
                                                        </td>
                                                        <td className="p-2">
                                                            {needsDropdown ? (
                                                                <div className="flex items-center gap-1">
                                                                    <Combobox
                                                                        items={itemsForRow}
                                                                        value={selectedDisplay}
                                                                        onValueChange={(val) =>
                                                                            handleCoaOverrideChange(
                                                                                v.key,
                                                                                val as
                                                                                    string | null,
                                                                            )
                                                                        }
                                                                    >
                                                                        <ComboboxInput
                                                                            placeholder={
                                                                                v.coaMatchType ===
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
                                                                                {(item: string) => {
                                                                                    const isSuggested =
                                                                                        v.coaTopMatches.some(
                                                                                            (m) =>
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
                                                                                                    ? "bg-card font-medium"
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
                                                                                    v.key,
                                                                                )
                                                                            }
                                                                        >
                                                                            ✕
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1">
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className="bg-secondary text-secondary-foreground"
                                                                    >
                                                                        ✅ {v.coaId}
                                                                    </Badge>
                                                                    <span
                                                                        className="truncate text-muted-foreground"
                                                                        title={v.effectiveCoa?.path}
                                                                    >
                                                                        {v.effectiveCoa?.path}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {needsDropdown && v.effectiveCoa && (
                                                                <div className="mt-1 text-xs text-green-600">
                                                                    → {v.effectiveCoa.path} —{" "}
                                                                    {v.effectiveCoa.account_title}
                                                                </div>
                                                            )}
                                                            {needsDropdown &&
                                                                !v.effectiveCoa &&
                                                                v.coaTopMatches.length > 0 && (
                                                                    <div
                                                                        className="mt-1 truncate text-xs text-muted-foreground"
                                                                        title={v.coaTopMatches
                                                                            .map(
                                                                                (m) =>
                                                                                    `${m.coa.path} — ${m.coa.account_title} (score ${m.score})`,
                                                                            )
                                                                            .join(" | ")}
                                                                    >
                                                                        Suggest:{" "}
                                                                        {
                                                                            v.coaTopMatches[0].coa
                                                                                .path
                                                                        }{" "}
                                                                        —{" "}
                                                                        {
                                                                            v.coaTopMatches[0].coa
                                                                                .account_title
                                                                        }
                                                                    </div>
                                                                )}
                                                        </td>
                                                        <td className="p-2 text-center">
                                                            {v.effectiveMappingExists ? (
                                                                <span className="text-green-600">
                                                                    ✅ exists
                                                                </span>
                                                            ) : v.catExists &&
                                                              v.effectiveCoaExists ? (
                                                                <span className="text-amber-600">
                                                                    ❌ not mapped
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground">
                                                                    —
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2 border-t p-3">
                                    <span className="text-xs text-muted-foreground">
                                        Detailed logs in console (F12) — with top suggestions. Mode:{" "}
                                        {(currentSheet
                                            ? getEffectiveConfig(currentSheet).coaMatchField
                                            : sharedConfig?.coaMatchField) ?? "account_title"}{" "}
                                        — overrides are row-unique (
                                        {Object.keys(coaOverrides).length} active).
                                    </span>
                                    <div className="flex gap-2">
                                        {Object.keys(coaOverrides).length > 0 && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCoaOverrides({})}
                                            >
                                                Clear overrides
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
                                No verification yet — click Log Unique Relationships.
                            </div>
                        )}

                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep("verifyFormat")}>
                                Back
                            </Button>
                            <Button onClick={() => setStep("review")} disabled={!canReview}>
                                Next: Review & Save{" "}
                                {effectiveVerification
                                    ? `(${effectiveVerification.effMissingMapping} to create)`
                                    : ""}
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="review" className="mt-4 flex flex-col gap-4">
                        {effectiveVerification ? (
                            <div className="rounded-lg border">
                                <div className="border-b p-3">
                                    <h3 className="text-sm font-semibold">
                                        Review — {effectiveVerification.total} unique pairs
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Checked against {existingCategories.length} categories,{" "}
                                        {existingCoas.length} COAs, {existingMappings.length}{" "}
                                        mappings — {effectiveVerification.effMissingMapping} will be
                                        created.
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                        <Badge
                                            variant={
                                                effectiveVerification.catFound ===
                                                effectiveVerification.total
                                                    ? "default"
                                                    : "secondary"
                                            }
                                        >
                                            Categories: {effectiveVerification.catFound}/
                                            {effectiveVerification.total}
                                        </Badge>
                                        <Badge
                                            variant={
                                                effectiveVerification.effCoaFound ===
                                                effectiveVerification.total
                                                    ? "default"
                                                    : "secondary"
                                            }
                                        >
                                            COAs: {effectiveVerification.effCoaFound}/
                                            {effectiveVerification.total}
                                        </Badge>
                                        <Badge
                                            variant={
                                                effectiveVerification.effMappingFound ===
                                                effectiveVerification.total
                                                    ? "default"
                                                    : "secondary"
                                            }
                                        >
                                            Mappings: {effectiveVerification.effMappingFound}/
                                            {effectiveVerification.total}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="max-h-96 overflow-auto">
                                    <table className="w-full text-xs">
                                        <thead className="sticky top-0 bg-card text-muted-foreground">
                                            <tr className="border-b">
                                                <th className="p-2 text-left">Sheet</th>
                                                <th className="p-2 text-left">Category</th>
                                                <th className="p-2 text-left">COA (Excel → DB)</th>
                                                <th className="p-2 text-center">Mapping</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {effectiveVerification.effectivePairs
                                                .filter(
                                                    (p) =>
                                                        p.catExists &&
                                                        p.effectiveCoaExists &&
                                                        !p.effectiveMappingExists,
                                                )
                                                .map((p) => (
                                                    <tr key={p.key} className="border-b">
                                                        <td className="p-2 text-muted-foreground">
                                                            {p.sheet}
                                                        </td>
                                                        <td className="p-2">
                                                            {p.category}{" "}
                                                            <span className="text-muted-foreground">
                                                                [{p.catId}]
                                                            </span>
                                                        </td>
                                                        <td className="p-2">
                                                            {p.coa}{" "}
                                                            <span className="text-muted-foreground">
                                                                →
                                                            </span>{" "}
                                                            {p.effectiveCoa?.path} —{" "}
                                                            {p.effectiveCoa?.account_title}
                                                        </td>
                                                        <td className="p-2 text-center text-amber-600">
                                                            ❌ not mapped
                                                        </td>
                                                    </tr>
                                                ))}
                                            {effectiveVerification.effMissingMapping === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={4}
                                                        className="p-4 text-center text-muted-foreground"
                                                    >
                                                        All mappings already exist — nothing to
                                                        create.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2 border-t p-3">
                                    <span className="text-xs text-muted-foreground">
                                        {effectiveVerification.effMissingMapping} mapping(s) will be
                                        created. COAs are not created, only linked.
                                    </span>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCoaOverrides({})}
                                        >
                                            Clear overrides
                                        </Button>
                                        <Button
                                            size="sm"
                                            disabled={
                                                isSaving ||
                                                effectiveVerification.effMissingMapping === 0
                                            }
                                            onClick={handleBulkCreateMappings}
                                        >
                                            {isSaving ? (
                                                <>
                                                    <Spinner className="mr-1 h-3 w-3" /> Saving...
                                                </>
                                            ) : (
                                                `Create ${effectiveVerification.effMissingMapping} Mapping${effectiveVerification.effMissingMapping === 1 ? "" : "s"}`
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
                                Verify first to review mappings.
                            </div>
                        )}

                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep("verifyMap")}>
                                Back
                            </Button>
                            <Button variant="outline" onClick={() => setStep("calibrate")}>
                                Recalibrate
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <ScrollBar orientation="vertical" />
        </ScrollArea>
    );
}

CategoryCoaMappingPage.layout = {
    breadcrumbs: [
        { title: "Imports", href: importsIndex().url },
        { title: "Category COA Mapping", href: categoryCoaMappingIndex().url },
    ],
};
