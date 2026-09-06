import { Head } from '@inertiajs/react';
import ExcelJS from 'exceljs';
import { FileSpreadsheet, ScrollText } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { Button } from '@/components/base-ui-components/ui/button';
import {
    Field,
    FieldDescription,
    FieldLabel,
} from '@/components/base-ui-components/ui/field';
import { Input } from '@/components/base-ui-components/ui/input';
import { Spinner } from '@/components/base-ui-components/ui/spinner';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/base-ui-components/ui/tabs';
import {
    ToggleGroup,
    ToggleGroupItem,
} from '@/components/base-ui-components/ui/toggle-group';
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

export default function AipSummaryImport() {
    const [sheets, setSheets] = useState<string[]>([]);
    const [workbook, setWorkbook] = useState<ExcelJS.Workbook | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [selectedSheet, setSelectedSheet] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'upload' | 'calibrate' | 'verify'>(
        'upload',
    );
    const [config, setConfig] = useState<AipSummarySheetConfig>(() =>
        getDefaultAipSummaryConfig(),
    );
    const [verifyResult, setVerifyResult] =
        useState<AipSummaryVerifyResult | null>(null);

    const canCalibrate = selectedSheet !== '';
    const canVerify =
        canCalibrate &&
        config.headerRow !== '' &&
        config.headerRow != null &&
        !!workbook;

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
            e.target.value = '';

            return;
        }

        setError(null);
        setLoading(true);
        setFileName(file.name);
        setSelectedSheet('');
        setStep('upload');
        setVerifyResult(null);

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
    }

    function updateHeaderRow(value: string) {
        setConfig((prev) => ({
            ...prev,
            headerRow: value === '' ? '' : Number(value),
        }));
        setVerifyResult(null);
    }

    function handleResetDefaults() {
        setConfig(getDefaultAipSummaryConfig());
        setVerifyResult(null);
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
        });
    }

    function handleVerify() {
        if (!workbook || !selectedSheet) return;

        setVerifyResult(verifyAipSummarySheet(workbook, selectedSheet, config));
    }

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
                            {verifyResult?.valid && (
                                <span className="ml-1 text-xs text-green-600">
                                    ✓
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

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
                                            <li key={`${issue.row}-${i}`}>
                                                <span className="text-muted-foreground font-mono">
                                                    Row {issue.row}:
                                                </span>{' '}
                                                {issue.message}
                                            </li>
                                        ))}
                                    </ul>
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

                        <div className="flex justify-start">
                            <Button
                                variant="outline"
                                onClick={() => setStep('calibrate')}
                            >
                                Back: Calibrate
                            </Button>
                        </div>
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
