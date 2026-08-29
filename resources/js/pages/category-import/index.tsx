import { Head } from "@inertiajs/react";
import ExcelJS from "exceljs";
import type { ChangeEvent } from "react";
import { useState } from "react";
import { Badge } from "@/components/base-ui-components/ui/badge";
import { Button } from "@/components/base-ui-components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/base-ui-components/ui/field";
import { Input } from "@/components/base-ui-components/ui/input";
import { Spinner } from "@/components/base-ui-components/ui/spinner";

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
            // hyperlink object or other without result/text is not display text
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
    if (n <= 1) return col; // A has no left, return itself (will be non-empty check false)
    return numberToColumn(n - 1);
}

function normalize(str: string): string {
    return str.trim().replace(/\s+/g, " ").toLowerCase();
}

function isTotalRow(normalized: string): boolean {
    // After normalize (trim → collapse → lowercase):
    // - suffix: " - total" e.g. "electrical supplies - total"
    // - prefix: "total ..." e.g. "total for procurement", "total non-procurement", "total ppa requirement"
    return /\s*-\s*total$/.test(normalized) || /^total\b/.test(normalized);
}

export default function CategoryImport() {
    const [sheets, setSheets] = useState<string[]>([]);
    const [workbook, setWorkbook] = useState<ExcelJS.Workbook | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Calibrations
    const [dataColumn, setDataColumn] = useState("F"); // category data, e.g. F
    const [coaColumn, setCoaColumn] = useState("D"); // Chart of Accounts column, e.g. D
    const [headerRow, setHeaderRow] = useState(7); // header row number; data starts at headerRow + 1 (default 8)
    const [additionalItemsHeaderRow, setAdditionalItemsHeaderRow] = useState<number | undefined>(undefined);
    const [nonProcurementHeaderRow, setNonProcurementHeaderRow] = useState<number | undefined>(undefined);
    const [verifyResult, setVerifyResult] = useState<{
        valid: boolean;
        message: string;
        errors: Array<{ row: number; message: string }>;
        groups: { procurement: number; additional: number; nonProcurement: number };
        details: string[];
    } | null>(null);

    async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        // Only accept .xlsx (ExcelJS only handles xlsx)
        const isXlsx =
            file.name.toLowerCase().endsWith(".xlsx") ||
            file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

        if (!isXlsx) {
            setError("Only .xlsx files are allowed.");
            setSheets([]);
            setWorkbook(null);
            setSelectedSheet(null);
            setFileName(null);
            // reset input so same file can be re-selected after fixing
            e.target.value = "";
            return;
        }

        setError(null);
        setLoading(true);
        setFileName(file.name);
        setSelectedSheet(null);

        try {
            const wb = new ExcelJS.Workbook();
            const arrayBuffer = await file.arrayBuffer();
            await wb.xlsx.load(arrayBuffer);
            setWorkbook(wb);
            setSheets(wb.worksheets.map((ws) => ws.name));
        } catch (err) {
            setError("Failed to parse .xlsx file. Please ensure it is a valid Excel file.");
            setSheets([]);
            setWorkbook(null);
            setSelectedSheet(null);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Head title="Category Import" />
            <div className="flex flex-col gap-4 p-4">
                <h1 className="text-2xl font-semibold">Category Import</h1>

                <Field>
                    <FieldLabel htmlFor="category-import-file">Excel File (.xlsx only)</FieldLabel>
                    <Input
                        id="category-import-file"
                        type="file"
                        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        onChange={handleFileChange}
                        disabled={loading}
                    />
                    <FieldDescription>Select an .xlsx file to view its sheets.</FieldDescription>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                </Field>

                {loading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Spinner /> Parsing workbook...
                    </div>
                )}

                {!loading && fileName && (
                    <div className="text-sm text-muted-foreground">
                        File: <span className="font-medium text-foreground">{fileName}</span> —{" "}
                        {sheets.length} sheet{sheets.length === 1 ? "" : "s"} found
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
                                        onClick={() => setSelectedSheet(sheet)}
                                    >
                                        {sheet}
                                    </Badge>
                                );
                            })}
                        </div>
                        <FieldDescription>
                            Click a sheet to select it. Selected:{" "}
                            <span className="font-medium text-foreground">
                                {selectedSheet ?? "none"}
                            </span>
                        </FieldDescription>
                    </Field>
                )}

                {/* Calibration */}
                {!loading && sheets.length > 0 && (
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
                                    onChange={(e) => setDataColumn(e.target.value.toUpperCase())}
                                    className="w-16"
                                    placeholder="F"
                                />
                                <FieldDescription>
                                    Category data — default <span className="font-medium">F</span>.
                                </FieldDescription>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="coa-column">Chart of Accounts Column</FieldLabel>
                                <Input
                                    id="coa-column"
                                    value={coaColumn}
                                    onChange={(e) => setCoaColumn(e.target.value.toUpperCase())}
                                    className="w-16"
                                    placeholder="D"
                                />
                                <FieldDescription>
                                    COA column — include row only when this is empty (normalized). Default{" "}
                                    <span className="font-medium">D</span>.
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
                                    placeholder="8"
                                />
                                <FieldDescription>
                                    Header at row {headerRow}; data starts at{" "}
                                    <span className="font-medium">{headerRow + 1}</span> (just below).
                                </FieldDescription>
                            </Field>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                            <Field>
                                <FieldLabel htmlFor="additional-header-row">Additional Items Header Row</FieldLabel>
                                <Input
                                    id="additional-header-row"
                                    type="number"
                                    value={additionalItemsHeaderRow ?? ""}
                                    onChange={(e) => {
                                        const v = e.target.value ? Number(e.target.value) : undefined;
                                        setAdditionalItemsHeaderRow(v);
                                        setVerifyResult(null);
                                    }}
                                    className="w-24"
                                    placeholder="e.g. 85"
                                />
                                <FieldDescription>
                                    Row of “Additional Items” header inside procurement.{" "}
                                    {additionalItemsHeaderRow
                                        ? `Data resumes at ${additionalItemsHeaderRow + 1}`
                                        : "Leave empty if none"}
                                </FieldDescription>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="nonproc-header-row">Non-Procurement Header Row</FieldLabel>
                                <Input
                                    id="nonproc-header-row"
                                    type="number"
                                    value={nonProcurementHeaderRow ?? ""}
                                    onChange={(e) => {
                                        const v = e.target.value ? Number(e.target.value) : undefined;
                                        setNonProcurementHeaderRow(v);
                                        setVerifyResult(null);
                                    }}
                                    className="w-24"
                                    placeholder="e.g. 1258"
                                />
                                <FieldDescription>
                                    Row of “Non-Procurement Items” header.{" "}
                                    {nonProcurementHeaderRow
                                        ? `Starts at ${nonProcurementHeaderRow + 1}`
                                        : "Leave empty if none"}
                                </FieldDescription>
                            </Field>
                        </div>
                        <div className="mt-3 text-xs text-muted-foreground">
                            Groups: procurement <span className="font-medium">[{headerRow + 1}..{additionalItemsHeaderRow ? additionalItemsHeaderRow - 1 : nonProcurementHeaderRow ? nonProcurementHeaderRow - 1 : "last"}]</span> →{" "}
                            additional{" "}
                            <span className="font-medium">
                                [{additionalItemsHeaderRow ? additionalItemsHeaderRow + 1 : "—"}..{nonProcurementHeaderRow ? nonProcurementHeaderRow - 1 : "last"}]
                            </span>{" "}
                            → non-procurement{" "}
                            <span className="font-medium">[{nonProcurementHeaderRow ? nonProcurementHeaderRow + 1 : "—"}..last]</span>
                        </div>
                    </div>
                )}

                {!loading && sheets.length > 0 && (
                    <div className="flex items-center gap-2">
                        <Button
                            disabled={!selectedSheet}
                            onClick={() => {
                                console.log("Selected sheet:", selectedSheet);
                                console.log("Calibrated column:", dataColumn);

                                if (!workbook || !selectedSheet) return;

                                const ws = workbook.getWorksheet(selectedSheet);
                                if (!ws) {
                                    console.log("Worksheet not found");
                                    return;
                                }

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

                                const startRow = headerRow + 1;
                                console.log(`Header row ${headerRow}, data starts at ${startRow}`);

                                // Bound: startRow (just below header) to actualRowCount
                                // 1) Normalize first, 2) keep dataColumn only when coaColumn empty (normalized), 3) exclude TOTAL rows (suffix " - total" + prefix "total ..." after normalize), 4) exclude COA labels via next-row COA match (normalized)
                                const lastRow = ws.actualRowCount;
                                if (startRow > lastRow) {
                                    console.log(`No data rows: startRow ${startRow} > lastRow ${lastRow}`);
                                }
                                for (let r = startRow; r <= lastRow; r++) {
                                    const row = ws.getRow(r);
                                    const coaRaw = cellText(row.getCell(coaColumn));
                                    const dataRaw = cellText(row.getCell(dataColumn));
                                    if (!dataRaw) continue;

                                    const coaNorm = coaRaw ? normalize(coaRaw) : null;
                                    const dataNorm = normalize(dataRaw);

                                    // Don't include actual header row labels (e.g. "Description") or group headers themselves
                                    if (dataNorm === "description") continue;
                                    if (additionalItemsHeaderRow && r === additionalItemsHeaderRow) continue;
                                    if (nonProcurementHeaderRow && r === nonProcurementHeaderRow) continue;
                                    // also skip the known group header texts if calibration not set or off-by-one
                                    if (dataNorm === "non-procurement requirements" || dataNorm === "additional items" || dataNorm === "procurement requirements") continue;

                                    // Skip entire Additional Items and Non-Procurement groups (after their headers it's just items, no categories needed)
                                    if (additionalItemsHeaderRow && r > additionalItemsHeaderRow) {
                                        // r is in additional or beyond; if non-procurement also set, both are skipped together
                                        continue;
                                    }
                                    if (nonProcurementHeaderRow && r > nonProcurementHeaderRow) {
                                        continue;
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

                                    // COA empty (normalized) — now suffix check after normalization
                                    if (isTotalRow(dataNorm)) {
                                        excludedTotal.push({ row: r, raw: dataRaw, normalized: dataNorm });
                                        continue;
                                    }

                                    // COA detection: if row below has same normalized COA value in coaColumn, this is a COA label
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

                                // Strict dedupe by normalized (exact equality after normalize: trim→collapse→lowercase)
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

                                console.log(
                                    `Filtered column ${dataColumn} (COA ${coaColumn} empty, TOTAL excluded (suffix/prefix after normalize), COA labels excluded via next-row COA match) from "${selectedSheet}":`,
                                    filtered,
                                );
                                console.table(
                                    filtered.map((f) => ({
                                        row: f.row,
                                        raw: f.raw,
                                        normalized: f.normalized,
                                        status: "passed — category only",
                                    })),
                                );
                                console.log(
                                    `Found ${filtered.length} raw, ${unique.length} unique (strict normalized equality), ${duplicates.length} duplicates`,
                                );
                                console.table(
                                    unique.map((u) => ({
                                        normalized: u.normalized,
                                        raw: u.raw,
                                        rows: u.rows.join(", "),
                                        count: u.count,
                                        status: u.count > 1 ? "duplicate — kept first" : "unique",
                                    })),
                                );
                                if (duplicates.length > 0) {
                                    console.table(
                                        duplicates.map((d) => ({
                                            normalized: d.normalized,
                                            keptRow: d.keptRow,
                                            duplicateRow: d.duplicateRow,
                                            duplicateRaw: d.duplicateRaw,
                                            status: "duplicate — normalized exact",
                                        })),
                                    );
                                }
                                console.log(
                                    `Found ${filtered.length} categories, ${excludedCoa.length} excluded: COA label (next-row COA match), ${excludedTotal.length} excluded: TOTAL (suffix/prefix after normalize), ${skippedCoaNotEmpty.length} excluded: COA not empty`,
                                );
                                if (excludedCoa.length > 0) {
                                    console.table(
                                        excludedCoa.slice(0, 10).map((e) => ({
                                            row: e.row,
                                            raw: e.raw,
                                            normalized: e.normalized,
                                            nextRow: e.row + 1,
                                            nextCoaRaw: e.nextRowCoaRaw,
                                            nextCoaNormalized: e.nextRowCoaNormalized,
                                            status: "excluded: COA (next-row match)",
                                        })),
                                    );
                                }
                                if (excludedTotal.length > 0) {
                                        console.table(
                                        excludedTotal.slice(0, 10).map((e) => ({
                                            row: e.row,
                                            raw: e.raw,
                                            normalized: e.normalized,
                                            status: "excluded: TOTAL (prefix/suffix after normalize)",
                                        })),
                                    );
                                }
                                if (skippedCoaNotEmpty.length > 0) {
                                    console.table(
                                        skippedCoaNotEmpty.slice(0, 10).map((s) => ({
                                            row: s.row,
                                            coaRaw: s.coaRaw,
                                            coaNormalized: s.coaNormalized,
                                            raw: s.raw,
                                            normalized: s.normalized,
                                            status: `excluded: COA ${coaColumn} not empty`,
                                        })),
                                    );
                                }
                            }}
                        >
                            Log Selected Sheet
                        </Button>
                        {selectedSheet && (
                            <span className="text-sm text-muted-foreground">
                                Will log categories (col {dataColumn} where {coaColumn} empty, - TOTAL & COA excluded) from "{selectedSheet}"
                            </span>
                        )}
                    </div>
                )}

                {!loading && sheets.length > 0 && (
                    <div className="flex flex-col gap-3 rounded-lg border p-4">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="secondary"
                                disabled={!selectedSheet || !workbook}
                                onClick={() => {
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

                                    // Quick group existence check (3 main groups)
                                    const groups = {
                                        procurement: 0,
                                        additional: 0,
                                        nonProcurement: 0,
                                    };

                                    // Count non-empty data in each group for existence verification
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
                                        : countData(procurementStart, nonProcurementHeaderRow ? nonProcurementHeaderRow - 1 : lastRow);
                                    groups.additional = additionalItemsHeaderRow ? countData(additionalStart, additionalEnd) : 0;
                                    groups.nonProcurement = nonProcurementHeaderRow ? countData(nonProcStart, nonProcEnd) : 0;

                                    if (!additionalItemsHeaderRow) {
                                        details.push("Additional Items header not calibrated — skipping additional group check");
                                    }
                                    if (!nonProcurementHeaderRow) {
                                        details.push("Non-Procurement header not calibrated — skipping non-procurement group check");
                                    }
                                    if (procurementStart > procurementEnd) {
                                        errors.push({
                                            row: procurementStart,
                                            message: `Procurement range invalid [${procurementStart}..${procurementEnd}] — check header calibrations`,
                                        });
                                    } else if (groups.procurement === 0) {
                                        errors.push({ row: procurementStart, message: "No data found in procurement group — check header calibration" });
                                    }
                                    if (additionalItemsHeaderRow && groups.additional === 0) {
                                        errors.push({ row: additionalStart, message: "No data found in additional items group" });
                                    }
                                    if (nonProcurementHeaderRow && groups.nonProcurement === 0) {
                                        errors.push({ row: nonProcStart, message: "No data found in non-procurement group" });
                                    }

                                    // Procurement-only (excluding additional) format check
                                    // Pattern per cat group: cat → 1..N { coa → 1..N items } → cat - total
                                    // Only verify rows in procurementMain (procurement excluding additional)
                                    const verifyStart = procurementStart;
                                    const verifyEnd = procurementEnd;

                                    // Debug: dump first ~12 rows after header to confirm headerRow vs cat/coa positions (normalize only)
                                    console.log(`Debug rows ${verifyStart}..${Math.min(verifyStart + 11, lastRow)} (F=${dataColumn}, D=${coaColumn}) after normalize:`);
                                    console.table(
                                        Array.from({ length: Math.min(12, lastRow - verifyStart + 1) }, (_, i) => {
                                            const r = verifyStart + i;
                                            const crow = ws.getRow(r);
                                            const cd = cellText(crow.getCell(coaColumn));
                                            const fd = cellText(crow.getCell(dataColumn));
                                            const cn = cd ? normalize(cd) : null;
                                            const fn = fd ? normalize(fd) : null;
                                            const nextCd = r + 1 <= lastRow ? cellText(ws.getRow(r + 1).getCell(coaColumn)) : null;
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

                                    const flushCoa = () => {
                                        if (currentCat && currentCoa) {
                                            currentCat.coas.push({ ...currentCoa });
                                            currentCoa = null;
                                        }
                                    };
                                    const flushCat = (totalRow?: number) => {
                                        if (currentCat) {
                                            flushCoa();
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

                                        // Skip header label row itself (e.g. row 8 "Description") — column headers, not data
                                        if (dataNorm === "description") continue;

                                        // Item row: coa not empty
                                        if (coaNorm && dataRaw) {
                                            if (!currentCat) {
                                                errors.push({ row: r, message: `Item at row ${r} ("${dataRaw}") found without active category` });
                                                continue;
                                            }
                                            if (!currentCoa) {
                                                errors.push({ row: r, message: `Item at row ${r} ("${dataRaw}") found without active COA in cat "${currentCat.cat}"` });
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

                                        // Non-item rows: D empty, check data
                                        if (!dataRaw || !dataNorm) continue;

                                        // Total row (normalized suffix/prefix)
                                        if (isTotalRow(dataNorm)) {
                                            const expected = currentCat ? normalize(`${currentCat.cat} - total`) : null;
                                            if (!currentCat) {
                                                errors.push({ row: r, message: `Total "${dataRaw}" at row ${r} without active category` });
                                            } else if (expected && dataNorm !== expected) {
                                                // allow also prefix totals? but for cat totals expect cat - total
                                                // check if it matches cat - total
                                                if (dataNorm !== expected) {
                                                    errors.push({
                                                        row: r,
                                                        message: `Total mismatch at row ${r}: got "${dataRaw}" (norm "${dataNorm}") expected "${currentCat.cat} - TOTAL"`,
                                                    });
                                                }
                                            }
                                            // Close cat — flush pending COA first so cat at 9 with coa at 10 is counted
                                            if (currentCat) {
                                                if (currentCoa) {
                                                    currentCat.coas.push({ ...currentCoa });
                                                    currentCoa = null;
                                                }
                                                if (currentCat.coas.length === 0) {
                                                    errors.push({ row: r, message: `Category "${currentCat.cat}" at row ${currentCat.catRow} has no COA groups before total` });
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

                                        // COA label detection: next row's COA == this data (normalize only)
                                        let isCoaLabel = false;
                                        let nextCoaRaw: string | null = null;
                                        let nextCoaNorm: string | null = null;
                                        if (r + 1 <= lastRow) {
                                            nextCoaRaw = cellText(ws.getRow(r + 1).getCell(coaColumn));
                                            nextCoaNorm = nextCoaRaw ? normalize(nextCoaRaw) : null;
                                            if (nextCoaNorm && dataNorm && nextCoaNorm === dataNorm) {
                                                isCoaLabel = true;
                                            }
                                        }

                                        if (isCoaLabel) {
                                            if (!currentCat) {
                                                errors.push({ row: r, message: `COA "${dataRaw}" at row ${r} found without active category` });
                                                // start cat implicitly? no, keep error
                                                continue;
                                            }
                                            // flush previous COA
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

                                        // Row 1118 case: D empty, not total, not COA label, but next row has a COA (next_D not empty) and mismatched → intended COA but inconsistent, don't treat as cat
                                        if (nextCoaNorm && dataNorm) {
                                            errors.push({
                                                row: r,
                                                message: `COA label "${dataRaw}" at row ${r} mismatched next D "${nextCoaRaw}" after normalize (expected same) — not treated as category`,
                                            });
                                            continue;
                                        }

                                        // Otherwise it's a category header
                                        // Close previous cat if not closed with total
                                        if (currentCat) {
                                            errors.push({
                                                row: r,
                                                message: `Category "${dataRaw}" at row ${r} started before previous cat "${currentCat.cat}" (row ${currentCat.catRow}) closed with " - TOTAL"`,
                                            });
                                            // still flush previous to continue verification
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
                                        // start new cat
                                        currentCat = { cat: dataRaw, catRow: r, coas: [] };
                                        currentCoa = null;
                                    }

                                    // End of loop — check dangling cat/coa
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

                                    // Log groups
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

                                    const valid = errors.length === 0;
                                    const message = valid
                                        ? `✅ Format OK — ${catGroups.length} procurement cat group(s) verified` +
                                          (groups.additional || groups.nonProcurement
                                              ? ` | Additional: ${groups.additional ? "found" : "—"}, Non-Proc: ${groups.nonProcurement ? "found" : "—"}`
                                              : "")
                                        : `❌ Found ${errors.length} issue(s) in procurement format`;

                                    console.log(message, errors);
                                    if (errors.length > 0) console.table(errors);

                                    setVerifyResult({ valid, message, errors, groups, details });
                                }}
                            >
                                Verify Sheet Format
                            </Button>
                            <span className="text-sm text-muted-foreground">Checks procurement cats (excluding additional) follow cat → coa(s) → items → cat - total</span>
                        </div>
                        {verifyResult && (
                            <div className={`rounded-md border p-3 text-sm ${verifyResult.valid ? "border-green-200 bg-green-50 text-green-900" : "border-red-200 bg-red-50 text-red-900"}`}>
                                <div className="font-medium">{verifyResult.message}</div>
                                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                    <Badge variant={verifyResult.groups.procurement ? "default" : "secondary"}>Procurement: {verifyResult.groups.procurement} cells</Badge>
                                    <Badge variant={verifyResult.groups.additional ? "default" : "secondary"}>Additional: {verifyResult.groups.additional} cells</Badge>
                                    <Badge variant={verifyResult.groups.nonProcurement ? "default" : "secondary"}>Non-Proc: {verifyResult.groups.nonProcurement} cells</Badge>
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
                                        <div className="text-xs font-semibold">Issues:</div>
                                        <ul className="mt-1 max-h-48 list-disc overflow-auto pl-5">
                                            {verifyResult.errors.map((e, i) => (
                                                <li key={i}>
                                                    <span className="font-mono">Row {e.row}:</span> {e.message}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {!loading && fileName && sheets.length === 0 && !error && (
                    <p className="text-sm text-muted-foreground">No sheets found in this workbook.</p>
                )}
            </div>
        </>
    );
}

CategoryImport.layout = {
    breadcrumbs: [{ title: "Category Import", href: "#" }],
};
