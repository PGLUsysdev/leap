import { router } from "@inertiajs/react";
import ExcelJS from "exceljs";
import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { Badge } from "@/components/base-ui-components/ui/badge";
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
import { Spinner } from "@/components/base-ui-components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/base-ui-components/ui/toggle-group";
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/base-ui-components/ui/combobox";

type CategoryCoaColumnConfig = {
    coa: string;
    category: string;
};

type CategoryCoaRowConfig = {
    headerRow: number;
    additionalItemsHeaderRow?: number | null;
    nonProcurementHeaderRow?: number | null;
};

type CategoryCoaSheetConfig = {
    columnConfig: CategoryCoaColumnConfig;
    rowConfig: CategoryCoaRowConfig;
    coaMatchField: "auto" | "account_number" | "account_title";
    coaLabelMode: "with-label" | "without-label";
};

function getDefaultMappingConfig(): CategoryCoaSheetConfig {
    return {
        columnConfig: { coa: "D", category: "F" },
        rowConfig: { headerRow: 7, additionalItemsHeaderRow: null, nonProcurementHeaderRow: null },
        coaMatchField: "auto",
        coaLabelMode: "with-label",
    };
}

function cellText(cell: ExcelJS.Cell): string | null {
    let value: unknown = cell.value as unknown;
    if (value && typeof value === "object") {
        if ("result" in (value as Record<string, unknown>)) {
            value = (value as { result: unknown }).result;
        } else if ("richText" in (value as Record<string, unknown>)) {
            const rt = (value as { richText: Array<{ text: string }> }).richText;
            if (Array.isArray(rt)) {
                const txt = rt.map((r) => r.text).join("").trim();
                return txt || null;
            }
            return null;
        } else if ("text" in (value as Record<string, unknown>)) {
            const maybe = value as { text?: string; hyperlink?: string };
            const txt = (maybe.text ?? maybe.hyperlink ?? "") as string;
            return String(txt).trim() || null;
        } else {
            return null;
        }
    }
    if (value == null) return null;
    const s = String(value).trim();
    return s || null;
}

function normalize(str: string): string {
    return str.trim().replace(/\s+/g, " ").toLowerCase();
}

function isTotalRow(normalized: string): boolean {
    return /\s*-\s*total$/.test(normalized) || /^total\b/.test(normalized);
}

const SHORT_PROCUREMENT_ROOTS = new Set(["oil", "gas", "ink", "lab", "cop", "car", "med", "law"]);

function levenshtein(a: string, b: string): number {
    if (a === b) return 0;
    const al = a.length;
    const bl = b.length;
    if (al === 0) return bl;
    if (bl === 0) return al;
    let prev = Array(bl + 1)
        .fill(0)
        .map((_, i) => i);
    let cur = Array(bl + 1).fill(0);
    for (let i = 1; i <= al; i++) {
        cur[0] = i;
        for (let j = 1; j <= bl; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
        }
        [prev, cur] = [cur, prev];
    }
    return prev[bl];
}

type ExistingCategory = { id: number; name: string; is_non_procurement: boolean; is_additional: boolean };
type ExistingCoa = { id: number; account_number: string; path: string; account_title: string };
type ExistingMapping = { chart_of_account_id: number; ppmp_category_id: number };

function getCategoryMatch(
    candidateNorm: string,
    existingCategories: ExistingCategory[],
): { type: "strict" | "partial" | "none"; match?: ExistingCategory; topMatches?: Array<{ category: ExistingCategory; score: number }> } {
    for (const dbCat of existingCategories) {
        const dbNorm = normalize(dbCat.name);
        if (candidateNorm === dbNorm) return { type: "strict", match: dbCat };
    }
    const partials: Array<{ category: ExistingCategory; score: number }> = [];
    const candidateLen = candidateNorm.length;
    for (const dbCat of existingCategories) {
        const dbNorm = normalize(dbCat.name);
        const dbLen = dbNorm.length;
        const levThreshold = dbLen <= 5 ? 1 : dbLen <= 12 ? 2 : 3;
        const dist = levenshtein(candidateNorm, dbNorm);
        if (dist <= levThreshold) {
            partials.push({ category: dbCat, score: dist });
            continue;
        }
        const isEligibleLength = candidateLen >= 4 || SHORT_PROCUREMENT_ROOTS.has(candidateNorm);
        if (isEligibleLength && (dbNorm.includes(candidateNorm) || candidateNorm.includes(dbNorm))) {
            partials.push({ category: dbCat, score: 99 });
        }
    }
    if (partials.length > 0) {
        partials.sort((a, b) => a.score - b.score);
        return { type: "partial", topMatches: partials.slice(0, 3) };
    }
    return { type: "none" };
}

