import { router } from "@inertiajs/react";
import ExcelJS from "exceljs";
import type { ChangeEvent } from "react";
import { useState } from "react";
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
import type { FiscalYear, FundingSource, Office } from "@/types";
import { FileSpreadsheet } from "lucide-react";
import { extractData } from "./extract";
import type { ExtractResult } from "./extract";
import { FundingSourceMap } from "./funding-source-map";

interface ColumnMapping {
    ppa: string;
    startDate: string;
    endDate: string;
    expectedOutput: string;
    fundingSourceId: string;
    psAmount: string;
    mooeAmount: string;
    feAmount: string;
    coAmount: string;
    ccetAdaptation: string;
    ccetMitigation: string;
    ccTypologyId: string;
}

const defaultColumnMapping: ColumnMapping = {
    ppa: "B",
    startDate: "D",
    endDate: "E",
    expectedOutput: "F",
    fundingSourceId: "G",
    psAmount: "H",
    mooeAmount: "I",
    feAmount: "J",
    coAmount: "K",
    ccetAdaptation: "M",
    ccetMitigation: "N",
    ccTypologyId: "O",
};

const DEFAULT_FUNDING_CODE_MAP: Record<string, string> = {
    "GF-Proper": "GF Proper",
    "5% GAD": "GF-5% GAD",
};

interface AipSummaryImportProps {
    years: FiscalYear[];
    offices: Office[];
    fundingSources: FundingSource[];
}

