import { Head, router, usePage } from '@inertiajs/react';
import { createColumnHelper } from '@tanstack/react-table';
import ExcelJS from 'exceljs';
import {
    FileSpreadsheet,
    Pencil,
    RotateCcw,
    ScrollText,
    X,
} from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useState, useMemo } from 'react';
import { MultiTableSelect } from '@/components/multi-table-select';
import { TableSelect } from '@/components/table-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type {
    AipSummaryField,
    AipSummarySheetConfig,
} from '@/lib/aip-summary-import/sheet-config';
import {
    AIP_SUMMARY_FIELD_GROUPS,
    AIP_SUMMARY_FIELD_LABELS,
    getDefaultAipSummaryConfig,
} from '@/lib/aip-summary-import/sheet-config';
import type { AipSummaryVerifyResult } from '@/lib/aip-summary-import/verify';
import {
    extractAipSummaryRows,
    verifyAipSummarySheet,
} from '@/lib/aip-summary-import/verify';
import type { AipSummaryExtractResult } from '@/lib/aip-summary-import/extract';
import {
    extractAipSummaryRecords,
    formatAipScheduleShort,
} from '@/lib/aip-summary-import/extract';
import type {
    RecordOfficeMatch,
    TokenMapping,
} from '@/lib/aip-summary-import/match-offices';
import {
    effectiveOfficeIds,
    matchRecordOffices,
    unmatchedOfficeFrequency,
    visibleUnmatched,
} from '@/lib/aip-summary-import/match-offices';
import type { RecordFundMatch } from '@/lib/aip-summary-import/match-funds';
import {
    matchRecordFunds,
    unmatchedFundFrequency,
} from '@/lib/aip-summary-import/match-funds';
import { normalize } from '@/lib/ppmp/normalize';

type ImportOffice = {
    id: number;
    acronym: string | null;
    name: string;
    full_code: string;
};

type ImportFund = {
    id: number;
    fund_type: string;
    code: string;
    title: string;
};

const importOfficeColumnHelper = createColumnHelper<ImportOffice>();

const importFundColumnHelper = createColumnHelper<ImportFund>();

const importFundColumns = [
    importFundColumnHelper.accessor('code', {
        size: 140,
        header: () => <div className="text-center text-wrap">Code</div>,
        cell: (info) => (
            <div className="text-center font-mono text-wrap">
                {info.getValue()}
            </div>
        ),
    }),
    importFundColumnHelper.accessor('title', {
        size: 220,
        header: () => <div className="text-center text-wrap">Title</div>,
        cell: (info) => <div className="text-wrap">{info.getValue()}</div>,
    }),
];

const importOfficeColumns = [
    importOfficeColumnHelper.accessor('acronym', {
        size: 100,
        header: () => <div className="text-center text-wrap">Acronym</div>,
        cell: (info) => (
            <div className="text-center text-wrap">
                {info.getValue() || '—'}
            </div>
        ),
    }),
    importOfficeColumnHelper.accessor('name', {
        size: 200,
        header: () => <div className="text-center text-wrap">Name</div>,
        cell: (info) => <div className="text-wrap">{info.getValue()}</div>,
    }),
];