function getCoaMatch(
    candidateNorm: string,
    existingCoas: ExistingCoa[],
    mode: CategoryCoaSheetConfig["coaMatchField"],
): { type: "strict" | "partial" | "none"; match?: ExistingCoa; topMatches?: Array<{ coa: ExistingCoa; score: number }> } {
    const normalizeCoa = (c: ExistingCoa) => ({
        title: normalize(c.account_title),
        number: normalize(c.account_number),
        path: normalize(c.path),
        pathNoDash: normalize(c.path.replace(/-/g, " ")),
    });
    // Strict first — punctuation-sensitive (whitespace/casing only via normalize)
    for (const coa of existingCoas) {
        const n = normalizeCoa(coa);
        if (mode === "account_title") {
            if (candidateNorm === n.title) return { type: "strict", match: coa };
        } else if (mode === "account_number") {
            if (candidateNorm === n.number || candidateNorm === n.path || candidateNorm === n.pathNoDash) return { type: "strict", match: coa };
        } else {
            // auto: title or number or path
            if (candidateNorm === n.title || candidateNorm === n.number || candidateNorm === n.path || candidateNorm === n.pathNoDash) return { type: "strict", match: coa };
        }
    }
    // Partial: substring or levenshtein on title/path
    const partials: Array<{ coa: ExistingCoa; score: number }> = [];
    const candidateLen = candidateNorm.length;
    for (const coa of existingCoas) {
        const n = normalizeCoa(coa);
        const targets = mode === "account_title" ? [n.title] : mode === "account_number" ? [n.number, n.path, n.pathNoDash] : [n.title, n.number, n.path, n.pathNoDash];
        let bestScore: number | null = null;
        for (const t of targets) {
            const tLen = t.length;
            const levThreshold = tLen <= 5 ? 1 : tLen <= 12 ? 2 : 3;
            const dist = levenshtein(candidateNorm, t);
            if (dist <= levThreshold) {
                bestScore = bestScore === null ? dist : Math.min(bestScore, dist);
            }
            const isEligibleLength = candidateLen >= 4;
            if (isEligibleLength && (t.includes(candidateNorm) || candidateNorm.includes(t))) {
                bestScore = bestScore === null ? 99 : Math.min(bestScore, 99);
            }
        }
        if (bestScore !== null) partials.push({ coa, score: bestScore });
    }
    if (partials.length > 0) {
        partials.sort((a, b) => a.score - b.score);
        return { type: "partial", topMatches: partials.slice(0, 3) };
    }
    return { type: "none" };
}

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
    const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    // Calibration – from scratch, minimal reference mapping config
    const [config, setConfig] = useState<CategoryCoaSheetConfig | null>(null);
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

    const effectiveVerification = useMemo(() => {
        if (!verification) return null;
        const mappingSet = new Set(existingMappings.map((m) => `${m.ppmp_category_id}|${m.chart_of_account_id}`));
        const effectivePairs = verification.verifiedPairs.map((v) => {
            const key = `${v.catRow}|${v.coaRow}`;
            const overrideId = coaOverrides[key] ?? null;
            const effectiveCoa = overrideId ? (existingCoas.find((c) => c.id === overrideId) ?? null) : v.coaMatch;
            const effectiveCoaExists = overrideId !== null ? true : v.coaExists;
            const effectiveCoaId = overrideId ?? v.coaId;
            const effectiveCoaMatchType = overrideId !== null ? ("strict" as const) : v.coaMatchType;
            const effectiveMappingExists = v.catId !== null && effectiveCoaId !== null && mappingSet.has(`${v.catId}|${effectiveCoaId}`);
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
        const effMissingMapping = effectivePairs.filter((p) => p.catExists && p.effectiveCoaExists && !p.effectiveMappingExists).length;
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
            const found = existingCoas.find((c) => `${c.path} — ${c.account_title}` === selectedValue);
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
            .filter((p) => p.catExists && p.effectiveCoaExists && !p.effectiveMappingExists && p.catId !== null && p.effectiveCoaId !== null)
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
        router.post(
            "/category-coa-mappings/bulk" as never,
            { mappings: uniqueToCreate } as never,
            {
                onFinish: () => setIsSaving(false),
                // Keep overrides after success so UI still shows manual mapping; page will reload with new existingMappings
            },
        );
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
            setSelectedSheet(null);
            setFileName(null);
            e.target.value = "";
            return;
        }

        setError(null);
        setLoading(true);
        setFileName(file.name);
        setSelectedSheet(null);
        setConfig(null);
        setVerification(null);
        setCoaOverrides({});

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
            setSelectedSheet(null);
            setFileName(null);
        } finally {
            setLoading(false);
        }
    }

    function handleSheetClick(sheet: string) {
        setSelectedSheet(sheet);
        if (!config) {
            setConfig(getDefaultMappingConfig());
        }
        setVerification(null);
        setCoaOverrides({});
    }

    function handleRowConfigChange(patch: Partial<CategoryCoaRowConfig>) {
        setConfig((prev) => {
            const base = prev ?? getDefaultMappingConfig();
            return { ...base, rowConfig: { ...base.rowConfig, ...patch } };
        });
        setVerification(null);
        setCoaOverrides({});
    }

    function handleColumnConfigChange(patch: Partial<CategoryCoaColumnConfig>) {
        setConfig((prev) => {
            const base = prev ?? getDefaultMappingConfig();
            return { ...base, columnConfig: { ...base.columnConfig, ...patch } };
        });
        setVerification(null);
        setCoaOverrides({});
    }

    function handleMatchFieldChange(value: CategoryCoaSheetConfig["coaMatchField"]) {
        setConfig((prev) => ({ ...(prev ?? getDefaultMappingConfig()), coaMatchField: value }));
        setVerification(null);
        setCoaOverrides({});
    }

    function handleCoaLabelModeChange(value: CategoryCoaSheetConfig["coaLabelMode"]) {
        setConfig((prev) => ({ ...(prev ?? getDefaultMappingConfig()), coaLabelMode: value }));
        setVerification(null);
        setCoaOverrides({});
    }

    function handleResetCalibration() {
        setConfig(getDefaultMappingConfig());
        setVerification(null);
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
        type CatGroup = { cat: string; catRow: number; coas: Array<{ coa: string; coaRow: number; items: number }>; totalRow?: number };
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

            // Item row: both F (description) + D (COA) present
            if (coaNorm && dataRaw) {
                // COA-only sentinel handling: create sentinel cat lazily if no currentCat in non-proc/additional
                if (!currentCat) {
                    if (sectionName === "additional") {
                        currentCat = { cat: "Additional Items (Uncategorized)", catRow: r, coas: [] };
                    } else if (sectionName === "non-procurement") {
                        currentCat = { cat: "Non-Procurement (Uncategorized)", catRow: r, coas: [] };
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
                            currentCat = { cat: "Additional Items (Uncategorized)", catRow: r, coas: [] };
                        } else if (sectionName === "non-procurement") {
                            currentCat = { cat: "Non-Procurement (Uncategorized)", catRow: r, coas: [] };
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

        const pairs = catGroups.flatMap((g) => g.coas.map((c) => ({ category: g.cat, coa: c.coa, catRow: g.catRow, coaRow: c.coaRow, items: c.items, section: sectionName })));
        return { catGroups, pairs };
    }

    function handleLogRelationships() {
        if (!workbook || !selectedSheet) return;
        const ws = workbook.getWorksheet(selectedSheet);
        if (!ws) return;
        const effective = config ?? getDefaultMappingConfig();
        const lastRow = ws.actualRowCount;
        const procurementStart = effective.rowConfig.headerRow + 1;
        const procurementEnd = effective.rowConfig.additionalItemsHeaderRow
            ? effective.rowConfig.additionalItemsHeaderRow - 1
            : effective.rowConfig.nonProcurementHeaderRow
              ? effective.rowConfig.nonProcurementHeaderRow - 1
              : lastRow;
        const additionalStart = effective.rowConfig.additionalItemsHeaderRow ? effective.rowConfig.additionalItemsHeaderRow + 1 : -1;
        const additionalEnd = effective.rowConfig.nonProcurementHeaderRow ? effective.rowConfig.nonProcurementHeaderRow - 1 : lastRow;
        const nonProcStart = effective.rowConfig.nonProcurementHeaderRow ? effective.rowConfig.nonProcurementHeaderRow + 1 : -1;
        const nonProcEnd = lastRow;

        const sections: Record<string, any> = {};

        const proc = extractRelationshipsForSection(ws, effective, "procurement", procurementStart, procurementEnd);
        sections.procurement = { range: [procurementStart, procurementEnd], catGroups: proc.catGroups, pairs: proc.pairs, count: proc.pairs.length };

        if (effective.rowConfig.additionalItemsHeaderRow) {
            const add = extractRelationshipsForSection(ws, effective, "additional", additionalStart, additionalEnd);
            sections.additional = { range: [additionalStart, additionalEnd], catGroups: add.catGroups, pairs: add.pairs, count: add.pairs.length };
        } else {
            sections.additional = { skipped: "additionalItemsHeaderRow not calibrated" };
        }

        if (effective.rowConfig.nonProcurementHeaderRow) {
            const non = extractRelationshipsForSection(ws, effective, "non-procurement", nonProcStart, nonProcEnd);
            sections["non-procurement"] = { range: [nonProcStart, nonProcEnd], catGroups: non.catGroups, pairs: non.pairs, count: non.pairs.length };
        } else {
            sections["non-procurement"] = { skipped: "nonProcurementHeaderRow not calibrated" };
        }

        const allPairs = [...(sections.procurement.pairs ?? []), ...(sections.additional.pairs ?? []), ...(sections["non-procurement"].pairs ?? [])];
        // dedupe across sections by normalized category|coa
        const seen = new Map<string, (typeof allPairs)[number]>();
        for (const p of allPairs) {
            const key = `${normalize(p.category)}|${normalize(p.coa)}`;
            if (!seen.has(key)) seen.set(key, p);
        }
        const uniquePairs = [...seen.values()];
        const duplicates = allPairs.length - uniquePairs.length;

        // DB verification: category exists, coa exists, mapping exists
        const mappingSet = new Set(existingMappings.map((m) => `${m.ppmp_category_id}|${m.chart_of_account_id}`));
        const verifiedPairs = uniquePairs.map((p) => {
            const catNorm = normalize(p.category);
            const coaNorm = normalize(p.coa);
            const catRes = getCategoryMatch(catNorm, existingCategories);
            const coaRes = getCoaMatch(coaNorm, existingCoas, effective.coaMatchField);
            const catExists = catRes.type === "strict";
            const coaExists = coaRes.type === "strict";
            const catId = catRes.match?.id ?? null;
            const coaId = coaRes.match?.id ?? null;
            const mappingExists = catId !== null && coaId !== null && mappingSet.has(`${catId}|${coaId}`);
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
        const missingMapping = verifiedPairs.filter((v) => v.catExists && v.coaExists && !v.mappingExists).length;

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

        const result = {
            file: fileName,
            sheet: selectedSheet,
            calibration: effective,
            sections,
            combined: { totalPairs: allPairs.length, uniquePairs, uniqueCount: uniquePairs.length, duplicates, allPairs },
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

        console.log(`[Category COA Mapping] Relationships — ${selectedSheet} (all sections, no verify)`, result);
        console.log(`Procurement pairs: ${sections.procurement.count}`, sections.procurement.pairs);
        if (sections.additional.pairs) console.log(`Additional pairs: ${sections.additional.count}`, sections.additional.pairs);
        if (sections["non-procurement"].pairs) console.log(`Non-Procurement pairs: ${sections["non-procurement"].count}`, sections["non-procurement"].pairs);
        console.table(
            uniquePairs.map((p) => ({
                section: p.section,
                category: p.category,
                coa: p.coa,
                catRow: p.catRow,
                coaRow: p.coaRow,
                items: p.items,
            })),
        );
        console.log(`Combined unique Category ↔ COA relationships: ${uniquePairs.length} (from ${allPairs.length} raw, ${duplicates} dupes) — flat list counts per section above`);
        if (uniquePairs.some((p) => p.category.includes("Uncategorized"))) {
            console.log("Sentinel usage: pairs with Additional/Non-Procurement (Uncategorized) are COA-only rows mapped to sentinels 276/277");
        }

        // DB verification logs
        console.log(
            `[Category COA Mapping] DB Verification — ${selectedSheet} (mode: ${effective.coaMatchField}) — ${verifiedPairs.length} unique pairs checked against DB`,
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
                section: v.section,
                category: v.category,
                catExists: v.catExists ? `✅ ${v.catId}` : v.catMatchType === "partial" ? `~ partial` : "❌ missing",
                coa: v.coa,
                coaExists: v.coaExists ? `✅ ${v.coaId} (${v.coaMatch?.path})` : v.coaMatchType === "partial" ? `~ partial` : "❌ missing",
                mapping: v.mappingExists ? "✅ exists" : v.catExists && v.coaExists ? "❌ not mapped" : "—",
                catRow: v.catRow,
                coaRow: v.coaRow,
                items: v.items,
            })),
        );
        if (missingCat > 0) {
            console.log(
                `Missing categories (${missingCat}):`,
                verifiedPairs.filter((v) => !v.catExists).map((v) => ({ category: v.category, matchType: v.catMatchType, topMatches: v.catTopMatches })),
            );
            console.table(
                verifiedPairs
                    .filter((v) => !v.catExists)
                    .map((v) => ({
                        category: v.category,
                        normalized: v.catNorm,
                        matchType: v.catMatchType,
                        topSuggestions: v.catTopMatches.map((m: { category: ExistingCategory; score: number }) => `${m.category.name} (lev ${m.score})`).join(" | ") || "—",
                    })),
            );
        }
        if (missingCoa > 0) {
            console.log(
                `Missing COAs (${missingCoa}) — mode ${effective.coaMatchField}:`,
                verifiedPairs.filter((v) => !v.coaExists).map((v) => ({ coa: v.coa, matchType: v.coaMatchType, topMatches: v.coaTopMatches })),
            );
            console.table(
                verifiedPairs
                    .filter((v) => !v.coaExists)
                    .map((v) => ({
                        coa: v.coa,
                        normalized: v.coaNorm,
                        matchType: v.coaMatchType,
                        topSuggestions: v.coaTopMatches.map((m: { coa: ExistingCoa; score: number }) => `${m.coa.account_title} [${m.coa.path}] (score ${m.score})`).join(" | ") || "—",
                    })),
            );
        }
        if (missingMapping > 0) {
            console.log(`Mappings not yet in DB but both sides exist (${missingMapping}):`, verifiedPairs.filter((v) => v.catExists && v.coaExists && !v.mappingExists));
            console.table(
                verifiedPairs
                    .filter((v) => v.catExists && v.coaExists && !v.mappingExists)
                    .map((v) => ({
                        category: `${v.category} [${v.catId}]`,
                        coa: `${v.coa} [${v.coaId}] ${v.coaMatch?.path}`,
                        section: v.section,
                    })),
            );
        }
        console.log(`DB Verify Summary: ${catFound}/${verifiedPairs.length} categories ✅, ${coaFound}/${verifiedPairs.length} COAs ✅ (mode ${effective.coaMatchField}), ${mappingFound}/${verifiedPairs.length} mappings ✅, ${missingMapping} mappings missing`);
    }

    function handleLog() {
        if (!workbook || !selectedSheet) return;
        const ws = workbook.getWorksheet(selectedSheet);
        const effective = config ?? getDefaultMappingConfig();
        console.log(`[Category COA Mapping] Sheet: ${selectedSheet}`, ws);
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
                `Preview with calibration — headerRow ${effective.rowConfig.headerRow} → data starts ${effective.rowConfig.headerRow + 1}, category ${effective.columnConfig.category}, coa ${effective.columnConfig.coa}, coaMatchField ${effective.coaMatchField}, coaLabelMode ${effective.coaLabelMode}, additional ${effective.rowConfig.additionalItemsHeaderRow ?? "—"}, nonProc ${effective.rowConfig.nonProcurementHeaderRow ?? "—"}`,
            );
            const startRow = effective.rowConfig.headerRow + 1;
            const endRow = Math.min(startRow + 9, ws.rowCount);
            const rows: Array<{ row: number; category: string | null; coa: string | null; sentinel: string | null; section: string }> = [];
            for (let r = startRow; r <= endRow; r++) {
                if (r === effective.rowConfig.additionalItemsHeaderRow || r === effective.rowConfig.nonProcurementHeaderRow) {
                    rows.push({ row: r, category: "[HEADER ROW]", coa: "[HEADER ROW]", sentinel: null, section: "header" });
                    continue;
                }
                const row = ws.getRow(r);
                const cat = cellText(row.getCell(effective.columnConfig.category));
                const coa = cellText(row.getCell(effective.columnConfig.coa));
                let sentinel: string | null = null;
                let section = "procurement";
                if (effective.rowConfig.additionalItemsHeaderRow && r > effective.rowConfig.additionalItemsHeaderRow) {
                    if (effective.rowConfig.nonProcurementHeaderRow && r > effective.rowConfig.nonProcurementHeaderRow) {
                        section = "non-procurement";
                        if (!cat && coa) sentinel = "Non-Procurement (Uncategorized) [277]";
                    } else {
                        section = "additional";
                        if (!cat && coa) sentinel = "Additional Items (Uncategorized) [276]";
                    }
                } else if (effective.rowConfig.nonProcurementHeaderRow && r > effective.rowConfig.nonProcurementHeaderRow) {
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
        <div className="flex flex-col gap-4 p-6">
            <h1 className="text-2xl font-bold">Category COA Mapping</h1>

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
                    <FieldLabel>Sheets — click to select</FieldLabel>
                    <div className="flex flex-wrap gap-2 rounded-lg border p-3">
                        {sheets.map((sheet) => {
                            const isSelected = selectedSheet === sheet;
                            return (
                                <Badge
                                    key={sheet}
                                    variant={isSelected ? "default" : "secondary"}
                                    className="cursor-pointer text-sm transition-colors hover:opacity-80"
                                    onClick={() => handleSheetClick(sheet)}
                                >
                                    {sheet} {isSelected && "✓"}
                                </Badge>
                            );
                        })}
                    </div>
                    <FieldDescription>
                        {selectedSheet ? (
                            <>
                                Selected: <span className="font-medium text-foreground">{selectedSheet}</span>
                            </>
                        ) : (
                            "Click a sheet to select it"
                        )}
                    </FieldDescription>
                </Field>
            )}

            {selectedSheet && config && (
                <div className="rounded-lg border p-4">
                    <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Calibration — Category ↔ COA mapping reference
                    </p>
                    <p className="mb-3 text-xs text-muted-foreground">
                        Tell us where Category and COA live in the sheet. Data is read from{" "}
                        <span className="font-medium">headerRow + 1 → end</span>. Sentinel categories for COA-only
                        rows: <span className="font-medium">Additional Items (Uncategorized)</span> (id 276) and{" "}
                        <span className="font-medium">Non-Procurement (Uncategorized)</span> (id 277) handle COA
                        without category.
                    </p>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="rounded-md border bg-muted/20 p-3">
                            <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                Column Config
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <Field>
                                    <FieldLabel htmlFor="coa-column">COA Column</FieldLabel>
                                    <Input
                                        id="coa-column"
                                        value={config.columnConfig.coa}
                                        onChange={(e) =>
                                            handleColumnConfigChange({ coa: e.target.value.toUpperCase() })
                                        }
                                        className="w-16"
                                        placeholder="D"
                                    />
                                    <FieldDescription>COA — col {config.columnConfig.coa || "D"}</FieldDescription>
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="category-column">Category Column</FieldLabel>
                                    <Input
                                        id="category-column"
                                        value={config.columnConfig.category}
                                        onChange={(e) =>
                                            handleColumnConfigChange({ category: e.target.value.toUpperCase() })
                                        }
                                        className="w-16"
                                        placeholder="F"
                                    />
                                    <FieldDescription>Category — col {config.columnConfig.category || "F"}</FieldDescription>
                                </Field>
                            </div>
                            <Field className="mt-3">
                                <FieldLabel>COA Match Field</FieldLabel>
                                <Select
                                    value={config.coaMatchField}
                                    onValueChange={(v) => handleMatchFieldChange(v as CategoryCoaSheetConfig["coaMatchField"])}
                                >
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Select match field" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="auto">Auto (title or number)</SelectItem>
                                            <SelectItem value="account_title">Account Title</SelectItem>
                                            <SelectItem value="account_number">Account Number</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <FieldDescription>How to match COA to DB (column-level matching)</FieldDescription>
                            </Field>
                        </div>

                        <div className="rounded-md border bg-muted/20 p-3">
                            <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                Row Config
                            </p>
                            <div className="flex flex-col gap-3">
                                <Field>
                                    <FieldLabel htmlFor="header-row">Header Row</FieldLabel>
                                    <Input
                                        id="header-row"
                                        type="number"
                                        value={config.rowConfig.headerRow}
                                        onChange={(e) => handleRowConfigChange({ headerRow: Number(e.target.value) || 0 })}
                                        className="w-20"
                                    />
                                    <FieldDescription>
                                        Header {config.rowConfig.headerRow}; data starts {config.rowConfig.headerRow + 1}
                                    </FieldDescription>
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="additional-header-row">Additional Items Header Row</FieldLabel>
                                    <Input
                                        id="additional-header-row"
                                        type="number"
                                        value={config.rowConfig.additionalItemsHeaderRow ?? ""}
                                        onChange={(e) =>
                                            handleRowConfigChange({
                                                additionalItemsHeaderRow: e.target.value
                                                    ? Number(e.target.value)
                                                    : null,
                                            })
                                        }
                                        placeholder="blank = ignore"
                                        className="w-20"
                                    />
                                    <FieldDescription>
                                        Sentinel: Additional Items (Uncategorized) • COA-only rows above this map to sentinel
                                    </FieldDescription>
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="non-proc-header-row">Non-Procurement Header Row</FieldLabel>
                                    <Input
                                        id="non-proc-header-row"
                                        type="number"
                                        value={config.rowConfig.nonProcurementHeaderRow ?? ""}
                                        onChange={(e) =>
                                            handleRowConfigChange({
                                                nonProcurementHeaderRow: e.target.value
                                                    ? Number(e.target.value)
                                                    : null,
                                            })
                                        }
                                        placeholder="blank = ignore"
                                        className="w-20"
                                    />
                                    <FieldDescription>
                                        Sentinel: Non-Procurement (Uncategorized) • COA-only rows below map to sentinel
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
                            value={[config.coaLabelMode]}
                            onValueChange={(value) => {
                                if (value.length > 0) {
                                    handleCoaLabelModeChange(value[0] as CategoryCoaSheetConfig["coaLabelMode"]);
                                }
                            }}
                            className="w-full"
                        >
                            <ToggleGroupItem
                                value="with-label"
                                className="flex-1 flex-col items-start gap-1 border p-3 text-left h-auto whitespace-normal"
                            >
                                <span className="font-medium">With COA label rows</span>
                                <span className="text-xs font-normal text-muted-foreground whitespace-normal">
                                    Category → COA label in F (next D same) → Items with D=COA
                                </span>
                                <span className="text-xs text-muted-foreground/70 font-mono">
                                    Cat 1 → coa 1 → items / coa 2 → items → Cat 1 - Total
                                </span>
                            </ToggleGroupItem>
                            <ToggleGroupItem
                                value="without-label"
                                className="flex-1 flex-col items-start gap-1 border p-3 text-left h-auto whitespace-normal"
                            >
                                <span className="font-medium">Without label (COA on item rows)</span>
                                <span className="text-xs font-normal text-muted-foreground whitespace-normal">
                                    COA directly on item row — grouped by COA value
                                </span>
                                <span className="text-xs text-muted-foreground/70 font-mono">
                                    Cat 1 → items (D=coa1) / items (D=coa2) → Cat 1 - Total
                                </span>
                            </ToggleGroupItem>
                        </ToggleGroup>
                        <FieldDescription>What format is your sheet in? This affects how we detect COA groups.</FieldDescription>
                    </Field>

                    <div className="mt-4 flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleResetCalibration}>
                            Reset to defaults
                        </Button>
                        <span className="self-center text-xs text-muted-foreground">
                            Column: D=COA, F=category → Row: header 7 → Mode: {config.coaLabelMode}
                        </span>
                    </div>
                </div>
            )}

            {selectedSheet && (
                <div className="flex gap-2">
                    <Button onClick={handleLog}>Log {selectedSheet} + calibration</Button>
                    <Button variant="secondary" onClick={handleLogRelationships}>
                        Log Unique Relationships
                    </Button>
                </div>
            )}

            {effectiveVerification && (
                <div className="rounded-lg border">
                    <div className="border-b p-3">
                        <h3 className="text-sm font-semibold">
                            DB Verification — {effectiveVerification.total} unique pairs
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Checked against {existingCategories.length} categories, {existingCoas.length} COAs ({config?.coaMatchField ?? "auto"}), {existingMappings.length} existing mappings
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <Badge variant={effectiveVerification.catFound === effectiveVerification.total ? "default" : "secondary"}>
                                Categories: {effectiveVerification.catFound}/{effectiveVerification.total} {effectiveVerification.catFound === effectiveVerification.total ? "✅" : `❌ ${effectiveVerification.missingCat} missing`}
                            </Badge>
                            <Badge variant={effectiveVerification.effCoaFound === effectiveVerification.total ? "default" : "secondary"}>
                                COAs: {effectiveVerification.effCoaFound}/{effectiveVerification.total} {effectiveVerification.effCoaFound === effectiveVerification.total ? "✅" : `❌ ${effectiveVerification.effMissingCoa} missing`}
                            </Badge>
                            <Badge variant={effectiveVerification.effMappingFound === effectiveVerification.total ? "default" : effectiveVerification.effMappingFound > 0 ? "secondary" : "outline"}>
                                Mappings: {effectiveVerification.effMappingFound}/{effectiveVerification.total} {effectiveVerification.effMappingFound === effectiveVerification.total ? "✅ all mapped" : effectiveVerification.effMissingMapping > 0 ? `${effectiveVerification.effMissingMapping} missing` : "—"}
                            </Badge>
                        </div>
                        {Object.keys(coaOverrides).length > 0 && (
                            <p className="mt-2 text-xs text-amber-600">
                                {Object.keys(coaOverrides).length} COA override(s) selected — mapping counts reflect overrides.
                            </p>
                        )}
                    </div>
                    <div className="max-h-[480px] overflow-auto">
                        <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-muted/50 text-muted-foreground">
                                <tr className="border-b">
                                    <th className="p-2 text-left">Section</th>
                                    <th className="p-2 text-left">Category</th>
                                    <th className="p-2 text-center">Cat DB</th>
                                    <th className="p-2 text-left">COA (Excel)</th>
                                    <th className="p-2 text-left min-w-[280px]">COA DB</th>
                                    <th className="p-2 text-center">Mapping</th>
                                </tr>
                            </thead>
                            <tbody>
                                {effectiveVerification.effectivePairs.map((v) => {
                                    const needsDropdown = !v.coaExists;
                                    const isOverridden = v.overrideId !== null;
                                    const selectedDisplay = v.effectiveCoa ? `coa:${v.effectiveCoa.id}:${v.effectiveCoa.path} — ${v.effectiveCoa.account_title}` : "";
                                    // Build items per row: suggested + remaining
                                    const suggestedIds = new Set(v.coaTopMatches.map((m) => m.coa.id));
                                    const suggestedCoas = v.coaTopMatches.map((m) => m.coa);
                                    const remainingCoas = existingCoas.filter((c) => !suggestedIds.has(c.id));
                                    const itemsForRow =
                                        v.coaMatchType === "partial" && suggestedCoas.length > 0
                                            ? [...suggestedCoas.map((c) => `coa:${c.id}:${c.path} — ${c.account_title}`), ...remainingCoas.map((c) => `coa:${c.id}:${c.path} — ${c.account_title}`)]
                                            : existingCoas.map((c) => `coa:${c.id}:${c.path} — ${c.account_title}`);
                                    return (
                                        <tr key={v.key} className="border-b hover:bg-muted/20">
                                            <td className="p-2 text-muted-foreground">{v.section}</td>
                                            <td className="p-2 max-w-[16ch] truncate" title={v.category}>
                                                {v.category}
                                            </td>
                                            <td className="p-2 text-center">
                                                {v.catExists ? (
                                                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                                                        ✅ {v.catId}
                                                    </Badge>
                                                ) : v.catMatchType === "partial" ? (
                                                    <Badge variant="outline" title={v.catTopMatches.map((m) => `${m.category.name} (lev ${m.score})`).join(", ")}>
                                                        ~ partial
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                                                        ❌ missing
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="p-2 max-w-[18ch] truncate" title={v.coa}>
                                                {v.coa}
                                            </td>
                                            <td className="p-2">
                                                {needsDropdown ? (
                                                    <div className="flex items-center gap-1">
                                                        <Combobox items={itemsForRow} value={selectedDisplay} onValueChange={(val) => handleCoaOverrideChange(v.key, val as string | null)}>
                                                            <ComboboxInput placeholder={v.coaMatchType === "partial" ? "★ Suggested at top — search..." : "Search COA..."} className="h-7 text-xs" />
                                                            <ComboboxContent>
                                                                <ComboboxEmpty>No COA found.</ComboboxEmpty>
                                                                <ComboboxList>
                                                                    {(item: string) => {
                                                                        const isSuggested = v.coaTopMatches.some((m) => item.includes(`coa:${m.coa.id}:`));
                                                                        return (
                                                                            <ComboboxItem key={item} value={item} className={isSuggested ? "bg-amber-50 font-medium" : ""}>
                                                                                {isSuggested ? "★ " : ""}
                                                                                {item.replace(/^coa:\d+:/, "")}
                                                                            </ComboboxItem>
                                                                        );
                                                                    }}
                                                                </ComboboxList>
                                                            </ComboboxContent>
                                                        </Combobox>
                                                        {isOverridden && (
                                                            <Button variant="ghost" size="sm" className="h-7 px-1 text-xs" onClick={() => handleClearOverride(v.key)}>
                                                                ✕
                                                            </Button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1">
                                                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                                                            ✅ {v.coaId}
                                                        </Badge>
                                                        <span className="truncate text-muted-foreground" title={v.effectiveCoa?.path}>
                                                            {v.effectiveCoa?.path}
                                                        </span>
                                                    </div>
                                                )}
                                                {needsDropdown && v.effectiveCoa && (
                                                    <div className="mt-1 text-xs text-green-600">→ {v.effectiveCoa.path} — {v.effectiveCoa.account_title}</div>
                                                )}
                                                {needsDropdown && !v.effectiveCoa && v.coaTopMatches.length > 0 && (
                                                    <div className="mt-1 text-xs text-muted-foreground truncate" title={v.coaTopMatches.map((m) => `${m.coa.path} — ${m.coa.account_title} (score ${m.score})`).join(" | ")}>
                                                        Suggest: {v.coaTopMatches[0].coa.path} — {v.coaTopMatches[0].coa.account_title}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-2 text-center">
                                                {v.effectiveMappingExists ? (
                                                    <span className="text-green-600">✅ exists</span>
                                                ) : v.catExists && v.effectiveCoaExists ? (
                                                    <span className="text-amber-600">❌ not mapped</span>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
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
                            Detailed logs in console (F12) — with top suggestions. Mode: {config?.coaMatchField ?? "auto"} — overrides are row-unique ({Object.keys(coaOverrides).length} active).
                        </span>
                        <div className="flex gap-2">
                            {Object.keys(coaOverrides).length > 0 && (
                                <Button variant="outline" size="sm" onClick={() => setCoaOverrides({})}>
                                    Clear overrides
                                </Button>
                            )}
                            <Button
                                size="sm"
                                disabled={isSaving || (effectiveVerification.effMissingMapping === 0)}
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
            )}
        </div>
    );
}

CategoryCoaMappingPage.layout = {
    breadcrumbs: [{ title: "Category COA Mapping", href: "#" }],
};