export default function AipSummaryImport({
    years,
    offices,
    fundingSources: allFundingSources,
}: AipSummaryImportProps) {
    const [sheets, setSheets] = useState<string[]>([]);
    const [workbook, setWorkbook] = useState<ExcelJS.Workbook | null>(null);
    const [selectedSheet, setSelectedSheet] = useState("");
    const [fileName, setFileName] = useState<string | null>(null);
    const [startRow, setStartRow] = useState(9);
    const [endRow, setEndRow] = useState<number | undefined>(undefined);
    const [columnMap, setColumnMap] = useState<ColumnMapping>(defaultColumnMapping);
    const [result, setResult] = useState<ExtractResult | null>(null);
    const [psPoolTempId, setPsPoolTempId] = useState<number | null>(null);
    const [fundingCodeMappings, setFundingCodeMappings] =
        useState<Record<string, string>>(DEFAULT_FUNDING_CODE_MAP);
    const latestDraftYear = years.find((fy) => fy.status === "draft");
    const [selectedFiscalYear, setSelectedFiscalYear] = useState(
        latestDraftYear ? String(latestDraftYear.id) : "",
    );
    const [selectedOfficeId, setSelectedOfficeId] = useState("");

    async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        const isXlsx =
            file.name.toLowerCase().endsWith(".xlsx") ||
            file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        if (!isXlsx) {
            setSheets([]);
            setWorkbook(null);
            setSelectedSheet("");
            setFileName(null);
            setResult(null);
            e.target.value = "";
            return;
        }

        setFileName(file.name);
        try {
            const wb = new ExcelJS.Workbook();
            const arrayBuffer = await file.arrayBuffer();
            await wb.xlsx.load(arrayBuffer);

            setWorkbook(wb);
            setSheets(wb.worksheets.map((ws) => ws.name));
            setResult(null);
            setPsPoolTempId(null);
            setFundingCodeMappings(DEFAULT_FUNDING_CODE_MAP);
        } catch {
            setSheets([]);
            setWorkbook(null);
            setSelectedSheet("");
            setFileName(null);
            setResult(null);
        }
    }

    function handleExtract() {
        if (!workbook || !selectedSheet) {
            return;
        }

        const ws = workbook.getWorksheet(selectedSheet);

        if (!ws) {
            return;
        }

        const data = extractData({
            worksheet: ws,
            startRow,
            endRow,
            columnMap,
        });

        setResult(data);
        setPsPoolTempId(null);
        setFundingCodeMappings(DEFAULT_FUNDING_CODE_MAP);
        console.log("Extract result:", data);
    }

    function handleImport() {
        if (!result || !selectedFiscalYear || !selectedOfficeId || !psPoolTempId) {
            return;
        }

        router.post("/aip-summary-import", {
            fiscal_year_id: selectedFiscalYear,
            office_id: selectedOfficeId,
            ps_pool_temp_id: psPoolTempId,
            ppas: result.ppas,
            aip_entries: result.aipEntries,
            funding_sources: result.fundingSources,
            funding_code_mappings: fundingCodeMappings,
        });
    }

    const programs = result?.ppas.filter((p) => p.type === "Program") ?? [];

    function updateColumn(key: keyof ColumnMapping, value: string) {
        setColumnMap((prev) => ({ ...prev, [key]: value.toUpperCase() }));
    }

    return (
        <>
            <Field>
                <FieldLabel htmlFor="file">Excel File</FieldLabel>
                <Input id="file" type="file" accept=".xlsx" onChange={handleFileChange} />
                <FieldDescription>Select an Excel file.</FieldDescription>
            </Field>

            {fileName && (
                <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-muted/30">
                    <FileSpreadsheet className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="font-medium truncate max-w-[42ch]" title={fileName}>
                        {fileName}
                    </span>
                    <span className="hidden text-muted-foreground sm:inline">•</span>
                    <span className="truncate text-muted-foreground">
                        {selectedSheet ? `Sheet: ${selectedSheet}` : `${sheets.length} sheet${sheets.length === 1 ? "" : "s"} found`}
                    </span>
                </div>
            )}

            {sheets.length > 0 && (
                <Field>
                    <FieldLabel>Sheet</FieldLabel>
                    <Select value={selectedSheet} onValueChange={setSelectedSheet}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select sheet" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {sheets.map((sheet) => (
                                    <SelectItem key={sheet} value={sheet}>
                                        {sheet}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </Field>
            )}

            {sheets.length > 0 && (
                <>
                    <div className="mt-4 flex gap-4">
                        <Field>
                            <FieldLabel>Fiscal Year</FieldLabel>
                            <Select
                                value={selectedFiscalYear}
                                onValueChange={setSelectedFiscalYear}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select fiscal year" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {years.map((fy) => (
                                            <SelectItem key={fy.id} value={String(fy.id)}>
                                                {fy.year} ({fy.status})
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </Field>

                        <Field>
                            <FieldLabel>Office</FieldLabel>
                            <Select value={selectedOfficeId} onValueChange={setSelectedOfficeId}>
                                <SelectTrigger className="w-[220px]">
                                    <SelectValue placeholder="Select office" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {offices.map((office) => (
                                            <SelectItem key={office.id} value={String(office.id)}>
                                                {office.acronym || office.name}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </Field>
                    </div>

                    <div className="mt-4 flex gap-4">
                        <Field>
                            <FieldLabel htmlFor="startRow">Start Row</FieldLabel>
                            <Input
                                id="startRow"
                                type="number"
                                value={startRow}
                                onChange={(e) => setStartRow(Number(e.target.value))}
                            />
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="endRow">End Row (optional)</FieldLabel>
                            <Input
                                id="endRow"
                                type="number"
                                value={endRow ?? ""}
                                onChange={(e) =>
                                    setEndRow(e.target.value ? Number(e.target.value) : undefined)
                                }
                            />
                            <FieldDescription>
                                Leave empty to read to the last row.
                            </FieldDescription>
                        </Field>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <Field>
                            <FieldLabel>PPA</FieldLabel>
                            <Input
                                value={columnMap.ppa}
                                onChange={(e) => updateColumn("ppa", e.target.value)}
                                className="w-16"
                            />
                        </Field>
                        <Field>
                            <FieldLabel>Start Date</FieldLabel>
                            <Input
                                value={columnMap.startDate}
                                onChange={(e) => updateColumn("startDate", e.target.value)}
                                className="w-16"
                            />
                        </Field>
                        <Field>
                            <FieldLabel>End Date</FieldLabel>
                            <Input
                                value={columnMap.endDate}
                                onChange={(e) => updateColumn("endDate", e.target.value)}
                                className="w-16"
                            />
                        </Field>
                        <Field>
                            <FieldLabel>Expected Output</FieldLabel>
                            <Input
                                value={columnMap.expectedOutput}
                                onChange={(e) => updateColumn("expectedOutput", e.target.value)}
                                className="w-16"
                            />
                        </Field>
                        <Field>
                            <FieldLabel>Funding Source ID</FieldLabel>
                            <Input
                                value={columnMap.fundingSourceId}
                                onChange={(e) => updateColumn("fundingSourceId", e.target.value)}
                                className="w-16"
                            />
                        </Field>
                        <Field>
                            <FieldLabel>PS Amount</FieldLabel>
                            <Input
                                value={columnMap.psAmount}
                                onChange={(e) => updateColumn("psAmount", e.target.value)}
                                className="w-16"
                            />
                        </Field>
                        <Field>
                            <FieldLabel>MOOE Amount</FieldLabel>
                            <Input
                                value={columnMap.mooeAmount}
                                onChange={(e) => updateColumn("mooeAmount", e.target.value)}
                                className="w-16"
                            />
                        </Field>
                        <Field>
                            <FieldLabel>FE Amount</FieldLabel>
                            <Input
                                value={columnMap.feAmount}
                                onChange={(e) => updateColumn("feAmount", e.target.value)}
                                className="w-16"
                            />
                        </Field>
                        <Field>
                            <FieldLabel>CO Amount</FieldLabel>
                            <Input
                                value={columnMap.coAmount}
                                onChange={(e) => updateColumn("coAmount", e.target.value)}
                                className="w-16"
                            />
                        </Field>
                        <Field>
                            <FieldLabel>CCET Adaptation</FieldLabel>
                            <Input
                                value={columnMap.ccetAdaptation}
                                onChange={(e) => updateColumn("ccetAdaptation", e.target.value)}
                                className="w-16"
                            />
                        </Field>
                        <Field>
                            <FieldLabel>CCET Mitigation</FieldLabel>
                            <Input
                                value={columnMap.ccetMitigation}
                                onChange={(e) => updateColumn("ccetMitigation", e.target.value)}
                                className="w-16"
                            />
                        </Field>
                        <Field>
                            <FieldLabel>CC Typology ID</FieldLabel>
                            <Input
                                value={columnMap.ccTypologyId}
                                onChange={(e) => updateColumn("ccTypologyId", e.target.value)}
                                className="w-16"
                            />
                        </Field>
                    </div>

                    {selectedSheet && (
                        <div className="mt-6">
                            <Button onClick={handleExtract}>Extract</Button>
                        </div>
                    )}

                    {result && (
                        <div className="mt-2 text-sm text-muted-foreground">
                            Found {result.ppas.length} PPAs, {result.aipEntries.length} entries,{" "}
                            {result.fundingSources.length} funding sources.
                        </div>
                    )}

                    {programs.length > 0 && (
                        <Field>
                            <FieldLabel>PS Pool Program</FieldLabel>
                            <Select
                                value={psPoolTempId ? String(psPoolTempId) : ""}
                                onValueChange={(v) => setPsPoolTempId(Number(v))}
                            >
                                <SelectTrigger className="w-[400px]">
                                    <SelectValue placeholder="Select which Program is the PS pool..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {programs.map((p) => (
                                            <SelectItem key={p.tempId} value={String(p.tempId)}>
                                                [{p.tempId}] {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <FieldDescription>
                                Personal Services amounts can only be assigned to this Program.
                            </FieldDescription>
                        </Field>
                    )}

                    <FundingSourceMap
                        fundingSources={result?.fundingSources ?? []}
                        allFundingSources={allFundingSources}
                        mappings={fundingCodeMappings}
                        onMappingsChange={setFundingCodeMappings}
                    />

                    {result && psPoolTempId && (
                        <div className="mt-6">
                            <Button onClick={handleImport}>Import to Database</Button>
                        </div>
                    )}
                </>
            )}
        </>
    );
}

AipSummaryImport.layout = {
    breadcrumbs: [
        {
            title: "AIP Summary Importer",
            href: "#",
        },
    ],
};
