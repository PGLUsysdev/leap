import { Head, router } from "@inertiajs/react";
import ExcelJS from "exceljs";
import { FileSpreadsheet } from "lucide-react";
import type { ChangeEvent } from "react";
import { useState, useMemo } from "react";
import { Badge } from "@/components/base-ui-components/ui/badge";
import { Button } from "@/components/base-ui-components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/base-ui-components/ui/field";
import { Input } from "@/components/base-ui-components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/base-ui-components/ui/tabs";

function cellText(cell: ExcelJS.Cell): string | null {
    let value: unknown = cell.value as unknown;

    if (value && typeof value === "object") {
        if ("result" in (value as Record<string, unknown>)) {
            value = (value as { result: unknown }).result;
        } else if ("richText" in (value as Record<string, unknown>)) {
            const rt = (value as { richText: Array<{ text: string }> }).richText;

            if (Array.isArray(rt)) {
                const txt = rt
                    .map((r) => r.text)
                    .join("")
                    .trim();

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

function columnToNumber(col: string): number {
    let n = 0;

    for (const ch of col.toUpperCase()) {
        if (ch < "A" || ch > "Z") continue;

        n = n * 26 + (ch.charCodeAt(0) - 64);
    }

    return n;
}

function numberToColumn(n: number): string {
    let s = "";

    while (n > 0) {
        const m = (n - 1) % 26;
        s = String.fromCharCode(65 + m) + s;
        n = Math.floor((n - 1) / 26);
    }

    return s;
}

function leftColumn(col: string): string {
    const n = columnToNumber(col);

    if (n <= 1) return col;

    return numberToColumn(n - 1);
}

function normalize(str: string): string {
    return str.trim().replace(/\s+/g, " ").toLowerCase();
}

function isTotalRow(normalized: string): boolean {
    return /\s*-\s*total$/.test(normalized) || /^total\b/.test(normalized);
}

type VerifyResult = {
    valid: boolean;
    message: string;
    errors: Array<{ row: number; message: string }>;
    groups: { procurement: number; additional: number; nonProcurement: number };
    details: string[];
};

type ExtractResult = {
    filtered: Array<{ row: number; raw: string; normalized: string }>;
    unique: Array<{ raw: string; normalized: string; rows: number[]; count: number }>;
    duplicates: Array<{
        normalized: string;
        keptRow: number;
        duplicateRow: number;
        duplicateRaw: string;
    }>;
    excludedTotal: Array<{ row: number; raw: string; normalized: string }>;
    excludedCoa: Array<{
        row: number;
        raw: string;
        normalized: string;
        nextRowCoaRaw: string;
        nextRowCoaNormalized: string;
    }>;
    skippedCoaNotEmpty: Array<{
        row: number;
        coaRaw: string;
        coaNormalized: string;
        raw: string;
        normalized: string;
    }>;
    skippedProblematic: Array<{ row: number; raw: string; normalized: string; reason: string }>;
};

export default function CategoryImport() {
    const [sheets, setSheets] = useState<string[]>([]);
    const [workbook, setWorkbook] = useState<ExcelJS.Workbook | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Calibrations
    const [dataColumn, setDataColumn] = useState("F");
    const [coaColumn, setCoaColumn] = useState("D");
    const [headerRow, setHeaderRow] = useState(7);
    const [additionalItemsHeaderRow, setAdditionalItemsHeaderRow] = useState<number | undefined>(
        undefined,
    );
    const [nonProcurementHeaderRow, setNonProcurementHeaderRow] = useState<number | undefined>(
        undefined,
    );

    const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
    const [extractResult, setExtractResult] = useState<ExtractResult | null>(null);
    const [step, setStep] = useState<"upload" | "calibrate" | "verify" | "extract">("upload");
    const [importing, setImporting] = useState(false);
    const [skipProblematic, setSkipProblematic] = useState(false);

    const canCalibrate = !!selectedSheet;
    const canVerify = canCalibrate && !!workbook && !!selectedSheet;
    const canExtract = canVerify && !!verifyResult && (verifyResult.valid || skipProblematic);

    const extractionStats = useMemo(() => {
        if (!extractResult) return null;

        return {
            raw: extractResult.filtered.length,
            unique: extractResult.unique.length,
            duplicates: extractResult.duplicates.length,
        };
    }, [extractResult]);

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
        setVerifyResult(null);
        setExtractResult(null);
        setStep("upload");

        try {
            const wb = new ExcelJS.Workbook();
            const arrayBuffer = await file.arrayBuffer();
            await wb.xlsx.load(arrayBuffer);
            setWorkbook(wb);
            setSheets(wb.worksheets.map((ws) => ws.name));
        } catch {
            setError("Failed to parse .xlsx file. Please ensure it is a valid Excel file.");
            setSheets([]);
            setWorkbook(null);
            setSelectedSheet(null);
        } finally {
            setLoading(false);
        }
    }

    function handleSheetSelect(sheet: string) {
        setSelectedSheet(sheet);
        setVerifyResult(null);
        setExtractResult(null);
        setSkipProblematic(false);
    }

    function handleVerify() {
        setSkipProblematic(false);
        setExtractResult(null);

        if (!workbook || !selectedSheet) return;

        const ws = workbook.getWorksheet(selectedSheet);

        if (!ws) {
            setVerifyResult({
                valid: false,
                message: "Worksheet not found",
                errors: [{ row: 0, message: "Worksheet not found" }],
                groups: { procurement: 0, additional: 0, nonProcurement: 0 },
                details: [],
            });

            return;
        }

        const lastRow = ws.actualRowCount;
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
        groups.procurement = additionalItemsHeaderRow
            ? countData(procurementStart, procurementEnd)
            : countData(
                  procurementStart,
                  nonProcurementHeaderRow ? nonProcurementHeaderRow - 1 : lastRow,
              );
        groups.additional = additionalItemsHeaderRow
            ? countData(additionalStart, additionalEnd)
            : 0;
        groups.nonProcurement = nonProcurementHeaderRow ? countData(nonProcStart, nonProcEnd) : 0;

        if (!additionalItemsHeaderRow) {
            details.push(
                "Additional Items header not calibrated — skipping additional group check",
            );
        }

        if (!nonProcurementHeaderRow) {
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

        if (additionalItemsHeaderRow && groups.additional === 0) {
            errors.push({
                row: additionalStart,
                message: "No data found in additional items group",
            });
        }

        const verifyStart = procurementStart;
        const verifyEnd = procurementEnd;

        console.log(
            `Debug rows ${verifyStart}..${Math.min(verifyStart + 11, lastRow)} (F=${dataColumn}, D=${coaColumn}) after normalize:`,
        );
        console.table(
            Array.from({ length: Math.min(12, lastRow - verifyStart + 1) }, (_, i) => {
                const r = verifyStart + i;
                const crow = ws.getRow(r);
                const cd = cellText(crow.getCell(coaColumn));
                const fd = cellText(crow.getCell(dataColumn));
                const cn = cd ? normalize(cd) : null;
                const fn = fd ? normalize(fd) : null;
                const nextCd =
                    r + 1 <= lastRow ? cellText(ws.getRow(r + 1).getCell(coaColumn)) : null;
                const nextCn = nextCd ? normalize(nextCd) : null;

                return {
                    row: r,
                    F_raw: fd ?? "",
                    F_norm: fn ?? "",
                    D_raw: cd ?? "",
                    D_norm: cn ?? "",
                    next_D_norm: nextCn ?? "",
                    isTotal: fn ? isTotalRow(fn) : false,
                    next_D_eq_F: fn && nextCn ? nextCn === fn : false,
                };
            }),
        );

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
                    currentCat.coas.push({ ...currentCoa });
                    currentCoa = null;
                }

                if (totalRow) currentCat.totalRow = totalRow;

                catGroups.push(currentCat);
                currentCat = null;
            }
        };

        for (let r = verifyStart; r <= verifyEnd && r <= lastRow; r++) {
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
                        message: `Item at row ${r} ("${dataRaw}") found without active category`,
                    });
                    continue;
                }

                if (!currentCoa) {
                    errors.push({
                        row: r,
                        message: `Item at row ${r} ("${dataRaw}") found without active COA in cat "${currentCat.cat}"`,
                    });
                    continue;
                }

                if (coaNorm !== normalize(currentCoa.coa)) {
                    errors.push({
                        row: r,
                        message: `Item COA mismatch at row ${r}: D="${coaRaw}" != current COA "${currentCoa.coa}" in cat "${currentCat.cat}"`,
                    });
                }

                currentCoa.items += 1;
                continue;
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
                    if (dataNorm !== expected) {
                        errors.push({
                            row: r,
                            message: `Total mismatch at row ${r}: got "${dataRaw}" (norm "${dataNorm}") expected "${currentCat.cat} - TOTAL"`,
                        });
                    }
                }

                if (currentCat) {
                    if (currentCoa) {
                        currentCat.coas.push({ ...currentCoa });
                        currentCoa = null;
                    }

                    if (currentCat.coas.length === 0) {
                        errors.push({
                            row: r,
                            message: `Category "${currentCat.cat}" at row ${currentCat.catRow} has no COA groups before total`,
                        });
                    } else {
                        for (const c of currentCat.coas) {
                            if (c.items === 0) {
                                errors.push({
                                    row: c.coaRow,
                                    message: `COA "${c.coa}" at row ${c.coaRow} in cat "${currentCat.cat}" has no items`,
                                });
                            }
                        }
                    }

                    flushCat(r);
                }

                continue;
            }

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
                        message: `COA "${dataRaw}" at row ${r} found without active category`,
                    });
                    continue;
                }

                if (currentCoa) {
                    if (currentCoa.items === 0) {
                        errors.push({
                            row: currentCoa.coaRow,
                            message: `COA "${currentCoa.coa}" at row ${currentCoa.coaRow} in cat "${currentCat.cat}" has no items before next COA`,
                        });
                    }

                    currentCat.coas.push({ ...currentCoa });
                }

                currentCoa = { coa: dataRaw, coaRow: r, items: 0 };
                continue;
            }

            if (nextCoaNorm && dataNorm) {
                errors.push({
                    row: r,
                    message: `COA label "${dataRaw}" at row ${r} mismatched next D "${nextCoaRaw}" after normalize (expected same) — not treated as category`,
                });
                continue;
            }

            if (currentCat) {
                errors.push({
                    row: r,
                    message: `Category "${dataRaw}" at row ${r} started before previous cat "${currentCat.cat}" (row ${currentCat.catRow}) closed with " - TOTAL"`,
                });

                if (currentCoa) {
                    if (currentCoa.items === 0) {
                        errors.push({
                            row: currentCoa.coaRow,
                            message: `COA "${currentCoa.coa}" at row ${currentCoa.coaRow} in cat "${currentCat.cat}" has no items`,
                        });
                    }

                    currentCat.coas.push({ ...currentCoa });
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
                        message: `COA "${currentCoa.coa}" at row ${currentCoa.coaRow} in cat "${currentCat.cat}" has no items at end`,
                    });
                }

                currentCat.coas.push({ ...currentCoa });
            }

            if (!currentCat.totalRow) {
                errors.push({
                    row: currentCat.catRow,
                    message: `Category "${currentCat.cat}" at row ${currentCat.catRow} missing closing "${currentCat.cat} - TOTAL" (found ${currentCat.coas.length} COA(s))`,
                });
            } else if (currentCat.coas.length === 0) {
                errors.push({
                    row: currentCat.catRow,
                    message: `Category "${currentCat.cat}" has no COAs`,
                });
            }

            catGroups.push(currentCat);
        }

        console.log("Procurement cat groups:", catGroups);
        console.log("Groups counts:", groups);
        details.push(
            `Procurement groups: ${catGroups.length} cat(s) verified in rows [${verifyStart}..${verifyEnd}] (excluding additional)`,
        );

        for (const g of catGroups) {
            details.push(
                `  Cat "${g.cat}" row ${g.catRow}: ${g.coas.length} COA(s)${g.totalRow ? ` → total at ${g.totalRow}` : " MISSING total"}`,
            );
        }

        // Only procurement errors block; non-procurement warnings handled above
        const procurementErrors = errors.filter(
            (e) => e.row <= verifyEnd || e.message.includes("Procurement"),
        );
        const valid = procurementErrors.length === 0;
        const message = valid
            ? `✅ Format OK — ${catGroups.length} procurement cat group(s) verified` +
              (groups.additional || groups.nonProcurement
                  ? ` | Additional: ${groups.additional ? "found" : "—"}, Non-Proc: ${groups.nonProcurement ? "found" : "—"}`
                  : "")
            : `❌ Found ${errors.length} issue(s) in procurement format`;
        console.log(message, errors);

        if (errors.length > 0) console.table(errors);

        const result: VerifyResult = { valid, message, errors, groups, details };
        setVerifyResult(result);
    }

    function handleExtract() {
        if (!workbook || !selectedSheet) return;

        const ws = workbook.getWorksheet(selectedSheet);

        if (!ws) return;

        const filtered: Array<{ row: number; raw: string; normalized: string }> = [];
        const excludedTotal: Array<{ row: number; raw: string; normalized: string }> = [];
        const excludedCoa: Array<{
            row: number;
            raw: string;
            normalized: string;
            nextRowCoaRaw: string;
            nextRowCoaNormalized: string;
        }> = [];
        const skippedCoaNotEmpty: Array<{
            row: number;
            coaRaw: string;
            coaNormalized: string;
            raw: string;
            normalized: string;
        }> = [];
        const skippedProblematic: Array<{
            row: number;
            raw: string;
            normalized: string;
            reason: string;
        }> = [];
        const startRow = headerRow + 1;
        const lastRow = ws.actualRowCount;

        // Build problematic sets from verify when skipProblematic is on (exclude all rows flagged in verify)
        const problematicRows = new Set<number>();
        const problematicNorms = new Set<string>();

        if (skipProblematic && verifyResult && !verifyResult.valid) {
            for (const e of verifyResult.errors) {
                problematicRows.add(e.row);
                // extract quoted strings like "CAT" or 'COA' from message for normalized match
                const quoted = e.message.match(/"([^"]+)"/g);

                if (quoted) {
                    for (const q of quoted) {
                        const inner = q.slice(1, -1);

                        if (inner) problematicNorms.add(normalize(inner));
                    }
                }
            }
        }

        for (let r = startRow; r <= lastRow; r++) {
            const row = ws.getRow(r);
            const coaRaw = cellText(row.getCell(coaColumn));
            const dataRaw = cellText(row.getCell(dataColumn));

            if (!dataRaw) continue;

            const coaNorm = coaRaw ? normalize(coaRaw) : null;
            const dataNorm = normalize(dataRaw);

            if (dataNorm === "description") continue;

            if (additionalItemsHeaderRow && r === additionalItemsHeaderRow) continue;

            if (nonProcurementHeaderRow && r === nonProcurementHeaderRow) continue;

            if (
                dataNorm === "non-procurement requirements" ||
                dataNorm === "additional items" ||
                dataNorm === "procurement requirements"
            ) {
                continue;
            }

            if (additionalItemsHeaderRow && r > additionalItemsHeaderRow) continue;

            if (nonProcurementHeaderRow && r > nonProcurementHeaderRow) continue;

            // Skip all rows flagged as problematic when option is on
            if (skipProblematic && verifyResult && !verifyResult.valid) {
                if (problematicRows.has(r) || problematicNorms.has(dataNorm)) {
                    const reason = problematicRows.has(r)
                        ? `row ${r} flagged in verify`
                        : `normalized "${dataNorm}" flagged`;
                    skippedProblematic.push({ row: r, raw: dataRaw, normalized: dataNorm, reason });
                    continue;
                }

                // Also skip if raw's normalized was in any error's quoted string (also catches cat - total variants)
                if (coaNorm && (problematicRows.has(r) || problematicNorms.has(coaNorm))) {
                    skippedProblematic.push({
                        row: r,
                        raw: dataRaw,
                        normalized: dataNorm,
                        reason: `COA "${coaRaw}" flagged`,
                    });
                    continue;
                }
            }

            if (coaNorm) {
                skippedCoaNotEmpty.push({
                    row: r,
                    coaRaw: coaRaw!,
                    coaNormalized: coaNorm,
                    raw: dataRaw,
                    normalized: dataNorm,
                });
                continue;
            }

            if (isTotalRow(dataNorm)) {
                excludedTotal.push({ row: r, raw: dataRaw, normalized: dataNorm });
                continue;
            }

            if (r + 1 <= lastRow) {
                const nextRow = ws.getRow(r + 1);
                const nextCoaRaw = cellText(nextRow.getCell(coaColumn));
                const nextCoaNorm = nextCoaRaw ? normalize(nextCoaRaw) : null;

                if (nextCoaNorm && nextCoaNorm === dataNorm) {
                    excludedCoa.push({
                        row: r,
                        raw: dataRaw,
                        normalized: dataNorm,
                        nextRowCoaRaw: nextCoaRaw!,
                        nextRowCoaNormalized: nextCoaNorm,
                    });
                    continue;
                }
            }

            filtered.push({ row: r, raw: dataRaw, normalized: dataNorm });
        }

        const seen = new Map<string, { raw: string; normalized: string; rows: number[] }>();
        const duplicates: Array<{
            normalized: string;
            keptRow: number;
            duplicateRow: number;
            duplicateRaw: string;
        }> = [];

        for (const c of filtered) {
            const existing = seen.get(c.normalized);

            if (!existing) {
                seen.set(c.normalized, { raw: c.raw, normalized: c.normalized, rows: [c.row] });
            } else {
                existing.rows.push(c.row);
                duplicates.push({
                    normalized: c.normalized,
                    keptRow: existing.rows[0],
                    duplicateRow: c.row,
                    duplicateRaw: c.raw,
                });
            }
        }

        const unique = [...seen.values()].map((v) => ({ ...v, count: v.rows.length }));
        console.log(filtered, unique, duplicates);

        if (skippedProblematic.length > 0) {
            console.table(
                skippedProblematic.map((s) => ({
                    row: s.row,
                    raw: s.raw,
                    normalized: s.normalized,
                    reason: s.reason,
                    status: "skipped: problematic",
                })),
            );
        }

        setExtractResult({
            filtered,
            unique,
            duplicates,
            excludedTotal,
            excludedCoa,
            skippedCoaNotEmpty,
            skippedProblematic,
        });
    }

    function handleImport() {
        if (!extractResult || extractResult.unique.length === 0) return;

        setImporting(true);
        router.post(
            "/category-import" as const,
            {
                categories: extractResult.unique.map((u) => ({
                    name: u.raw,
                    normalized: u.normalized,
                })),
            } as never,
            {
                onFinish: () => setImporting(false),
            },
        );
    }

    return (
        <>
            <Head title="Category Import" />
            <div className="flex flex-col gap-4 p-4">
                <h1 className="text-2xl font-semibold">Category Import</h1>

                {fileName && !loading && (
                    <div className="sticky top-0 z-10 flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm backdrop-blur supports-[backdrop-filter]:bg-muted/30">
                        <FileSpreadsheet className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="max-w-[42ch] truncate font-medium" title={fileName}>
                            {fileName}
                        </span>
                        <span className="hidden text-muted-foreground sm:inline">•</span>
                        <span className="truncate text-muted-foreground">
                            {selectedSheet
                                ? `Sheet: ${selectedSheet}`
                                : `${sheets.length} sheet${sheets.length === 1 ? "" : "s"} found`}
                        </span>
                        {selectedSheet && sheets.length > 1 && (
                            <span className="hidden text-xs text-muted-foreground sm:inline">
                                ({sheets.length} sheets total)
                            </span>
                        )}
                    </div>
                )}

                <Tabs value={step} onValueChange={(v) => setStep(v as typeof step)}>
                    <TabsList variant="line" className="w-full">
                        <TabsTrigger value="upload" className="flex-1">
                            1. Upload & Sheet
                            {selectedSheet && (
                                <span className="ml-1 text-xs text-muted-foreground">✓</span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="calibrate" disabled={!canCalibrate}>
                            2. Calibrate
                        </TabsTrigger>
                        <TabsTrigger value="verify" disabled={!canVerify}>
                            3. Verify Format
                            {verifyResult?.valid && (
                                <span className="ml-1 text-xs text-green-600">✓</span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="extract" disabled={!canExtract}>
                            4. Extract & Import
                            {extractResult && (
                                <span className="ml-1 text-xs text-muted-foreground">
                                    {extractResult.unique.length}
                                </span>
                            )}
                            {!verifyResult?.valid && skipProblematic && (
                                <span className="ml-1 text-xs text-amber-600">skip</span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="upload" className="mt-4 flex flex-col gap-4">
                        <Field>
                            <FieldLabel htmlFor="category-import-file">
                                Excel File (.xlsx only)
                            </FieldLabel>
                            <Input
                                id="category-import-file"
                                type="file"
                                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                onChange={handleFileChange}
                                disabled={loading}
                            />
                            <FieldDescription>
                                Select an .xlsx file. Only .xlsx is accepted (ExcelJS).
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
                                <FieldLabel>Sheets — click to select one</FieldLabel>
                                <div className="flex flex-wrap gap-2 rounded-lg border p-3">
                                    {sheets.map((sheet) => {
                                        const isSelected = selectedSheet === sheet;

                                        return (
                                            <Badge
                                                key={sheet}
                                                variant={isSelected ? "default" : "secondary"}
                                                className="cursor-pointer text-sm transition-colors hover:opacity-80"
                                                onClick={() => handleSheetSelect(sheet)}
                                            >
                                                {sheet}
                                            </Badge>
                                        );
                                    })}
                                </div>
                                <FieldDescription>
                                    Selected:{" "}
                                    <span className="font-medium text-foreground">
                                        {selectedSheet ?? "none"}
                                    </span>
                                </FieldDescription>
                            </Field>
                        )}
                        <div className="flex justify-end">
                            <Button disabled={!selectedSheet} onClick={() => setStep("calibrate")}>
                                Next: Calibrate
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="calibrate" className="mt-4 flex flex-col gap-4">
                        <div className="rounded-lg border p-4">
                            <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                Calibration
                            </p>
                            <div className="grid grid-cols-3 gap-4">
                                <Field>
                                    <FieldLabel htmlFor="data-column">Data Column</FieldLabel>
                                    <Input
                                        id="data-column"
                                        value={dataColumn}
                                        onChange={(e) =>
                                            setDataColumn(e.target.value.toUpperCase())
                                        }
                                        className="w-16"
                                        placeholder="F"
                                    />
                                    <FieldDescription>Category data — default F</FieldDescription>
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="coa-column">
                                        Chart of Accounts Column
                                    </FieldLabel>
                                    <Input
                                        id="coa-column"
                                        value={coaColumn}
                                        onChange={(e) => setCoaColumn(e.target.value.toUpperCase())}
                                        className="w-16"
                                        placeholder="D"
                                    />
                                    <FieldDescription>
                                        COA column — empty means category. Default D
                                    </FieldDescription>
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="header-row">Header Row</FieldLabel>
                                    <Input
                                        id="header-row"
                                        type="number"
                                        value={headerRow}
                                        onChange={(e) => setHeaderRow(Number(e.target.value) || 0)}
                                        className="w-20"
                                        placeholder="7"
                                    />
                                    <FieldDescription>
                                        Header {headerRow}; data starts {headerRow + 1}
                                    </FieldDescription>
                                </Field>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-4">
                                <Field>
                                    <FieldLabel htmlFor="additional-header-row">
                                        Additional Items Header Row
                                    </FieldLabel>
                                    <Input
                                        id="additional-header-row"
                                        type="number"
                                        value={additionalItemsHeaderRow ?? ""}
                                        onChange={(e) => {
                                            const v = e.target.value
                                                ? Number(e.target.value)
                                                : undefined;
                                            setAdditionalItemsHeaderRow(v);
                                            setVerifyResult(null);
                                        }}
                                        className="w-24"
                                        placeholder="e.g. 85"
                                    />
                                    <FieldDescription>
                                        {additionalItemsHeaderRow
                                            ? `Resumes at ${additionalItemsHeaderRow + 1}`
                                            : "Leave empty if none"}
                                    </FieldDescription>
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="nonproc-header-row">
                                        Non-Procurement Header Row
                                    </FieldLabel>
                                    <Input
                                        id="nonproc-header-row"
                                        type="number"
                                        value={nonProcurementHeaderRow ?? ""}
                                        onChange={(e) => {
                                            const v = e.target.value
                                                ? Number(e.target.value)
                                                : undefined;
                                            setNonProcurementHeaderRow(v);
                                            setVerifyResult(null);
                                        }}
                                        className="w-24"
                                        placeholder="e.g. 1258"
                                    />
                                    <FieldDescription>
                                        {nonProcurementHeaderRow
                                            ? `Starts at ${nonProcurementHeaderRow + 1}`
                                            : "Leave empty if none"}
                                    </FieldDescription>
                                </Field>
                            </div>
                            <div className="mt-3 text-xs text-muted-foreground">
                                Groups: procurement [{headerRow + 1}..
                                {additionalItemsHeaderRow
                                    ? additionalItemsHeaderRow - 1
                                    : nonProcurementHeaderRow
                                      ? nonProcurementHeaderRow - 1
                                      : "last"}
                                ] → additional [
                                {additionalItemsHeaderRow ? additionalItemsHeaderRow + 1 : "—"}..
                                {nonProcurementHeaderRow ? nonProcurementHeaderRow - 1 : "last"}] →
                                non-proc [
                                {nonProcurementHeaderRow ? nonProcurementHeaderRow + 1 : "—"}..last]
                            </div>
                        </div>
                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep("upload")}>
                                Back
                            </Button>
                            <Button onClick={() => setStep("verify")} disabled={!canVerify}>
                                Next: Verify Format
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="verify" className="mt-4 flex flex-col gap-4">
                        <div className="rounded-lg border p-4">
                            <p className="mb-2 text-sm font-medium">
                                Verify procurement format (categories not in additional)
                            </p>
                            <p className="mb-3 text-xs text-muted-foreground">
                                Checks procurement cats (excluding additional) follow cat → coa(s) →
                                items → cat - total (normalize only, suffix/prefix total).
                            </p>
                            <Button
                                variant="secondary"
                                disabled={!canVerify}
                                onClick={handleVerify}
                            >
                                Verify Sheet Format
                            </Button>
                            {verifyResult && (
                                <div
                                    className={`mt-4 rounded-md border p-3 text-sm ${verifyResult.valid ? "border-green-200 bg-green-50 text-green-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}
                                >
                                    <div className="font-medium">{verifyResult.message}</div>
                                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                        <Badge
                                            variant={
                                                verifyResult.groups.procurement
                                                    ? "default"
                                                    : "secondary"
                                            }
                                        >
                                            Procurement: {verifyResult.groups.procurement} cells
                                        </Badge>
                                        <Badge
                                            variant={
                                                verifyResult.groups.additional
                                                    ? "default"
                                                    : "secondary"
                                            }
                                        >
                                            Additional: {verifyResult.groups.additional} cells
                                        </Badge>
                                        <Badge
                                            variant={
                                                verifyResult.groups.nonProcurement
                                                    ? "default"
                                                    : "secondary"
                                            }
                                        >
                                            Non-Proc: {verifyResult.groups.nonProcurement} cells
                                        </Badge>
                                    </div>
                                    {verifyResult.details.length > 0 && (
                                        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs opacity-80">
                                            {verifyResult.details.map((d, i) => (
                                                <li key={i}>{d}</li>
                                            ))}
                                        </ul>
                                    )}
                                    {verifyResult.errors.length > 0 && (
                                        <div className="mt-3">
                                            <div className="text-xs font-semibold">
                                                Issues ({verifyResult.errors.length}):
                                            </div>
                                            <ul className="mt-1 max-h-48 list-disc overflow-auto pl-5">
                                                {verifyResult.errors.map((e, i) => (
                                                    <li key={i}>
                                                        <span className="font-mono">
                                                            Row {e.row}:
                                                        </span>{" "}
                                                        {e.message}
                                                    </li>
                                                ))}
                                            </ul>
                                            {!verifyResult.valid && (
                                                <div className="mt-3 flex items-center gap-2 rounded-md border border-amber-200 bg-white p-2">
                                                    <Switch
                                                        checked={skipProblematic}
                                                        onCheckedChange={setSkipProblematic}
                                                        size="sm"
                                                    />
                                                    <span className="text-xs">
                                                        Skip {verifyResult.errors.length}{" "}
                                                        problematic row(s) and proceed to extraction
                                                        (they will show as{" "}
                                                        <span className="font-medium">
                                                            skipped: problematic
                                                        </span>{" "}
                                                        in Review)
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep("calibrate")}>
                                Back
                            </Button>
                            <Button onClick={() => setStep("extract")} disabled={!canExtract}>
                                {verifyResult?.valid
                                    ? "Next: Extract"
                                    : skipProblematic
                                      ? "Next: Extract (skipping problematic)"
                                      : "Fix verification first"}
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="extract" className="mt-4 flex flex-col gap-4">
                        {!canExtract ? (
                            <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
                                {verifyResult ? (
                                    <>
                                        Verification failed — enable{" "}
                                        <span className="font-medium">Skip problematic rows</span>{" "}
                                        in Verify tab to proceed, or fix sheet format.
                                    </>
                                ) : (
                                    "Verify format first (must be valid or skipped) to enable extraction."
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2">
                                    <Button onClick={handleExtract} disabled={!selectedSheet}>
                                        Extract Categories
                                    </Button>
                                    {extractResult && (
                                        <span className="text-sm text-muted-foreground">
                                            Raw {extractResult.filtered.length} → Unique{" "}
                                            {extractResult.unique.length} (duplicates{" "}
                                            {extractResult.duplicates.length})
                                        </span>
                                    )}
                                </div>

                                {extractResult && (
                                    <>
                                        <div className="grid grid-cols-5 gap-2 text-xs">
                                            <div className="rounded-md border p-2 text-center">
                                                <div className="text-lg font-semibold">
                                                    {extractionStats?.raw}
                                                </div>
                                                <div className="text-muted-foreground">Raw</div>
                                            </div>
                                            <div className="rounded-md border bg-green-50 p-2 text-center">
                                                <div className="text-lg font-semibold text-green-700">
                                                    {extractionStats?.unique}
                                                </div>
                                                <div className="text-muted-foreground">Unique</div>
                                            </div>
                                            <div className="rounded-md border p-2 text-center">
                                                <div className="text-lg font-semibold">
                                                    {extractResult.duplicates.length}
                                                </div>
                                                <div className="text-muted-foreground">
                                                    Duplicates
                                                </div>
                                            </div>
                                            <div className="rounded-md border p-2 text-center">
                                                <div className="text-lg font-semibold">
                                                    {extractResult.excludedTotal.length}
                                                </div>
                                                <div className="text-muted-foreground">
                                                    Totals excluded
                                                </div>
                                            </div>
                                            <div
                                                className={`rounded-md border p-2 text-center ${extractResult.skippedProblematic.length > 0 ? "border-amber-200 bg-amber-50" : ""}`}
                                            >
                                                <div
                                                    className={`text-lg font-semibold ${extractResult.skippedProblematic.length > 0 ? "text-amber-700" : ""}`}
                                                >
                                                    {extractResult.skippedProblematic.length}
                                                </div>
                                                <div className="text-muted-foreground">
                                                    Skipped: problematic
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-lg border">
                                            <div className="p-3">
                                                <h3 className="text-sm font-semibold">
                                                    Review — Unique Categories (
                                                    {extractResult.unique.length})
                                                </h3>
                                                <p className="text-xs text-muted-foreground">
                                                    Strict dedupe by normalized (trim → collapse →
                                                    lowercase). Duplicates show kept vs duplicate
                                                    rows.
                                                </p>
                                            </div>
                                            <div className="max-h-64 overflow-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Rows</TableHead>
                                                            <TableHead>Raw</TableHead>
                                                            <TableHead>Normalized</TableHead>
                                                            <TableHead>Count</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {extractResult.unique
                                                            .slice(0, 50)
                                                            .map((u) => (
                                                                <TableRow key={u.normalized}>
                                                                    <TableCell className="font-mono text-xs">
                                                                        {u.rows.join(", ")}
                                                                    </TableCell>
                                                                    <TableCell className="text-xs">
                                                                        {u.raw}
                                                                    </TableCell>
                                                                    <TableCell className="text-xs text-muted-foreground">
                                                                        {u.normalized}
                                                                    </TableCell>
                                                                    <TableCell>{u.count}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                            {extractResult.unique.length > 50 && (
                                                <div className="p-2 text-center text-xs text-muted-foreground">
                                                    Showing first 50 of{" "}
                                                    {extractResult.unique.length}
                                                </div>
                                            )}
                                        </div>

                                        {extractResult.duplicates.length > 0 && (
                                            <div className="rounded-lg border p-3">
                                                <h4 className="text-xs font-semibold">
                                                    Duplicates (normalized exact)
                                                </h4>
                                                <ul className="mt-1 max-h-32 list-disc overflow-auto pl-5 text-xs">
                                                    {extractResult.duplicates
                                                        .slice(0, 10)
                                                        .map((d, i) => (
                                                            <li key={i}>
                                                                <span className="font-mono">
                                                                    {d.normalized}
                                                                </span>{" "}
                                                                — kept {d.keptRow}, duplicate{" "}
                                                                {d.duplicateRow} (“{d.duplicateRaw}
                                                                ”)
                                                            </li>
                                                        ))}
                                                </ul>
                                            </div>
                                        )}

                                        {extractResult.skippedProblematic.length > 0 && (
                                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                                <h4 className="text-xs font-semibold text-amber-900">
                                                    Skipped: Problematic (from Verify)
                                                </h4>
                                                <p className="text-xs text-amber-800">
                                                    Excluded all rows flagged in Verify (row match
                                                    or normalized match). Shown for review.
                                                </p>
                                                <ul className="mt-1 max-h-32 list-disc overflow-auto pl-5 text-xs text-amber-900">
                                                    {extractResult.skippedProblematic
                                                        .slice(0, 20)
                                                        .map((s, i) => (
                                                            <li key={i}>
                                                                <span className="font-mono">
                                                                    Row {s.row}:
                                                                </span>{" "}
                                                                “{s.raw}” →{" "}
                                                                <span className="font-mono">
                                                                    {s.normalized}
                                                                </span>{" "}
                                                                —{" "}
                                                                <span className="italic">
                                                                    {s.reason}
                                                                </span>
                                                            </li>
                                                        ))}
                                                </ul>
                                                {extractResult.skippedProblematic.length > 20 && (
                                                    <div className="mt-1 text-xs text-amber-800">
                                                        Showing first 20 of{" "}
                                                        {extractResult.skippedProblematic.length}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 rounded-lg border p-3">
                                            <Button
                                                onClick={handleImport}
                                                disabled={
                                                    importing || extractResult.unique.length === 0
                                                }
                                            >
                                                {importing ? (
                                                    <>
                                                        <Spinner /> Importing...
                                                    </>
                                                ) : (
                                                    `Import ${extractResult.unique.length} Categories`
                                                )}
                                            </Button>
                                            <span className="text-xs text-muted-foreground">
                                                Will create ppmp_categories where not exists (strict
                                                normalized match).
                                            </span>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep("verify")}>
                                Back
                            </Button>
                            <Button variant="ghost" onClick={() => setStep("calibrate")}>
                                Recalibrate
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}

CategoryImport.layout = {
    breadcrumbs: [{ title: "Category Import", href: "#" }],
};