export default function AipSummaryImport() {
    // ----- Inertia props (offices, ppas, fiscal years, funds, auth user) -----
    const {
        existingOffices,
        existingPpas,
        fiscalYears,
        activeFiscalYear,
        fundingSources,
        ccTypologies,
        existingOutputs,
        existingFundLinks,
        auth,
    } = usePage().props as unknown as {
        existingOffices: {
            id: number;
            acronym: string | null;
            name: string;
            full_code: string;
        }[];
        existingPpas: {
            id: number;
            office_id: number;
            parent_id: number | null;
            name: string;
            type: string;
            code_suffix: string | null;
            full_code: string;
            fiscal_year_id: number;
        }[];
        fiscalYears: { id: number; year: number; status: string }[];
        activeFiscalYear: { id: number; year: number; status: string } | null;
        fundingSources: {
            id: number;
            fund_type: string;
            code: string;
            title: string;
        }[];
        ccTypologies: { id: number; code: string }[];
        existingOutputs: {
            id: number;
            ppa_id: number;
            office_id: number;
            fiscal_year_id: number | null;
            expected_output: string | null;
        }[];
        existingFundLinks: {
            id: number;
            output_id: number;
            funding_source_id: number;
            ppa_id: number;
            office_id: number;
            fiscal_year_id: number | null;
        }[];
        auth: { user: { office_id: number | null } };
    };

    // ----- Existing state -----
    const [sheets, setSheets] = useState<string[]>([]);
    const [workbook, setWorkbook] = useState<ExcelJS.Workbook | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [selectedSheet, setSelectedSheet] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<
        | 'upload'
        | 'calibrate'
        | 'verify'
        | 'extract'
        | 'import-ppa'
        | 'import-outputs'
        | 'import-funding'
    >('upload');
    const [config, setConfig] = useState<AipSummarySheetConfig>(() =>
        getDefaultAipSummaryConfig(),
    );
    const [verifyResult, setVerifyResult] =
        useState<AipSummaryVerifyResult | null>(null);
    const [extractResult, setExtractResult] =
        useState<AipSummaryExtractResult | null>(null);
    const [importing, setImporting] = useState(false);

    // ----- Which import flow the 5th step shows (set by the Extract buttons) -----
    const [importTarget, setImportTarget] = useState<
        'ppa' | 'outputs' | 'funding'
    >('ppa');
    const importStep =
        importTarget === 'outputs'
            ? 'import-outputs'
            : importTarget === 'funding'
              ? 'import-funding'
              : 'import-ppa';
    const importTitle =
        importTarget === 'outputs'
            ? 'Import Expected Outputs'
            : importTarget === 'funding'
              ? 'Import Funding Source'
              : 'Import PPA';

    function goToImport(target: typeof importTarget) {
        setImportTarget(target);
        setStep(
            target === 'outputs'
                ? 'import-outputs'
                : target === 'funding'
                  ? 'import-funding'
                  : 'import-ppa',
        );
    }

    // ----- State for selected office (defaults to user's office) -----
    const [selectedOffice, setSelectedOffice] = useState<string>(
        auth.user.office_id?.toString() || '',
    );

    // ----- State for selected fiscal year (defaults to active fiscal year) -----
    const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>(
        activeFiscalYear?.id.toString() || '',
    );

    // ----- Derived display label for the office trigger (acronym, name fallback) -----
    const selectedOfficeLabel = useMemo(() => {
        const office = existingOffices.find(
            (o) => o.id.toString() === selectedOffice,
        );
        return office?.acronym?.trim() || office?.name || '';
    }, [existingOffices, selectedOffice]);

    // ----- Derived display label for the fiscal year trigger -----
    const selectedFiscalYearLabel = useMemo(() => {
        const fy = fiscalYears.find(
            (f) => f.id.toString() === selectedFiscalYear,
        );
        return fy ? String(fy.year) : '';
    }, [fiscalYears, selectedFiscalYear]);

    // ----- Per-record office overrides (record.key -> office ids), set via the picker -----
    const [officeOverrides, setOfficeOverrides] = useState<
        Record<string, number[]>
    >({});
    const [officePickerKey, setOfficePickerKey] = useState<string | null>(null);
    // ----- Per-record 1:1 token -> office links (manual mapping context) -----
    const [tokenMappings, setTokenMappings] = useState<
        Record<string, TokenMapping>
    >({});
    // ----- Per-record explicitly removed unresolved tokens -----
    const [dismissedTokens, setDismissedTokens] = useState<
        Record<string, string[]>
    >({});
    // ----- Which unresolved token the shared picker is mapping (null = bulk mode) -----
    const [mappingTarget, setMappingTarget] = useState<{
        key: string;
        token: string;
    } | null>(null);

    // ----- Per-record fund overrides (record.key -> funding_source_id) -----
    const [fundOverrides, setFundOverrides] = useState<Record<string, number>>(
        {},
    );
    // ----- Per-record explicitly removed unresolved funds -----
    const [dismissedFunds, setDismissedFunds] = useState<
        Record<string, boolean>
    >({});
    // ----- Which record the shared fund picker is mapping -----
    const [fundPickerKey, setFundPickerKey] = useState<string | null>(null);

    // ----- Auto-match of implementing-office tokens (strict-normalized) -----
    const officeMatches = useMemo(() => {
        if (!extractResult) return new Map<string, RecordOfficeMatch>();

        return new Map(
            extractResult.records.map((record) => [
                record.key,
                matchRecordOffices(record.key, record.offices, existingOffices),
            ]),
        );
    }, [extractResult, existingOffices]);

    // ----- Unmatched token frequencies (shows where to loosen matching later) -----
    // Only tokens still needing attention count: mapped + dismissed are out.
    const unmatchedFrequency = useMemo(() => {
        if (!extractResult) return [];

        return unmatchedOfficeFrequency(
            extractResult.records.map((record) => ({
                key: record.key,
                tokens: [],
                matched: [],
                unmatched: visibleUnmatched(
                    officeMatches.get(record.key),
                    tokenMappings[record.key] ?? {},
                    dismissedTokens[record.key] ?? [],
                ),
            })),
        );
    }, [extractResult, officeMatches, tokenMappings, dismissedTokens]);

    /** Effective office ids for a record: override base + 1:1 mappings unioned. */
    function officeIdsForRecord(key: string): number[] {
        return effectiveOfficeIds(
            officeMatches.get(key),
            officeOverrides[key],
            tokenMappings[key] ?? {},
        );
    }

    // ----- Auto-match of fund + typology tokens (strict-normalized) -----
    const fundMatches = useMemo(() => {
        if (!extractResult) return new Map<string, RecordFundMatch>();

        return new Map(
            extractResult.records.map((record) => [
                record.key,
                matchRecordFunds(
                    record.key,
                    record.fundingSource,
                    record.typology,
                    fundingSources,
                    ccTypologies,
                ),
            ]),
        );
    }, [extractResult, fundingSources, ccTypologies]);

    // ----- Unmatched fund frequencies (shows where to loosen matching later) -----
    // Overridden + dismissed rows are out — already resolved.
    const unmatchedFundEntries = useMemo(() => {
        if (!extractResult) return [];

        return unmatchedFundFrequency(
            extractResult.records
                .filter(
                    (record) =>
                        fundOverrides[record.key] === undefined &&
                        !dismissedFunds[record.key],
                )
                .map(
                    (record) =>
                        fundMatches.get(record.key) ?? {
                            key: record.key,
                            fundToken: record.fundingSource,
                            fund: null,
                            typology: null,
                        },
                ),
        );
    }, [extractResult, fundMatches, fundOverrides, dismissedFunds]);

    /** Effective funding_source_id for a record: override wins over auto-match. */
    function fundIdForRecord(key: string): number | null {
        const override = fundOverrides[key];
        if (override !== undefined) return override;

        return fundMatches.get(key)?.fund?.id ?? null;
    }

    /** CC peso amounts ride the fund link; blank/dash/non-numeric → 0. */
    function ccAmount(value: string | null): number {
        if (value == null) return 0;

        const parsed = Number.parseFloat(value.trim());

        return Number.isFinite(parsed) ? parsed : 0;
    }

    function resetRowOffices(key: string) {
        setOfficeOverrides((prev) => {
            const next = { ...prev };
            delete next[key];

            return next;
        });
        setTokenMappings((prev) => {
            const next = { ...prev };
            delete next[key];

            return next;
        });
        setDismissedTokens((prev) => {
            const next = { ...prev };
            delete next[key];

            return next;
        });
    }

    /** Set (officeId) or clear (null) the 1:1 link for one unresolved token. */
    function setTokenMapping(
        key: string,
        token: string,
        officeId: number | null,
    ) {
        setTokenMappings((prev) => {
            const rowMappings = { ...(prev[key] ?? {}) };

            if (officeId === null) {
                delete rowMappings[token];
            } else {
                rowMappings[token] = officeId;
            }

            if (Object.keys(rowMappings).length === 0) {
                const next = { ...prev };
                delete next[key];

                return next;
            }

            return { ...prev, [key]: rowMappings };
        });
    }

    // ----- Derived flags -----
    const canCalibrate = selectedSheet !== '';
    const canVerify =
        canCalibrate &&
        config.headerRow !== '' &&
        config.headerRow != null &&
        !!workbook;
    const canExtract = canVerify && verifyResult?.valid === true;
    const canImportPpa = canExtract && !!extractResult;

    // ----- Compute blocks for import based on selected office + fiscal year -----
    const blocksForImport = useMemo(() => {
        if (!extractResult || !selectedOffice || !selectedFiscalYear) return [];

        const officeId = Number(selectedOffice);
        const fiscalYearId = Number(selectedFiscalYear);
        const office = existingOffices.find((o) => o.id === officeId);
        if (!office) return [];

        // Filter PPAs that belong to the selected office + fiscal year
        const ppasForOffice = existingPpas.filter(
            (p) =>
                p.office_id === officeId && p.fiscal_year_id === fiscalYearId,
        );
        const ppasByCode = new Map<string, (typeof existingPpas)[0]>();
        for (const ppa of ppasForOffice) {
            const key = normalize(ppa.full_code);
            if (!ppasByCode.has(key)) {
                ppasByCode.set(key, ppa);
            }
        }

        // Group extracted records by fullCode
        const groups = new Map<
            string,
            { fullCode: string; name: string; type: string; rows: number[] }
        >();
        for (const record of extractResult.records) {
            let group = groups.get(record.fullCode);
            if (!group) {
                group = {
                    fullCode: record.fullCode,
                    name: record.name,
                    type: record.type,
                    rows: [],
                };
                groups.set(record.fullCode, group);
            }
            group.rows.push(record.row);
        }

        // Build result with status
        const result = [];
        for (const [fullCode, group] of groups) {
            const ppa = ppasByCode.get(normalize(fullCode));
            result.push({
                ...group,
                status: ppa ? 'exists' : 'new',
            });
        }
        return result;
    }, [
        extractResult,
        selectedOffice,
        selectedFiscalYear,
        existingOffices,
        existingPpas,
    ]);

    // ----- Handlers -----
    async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const isXlsx =
            file.name.toLowerCase().endsWith('.xlsx') ||
            file.type ===
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        if (!isXlsx) {
            setError('Only .xlsx files are allowed.');
            setSheets([]);
            setWorkbook(null);
            setSelectedSheet('');
            setFileName(null);
            setStep('upload');
            setVerifyResult(null);
            setExtractResult(null);
            e.target.value = '';
            return;
        }

        setError(null);
        setLoading(true);
        setFileName(file.name);
        setSelectedSheet('');
        setStep('upload');
        setVerifyResult(null);
        setExtractResult(null);

        try {
            const wb = new ExcelJS.Workbook();
            const buf = await file.arrayBuffer();
            await wb.xlsx.load(buf);
            setWorkbook(wb);
            setSheets(wb.worksheets.map((ws) => ws.name));
        } catch {
            setError('Failed to parse .xlsx file.');
            setSheets([]);
            setWorkbook(null);
            setSelectedSheet('');
            setFileName(null);
        } finally {
            setLoading(false);
        }
    }

    function handleSheetChange(value: string[]) {
        setSelectedSheet(value[0] ?? '');
        setVerifyResult(null);
        setExtractResult(null);
    }

    function updateColumn(field: AipSummaryField, letter: string) {
        setConfig((prev) => ({
            ...prev,
            columnConfig: {
                ...prev.columnConfig,
                [field]: letter.toUpperCase(),
            },
        }));
        setVerifyResult(null);
        setExtractResult(null);
    }

    function updateHeaderRow(value: string) {
        setConfig((prev) => ({
            ...prev,
            headerRow: value === '' ? '' : Number(value),
        }));
        setVerifyResult(null);
        setExtractResult(null);
    }

    function handleResetDefaults() {
        setConfig(getDefaultAipSummaryConfig());
        setVerifyResult(null);
        setExtractResult(null);
    }

    function handleLogContents() {
        if (!workbook || !selectedSheet) return;
        if (config.headerRow === '' || config.headerRow == null) {
            console.log(
                'AipSummaryImport: header row is required before logging contents.',
            );
            return;
        }

        const ws = workbook.getWorksheet(selectedSheet);
        if (!ws) {
            console.log(
                `AipSummaryImport: worksheet "${selectedSheet}" not found.`,
            );
            return;
        }

        const extracted = extractAipSummaryRows(ws, {
            ...config,
            headerRow: config.headerRow,
        });

        console.log('AipSummaryImport contents:', {
            fileName,
            sheet: selectedSheet,
            headerRow: extracted.headerRow,
            numberRow: extracted.numberRow,
            dataStartRow: extracted.dataStartRow,
            lastRow: extracted.lastRow,
            actualRowCount: ws.actualRowCount,
            rowCount: ws.rowCount,
            rowCountLogged: extracted.kept.length,
            skippedBlank: extracted.skippedBlank,
            skippedFooter: extracted.skippedFooter,
            columnConfig: config.columnConfig,
            rows: extracted.kept.map((k) => ({
                _row: String(k.row),
                _kind: k.kind,
                ...k.values,
            })),
            scheduleRaw: extracted.kept.map((k) => {
                const row = ws.getRow(k.row);
                const startCell = row.getCell(config.columnConfig.startDate);
                const endCell = row.getCell(config.columnConfig.endDate);
                return {
                    _row: String(k.row),
                    startDateRaw: startCell.value,
                    startDateText: k.values.startDate,
                    endDateRaw: endCell.value,
                    endDateText: k.values.endDate,
                };
            }),
        });
    }

    function handleVerify() {
        if (!workbook || !selectedSheet) return;
        setVerifyResult(verifyAipSummarySheet(workbook, selectedSheet, config));
        setExtractResult(null);
    }

    function handleExtract() {
        if (!workbook || !selectedSheet) return;
        if (config.headerRow === '' || config.headerRow == null) return;
        const ws = workbook.getWorksheet(selectedSheet);
        if (!ws) return;
        setExtractResult(
            extractAipSummaryRecords(ws, {
                ...config,
                headerRow: config.headerRow,
            }),
        );
        setOfficeOverrides({});
        setOfficePickerKey(null);
        setTokenMappings({});
        setDismissedTokens({});
        setMappingTarget(null);
        setFundOverrides({});
        setDismissedFunds({});
        setFundPickerKey(null);
    }

    const newBlocks = useMemo(
        () => blocksForImport.filter((b) => b.status === 'new'),
        [blocksForImport],
    );

    function handleConfirmImport() {
        if (!selectedOffice || !selectedFiscalYear || newBlocks.length === 0)
            return;
        setImporting(true);
        router.post(
            '/aip-summary-import',
            {
                office_id: Number(selectedOffice),
                fiscal_year_id: Number(selectedFiscalYear),
                blocks: newBlocks.map((b) => ({
                    full_code: b.fullCode,
                    name: b.name,
                    type: b.type,
                })),
            },
            {
                onFinish: () => setImporting(false),
            },
        );
    }

    const [importingOutputs, setImportingOutputs] = useState(false);

    // Importable grain: output rows plus context rows (office/schedule
    // present, output null — e.g. MANPOWER SERVICES). Pure hierarchy rows
    // (nothing carried) are excluded. Office ids are the effective
    // resolution (auto + mappings + overrides); rows with none are still
    // sent so the backend can report them as skipped.
    const importableOutputs = useMemo(() => {
        if (!extractResult || !selectedOffice || !selectedFiscalYear) return [];

        return extractResult.records
            .filter(
                (r) =>
                    (r.expectedOutput != null &&
                        r.expectedOutput.trim() !== '') ||
                    r.offices.length > 0 ||
                    r.startDate != null ||
                    r.endDate != null,
            )
            .map((r) => ({
                key: r.key,
                full_code: r.fullCode,
                fullCodeNorm: r.fullCodeNorm,
                outputNorm: r.outputNorm,
                name: r.name,
                expected_output: r.expectedOutput,
                start_date: r.startDate,
                end_date: r.endDate,
                office_ids: officeIdsForRecord(r.key),
            }));
    }, [
        extractResult,
        selectedOffice,
        selectedFiscalYear,
        officeMatches,
        officeOverrides,
        tokenMappings,
    ]);

    // Exists/new status per output row: resolve the PPA by normalized ref
    // code within the selected office + fiscal year, then match the
    // expected output text (null matches null). Rows with no resolved
    // offices are flagged `no-offices` but still importable — offices
    // attach later via the edit dialog. Mirrors the PPA tab.
    type OutputImportStatus = 'exists' | 'new' | 'no-ppa' | 'no-offices';

    const outputStatuses = useMemo(() => {
        const map = new Map<string, OutputImportStatus>();

        if (!selectedOffice || !selectedFiscalYear) return map;

        const officeId = Number(selectedOffice);
        const fiscalYearId = Number(selectedFiscalYear);
        const ppasByCode = new Map<number, (typeof existingPpas)[number]>();
        for (const ppa of existingPpas) {
            if (
                ppa.office_id === officeId &&
                ppa.fiscal_year_id === fiscalYearId &&
                !ppasByCode.has(ppa.id)
            ) {
                ppasByCode.set(ppa.id, ppa);
            }
        }
        const byCodeNorm = new Map<string, (typeof existingPpas)[number]>();
        for (const ppa of ppasByCode.values()) {
            const key = normalize(ppa.full_code);
            if (!byCodeNorm.has(key)) byCodeNorm.set(key, ppa);
        }
        const outputsByPpa = new Map<number, typeof existingOutputs>();
        for (const output of existingOutputs) {
            if (
                output.office_id !== officeId ||
                output.fiscal_year_id !== fiscalYearId
            ) {
                continue;
            }
            const list = outputsByPpa.get(output.ppa_id) ?? [];
            list.push(output);
            outputsByPpa.set(output.ppa_id, list);
        }

        for (const row of importableOutputs) {
            const ppa = byCodeNorm.get(row.fullCodeNorm);
            if (!ppa) {
                map.set(row.key, 'no-ppa');
                continue;
            }
            const match = (outputsByPpa.get(ppa.id) ?? []).some((o) =>
                row.outputNorm == null
                    ? o.expected_output == null
                    : o.expected_output != null &&
                      normalize(o.expected_output) === row.outputNorm,
            );
            if (match) {
                map.set(row.key, 'exists');
                continue;
            }
            map.set(
                row.key,
                row.office_ids.length === 0 ? 'no-offices' : 'new',
            );
        }

        return map;
    }, [
        importableOutputs,
        selectedOffice,
        selectedFiscalYear,
        existingPpas,
        existingOutputs,
    ]);

    const newOutputs = useMemo(
        () =>
            importableOutputs.filter((r) => {
                const status = outputStatuses.get(r.key);

                return status === 'new' || status === 'no-offices';
            }),
        [importableOutputs, outputStatuses],
    );

    function handleConfirmOutputs() {
        if (
            !selectedOffice ||
            !selectedFiscalYear ||
            newOutputs.length === 0
        )
            return;
        setImportingOutputs(true);

        router.post(
            '/aip-summary-import/outputs',
            {
                office_id: Number(selectedOffice),
                fiscal_year_id: Number(selectedFiscalYear),
                outputs: newOutputs.map(
                    ({ key, fullCodeNorm, outputNorm, ...payload }) => payload,
                ),
            },
            {
                onFinish: () => setImportingOutputs(false),
                onSuccess: (page) => {
                    const report = (
                        page.props as unknown as {
                            flash?: {
                                importReport?: {
                                    total: number;
                                    inserted: number;
                                    skipped: number;
                                    status: string;
                                    details: Array<{
                                        output: string;
                                        status: string;
                                        id?: number;
                                    }>;
                                };
                            };
                        }
                    ).flash?.importReport;

                    console.log('AipSummaryImport outputs result:', report);
                    console.table(
                        report?.details.filter(
                            (d) => d.status !== 'inserted',
                        ) ?? [],
                    );
                },
            },
        );
    }

    const [importingFunds, setImportingFunds] = useState(false);

    // Importable fund links: records carrying a fund with an effective
    // funding_source_id and not dismissed. Typology falls back to null
    // when unmatched; peso amounts stay out (zeros on the backend).
    const importableFunds = useMemo(() => {
        if (!extractResult || !selectedOffice || !selectedFiscalYear) return [];

        const links: Array<{
            key: string;
            full_code: string;
            fullCodeNorm: string;
            outputNorm: string | null;
            name: string;
            expected_output: string | null;
            funding_source_id: number;
            ccet_adaptation: number;
            ccet_mitigation: number;
            cc_typology_id: number | null;
        }> = [];

        for (const r of extractResult.records) {
            if (r.fundingSource == null) continue;
            if (dismissedFunds[r.key]) continue;

            const fundingSourceId = fundIdForRecord(r.key);
            if (fundingSourceId == null) continue;

            links.push({
                key: r.key,
                full_code: r.fullCode,
                fullCodeNorm: r.fullCodeNorm,
                outputNorm: r.outputNorm,
                name: r.name,
                expected_output: r.expectedOutput,
                funding_source_id: fundingSourceId,
                ccet_adaptation: ccAmount(r.adaptation),
                ccet_mitigation: ccAmount(r.mitigation),
                cc_typology_id:
                    fundMatches.get(r.key)?.typology?.id ?? null,
            });
        }

        return links;
    }, [
        extractResult,
        selectedOffice,
        selectedFiscalYear,
        fundMatches,
        fundOverrides,
        dismissedFunds,
    ]);

    // Exists/new status per fund link: resolve the PPA by normalized ref
    // code, then the output by expected-output text, then check for an
    // existing link on (output, fund). Mirrors the outputs tab.
    type FundLinkStatus = 'exists' | 'new' | 'no-output';

    const fundStatuses = useMemo(() => {
        const map = new Map<string, FundLinkStatus>();

        if (!selectedOffice || !selectedFiscalYear) return map;

        const officeId = Number(selectedOffice);
        const fiscalYearId = Number(selectedFiscalYear);
        const byCodeNorm = new Map<string, (typeof existingPpas)[number]>();
        for (const ppa of existingPpas) {
            if (
                ppa.office_id !== officeId ||
                ppa.fiscal_year_id !== fiscalYearId
            ) {
                continue;
            }
            const key = normalize(ppa.full_code);
            if (!byCodeNorm.has(key)) byCodeNorm.set(key, ppa);
        }
        const outputsByPpa = new Map<number, typeof existingOutputs>();
        for (const output of existingOutputs) {
            if (
                output.office_id !== officeId ||
                output.fiscal_year_id !== fiscalYearId
            ) {
                continue;
            }
            const list = outputsByPpa.get(output.ppa_id) ?? [];
            list.push(output);
            outputsByPpa.set(output.ppa_id, list);
        }
        const linksByOutput = new Map<number, typeof existingFundLinks>();
        for (const link of existingFundLinks) {
            if (
                link.office_id !== officeId ||
                link.fiscal_year_id !== fiscalYearId
            ) {
                continue;
            }
            const list = linksByOutput.get(link.output_id) ?? [];
            list.push(link);
            linksByOutput.set(link.output_id, list);
        }

        for (const row of importableFunds) {
            const ppa = byCodeNorm.get(row.fullCodeNorm);
            const output = ppa
                ? (outputsByPpa.get(ppa.id) ?? []).find((o) =>
                      row.outputNorm == null
                          ? o.expected_output == null
                          : o.expected_output != null &&
                            normalize(o.expected_output) === row.outputNorm,
                  )
                : undefined;
            if (!output) {
                map.set(row.key, 'no-output');
                continue;
            }
            const match = (linksByOutput.get(output.id) ?? []).some(
                (l) => l.funding_source_id === row.funding_source_id,
            );
            map.set(row.key, match ? 'exists' : 'new');
        }

        return map;
    }, [
        importableFunds,
        selectedOffice,
        selectedFiscalYear,
        existingPpas,
        existingOutputs,
        existingFundLinks,
    ]);

    const newFunds = useMemo(
        () =>
            importableFunds.filter((r) => fundStatuses.get(r.key) === 'new'),
        [importableFunds, fundStatuses],
    );

    function handleConfirmFunds() {
        if (
            !selectedOffice ||
            !selectedFiscalYear ||
            newFunds.length === 0
        )
            return;
        setImportingFunds(true);

        router.post(
            '/aip-summary-import/funding-sources',
            {
                office_id: Number(selectedOffice),
                fiscal_year_id: Number(selectedFiscalYear),
                links: newFunds.map(
                    ({ key, fullCodeNorm, outputNorm, ...payload }) => payload,
                ),
            },
            {
                onFinish: () => setImportingFunds(false),
                onSuccess: (page) => {
                    const report = (
                        page.props as unknown as {
                            flash?: {
                                importReport?: {
                                    total: number;
                                    inserted: number;
                                    skipped: number;
                                    status: string;
                                    details: Array<{
                                        output: string;
                                        status: string;
                                        id?: number;
                                    }>;
                                };
                            };
                        }
                    ).flash?.importReport;

                    console.log('AipSummaryImport funds result:', report);
                    console.table(
                        report?.details.filter(
                            (d) => d.status !== 'inserted',
                        ) ?? [],
                    );
                },
            },
        );
    }

    // ----- Render -----
    return (
        <>
            <Head title="AIP Summary Import" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <h1 className="text-2xl font-semibold tracking-tight">
                    AIP Summary Import
                </h1>

                {fileName && !loading && (
                    <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                        <FileSpreadsheet className="text-muted-foreground h-4 w-4 shrink-0" />
                        <span
                            className="max-w-[42ch] truncate font-medium"
                            title={fileName}
                        >
                            {fileName}
                        </span>
                        <span className="text-muted-foreground hidden sm:inline">
                            •
                        </span>
                        <span className="text-muted-foreground truncate">
                            {sheets.length} sheet
                            {sheets.length === 1 ? '' : 's'} found
                        </span>
                    </div>
                )}

                <Tabs
                    value={step}
                    onValueChange={(v) => setStep(v as typeof step)}
                >
                    <TabsList variant="line" className="w-full">
                        <TabsTrigger value="upload" className="flex-1">
                            1. Upload & Sheet
                            {selectedSheet && (
                                <span className="text-muted-foreground ml-1 text-xs">
                                    ✓
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="calibrate"
                            disabled={!canCalibrate}
                            className="flex-1"
                        >
                            2. Calibrate
                        </TabsTrigger>
                        <TabsTrigger
                            value="verify"
                            disabled={!canVerify}
                            className="flex-1"
                        >
                            3. Verify
                            {verifyResult?.valid &&
                                verifyResult.warnings.length === 0 && (
                                    <span className="ml-1 text-xs text-green-600">
                                        ✓
                                    </span>
                                )}
                            {verifyResult?.valid &&
                                verifyResult.warnings.length > 0 && (
                                    <span className="ml-1 text-xs text-amber-600">
                                        ⚠ {verifyResult.warnings.length}
                                    </span>
                                )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="extract"
                            disabled={!canExtract}
                            className="flex-1"
                        >
                            4. Extract
                            {extractResult && (
                                <span className="text-muted-foreground ml-1 text-xs">
                                    {extractResult.records.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value={importStep}
                            disabled={!canImportPpa}
                            className="flex-1"
                        >
                            5. {importTitle}
                        </TabsTrigger>
                    </TabsList>

                    {/* ----- Upload Tab (unchanged) ----- */}
                    <TabsContent
                        value="upload"
                        className="mt-4 flex flex-col gap-4"
                    >
                        <Field>
                            <FieldLabel htmlFor="aip-summary-import-file">
                                Excel File (.xlsx only)
                            </FieldLabel>
                            <Input
                                id="aip-summary-import-file"
                                type="file"
                                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                onChange={handleFileChange}
                                disabled={loading}
                            />
                            <FieldDescription>
                                Select an .xlsx file. Only .xlsx is accepted
                                (ExcelJS).
                            </FieldDescription>
                            {error && (
                                <p className="text-destructive text-sm">
                                    {error}
                                </p>
                            )}
                        </Field>

                        {loading && (
                            <div className="text-muted-foreground flex items-center gap-2 text-sm">
                                <Spinner /> Parsing workbook...
                            </div>
                        )}

                        {!loading && sheets.length > 0 && (
                            <Field>
                                <FieldLabel>Sheets — select one</FieldLabel>
                                <ToggleGroup
                                    value={selectedSheet ? [selectedSheet] : []}
                                    onValueChange={handleSheetChange}
                                    className="flex flex-wrap"
                                >
                                    {sheets.map((sheet) => (
                                        <ToggleGroupItem
                                            key={sheet}
                                            value={sheet}
                                        >
                                            {sheet}
                                        </ToggleGroupItem>
                                    ))}
                                </ToggleGroup>
                                <FieldDescription>
                                    Selected:{' '}
                                    <span className="text-foreground font-medium">
                                        {selectedSheet || 'none'}
                                    </span>
                                </FieldDescription>
                            </Field>
                        )}

                        <div className="flex justify-end">
                            <Button
                                disabled={!canCalibrate}
                                onClick={() => setStep('calibrate')}
                            >
                                Next: Calibrate
                            </Button>
                        </div>
                    </TabsContent>

                    {/* ----- Calibrate Tab (unchanged) ----- */}
                    <TabsContent
                        value="calibrate"
                        className="mt-4 flex flex-col gap-4"
                    >
                        <Field>
                            <FieldLabel htmlFor="aip-summary-header-row">
                                Header row
                            </FieldLabel>
                            <Input
                                id="aip-summary-header-row"
                                type="number"
                                min={1}
                                className="w-32"
                                value={config.headerRow}
                                onChange={(e) =>
                                    updateHeaderRow(e.target.value)
                                }
                            />
                            <FieldDescription>
                                1-indexed leaf-header row. The number row
                                (`1`–`15`) is always one row below
                                {config.headerRow === '' ||
                                config.headerRow == null
                                    ? ' the header'
                                    : ` (row ${config.headerRow + 1})`}
                                ; data starts two rows below.
                            </FieldDescription>
                        </Field>

                        {AIP_SUMMARY_FIELD_GROUPS.map((group) => (
                            <Field key={group.title}>
                                <FieldLabel>{group.title}</FieldLabel>
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {group.fields.map((field) => (
                                        <div
                                            key={field}
                                            className="flex items-center gap-2"
                                        >
                                            <label
                                                htmlFor={`aip-summary-col-${field}`}
                                                className="text-muted-foreground w-36 shrink-0 text-sm"
                                            >
                                                {
                                                    AIP_SUMMARY_FIELD_LABELS[
                                                        field
                                                    ]
                                                }
                                            </label>
                                            <Input
                                                id={`aip-summary-col-${field}`}
                                                className="w-16 text-center uppercase"
                                                maxLength={3}
                                                value={
                                                    config.columnConfig[field]
                                                }
                                                onChange={(e) =>
                                                    updateColumn(
                                                        field,
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                    ))}
                                </div>
                            </Field>
                        ))}

                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep('upload')}
                                >
                                    Back
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleResetDefaults}
                                >
                                    Reset defaults
                                </Button>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleLogContents}
                                    disabled={!selectedSheet}
                                >
                                    <ScrollText className="h-4 w-4" /> Log
                                    contents
                                </Button>
                                <Button
                                    disabled={!canVerify}
                                    onClick={() => setStep('verify')}
                                >
                                    Next: Verify
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ----- Verify Tab (unchanged) ----- */}
                    <TabsContent
                        value="verify"
                        className="mt-4 flex flex-col gap-4"
                    >
                        <p className="text-muted-foreground text-sm">
                            Sheet{' '}
                            <span className="text-foreground font-medium">
                                {selectedSheet}
                            </span>{' '}
                            · header row{' '}
                            {config.headerRow === '' ? '—' : config.headerRow} ·{' '}
                            {Object.keys(config.columnConfig).length} columns
                        </p>

                        <div>
                            <Button
                                onClick={handleVerify}
                                disabled={!canVerify}
                            >
                                Run verify
                            </Button>
                        </div>

                        {verifyResult && (
                            <div className="flex flex-col gap-2 rounded-md border p-3">
                                <p
                                    className={`text-sm font-medium ${verifyResult.valid ? 'text-green-600' : 'text-destructive'}`}
                                >
                                    {verifyResult.valid ? '✅ ' : '❌ '}
                                    {verifyResult.message}
                                </p>
                                {verifyResult.errors.length > 0 && (
                                    <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto text-sm">
                                        {verifyResult.errors.map((issue, i) => (
                                            <li key={`error-${issue.row}-${i}`}>
                                                <span className="text-muted-foreground font-mono">
                                                    Row {issue.row}:
                                                </span>{' '}
                                                {issue.message}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {verifyResult.warnings.length > 0 && (
                                    <>
                                        <p className="text-sm font-medium text-amber-600">
                                            ⚠ {verifyResult.warnings.length}{' '}
                                            warning
                                            {verifyResult.warnings.length === 1
                                                ? ''
                                                : 's'}{' '}
                                            — formatting only, sheet still
                                            passes
                                        </p>
                                        <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto text-sm text-amber-700">
                                            {verifyResult.warnings.map(
                                                (issue, i) => (
                                                    <li
                                                        key={`warning-${issue.row}-${i}`}
                                                    >
                                                        <span className="font-mono opacity-70">
                                                            Row {issue.row}:
                                                        </span>{' '}
                                                        {issue.message}
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    </>
                                )}
                                {verifyResult.details.length > 0 && (
                                    <ul className="text-muted-foreground flex flex-col gap-1 text-xs">
                                        {verifyResult.details.map(
                                            (detail, i) => (
                                                <li key={i}>{detail}</li>
                                            ),
                                        )}
                                    </ul>
                                )}
                            </div>
                        )}

                        <div className="flex items-center justify-between gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setStep('calibrate')}
                            >
                                Back: Calibrate
                            </Button>
                            <Button
                                disabled={!canExtract}
                                onClick={() => setStep('extract')}
                            >
                                Next: Extract
                            </Button>
                        </div>
                    </TabsContent>

                    {/* ----- Extract Tab (unchanged) ----- */}
                    <TabsContent
                        value="extract"
                        className="mt-4 flex flex-col gap-4"
                    >
                        <p className="text-muted-foreground text-sm">
                            Sheet{' '}
                            <span className="text-foreground font-medium">
                                {selectedSheet}
                            </span>{' '}
                            · one record per output × funding source ·
                            continuation rows attach to their PPA block
                        </p>

                        <div>
                            <Button
                                onClick={handleExtract}
                                disabled={!canExtract}
                            >
                                Run extract
                            </Button>
                        </div>

                        {extractResult && (
                            <div className="flex flex-col gap-2 rounded-md border p-3">
                                <p className="text-sm font-medium text-green-600">
                                    ✅ Extracted {extractResult.records.length}{' '}
                                    record
                                    {extractResult.records.length === 1
                                        ? ''
                                        : 's'}{' '}
                                    across {extractResult.blocks} PPA block
                                    {extractResult.blocks === 1 ? '' : 's'}
                                </p>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="text-muted-foreground border-b">
                                                <th className="px-2 py-1 font-medium">
                                                    Row
                                                </th>
                                                <th className="px-2 py-1 font-medium">
                                                    Code
                                                </th>
                                                <th className="px-2 py-1 font-medium">
                                                    Name
                                                </th>
                                                <th className="px-2 py-1 font-medium">
                                                    Offices
                                                </th>
                                                <th className="px-2 py-1 font-medium">
                                                    Schedule
                                                </th>
                                                <th className="px-2 py-1 font-medium">
                                                    Output
                                                </th>
                                                <th className="px-2 py-1 font-medium">
                                                    Fund
                                                </th>
                                                <th className="px-2 py-1 font-medium">
                                                    Adapt.
                                                </th>
                                                <th className="px-2 py-1 font-medium">
                                                    Mitig.
                                                </th>
                                                <th className="px-2 py-1 font-medium">
                                                    Typology
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {extractResult.records.map(
                                                (record) => (
                                                    <tr
                                                        key={record.key}
                                                        className="border-b last:border-0"
                                                    >
                                                        <td className="px-2 py-1 font-mono whitespace-nowrap">
                                                            {record.row}
                                                            {record.isContinuation && (
                                                                <span
                                                                    className="text-muted-foreground ml-1"
                                                                    title={`Continuation of row ${record.blockRow}`}
                                                                >
                                                                    ↳
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-2 py-1 font-mono whitespace-nowrap">
                                                            {record.isContinuation
                                                                ? '—'
                                                                : record.fullCode}
                                                        </td>
                                                        <td className="max-w-[24ch] truncate px-2 py-1">
                                                            {record.name}
                                                        </td>
                                                        <td className="px-2 py-1 whitespace-nowrap">
                                                            {record.offices.join(
                                                                ' / ',
                                                            ) || '—'}
                                                        </td>
                                                        <td className="px-2 py-1 whitespace-nowrap">
                                                            {formatAipScheduleShort(
                                                                record.startDate,
                                                            ) ?? '—'}{' '}
                                                            →{' '}
                                                            {formatAipScheduleShort(
                                                                record.endDate,
                                                            ) ?? '—'}
                                                        </td>
                                                        <td className="max-w-[24ch] truncate px-2 py-1">
                                                            {record.expectedOutput ??
                                                                '—'}
                                                        </td>
                                                        <td className="px-2 py-1 whitespace-nowrap">
                                                            {record.fundingSource ??
                                                                '—'}
                                                        </td>
                                                        <td className="px-2 py-1 whitespace-nowrap">
                                                            {record.adaptation ??
                                                                '—'}
                                                        </td>
                                                        <td className="px-2 py-1 whitespace-nowrap">
                                                            {record.mitigation ??
                                                                '—'}
                                                        </td>
                                                        <td className="px-2 py-1 whitespace-nowrap">
                                                            {record.typology ??
                                                                '—'}
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <p className="text-muted-foreground text-xs">
                                    Preview only — Review &amp; Import comes
                                    next (matching, selection, POST).
                                </p>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <Button
                                variant="outline"
                                onClick={() => setStep('verify')}
                            >
                                Back: Verify
                            </Button>
                            <div className="flex gap-2">
                                <Button
                                    disabled={!canImportPpa}
                                    onClick={() => goToImport('ppa')}
                                >
                                    Import PPA
                                </Button>
                                <Button
                                    disabled={!canImportPpa}
                                    onClick={() => goToImport('outputs')}
                                >
                                    Import Expected Outputs
                                </Button>
                                <Button
                                    disabled={!canImportPpa}
                                    onClick={() => goToImport('funding')}
                                >
                                    Import Funding Source
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ----- Import PPA Tab (Office dropdown controls the target office) ----- */}
                    <TabsContent
                        value="import-ppa"
                        className="mt-4 flex flex-col gap-4"
                    >
                        <div className="flex flex-col gap-1">
                            <h2 className="text-lg font-semibold tracking-tight">
                                Import PPA
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                Review and import PPA blocks extracted from
                                sheet “{selectedSheet}”.
                            </p>
                        </div>

                        {/* Office + fiscal year dropdowns side by side */}
                        <div className="flex flex-wrap gap-4">
                            <Field>
                                <FieldLabel>Target Office</FieldLabel>
                                <Select
                                    value={selectedOffice}
                                    onValueChange={(v) =>
                                        setSelectedOffice(v ?? '')
                                    }
                                >
                                    <SelectTrigger className="w-[200px]">
                                        {selectedOfficeLabel ? (
                                            <span className="flex flex-1 text-left">
                                                {selectedOfficeLabel}
                                            </span>
                                        ) : (
                                            <SelectValue placeholder="Select an office" />
                                        )}
                                    </SelectTrigger>
                                    <SelectContent>
                                        {existingOffices.map((office) => (
                                            <SelectItem
                                                key={office.id}
                                                value={office.id.toString()}
                                            >
                                                {office.acronym || office.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FieldDescription>
                                    PPAs will be created under this office.
                                </FieldDescription>
                            </Field>

                            <Field>
                                <FieldLabel>Fiscal Year</FieldLabel>
                                <Select
                                    value={selectedFiscalYear}
                                    onValueChange={(v) =>
                                        setSelectedFiscalYear(v ?? '')
                                    }
                                >
                                    <SelectTrigger className="w-[160px]">
                                        {selectedFiscalYearLabel ? (
                                            <span className="flex flex-1 text-left">
                                                {selectedFiscalYearLabel}
                                            </span>
                                        ) : (
                                            <SelectValue placeholder="Select a year" />
                                        )}
                                    </SelectTrigger>
                                    <SelectContent>
                                        {fiscalYears.map((fy) => (
                                            <SelectItem
                                                key={fy.id}
                                                value={fy.id.toString()}
                                            >
                                                {fy.year}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FieldDescription>
                                    PPAs will be created for this fiscal year.
                                </FieldDescription>
                            </Field>
                        </div>

                        {/* Only show stats and table if an office + fiscal year is selected */}
                        {selectedOffice && selectedFiscalYear ? (
                            <>
                                <div className="flex flex-wrap items-center gap-3 rounded-md border p-3 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">
                                            Total PPA blocks:
                                        </span>{' '}
                                        <span className="font-medium">
                                            {blocksForImport.length}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            New:
                                        </span>{' '}
                                        <span className="font-medium text-blue-600">
                                            {
                                                blocksForImport.filter(
                                                    (b) => b.status === 'new',
                                                ).length
                                            }
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            Exists:
                                        </span>{' '}
                                        <span className="font-medium text-green-600">
                                            {
                                                blocksForImport.filter(
                                                    (b) =>
                                                        b.status === 'exists',
                                                ).length
                                            }
                                        </span>
                                    </div>
                                </div>

                                {blocksForImport.length > 0 && (
                                    <div className="overflow-x-auto rounded-md border">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="bg-muted/50 text-muted-foreground border-b">
                                                    <th className="px-3 py-2 font-medium">
                                                        Full Code
                                                    </th>
                                                    <th className="px-3 py-2 font-medium">
                                                        Name &amp; Type
                                                    </th>
                                                    <th className="px-3 py-2 font-medium">
                                                        Status
                                                    </th>
                                                    <th className="px-3 py-2 font-medium">
                                                        Rows
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {blocksForImport.map(
                                                    (block) => (
                                                        <tr
                                                            key={block.fullCode}
                                                            className="border-b last:border-0"
                                                        >
                                                            <td className="px-3 py-2 font-mono font-medium whitespace-nowrap">
                                                                {block.fullCode}
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                <div className="font-medium">
                                                                    {block.name}
                                                                </div>
                                                                <div className="text-muted-foreground text-[10px] uppercase">
                                                                    {block.type}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                {block.status ===
                                                                    'exists' && (
                                                                    <span className="font-medium text-green-600">
                                                                        Exists
                                                                    </span>
                                                                )}
                                                                {block.status ===
                                                                    'new' && (
                                                                    <span className="font-medium text-blue-600">
                                                                        New
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="text-muted-foreground px-3 py-2 font-mono whitespace-nowrap">
                                                                {block.rows.join(
                                                                    ', ',
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-muted-foreground text-sm">
                                Please select a target office and fiscal year to
                                review the extracted PPAs.
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <Button
                                variant="outline"
                                onClick={() => setStep('extract')}
                            >
                                Back: Extract
                            </Button>
                            <Button
                                onClick={handleConfirmImport}
                                disabled={
                                    !selectedOffice ||
                                    !selectedFiscalYear ||
                                    newBlocks.length === 0 ||
                                    importing
                                }
                            >
                                {importing && <Spinner />}
                                Confirm &amp; Import {newBlocks.length} PPA
                                {newBlocks.length === 1 ? '' : 's'}
                            </Button>
                        </div>
                    </TabsContent>

                    {/* ----- Import Expected Outputs (review UI only, no backend yet) ----- */}
                    <TabsContent
                        value="import-outputs"
                        className="mt-4 flex flex-col gap-4"
                    >
                        <div className="flex flex-col gap-1">
                            <h2 className="text-lg font-semibold tracking-tight">
                                Import Expected Outputs
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                Review expected outputs extracted from sheet “
                                {selectedSheet}” — office, start date,
                                completion date, and expected output.
                            </p>
                        </div>

                        {/* Office + fiscal year dropdowns side by side (shared with PPA import) */}
                        <div className="flex flex-wrap gap-4">
                            <Field>
                                <FieldLabel>Target Office</FieldLabel>
                                <Select
                                    value={selectedOffice}
                                    onValueChange={(v) =>
                                        setSelectedOffice(v ?? '')
                                    }
                                >
                                    <SelectTrigger className="w-[200px]">
                                        {selectedOfficeLabel ? (
                                            <span className="flex flex-1 text-left">
                                                {selectedOfficeLabel}
                                            </span>
                                        ) : (
                                            <SelectValue placeholder="Select an office" />
                                        )}
                                    </SelectTrigger>
                                    <SelectContent>
                                        {existingOffices.map((office) => (
                                            <SelectItem
                                                key={office.id}
                                                value={office.id.toString()}
                                            >
                                                {office.acronym || office.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FieldDescription>
                                    Outputs will be imported under this office.
                                </FieldDescription>
                            </Field>

                            <Field>
                                <FieldLabel>Fiscal Year</FieldLabel>
                                <Select
                                    value={selectedFiscalYear}
                                    onValueChange={(v) =>
                                        setSelectedFiscalYear(v ?? '')
                                    }
                                >
                                    <SelectTrigger className="w-[160px]">
                                        {selectedFiscalYearLabel ? (
                                            <span className="flex flex-1 text-left">
                                                {selectedFiscalYearLabel}
                                            </span>
                                        ) : (
                                            <SelectValue placeholder="Select a year" />
                                        )}
                                    </SelectTrigger>
                                    <SelectContent>
                                        {fiscalYears.map((fy) => (
                                            <SelectItem
                                                key={fy.id}
                                                value={fy.id.toString()}
                                            >
                                                {fy.year}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FieldDescription>
                                    Outputs will be imported for this fiscal
                                    year.
                                </FieldDescription>
                            </Field>
                        </div>

                        {/* Only show stats and table if an office + fiscal year is selected */}
                        {selectedOffice && selectedFiscalYear ? (
                            <>
                                <div className="flex flex-wrap items-center gap-3 rounded-md border p-3 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">
                                            Total rows:
                                        </span>{' '}
                                        <span className="font-medium">
                                            {extractResult?.records.length ?? 0}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            With expected output:
                                        </span>{' '}
                                        <span className="font-medium text-blue-600">
                                            {extractResult?.records.filter(
                                                (r) => r.expectedOutput,
                                            ).length ?? 0}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            Missing output:
                                        </span>{' '}
                                        <span className="font-medium text-amber-600">
                                            {extractResult?.records.filter(
                                                (r) => !r.expectedOutput,
                                            ).length ?? 0}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            New:
                                        </span>{' '}
                                        <span className="font-medium text-blue-600">
                                            {newOutputs.length}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            Exists:
                                        </span>{' '}
                                        <span className="font-medium text-green-600">
                                            {
                                                importableOutputs.filter(
                                                    (r) =>
                                                        outputStatuses.get(
                                                            r.key,
                                                        ) === 'exists',
                                                ).length
                                            }
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            Unresolved offices:
                                        </span>{' '}
                                        <span className="font-medium text-amber-600">
                                            {
                                                extractResult?.records.filter(
                                                    (r) =>
                                                        officeIdsForRecord(
                                                            r.key,
                                                        ).length === 0,
                                                ).length
                                            }
                                        </span>
                                    </div>
                                </div>

                                {unmatchedFrequency.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs dark:border-amber-900 dark:bg-amber-950">
                                        <span className="text-muted-foreground font-medium">
                                            Unmatched office tokens (strict
                                            normalized match — candidates for
                                            loosening):
                                        </span>
                                        {unmatchedFrequency.map((entry) => (
                                            <Badge
                                                key={entry.token}
                                                variant="outline"
                                                className="border-amber-300 text-amber-700 dark:text-amber-400"
                                                title={`${entry.count} row(s)`}
                                            >
                                                {entry.token} ×{entry.count}
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                {(extractResult?.records.length ?? 0) > 0 && (
                                    <div className="overflow-x-auto rounded-md border">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="bg-muted/50 text-muted-foreground border-b">
                                                    <th className="px-3 py-2 font-medium">
                                                        Row
                                                    </th>
                                                    <th className="px-3 py-2 font-medium">
                                                        PPA Code
                                                    </th>
                                                    <th className="px-3 py-2 font-medium">
                                                        PPA Name
                                                    </th>
                                                    <th className="px-3 py-2 font-medium">
                                                        Office
                                                    </th>
                                                    <th className="px-3 py-2 font-medium">
                                                        Start Date
                                                    </th>
                                                    <th className="px-3 py-2 font-medium">
                                                        Completion Date
                                                    </th>
                                                    <th className="px-3 py-2 font-medium">
                                                        Expected Output
                                                    </th>
                                                    <th className="px-3 py-2 font-medium">
                                                        Status
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {extractResult?.records.map(
                                                    (record) => (
                                                        <tr
                                                            key={record.key}
                                                            className="border-b last:border-0"
                                                        >
                                                            <td className="px-3 py-2 font-mono whitespace-nowrap">
                                                                {record.row}
                                                                {record.isContinuation && (
                                                                    <span
                                                                        className="text-muted-foreground ml-1"
                                                                        title={`Continuation of row ${record.blockRow}`}
                                                                    >
                                                                        ↳
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-3 py-2 font-mono whitespace-nowrap">
                                                                {record.isContinuation
                                                                    ? '—'
                                                                    : record.fullCode}
                                                            </td>
                                                            <td className="px-3 py-2 whitespace-nowrap">
                                                                {record.name}
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                {(() => {
                                                                    const match =
                                                                        officeMatches.get(
                                                                            record.key,
                                                                        );
                                                                    const mappings =
                                                                        tokenMappings[
                                                                            record
                                                                                .key
                                                                        ] ?? {};
                                                                    const dismissed =
                                                                        dismissedTokens[
                                                                            record
                                                                                .key
                                                                        ] ?? [];
                                                                    const hasManual =
                                                                        officeOverrides[
                                                                            record
                                                                                .key
                                                                        ] !==
                                                                            undefined ||
                                                                        Object.keys(
                                                                            mappings,
                                                                        )
                                                                            .length >
                                                                            0 ||
                                                                        dismissed.length >
                                                                            0;
                                                                    const effectiveIds =
                                                                        officeIdsForRecord(
                                                                            record.key,
                                                                        );
                                                                    const effective =
                                                                        existingOffices.filter(
                                                                            (
                                                                                o,
                                                                            ) =>
                                                                                effectiveIds.includes(
                                                                                    o.id,
                                                                                ),
                                                                        );
                                                                    const visible =
                                                                        visibleUnmatched(
                                                                            match,
                                                                            mappings,
                                                                            dismissed,
                                                                        );

                                                                    function setMapping(
                                                                        token: string,
                                                                        value:
                                                                            | string
                                                                            | null,
                                                                    ) {
                                                                        setTokenMapping(
                                                                            record.key,
                                                                            token,
                                                                            value ===
                                                                                null ||
                                                                                value ===
                                                                                    ''
                                                                                ? null
                                                                                : Number(
                                                                                      value,
                                                                                  ),
                                                                        );
                                                                    }

                                                                    function dismissToken(
                                                                        token: string,
                                                                    ) {
                                                                        setDismissedTokens(
                                                                            (
                                                                                prev,
                                                                            ) => ({
                                                                                ...prev,
                                                                                [record.key]:
                                                                                    [
                                                                                        ...(prev[
                                                                                            record
                                                                                                .key
                                                                                        ] ??
                                                                                            []),
                                                                                        token,
                                                                                    ],
                                                                            }),
                                                                        );
                                                                    }

                                                                    return (
                                                                        <div className="flex max-w-[40ch] flex-wrap items-center gap-1">
                                                                            {effective.length ===
                                                                            0 ? (
                                                                                <span className="text-muted-foreground">
                                                                                    —
                                                                                </span>
                                                                            ) : (
                                                                                effective.map(
                                                                                    (
                                                                                        o,
                                                                                    ) => (
                                                                                        <Badge
                                                                                            key={
                                                                                                o.id
                                                                                            }
                                                                                            variant="secondary"
                                                                                            className="text-[10px]"
                                                                                        >
                                                                                            {o.acronym ||
                                                                                                o.name}
                                                                                        </Badge>
                                                                                    ),
                                                                                )
                                                                            )}
                                                                            {Object.entries(
                                                                                mappings,
                                                                            ).map(
                                                                                ([
                                                                                    token,
                                                                                    officeId,
                                                                                ]) => {
                                                                                    const office =
                                                                                        existingOffices.find(
                                                                                            (
                                                                                                o,
                                                                                            ) =>
                                                                                                o.id ===
                                                                                                officeId,
                                                                                        );

                                                                                    return (
                                                                                        <span
                                                                                            key={`mapped-${token}`}
                                                                                            className="inline-flex items-center gap-1 rounded-md border border-blue-300 bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400"
                                                                                            title={`"${token}" manually mapped to ${office?.acronym || office?.name || 'unknown office'}`}
                                                                                        >
                                                                                            {
                                                                                                token
                                                                                            }{' '}
                                                                                            →{' '}
                                                                                            {office?.acronym ||
                                                                                                office?.name ||
                                                                                                '?'}
                                                                                            <button
                                                                                                type="button"
                                                                                                className="cursor-pointer opacity-60 hover:opacity-100"
                                                                                                onClick={() =>
                                                                                                    setMapping(
                                                                                                        token,
                                                                                                        null,
                                                                                                    )
                                                                                                }
                                                                                                title={`Unmap "${token}"`}
                                                                                            >
                                                                                                <X className="h-3 w-3" />
                                                                                            </button>
                                                                                        </span>
                                                                                    );
                                                                                },
                                                                            )}
                                                                            {visible.map(
                                                                                (
                                                                                    token,
                                                                                ) => (
                                                                                    <span
                                                                                        key={
                                                                                            token
                                                                                        }
                                                                                        className="inline-flex items-center gap-1 rounded-md border border-amber-300 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400"
                                                                                        title={`No office matches "${token}" — map it or remove it`}
                                                                                    >
                                                                                        {
                                                                                            token
                                                                                        }{' '}
                                                                                        ?
                                                                                        <button
                                                                                            type="button"
                                                                                            className="cursor-pointer rounded px-0.5 font-semibold underline decoration-dotted underline-offset-2 opacity-70 hover:opacity-100"
                                                                                            onClick={() =>
                                                                                                setMappingTarget(
                                                                                                    {
                                                                                                        key: record.key,
                                                                                                        token,
                                                                                                    },
                                                                                                )
                                                                                            }
                                                                                            title={`Map "${token}" to an office`}
                                                                                        >
                                                                                            Map
                                                                                        </button>
                                                                                        <button
                                                                                            type="button"
                                                                                            className="cursor-pointer opacity-60 hover:opacity-100"
                                                                                            onClick={() =>
                                                                                                dismissToken(
                                                                                                    token,
                                                                                                )
                                                                                            }
                                                                                            title={`Remove "${token}" from the unresolved list`}
                                                                                        >
                                                                                            <X className="h-3 w-3" />
                                                                                        </button>
                                                                                    </span>
                                                                                ),
                                                                            )}
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="icon-xs"
                                                                                onClick={() =>
                                                                                    setOfficePickerKey(
                                                                                        record.key,
                                                                                    )
                                                                                }
                                                                                title="Add or remove offices for this output (bulk, resolves nothing)"
                                                                            >
                                                                                <Pencil />
                                                                            </Button>
                                                                            {hasManual && (
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="ghost"
                                                                                    size="icon-xs"
                                                                                    onClick={() =>
                                                                                        resetRowOffices(
                                                                                            record.key,
                                                                                        )
                                                                                    }
                                                                                    title="Reset row to auto-matched offices"
                                                                                >
                                                                                    <RotateCcw />
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </td>
                                                            <td className="px-3 py-2 whitespace-nowrap">
                                                                {formatAipScheduleShort(
                                                                    record.startDate,
                                                                ) ?? '—'}
                                                            </td>
                                                            <td className="px-3 py-2 whitespace-nowrap">
                                                                {formatAipScheduleShort(
                                                                    record.endDate,
                                                                ) ?? '—'}
                                                            </td>
                                                            <td className="max-w-[32ch] truncate px-3 py-2">
                                                                {record.expectedOutput ??
                                                                    '—'}
                                                            </td>
                                                            <td className="px-3 py-2 whitespace-nowrap">
                                                                {(() => {
                                                                    const status =
                                                                        outputStatuses.get(
                                                                            record.key,
                                                                        );

                                                                    if (
                                                                        status ===
                                                                        'exists'
                                                                    ) {
                                                                        return (
                                                                            <span className="font-medium text-green-600">
                                                                                Exists
                                                                            </span>
                                                                        );
                                                                    }

                                                                    if (
                                                                        status ===
                                                                        'no-ppa'
                                                                    ) {
                                                                        return (
                                                                            <span
                                                                                className="font-medium text-amber-600"
                                                                                title="No PPA with this ref code in the selected office + fiscal year"
                                                                            >
                                                                                No
                                                                                PPA
                                                                            </span>
                                                                        );
                                                                    }

                                                                    if (
                                                                        status ===
                                                                        'new'
                                                                    ) {
                                                                        return (
                                                                            <span className="font-medium text-blue-600">
                                                                                New
                                                                            </span>
                                                                        );
                                                                    }

                                                                    if (
                                                                        status ===
                                                                        'no-offices'
                                                                    ) {
                                                                        return (
                                                                            <span
                                                                                className="font-medium text-amber-600"
                                                                                title="No offices resolved — imports without offices; attach them later via edit"
                                                                            >
                                                                                No
                                                                                offices
                                                                            </span>
                                                                        );
                                                                    }

                                                                    return (
                                                                        <span className="text-muted-foreground">
                                                                            —
                                                                        </span>
                                                                    );
                                                                })()}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-muted-foreground text-sm">
                                Please select a target office and fiscal year to
                                review the extracted outputs.
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <Button
                                variant="outline"
                                onClick={() => setStep('extract')}
                            >
                                Back: Extract
                            </Button>
                            <div className="flex flex-col items-end gap-1">
                                <Button
                                    onClick={handleConfirmOutputs}
                                    disabled={
                                        !selectedOffice ||
                                        !selectedFiscalYear ||
                                        newOutputs.length === 0 ||
                                        importingOutputs
                                    }
                                >
                                    {importingOutputs && <Spinner />}
                                    Confirm &amp; Import {newOutputs.length}{' '}
                                    Output
                                    {newOutputs.length === 1 ? '' : 's'}
                                </Button>
                                <p className="text-muted-foreground text-xs">
                                    Matched by PPA name — any row with office,
                                    schedule, or output imports (offices
                                    attach later when unresolved).
                                </p>
                            </div>
                        </div>

                        <MultiTableSelect<ImportOffice>
                            data={existingOffices}
                            columns={importOfficeColumns}
                            open={officePickerKey !== null}
                            onOpenChange={(open) => {
                                if (!open) setOfficePickerKey(null);
                            }}
                            selectedValues={
                                officePickerKey
                                    ? officeIdsForRecord(officePickerKey).map(
                                          String,
                                      )
                                    : []
                            }
                            valueKey="id"
                            title="Offices for this output"
                            description="Select one or more implementing offices. Overrides the auto-matched offices for this row only."
                            className="sm:max-w-[30rem]"
                            onConfirm={(selected) => {
                                const key = officePickerKey;
                                setOfficePickerKey(null);

                                if (key) {
                                    setOfficeOverrides((prev) => ({
                                        ...prev,
                                        [key]: selected.map((o) => o.id),
                                    }));
                                }
                            }}
                        />

                        <TableSelect<ImportOffice>
                            data={existingOffices}
                            columns={importOfficeColumns}
                            open={mappingTarget !== null}
                            onOpenChange={(open) => {
                                if (!open) setMappingTarget(null);
                            }}
                            onRowSelect={(row) => {
                                if (mappingTarget) {
                                    setTokenMapping(
                                        mappingTarget.key,
                                        mappingTarget.token,
                                        row.id,
                                    );
                                }
                            }}
                            value={
                                mappingTarget
                                    ? (() => {
                                          const mapped =
                                              tokenMappings[
                                                  mappingTarget.key
                                              ]?.[mappingTarget.token];

                                          return mapped === undefined
                                              ? undefined
                                              : String(mapped);
                                      })()
                                    : undefined
                            }
                            valueKey="id"
                            title={
                                mappingTarget
                                    ? `Map "${mappingTarget.token}" to an office`
                                    : 'Map office'
                            }
                            description="Click a row to map this token to that office."
                            className="sm:max-w-[30rem]"
                        />
                    </TabsContent>

                    {/* ----- Import Funding Source (review UI + POST) ----- */}
                    <TabsContent
                        value="import-funding"
                        className="mt-4 flex flex-col gap-4"
                    >
                        <div className="flex flex-col gap-1">
                            <h2 className="text-lg font-semibold tracking-tight">
                                Import Funding Source
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                Review fund links extracted from sheet
                                “{selectedSheet}” — funding source plus
                                climate (adaptation / mitigation / typology).
                                Peso amounts stay zero.
                            </p>
                        </div>

                        {selectedOffice && selectedFiscalYear ? (
                            <>
                                <div className="flex flex-wrap items-center gap-3 rounded-md border p-3 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">
                                            Rows with fund:
                                        </span>{' '}
                                        <span className="font-medium">
                                            {extractResult?.records.filter(
                                                (r) => r.fundingSource != null,
                                            ).length ?? 0}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            Importable:
                                        </span>{' '}
                                        <span className="font-medium text-blue-600">
                                            {importableFunds.length}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            New:
                                        </span>{' '}
                                        <span className="font-medium text-blue-600">
                                            {newFunds.length}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            Exists:
                                        </span>{' '}
                                        <span className="font-medium text-green-600">
                                            {
                                                importableFunds.filter(
                                                    (r) =>
                                                        fundStatuses.get(
                                                            r.key,
                                                        ) === 'exists',
                                                ).length
                                            }
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            Unresolved fund:
                                        </span>{' '}
                                        <span className="font-medium text-amber-600">
                                            {unmatchedFundEntries.length}
                                        </span>
                                    </div>
                                </div>

                                {unmatchedFundEntries.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs dark:border-amber-900 dark:bg-amber-950">
                                        <span className="text-muted-foreground font-medium">
                                            Unmatched fund tokens (strict
                                            normalized match — candidates for
                                            loosening):
                                        </span>
                                        {unmatchedFundEntries.map((entry) => (
                                            <Badge
                                                key={entry.token}
                                                variant="outline"
                                                className="border-amber-300 text-amber-700 dark:text-amber-400"
                                                title={`${entry.count} row(s)`}
                                            >
                                                {entry.token} ×{entry.count}
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                {(extractResult?.records.length ?? 0) > 0 && (
                                    <div className="overflow-x-auto rounded-md border">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="bg-muted/50 text-muted-foreground border-b">
                                                    <th className="px-3 py-2 font-medium">
                                                        Row
                                                    </th>
                                                    <th className="px-3 py-2 font-medium">
                                                        PPA / Output
                                                    </th>
                                                    <th className="px-3 py-2 font-medium">
                                                        Fund
                                                    </th>
                                                    <th className="px-3 py-2 font-medium">
                                                        Climate
                                                    </th>
                                                    <th className="px-3 py-2 font-medium">
                                                        Status
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {extractResult?.records.map(
                                                    (record) => {
                                                        const match =
                                                            fundMatches.get(
                                                                record.key,
                                                            );
                                                        const override =
                                                            fundOverrides[
                                                                record.key
                                                            ];
                                                        const dismissed =
                                                            !!dismissedFunds[
                                                                record.key
                                                            ];
                                                        const effectiveId =
                                                            fundIdForRecord(
                                                                record.key,
                                                            );
                                                        const effective =
                                                            effectiveId == null
                                                                ? null
                                                                : fundingSources.find(
                                                                      (f) =>
                                                                          f.id ===
                                                                          effectiveId,
                                                                  ) ?? null;

                                                        return (
                                                            <tr
                                                                key={record.key}
                                                                className="border-b last:border-0"
                                                            >
                                                                <td className="px-3 py-2 font-mono whitespace-nowrap">
                                                                    {
                                                                        record.row
                                                                    }
                                                                    {record.isContinuation && (
                                                                        <span
                                                                            className="text-muted-foreground ml-1"
                                                                            title={`Continuation of row ${record.blockRow}`}
                                                                        >
                                                                            ↳
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="max-w-[28ch] px-3 py-2">
                                                                    <div className="truncate font-medium">
                                                                        {
                                                                            record.name
                                                                        }
                                                                    </div>
                                                                    <div className="text-muted-foreground truncate">
                                                                        {record.expectedOutput ??
                                                                            '—'}
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-2">
                                                                    {record.fundingSource ==
                                                                    null ? (
                                                                        <span className="text-muted-foreground">
                                                                            —
                                                                        </span>
                                                                    ) : dismissed ? (
                                                                        <span className="text-muted-foreground italic">
                                                                            dismissed
                                                                        </span>
                                                                    ) : (
                                                                        <div className="flex max-w-[30ch] flex-wrap items-center gap-1">
                                                                            {override !==
                                                                            undefined ? (
                                                                                <span
                                                                                    className="inline-flex items-center gap-1 rounded-md border border-blue-300 bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400"
                                                                                    title={`"${record.fundingSource}" manually mapped to ${effective?.code ?? 'unknown fund'}`}
                                                                                >
                                                                                    {
                                                                                        record.fundingSource
                                                                                    }{' '}
                                                                                    →{' '}
                                                                                    {effective?.code ??
                                                                                        '?'}
                                                                                    <button
                                                                                        type="button"
                                                                                        className="cursor-pointer opacity-60 hover:opacity-100"
                                                                                        onClick={() =>
                                                                                            setFundOverrides(
                                                                                                (
                                                                                                    prev,
                                                                                                ) => {
                                                                                                    const next =
                                                                                                        {
                                                                                                            ...prev,
                                                                                                        };
                                                                                                    delete next[
                                                                                                        record.key
                                                                                                    ];

                                                                                                    return next;
                                                                                                },
                                                                                            )
                                                                                        }
                                                                                        title={`Unmap "${record.fundingSource}"`}
                                                                                    >
                                                                                        <X className="h-3 w-3" />
                                                                                    </button>
                                                                                </span>
                                                                            ) : match?.fund ? (
                                                                                <Badge
                                                                                    variant="secondary"
                                                                                    className="text-[10px]"
                                                                                >
                                                                                    {
                                                                                        match
                                                                                            .fund
                                                                                            .code
                                                                                    }
                                                                                </Badge>
                                                                            ) : (
                                                                                <>
                                                                                    <span
                                                                                        className="inline-flex items-center gap-1 rounded-md border border-amber-300 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400"
                                                                                        title={`No funding source matches "${record.fundingSource}" — map it or remove it`}
                                                                                    >
                                                                                        {
                                                                                            record.fundingSource
                                                                                        }{' '}
                                                                                        ?
                                                                                        <button
                                                                                            type="button"
                                                                                            className="cursor-pointer rounded px-0.5 font-semibold underline decoration-dotted underline-offset-2 opacity-70 hover:opacity-100"
                                                                                            onClick={() =>
                                                                                                setFundPickerKey(
                                                                                                    record.key,
                                                                                                )
                                                                                            }
                                                                                            title={`Map "${record.fundingSource}" to a funding source`}
                                                                                        >
                                                                                            Map
                                                                                        </button>
                                                                                        <button
                                                                                            type="button"
                                                                                            className="cursor-pointer opacity-60 hover:opacity-100"
                                                                                            onClick={() =>
                                                                                                setDismissedFunds(
                                                                                                    (
                                                                                                        prev,
                                                                                                    ) => ({
                                                                                                        ...prev,
                                                                                                        [record.key]:
                                                                                                            true,
                                                                                                    }),
                                                                                                )
                                                                                            }
                                                                                            title={`Remove this row from the fund import`}
                                                                                        >
                                                                                            <X className="h-3 w-3" />
                                                                                        </button>
                                                                                    </span>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-2 whitespace-nowrap">
                                                                    {record.adaptation ??
                                                                        '—'}{' '}
                                                                    /{' '}
                                                                    {record.mitigation ??
                                                                        '—'}{' '}
                                                                    /{' '}
                                                                    {match?.typology ? (
                                                                        <Badge
                                                                            variant="secondary"
                                                                            className="text-[10px]"
                                                                        >
                                                                            {
                                                                                match
                                                                                    .typology
                                                                                    .code
                                                                            }
                                                                        </Badge>
                                                                    ) : (
                                                                        <span className="text-muted-foreground">
                                                                            {record.typology ??
                                                                                '—'}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-2 whitespace-nowrap">
                                                                    {(() => {
                                                                        const status =
                                                                            fundStatuses.get(
                                                                                record.key,
                                                                            );

                                                                        if (
                                                                            status ===
                                                                            'exists'
                                                                        ) {
                                                                            return (
                                                                                <span className="font-medium text-green-600">
                                                                                    Exists
                                                                                </span>
                                                                            );
                                                                        }

                                                                        if (
                                                                            status ===
                                                                            'no-output'
                                                                        ) {
                                                                            return record.fundingSource ==
                                                                                null ||
                                                                                dismissedFunds[
                                                                                    record.key
                                                                                ] ? (
                                                                                <span className="text-muted-foreground">
                                                                                    —
                                                                                </span>
                                                                            ) : (
                                                                                <span
                                                                                    className="font-medium text-amber-600"
                                                                                    title="No matching PPA output yet — import expected outputs first"
                                                                                >
                                                                                    No
                                                                                    output
                                                                                </span>
                                                                            );
                                                                        }

                                                                        if (
                                                                            status ===
                                                                            'new'
                                                                        ) {
                                                                            return (
                                                                                <span className="font-medium text-blue-600">
                                                                                    New
                                                                                </span>
                                                                            );
                                                                        }

                                                                        return (
                                                                            <span className="text-muted-foreground">
                                                                                —
                                                                            </span>
                                                                        );
                                                                    })()}
                                                                </td>
                                                            </tr>
                                                        );
                                                    },
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-muted-foreground text-sm">
                                Please select a target office and fiscal year to
                                review the extracted fund links.
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <Button
                                variant="outline"
                                onClick={() => setStep('extract')}
                            >
                                Back: Extract
                            </Button>
                            <div className="flex flex-col items-end gap-1">
                                <Button
                                    onClick={handleConfirmFunds}
                                    disabled={
                                        !selectedOffice ||
                                        !selectedFiscalYear ||
                                        newFunds.length === 0 ||
                                        importingFunds
                                    }
                                >
                                    {importingFunds && <Spinner />}
                                    Confirm &amp; Import {newFunds.length}{' '}
                                    Fund Link
                                    {newFunds.length === 1 ? '' : 's'}
                                </Button>
                                <p className="text-muted-foreground text-xs">
                                    Links + climate only — peso amounts stay
                                    zero.
                                </p>
                            </div>
                        </div>

                        <TableSelect<ImportFund>
                            data={fundingSources}
                            columns={importFundColumns}
                            open={fundPickerKey !== null}
                            onOpenChange={(open) => {
                                if (!open) setFundPickerKey(null);
                            }}
                            onRowSelect={(row) => {
                                if (fundPickerKey) {
                                    setFundOverrides((prev) => ({
                                        ...prev,
                                        [fundPickerKey]: row.id,
                                    }));
                                }
                            }}
                            value={
                                fundPickerKey &&
                                fundOverrides[fundPickerKey] !== undefined
                                    ? String(fundOverrides[fundPickerKey])
                                    : undefined
                            }
                            valueKey="id"
                            title="Map fund to a funding source"
                            description="Click a row to map this token to that funding source."
                            className="sm:max-w-[30rem]"
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}

AipSummaryImport.layout = {
    breadcrumbs: [
        { title: 'Imports', href: '/imports' },
        { title: 'AIP Summary Import', href: '/aip-summary-import' },
    ],
};
