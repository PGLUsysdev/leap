import { Head, router } from '@inertiajs/react';
import ExcelJS from 'exceljs';
import { FileSpreadsheet } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import {
    ToggleGroup,
    ToggleGroupItem,
} from '@/components/ui/toggle-group';
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/components/ui/combobox';
import {
    getDefaultQuantitiesConfig,
} from '@/lib/ppmp/sheet-config';
import type { QuantitiesSheetConfig } from '@/lib/ppmp/sheet-config';
import {
    QUANTITY_MONTHS,
    extractQuantitiesSheet,
    verifyQuantitiesSheet,
} from '@/lib/ppmp/quantities-extract';
import type {
    QuantitiesExtractResult,
    QuantitiesVerifyResult,
    UniqueQuantityItem,
} from '@/lib/ppmp/quantities-extract';
import { matchQuantityItems } from '@/lib/ppmp/quantities-match';
import type {
    ExistingMapping,
    ExistingPriceList,
} from '@/lib/ppmp/quantities-match';
import type {
    ExistingCategory,
    ExistingCoa,
} from '@/lib/ppmp/normalize';

interface ExistingOffice {
    id: number;
    name: string;
    acronym: string | null;
}

interface ExistingPpa {
    id: number;
    office_id: number;
    parent_id: number | null;
    name: string;
    type: string;
    full_code: string;
    fiscal_year_id: number;
}

interface FiscalYearOption {
    id: number;
    year: number;
    status: string;
}

interface ExistingFundingSource {
    id: number;
    aip_output_id: number;
    funding_source_id: number | null;
    funding_source_code: string | null;
    funding_source_title: string | null;
    expected_output: string | null;
    ppa_id: number | null;
}

interface ExistingOutput {
    id: number;
    expected_output: string | null;
    sort_order: number | null;
    ppa_id: number | null;
}

interface PriceListQuantitiesImportProps {
    existingCategories: ExistingCategory[];
    existingCoas: ExistingCoa[];
    existingMappings: ExistingMapping[];
    existingPriceLists: ExistingPriceList[];
    existingOffices: ExistingOffice[];
    fiscalYears: FiscalYearOption[];
    existingPpas: ExistingPpa[];
    existingFundingSources: ExistingFundingSource[];
    existingOutputs: ExistingOutput[];
}

export default function PriceListQuantitiesImport({
    existingCategories,
    existingCoas,
    existingMappings,
    existingPriceLists,
    existingOffices,
    fiscalYears,
    existingPpas,
    existingFundingSources,
    existingOutputs,
}: PriceListQuantitiesImportProps) {
    const [workbook, setWorkbook] = useState<ExcelJS.Workbook | null>(null);
    const [sheets, setSheets] = useState<string[]>([]);
    const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [step, setStep] = useState<
        'upload' | 'calibrate' | 'verify' | 'review' | 'import'
    >('upload');

    const [calibrationMode, setCalibrationMode] = useState<
        'shared' | 'per-sheet'
    >('shared');
    const [sharedConfig, setSharedConfig] =
        useState<QuantitiesSheetConfig | null>(null);
    const [calibrations, setCalibrations] = useState<
        Record<string, QuantitiesSheetConfig>
    >({});
    const [currentSheet, setCurrentSheet] = useState<string>('');

    const [extractResults, setExtractResults] = useState<
        Record<string, QuantitiesExtractResult>
    >({});
    const [activeExtractSheet, setActiveExtractSheet] = useState<string>('');

    const [verifyResults, setVerifyResults] = useState<
        Record<string, QuantitiesVerifyResult>
    >({});
    const [activeVerifySheet, setActiveVerifySheet] = useState<string>('');

    const [hideEmptyQty, setHideEmptyQty] = useState(false);
    const [showOnlyUnmapped, setShowOnlyUnmapped] = useState(false);
    const [showOnlyWithQty, setShowOnlyWithQty] = useState(false);
    const [selectedOfficeId, setSelectedOfficeId] = useState<number | null>(
        null,
    );
    const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<
        number | null
    >(null);
    const [selectedPpaId, setSelectedPpaId] = useState<number | null>(null);
    const [selectedAipOutputId, setSelectedAipOutputId] = useState<
        number | null
    >(null);
    const [selectedPpaFundingSourceId, setSelectedPpaFundingSourceId] =
        useState<number | null>(null);

    const officeItems = useMemo(
        () =>
            existingOffices.map(
                (o) =>
                    `office:${o.id}:${o.acronym ? `${o.acronym} — ` : ''}${o.name}`,
            ),
        [existingOffices],
    );
    const officeValue = useMemo(() => {
        const found = existingOffices.find((o) => o.id === selectedOfficeId);

        return found
            ? `office:${found.id}:${found.acronym ? `${found.acronym} — ` : ''}${found.name}`
            : '';
    }, [existingOffices, selectedOfficeId]);

    const ppasForSelection = useMemo(
        () =>
            existingPpas.filter(
                (p) =>
                    (selectedOfficeId == null ||
                        p.office_id === selectedOfficeId) &&
                    (selectedFiscalYearId == null ||
                        p.fiscal_year_id === selectedFiscalYearId),
            ),
        [existingPpas, selectedOfficeId, selectedFiscalYearId],
    );
    const ppaItems = useMemo(
        () =>
            ppasForSelection.map(
                (p) => `ppa:${p.id}:${p.full_code} — ${p.name}`,
            ),
        [ppasForSelection],
    );
    const ppaValue = useMemo(() => {
        const found = existingPpas.find((p) => p.id === selectedPpaId);

        return found ? `ppa:${found.id}:${found.full_code} — ${found.name}` : '';
    }, [existingPpas, selectedPpaId]);

    const fundingSourcesForSelection = useMemo(() => {
        if (selectedAipOutputId != null) {
            return existingFundingSources.filter(
                (f) => f.aip_output_id === selectedAipOutputId,
            );
        }

        const scopedPpaIds = new Set(ppasForSelection.map((p) => p.id));

        return existingFundingSources.filter(
            (f) =>
                f.ppa_id != null &&
                (selectedPpaId != null
                    ? f.ppa_id === selectedPpaId
                    : scopedPpaIds.has(f.ppa_id)),
        );
    }, [
        existingFundingSources,
        ppasForSelection,
        selectedAipOutputId,
        selectedPpaId,
    ]);
    const fundingSourceItems = useMemo(
        () =>
            fundingSourcesForSelection.map(
                (f) =>
                    `fs:${f.id}:${f.funding_source_code ?? '—'} — ${f.funding_source_title ?? 'Unnamed fund'}`,
            ),
        [fundingSourcesForSelection],
    );
    const fundingSourceValue = useMemo(() => {
        const found = existingFundingSources.find(
            (f) => f.id === selectedPpaFundingSourceId,
        );

        return found
            ? `fs:${found.id}:${found.funding_source_code ?? '—'} — ${found.funding_source_title ?? 'Unnamed fund'}`
            : '';
    }, [existingFundingSources, selectedPpaFundingSourceId]);

    const outputsForSelection = useMemo(
        () =>
            selectedPpaId == null
                ? []
                : existingOutputs.filter((o) => o.ppa_id === selectedPpaId),
        [existingOutputs, selectedPpaId],
    );
    const outputItems = useMemo(
        () =>
            outputsForSelection.map(
                (o) => `output:${o.id}:${o.expected_output ?? `Output #${o.id}`}`,
            ),
        [outputsForSelection],
    );
    const outputValue = useMemo(() => {
        const found = existingOutputs.find((o) => o.id === selectedAipOutputId);

        return found
            ? `output:${found.id}:${found.expected_output ?? `Output #${found.id}`}`
            : '';
    }, [existingOutputs, selectedAipOutputId]);

    const canCalibrate = selectedSheets.length > 0;
    const canVerify =
        canCalibrate &&
        !!workbook &&
        !!sharedConfig &&
        sharedConfig.rowConfig.headerRow !== '' &&
        sharedConfig.rowConfig.headerRow != null;
    const hasAnyVerify = selectedSheets.some((s) => !!verifyResults[s]);
    const allVerifyValid =
        selectedSheets.length > 0 &&
        selectedSheets.every((s) => verifyResults[s]?.valid);
    const canReview = canVerify && hasAnyVerify && allVerifyValid;
    const canImport = Object.keys(extractResults).length > 0;

    const [activeImportSheet, setActiveImportSheet] = useState<string>('');

    const mappedBySheet = useMemo(() => {
        const next: Record<string, ReturnType<typeof matchQuantityItems>> = {};

        for (const [sheet, result] of Object.entries(extractResults)) {
            next[sheet] = matchQuantityItems(
                result.uniqueItems,
                existingPriceLists,
            );
        }

        return next;
    }, [
        extractResults,
        existingCategories,
        existingCoas,
        existingMappings,
        existingPriceLists,
    ]);

    const importSheets = Object.keys(mappedBySheet);
    const effectiveImportSheet =
        (activeImportSheet && mappedBySheet[activeImportSheet]
            ? activeImportSheet
            : importSheets[0]) ?? '';
    const mappedItems = mappedBySheet[effectiveImportSheet] ?? [];

    const matchedCount = mappedItems.filter(
        (m) => m.status === 'matched',
    ).length;
    const [excludeUnmapped, setExcludeUnmapped] = useState(true);
    const [excludeAmbiguous, setExcludeAmbiguous] = useState(true);
    const [importing, setImporting] = useState(false);

    const isAmbiguous = (message: string): boolean =>
        message.includes('Multiple price list matches');
    const isUnmapped = (message: string): boolean =>
        message.includes('Item not in price list');

    const importableItems = useMemo(
        () =>
            mappedItems.filter((m) => {
                if (m.status === 'matched') {
                    return m.monthTotal > 0;
                }
                if (excludeAmbiguous && isAmbiguous(m.message)) {
                    return false;
                }
                if (excludeUnmapped && isUnmapped(m.message)) {
                    return false;
                }
                return false;
            }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [mappedItems, excludeAmbiguous, excludeUnmapped],
    );

    function handleImport() {
        if (
            !selectedPpaId ||
            !selectedAipOutputId ||
            !selectedPpaFundingSourceId ||
            importableItems.length === 0 ||
            importing
        ) {
            return;
        }

        setImporting(true);
        router.post(
            '/price-list-quantities-import' as never,
            {
                ppa_id: selectedPpaId,
                aip_output_id: selectedAipOutputId,
                ppa_funding_source_id: selectedPpaFundingSourceId,
                items: importableItems
                    .filter((m) => m.status === 'matched' && m.monthTotal > 0)
                    .map((m) => ({
                        ppmp_price_list_id: m.priceListId,
                        qtys: m.qtys,
                    })),
            } as never,
            {
                onFinish: () => setImporting(false),
            },
        );
    }

    function getEffectiveConfig(sheet: string): QuantitiesSheetConfig {
        if (calibrationMode === 'shared' && sharedConfig) {
            return sharedConfig;
        }

        return (
            calibrations[sheet] ?? sharedConfig ?? getDefaultQuantitiesConfig()
        );
    }

    function runExtraction() {
        if (!workbook || !allVerifyValid) {
            return;
        }

        const next: Record<string, QuantitiesExtractResult> = {};

        for (const sheet of selectedSheets) {
            const result = extractQuantitiesSheet(
                workbook,
                sheet,
                getEffectiveConfig(sheet),
            );
            next[sheet] = result;
        }

        setExtractResults(next);
        setActiveExtractSheet(selectedSheets[0] ?? '');
        setStep('review');
    }

    function handleVerify() {
        if (!workbook || selectedSheets.length === 0) {
            return;
        }

        if (!sharedConfig) {
            ensureCalibrationsInitialized();
        }

        const next: Record<string, QuantitiesVerifyResult> = {};

        for (const sheet of selectedSheets) {
            const result = verifyQuantitiesSheet(
                workbook,
                sheet,
                getEffectiveConfig(sheet),
            );
            next[sheet] = result;
        }

        setVerifyResults(next);
        const firstInvalid = selectedSheets.find((s) => !next[s]?.valid);
        setActiveVerifySheet(firstInvalid ?? selectedSheets[0] ?? '');
        setExtractResults({});
        setActiveExtractSheet('');
    }

    async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        setWorkbook(null);
        setSheets([]);
        setSelectedSheets([]);
        setFileName(null);
        setError('');
        setSharedConfig(null);
        setCalibrations({});
        setCurrentSheet('');
        setExtractResults({});
        setVerifyResults({});
        setActiveExtractSheet('');
        setActiveVerifySheet('');
        setStep('upload');

        if (!file) {
            return;
        }

        try {
            const wb = new ExcelJS.Workbook();
            const buf = await file.arrayBuffer();
            await wb.xlsx.load(buf);
            setWorkbook(wb);
            setSheets(wb.worksheets.map((ws) => ws.name));
            setFileName(file.name);
        } catch {
            setError('Failed to parse .xlsx file.');
        }
    }

    function handleSheetToggle(name: string) {
        setSelectedSheets((prev) => {
            const next = prev.includes(name)
                ? prev.filter((s) => s !== name)
                : [...prev, name];

            if (next.length > 0 && !next.includes(currentSheet)) {
                setCurrentSheet(next[0]);
            }

            if (next.length === 0) {
                setCurrentSheet('');
            }

            return next;
        });
        setExtractResults({});
        setVerifyResults({});
        setActiveExtractSheet('');
        setActiveVerifySheet('');
    }

    function ensureCalibrationsInitialized() {
        if (sharedConfig) {
            return;
        }

        const def = getDefaultQuantitiesConfig();
        setSharedConfig(def);
        const clones: Record<string, QuantitiesSheetConfig> = {};

        for (const s of selectedSheets) {
            clones[s] = {
                ...def,
                columnConfig: { ...def.columnConfig },
                rowConfig: { ...def.rowConfig },
            };
        }

        setCalibrations(clones);

        if (!currentSheet && selectedSheets[0]) {
            setCurrentSheet(selectedSheets[0]);
        }
    }

    function handleApplySharedToAll() {
        if (!sharedConfig) {
            return;
        }

        const next: Record<string, QuantitiesSheetConfig> = {};

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

        if (!src) {
            return;
        }

        const next: Record<string, QuantitiesSheetConfig> = {};

        for (const s of selectedSheets) {
            next[s] = {
                ...src,
                columnConfig: { ...src.columnConfig },
                rowConfig: { ...src.rowConfig },
            };
        }

        setCalibrations(next);
    }

    function updateSharedConfig(patch: Partial<QuantitiesSheetConfig>) {
        setSharedConfig((prev) => ({
            ...(prev ?? getDefaultQuantitiesConfig()),
            ...patch,
        }));
    }

    function updateCurrentCalibration(patch: Partial<QuantitiesSheetConfig>) {
        if (!currentSheet) {
            return;
        }

        setCalibrations((prev) => ({
            ...prev,
            [currentSheet]: {
                ...(prev[currentSheet] ??
                    sharedConfig ??
                    getDefaultQuantitiesConfig()),
                ...patch,
            },
        }));
    }

    return (
        <>
            <Head title="Price List Quantities Import" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-1">
                    <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                        <FileSpreadsheet className="h-6 w-6" />
                        Price List Quantities Import
                    </h1>
                </div>

                <Tabs
                    value={step}
                    onValueChange={(v) => setStep(v as typeof step)}
                >
                    <TabsList>
                        <TabsTrigger value="upload">1. Upload</TabsTrigger>
                        <TabsTrigger value="calibrate" disabled={!canCalibrate}>
                            2. Calibrate{' '}
                            {calibrationMode === 'shared'
                                ? '(shared)'
                                : '(per-sheet)'}
                        </TabsTrigger>
                        <TabsTrigger value="verify" disabled={!canVerify}>
                            3. Verify
                        </TabsTrigger>
                        <TabsTrigger value="review" disabled={!canReview}>
                            4. Review
                        </TabsTrigger>
                        <TabsTrigger value="import" disabled={!canImport}>
                            5. Import
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="upload" className="flex flex-col gap-4">
                        <Field>
                            <FieldLabel htmlFor="quantities-file">
                                XLSX file
                            </FieldLabel>
                            <Input
                                id="quantities-file"
                                type="file"
                                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                onChange={handleFileChange}
                            />
                            <FieldDescription>
                                {fileName ??
                                    'Choose an .xlsx file to list its sheets.'}
                            </FieldDescription>
                        </Field>

                        {error !== '' && (
                            <p className="text-destructive text-sm">{error}</p>
                        )}

                        {sheets.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <h2 className="text-sm font-medium">Sheets</h2>
                                <ul className="flex flex-col gap-1">
                                    {sheets.map((name) => (
                                        <li key={name}>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleSheetToggle(name)
                                                }
                                                className={
                                                    selectedSheets.includes(
                                                        name,
                                                    )
                                                        ? 'bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm font-medium'
                                                        : 'bg-muted hover:bg-muted/70 rounded-md px-3 py-1.5 text-sm'
                                                }
                                            >
                                                {name}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                <div>
                                    <Button
                                        disabled={!canCalibrate}
                                        onClick={() => {
                                            ensureCalibrationsInitialized();
                                            setStep('calibrate');
                                        }}
                                    >
                                        Next: Calibrate
                                    </Button>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent
                        value="calibrate"
                        className="mt-4 flex flex-col gap-4"
                    >
                        <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
                            <span className="text-sm font-medium">Scope:</span>
                            <div className="flex gap-2">
                                <Button
                                    variant={
                                        calibrationMode === 'shared'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    size="sm"
                                    onClick={() => {
                                        if (
                                            calibrationMode === 'per-sheet' &&
                                            calibrations[currentSheet]
                                        ) {
                                            setSharedConfig({
                                                ...calibrations[currentSheet],
                                            });
                                        } else if (!sharedConfig) {
                                            ensureCalibrationsInitialized();
                                        }

                                        setCalibrationMode('shared');
                                    }}
                                >
                                    Shared — all {selectedSheets.length} sheets
                                </Button>
                                <Button
                                    variant={
                                        calibrationMode === 'per-sheet'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    size="sm"
                                    onClick={() => {
                                        if (sharedConfig) {
                                            const next: Record<
                                                string,
                                                QuantitiesSheetConfig
                                            > = {};

                                            for (const s of selectedSheets) {
                                                next[s] = {
                                                    ...sharedConfig,
                                                    columnConfig: {
                                                        ...sharedConfig.columnConfig,
                                                    },
                                                    rowConfig: {
                                                        ...sharedConfig.rowConfig,
                                                    },
                                                };
                                            }

                                            setCalibrations(next);

                                            if (
                                                !currentSheet &&
                                                selectedSheets[0]
                                            ) {
                                                setCurrentSheet(
                                                    selectedSheets[0],
                                                );
                                            }
                                        }

                                        setCalibrationMode('per-sheet');
                                    }}
                                >
                                    Per-sheet
                                </Button>
                            </div>
                            <span className="text-muted-foreground text-xs">
                                {calibrationMode === 'shared'
                                    ? `Header row ${sharedConfig?.rowConfig.headerRow === '' || sharedConfig?.rowConfig.headerRow == null ? 7 : sharedConfig.rowConfig.headerRow} applies to every sheet`
                                    : `Editing ${currentSheet || '—'} only affects that sheet`}
                            </span>
                            {calibrationMode === 'shared' ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleApplySharedToAll}
                                    disabled={!sharedConfig}
                                >
                                    Apply shared to all ({selectedSheets.length}
                                    )
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

                        {calibrationMode === 'per-sheet' &&
                            selectedSheets.length > 1 && (
                                <Field>
                                    <FieldLabel>Editing sheet</FieldLabel>
                                    <Select
                                        value={currentSheet}
                                        onValueChange={(v) =>
                                            setCurrentSheet(v ?? '')
                                        }
                                    >
                                        <SelectTrigger className="w-[260px]">
                                            <SelectValue placeholder="Select sheet to edit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {selectedSheets.map((s) => (
                                                    <SelectItem key={s} value={s}>
                                                        {s}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </Field>
                            )}

                        {(() => {
                            const cfg = getEffectiveConfig(
                                calibrationMode === 'shared'
                                    ? (selectedSheets[0] ?? '')
                                    : (currentSheet || selectedSheets[0]!),
                            );
                            const onChange = (
                                patch: Partial<QuantitiesSheetConfig>,
                            ) => {
                                if (calibrationMode === 'shared') {
                                    updateSharedConfig(patch);
                                } else {
                                    updateCurrentCalibration(patch);
                                }

                                setExtractResults({});
                                setVerifyResults({});
                                setActiveExtractSheet('');
                                setActiveVerifySheet('');
                            };
                            const onColumn = (
                                patch: Partial<
                                    QuantitiesSheetConfig['columnConfig']
                                >,
                            ) => {
                                const next = { ...cfg.columnConfig, ...patch };
                                onChange({
                                    columnConfig: next,
                                } as Partial<QuantitiesSheetConfig>);
                            };
                            const onRow = (
                                patch: Partial<
                                    QuantitiesSheetConfig['rowConfig']
                                >,
                            ) => {
                                const next = { ...cfg.rowConfig, ...patch };
                                onChange({
                                    rowConfig: next,
                                } as unknown as Partial<QuantitiesSheetConfig>);
                            };

                            return (
                                <div className="rounded-lg border p-4">
                                    <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
                                        Calibration{' '}
                                        {calibrationMode === 'shared'
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
                                            <FieldLabel>
                                                Category / Description Column
                                            </FieldLabel>
                                            <Input
                                                value={
                                                    cfg.columnConfig.category
                                                }
                                                onChange={(e) =>
                                                    onColumn({
                                                        category:
                                                            e.target.value.toUpperCase(),
                                                    })
                                                }
                                                className="w-16"
                                                placeholder="F"
                                            />
                                            <FieldDescription>
                                                F — shared
                                            </FieldDescription>
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
                                            <FieldLabel>
                                                Price Column
                                            </FieldLabel>
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
                                        <Field>
                                            <FieldLabel>
                                                Item No. Column
                                            </FieldLabel>
                                            <Input
                                                value={
                                                    cfg.columnConfig.itemNumber
                                                }
                                                onChange={(e) =>
                                                    onColumn({
                                                        itemNumber:
                                                            e.target.value.toUpperCase(),
                                                    })
                                                }
                                                className="w-16"
                                                placeholder="E"
                                            />
                                            <FieldDescription>
                                                E — placeholder detection
                                            </FieldDescription>
                                        </Field>
                                        <Field>
                                            <FieldLabel>
                                                Qty Start Column (Jan)
                                            </FieldLabel>
                                            <Input
                                                value={
                                                    cfg.columnConfig.qtyStart
                                                }
                                                onChange={(e) =>
                                                    onColumn({
                                                        qtyStart:
                                                            e.target.value.toUpperCase(),
                                                    })
                                                }
                                                className="w-16"
                                                placeholder="K"
                                            />
                                            <FieldDescription>
                                                K — Jan qty, alternating
                                                qty/amount pairs (amounts
                                                skipped)
                                            </FieldDescription>
                                        </Field>
                                    </div>
                                    <div className="mt-4 grid grid-cols-3 gap-4">
                                        <Field>
                                            <FieldLabel>Header Row</FieldLabel>
                                            <Input
                                                type="number"
                                                value={
                                                    cfg.rowConfig.headerRow ??
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    onRow({
                                                        headerRow:
                                                            e.target.value ===
                                                            ''
                                                                ? ''
                                                                : Number(
                                                                      e.target
                                                                          .value,
                                                                  ),
                                                    })
                                                }
                                                className="w-20"
                                                placeholder="7"
                                            />
                                            <FieldDescription>
                                                Header{' '}
                                                {cfg.rowConfig.headerRow ===
                                                    '' ||
                                                cfg.rowConfig.headerRow == null
                                                    ? '—'
                                                    : cfg.rowConfig.headerRow}
                                                ; data starts{' '}
                                                {cfg.rowConfig.headerRow ===
                                                    '' ||
                                                cfg.rowConfig.headerRow == null
                                                    ? '—'
                                                    : cfg.rowConfig.headerRow +
                                                      1}
                                            </FieldDescription>
                                        </Field>
                                        <Field>
                                            <FieldLabel>
                                                Additional Items Header Row
                                                (optional)
                                            </FieldLabel>
                                            <Input
                                                type="number"
                                                value={
                                                    cfg.rowConfig
                                                        .additionalItemsHeaderRow ??
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    onRow({
                                                        additionalItemsHeaderRow:
                                                            e.target.value
                                                                ? Number(
                                                                      e.target
                                                                          .value,
                                                                  )
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
                                                Non-Procurement Header Row
                                                (optional)
                                            </FieldLabel>
                                            <Input
                                                type="number"
                                                value={
                                                    cfg.rowConfig
                                                        .nonProcurementHeaderRow ??
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    onRow({
                                                        nonProcurementHeaderRow:
                                                            e.target.value
                                                                ? Number(
                                                                      e.target
                                                                          .value,
                                                                  )
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
                                        <FieldLabel>
                                            COA items format *
                                        </FieldLabel>
                                        <ToggleGroup
                                            variant="outline"
                                            spacing={2}
                                            value={[cfg.coaLabelMode]}
                                            onValueChange={(value) => {
                                                if (value.length > 0) {
                                                    onChange({
                                                        coaLabelMode:
                                                            value[0] as QuantitiesSheetConfig['coaLabelMode'],
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
                                                <span className="text-muted-foreground text-xs font-normal">
                                                    Category → COA label in F
                                                    (next D same) → Items with
                                                    D=COA
                                                </span>
                                            </ToggleGroupItem>
                                            <ToggleGroupItem
                                                value="without-label"
                                                className="h-auto flex-1 flex-col items-start gap-1 border p-3 text-left whitespace-normal"
                                            >
                                                <span className="font-medium">
                                                    Without COA label rows
                                                </span>
                                                <span className="text-muted-foreground text-xs font-normal">
                                                    Items already have D=COA
                                                    directly, no label rows
                                                </span>
                                            </ToggleGroupItem>
                                        </ToggleGroup>
                                    </Field>
                                </div>
                            );
                        })()}

                        <div>
                            <Button
                                disabled={!canVerify}
                                onClick={() => {
                                    handleVerify();
                                    setStep('verify');
                                }}
                            >
                                Run verification
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent
                        value="verify"
                        className="mt-4 flex flex-col gap-4"
                    >
                        <div className="flex gap-2">
                            <Button
                                onClick={handleVerify}
                                disabled={!canVerify}
                            >
                                Run Verify ({selectedSheets.length} sheets)
                            </Button>
                            {hasAnyVerify && allVerifyValid && (
                                <Badge
                                    variant="default"
                                    className="self-center"
                                >
                                    All valid ✓
                                </Badge>
                            )}
                            {hasAnyVerify && !allVerifyValid && (
                                <Badge
                                    variant="destructive"
                                    className="self-center"
                                >
                                    Fix errors to continue
                                </Badge>
                            )}
                        </div>

                        {!hasAnyVerify && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">
                                        What verification checks
                                    </CardTitle>
                                    <CardDescription>
                                        Runs against each selected sheet using
                                        its calibration. Extraction stays
                                        locked until every sheet passes.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
                                        <li>
                                            Calibrated ranges are sane and the
                                            procurement section has data
                                        </li>
                                        <li>
                                            Every item row has a unit and a COA
                                        </li>
                                        <li>
                                            Every quantity cell is numeric
                                            (amount columns are skipped)
                                        </li>
                                        <li>
                                            Every item row carries quantities
                                            in at least one month
                                        </li>
                                    </ul>
                                    {selectedSheets.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {selectedSheets.map((s) => (
                                                <Badge
                                                    key={s}
                                                    variant="secondary"
                                                >
                                                    {s}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {selectedSheets.length > 0 &&
                            Object.keys(verifyResults).length > 0 && (
                                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                    {selectedSheets.map((s) => {
                                        const r = verifyResults[s];
                                        const valid = r?.valid ?? false;

                                        return (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() =>
                                                    setActiveVerifySheet(s)
                                                }
                                                className={`rounded-lg border p-3 text-left transition-colors ${
                                                    activeVerifySheet === s
                                                        ? 'border-primary ring-primary/30 ring-1'
                                                        : 'hover:bg-muted/50'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="truncate text-sm font-medium">
                                                        {s}
                                                    </span>
                                                    <Badge
                                                        variant={
                                                            valid
                                                                ? 'default'
                                                                : 'destructive'
                                                        }
                                                    >
                                                        {r
                                                            ? valid
                                                                ? '✓ Valid'
                                                                : '❌ Invalid'
                                                            : '—'}
                                                    </Badge>
                                                </div>
                                                <p className="text-muted-foreground mt-1 text-xs">
                                                    {r
                                                        ? r.message
                                                        : 'Not verified yet'}
                                                </p>
                                                {r && r.errors.length > 0 && (
                                                    <p className="text-destructive mt-1 text-xs">
                                                        {r.errors.length}{' '}
                                                        problem(s) — click for
                                                        details
                                                    </p>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                        {activeVerifySheet &&
                            verifyResults[activeVerifySheet] && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">
                                            {activeVerifySheet}
                                        </CardTitle>
                                        <CardDescription>
                                            {
                                                verifyResults[
                                                    activeVerifySheet
                                                ].message
                                            }
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex flex-col gap-3">
                                        {verifyResults[activeVerifySheet]
                                            .errors.length > 0 && (
                                            <ul className="text-destructive flex flex-col gap-1 text-sm">
                                                {verifyResults[
                                                    activeVerifySheet
                                                ].errors.map((e, i) => (
                                                    <li key={i}>
                                                        Row {e.row}: {e.message}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        <ul className="text-muted-foreground flex flex-col gap-1 text-xs">
                                            {verifyResults[
                                                activeVerifySheet
                                            ].details.map((d, i) => (
                                                <li key={i}>{d}</li>
                                            ))}
                                        </ul>

                                        {allVerifyValid && (
                                            <div>
                                                <Button
                                                    onClick={runExtraction}
                                                >
                                                    Run extraction
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                    </TabsContent>

                    <TabsContent
                        value="review"
                        className="mt-4 flex flex-col gap-4"
                    >
                        {selectedSheets.length === 0 && (
                            <p className="text-muted-foreground text-sm">
                                No sheets selected.
                            </p>
                        )}

                        {selectedSheets.length > 0 &&
                            Object.keys(extractResults).length === 0 && (
                                <div className="flex flex-col items-start gap-2">
                                    <p className="text-muted-foreground text-sm">
                                        {allVerifyValid
                                            ? 'Extraction has not run yet.'
                                            : 'Verify all sheets first.'}
                                    </p>
                                    <Button
                                        disabled={!canReview}
                                        onClick={runExtraction}
                                    >
                                        Run extraction
                                    </Button>
                                </div>
                            )}

                        {Object.keys(extractResults).length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                                {selectedSheets.map((s) => (
                                    <Button
                                        key={s}
                                        variant={
                                            activeExtractSheet === s
                                                ? 'default'
                                                : 'outline'
                                        }
                                        size="sm"
                                        onClick={() =>
                                            setActiveExtractSheet(s)
                                        }
                                    >
                                        {s}{' '}
                                        {extractResults[s]?.valid
                                            ? '✓'
                                            : extractResults[s]
                                              ? '❌'
                                              : ''}
                                    </Button>
                                ))}
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        setActiveImportSheet(
                                            activeExtractSheet,
                                        );
                                        setStep('import');
                                    }}
                                >
                                    Go to Import →
                                </Button>
                            </div>
                        )}

                        {activeExtractSheet &&
                            extractResults[activeExtractSheet] && (
                                <div className="flex flex-col gap-3">
                                    <p className="text-sm font-medium">
                                        {
                                            extractResults[activeExtractSheet]
                                                .message
                                        }
                                    </p>
                                    {extractResults[activeExtractSheet].errors
                                        .length > 0 && (
                                        <ul className="text-destructive flex flex-col gap-1 text-sm">
                                            {extractResults[
                                                activeExtractSheet
                                            ].errors.map((e, i) => (
                                                <li key={i}>
                                                    Row {e.row}: {e.message}
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    <ul className="text-muted-foreground flex flex-col gap-1 text-xs">
                                        {extractResults[
                                            activeExtractSheet
                                        ].details.map((d, i) => (
                                            <li key={i}>{d}</li>
                                        ))}
                                    </ul>

                                    {(() => {
                                        const items =
                                            extractResults[activeExtractSheet]
                                                .uniqueItems;
                                        const emptyCount = items.filter(
                                            (item) => item.monthTotal === 0,
                                        ).length;
                                        const visibleItems = hideEmptyQty
                                            ? items.filter(
                                                  (item) =>
                                                      item.monthTotal > 0,
                                              )
                                            : items;

                                        return (
                                            <>
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <label
                                                        htmlFor="hide-empty-qty"
                                                        className="flex cursor-pointer items-center gap-2 text-sm"
                                                    >
                                                        <Checkbox
                                                            id="hide-empty-qty"
                                                            checked={
                                                                hideEmptyQty
                                                            }
                                                            onCheckedChange={(
                                                                v,
                                                            ) =>
                                                                setHideEmptyQty(
                                                                    v === true,
                                                                )
                                                            }
                                                        />
                                                        Hide rows with no
                                                        quantities
                                                        {emptyCount > 0 &&
                                                            ` (${emptyCount})`}
                                                    </label>
                                                    <span className="text-muted-foreground text-xs">
                                                        Showing{' '}
                                                        {
                                                            visibleItems.length
                                                        }{' '}
                                                        of {items.length} items
                                                    </span>
                                                </div>

                                                <ReviewItemsTable
                                                    items={visibleItems}
                                                />
                                            </>
                                        );
                                    })()}
                                </div>
                            )}
                    </TabsContent>

                    <TabsContent
                        value="import"
                        className="mt-4 flex flex-col gap-4"
                    >
                        {importSheets.length === 0 && (
                            <p className="text-muted-foreground text-sm">
                                Run extraction in Review first.
                            </p>
                        )}

                        {importSheets.length > 0 && (
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-wrap items-end gap-3">
                                    <Field className="w-64 max-w-md">
                                    <FieldLabel>Office</FieldLabel>
                                    <Combobox
                                        items={officeItems}
                                        value={officeValue}
                                        onValueChange={(val) => {
                                            const match = /^office:(\d+):/.exec(
                                                (val as string | null) ?? '',
                                            );
                                            setSelectedOfficeId(
                                                match
                                                    ? Number(match[1])
                                                    : null,
                                            );
                                            setSelectedPpaId(null);
                                            setSelectedAipOutputId(null);
                                            setSelectedPpaFundingSourceId(null);
                                        }}
                                    >
                                        <ComboboxInput
                                            placeholder="Search offices..."
                                            className="h-9"
                                        />
                                        <ComboboxContent>
                                            <ComboboxEmpty>
                                                No office found.
                                            </ComboboxEmpty>
                                            <ComboboxList>
                                                {(item: string) => (
                                                    <ComboboxItem
                                                        key={item}
                                                        value={item}
                                                    >
                                                        {item.replace(
                                                            /^office:\d+:/,
                                                            '',
                                                        )}
                                                    </ComboboxItem>
                                                )}
                                            </ComboboxList>
                                        </ComboboxContent>
                                    </Combobox>
                                    <FieldDescription>
                                        {selectedOfficeId
                                            ? `${existingOffices.length} offices — 1 selected`
                                            : `Displaying all ${existingOffices.length} offices — pick one to scope this import.`}
                                    </FieldDescription>
                                </Field>
                                    <Field className="w-40">
                                        <FieldLabel>Year</FieldLabel>
                                        <Select
                                            value={
                                                selectedFiscalYearId != null
                                                    ? String(selectedFiscalYearId)
                                                    : ''
                                            }
                                            onValueChange={(v) => {
                                                setSelectedFiscalYearId(
                                                    v ? Number(v) : null,
                                                );
                                                setSelectedPpaId(null);
                                                setSelectedAipOutputId(null);
                                                setSelectedPpaFundingSourceId(
                                                    null,
                                                );
                                            }}
                                        >
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="Select year" />
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
                                        <FieldDescription>
                                            {selectedFiscalYearId
                                                ? `${ppasForSelection.length} PPAs in scope`
                                                : `Pick a year to filter PPAs.`}
                                        </FieldDescription>
                                    </Field>
                                    <Field className="w-96 max-w-full">
                                        <FieldLabel>PPA</FieldLabel>
                                        <Combobox
                                            items={ppaItems}
                                            value={ppaValue}
                                            onValueChange={(val) => {
                                                const match = /^ppa:(\d+):/.exec(
                                                    (val as string | null) ??
                                                        '',
                                                );
                                                setSelectedPpaId(
                                                    match
                                                        ? Number(match[1])
                                                        : null,
                                                );
                                                setSelectedAipOutputId(null);
                                                setSelectedPpaFundingSourceId(
                                                    null,
                                                );
                                            }}
                                        >
                                            <ComboboxInput
                                                placeholder={
                                                    selectedOfficeId ||
                                                    selectedFiscalYearId
                                                        ? 'Search PPAs...'
                                                        : 'Select office/year first...'
                                                }
                                                className="h-9"
                                            />
                                            <ComboboxContent>
                                                <ComboboxEmpty>
                                                    No PPA found.
                                                </ComboboxEmpty>
                                                <ComboboxList>
                                                    {(item: string) => (
                                                        <ComboboxItem
                                                            key={item}
                                                            value={item}
                                                        >
                                                            {item.replace(
                                                                /^ppa:\d+:/,
                                                                '',
                                                            )}
                                                        </ComboboxItem>
                                                    )}
                                                </ComboboxList>
                                            </ComboboxContent>
                                        </Combobox>
                                        <FieldDescription>
                                            {selectedPpaId
                                                ? '1 PPA selected'
                                                : `Showing ${ppasForSelection.length} of ${existingPpas.length} PPAs for the selected office/year.`}
                                        </FieldDescription>
                                    </Field>
                                    <Field className="w-96 max-w-full">
                                        <FieldLabel>Expected output</FieldLabel>
                                        <Combobox
                                            items={outputItems}
                                            value={outputValue}
                                            onValueChange={(val) => {
                                                const match =
                                                    /^output:(\d+):/.exec(
                                                        (val as
                                                            | string
                                                            | null) ?? '',
                                                    );
                                                setSelectedAipOutputId(
                                                    match
                                                        ? Number(match[1])
                                                        : null,
                                                );
                                                setSelectedPpaFundingSourceId(
                                                    null,
                                                );
                                            }}
                                        >
                                            <ComboboxInput
                                                placeholder={
                                                    selectedPpaId
                                                        ? 'Search outputs...'
                                                        : 'Select a PPA first...'
                                                }
                                                disabled={!selectedPpaId}
                                                className="h-9"
                                            />
                                            <ComboboxContent>
                                                <ComboboxEmpty>
                                                    No output found.
                                                </ComboboxEmpty>
                                                <ComboboxList>
                                                    {(item: string) => (
                                                        <ComboboxItem
                                                            key={item}
                                                            value={item}
                                                        >
                                                            {item.replace(
                                                                /^output:\d+:/,
                                                                '',
                                                            )}
                                                        </ComboboxItem>
                                                    )}
                                                </ComboboxList>
                                            </ComboboxContent>
                                        </Combobox>
                                        <FieldDescription>
                                            {selectedAipOutputId
                                                ? '1 output selected'
                                                : selectedPpaId
                                                  ? `Showing ${outputsForSelection.length} output(s) for the selected PPA.`
                                                  : 'Pick a PPA to list its expected outputs.'}
                                        </FieldDescription>
                                    </Field>
                                    <Field className="w-96 max-w-full">
                                        <FieldLabel>Funding source</FieldLabel>
                                        <Combobox
                                            items={fundingSourceItems}
                                            value={fundingSourceValue}
                                            onValueChange={(val) => {
                                                const match = /^fs:(\d+):/.exec(
                                                    (val as string | null) ??
                                                        '',
                                                );
                                                setSelectedPpaFundingSourceId(
                                                    match
                                                        ? Number(match[1])
                                                        : null,
                                                );
                                            }}
                                        >
                                            <ComboboxInput
                                                placeholder={
                                                    selectedAipOutputId
                                                        ? 'Search funding sources...'
                                                        : 'Select an output first...'
                                                }
                                                disabled={!selectedAipOutputId}
                                                className="h-9"
                                            />
                                            <ComboboxContent>
                                                <ComboboxEmpty>
                                                    No funding source found.
                                                </ComboboxEmpty>
                                                <ComboboxList>
                                                    {(item: string) => (
                                                        <ComboboxItem
                                                            key={item}
                                                            value={item}
                                                        >
                                                            {item.replace(
                                                                /^fs:\d+:/,
                                                                '',
                                                            )}
                                                        </ComboboxItem>
                                                    )}
                                                </ComboboxList>
                                            </ComboboxContent>
                                        </Combobox>
                                        <FieldDescription>
                                            {selectedPpaFundingSourceId
                                                ? '1 funding source selected — quantities import to this source.'
                                                : selectedAipOutputId
                                                  ? `Showing ${fundingSourcesForSelection.length} funding source(s) for the selected output.`
                                                  : 'Pick office, PPA, and output to list funding sources.'}
                                        </FieldDescription>
                                    </Field>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {importSheets.map((s) => {
                                        const items = mappedBySheet[s] ?? [];
                                        const matched = items.filter(
                                            (m) => m.status === 'matched',
                                        ).length;

                                        return (
                                            <Button
                                                key={s}
                                                variant={
                                                    effectiveImportSheet === s
                                                        ? 'default'
                                                        : 'outline'
                                                }
                                                size="sm"
                                                onClick={() =>
                                                    setActiveImportSheet(s)
                                                }
                                            >
                                                {s} ({matched}/{items.length})
                                            </Button>
                                        );
                                    })}
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <Badge variant="default">
                                        {matchedCount} of {mappedItems.length}{' '}
                                        mapped
                                    </Badge>
                                    <label
                                        htmlFor="show-only-unmapped"
                                        className="flex cursor-pointer items-center gap-2 text-sm"
                                    >
                                        <Checkbox
                                            id="show-only-unmapped"
                                            checked={showOnlyUnmapped}
                                            onCheckedChange={(v) =>
                                                setShowOnlyUnmapped(v === true)
                                            }
                                        />
                                        Show only unmapped
                                        {mappedItems.length - matchedCount >
                                            0 &&
                                            ` (${mappedItems.length - matchedCount})`}
                                    </label>
                                    <label
                                        htmlFor="show-only-with-qty"
                                        className="flex cursor-pointer items-center gap-2 text-sm"
                                    >
                                        <Checkbox
                                            id="show-only-with-qty"
                                            checked={showOnlyWithQty}
                                            onCheckedChange={(v) =>
                                                setShowOnlyWithQty(v === true)
                                            }
                                        />
                                        Show only rows with quantities
                                        {mappedItems.filter(
                                            (m) => m.monthTotal > 0,
                                        ).length > 0 &&
                                            ` (${mappedItems.filter((m) => m.monthTotal > 0).length})`}
                                    </label>
                                    <span className="text-muted-foreground text-xs">
                                        Sheet: {effectiveImportSheet} —{' '}
                                        {importableItems.length} of{' '}
                                        {mappedItems.length} queued for import.
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
                                    <label
                                        htmlFor="exclude-unmapped"
                                        className="flex cursor-pointer items-center gap-2 text-sm"
                                    >
                                        <Checkbox
                                            id="exclude-unmapped"
                                            checked={excludeUnmapped}
                                            onCheckedChange={(v) =>
                                                setExcludeUnmapped(v === true)
                                            }
                                        />
                                        Exclude unmapped (not in price list)
                                    </label>
                                    <label
                                        htmlFor="exclude-ambiguous"
                                        className="flex cursor-pointer items-center gap-2 text-sm"
                                    >
                                        <Checkbox
                                            id="exclude-ambiguous"
                                            checked={excludeAmbiguous}
                                            onCheckedChange={(v) =>
                                                setExcludeAmbiguous(v === true)
                                            }
                                        />
                                        Exclude ambiguous (multiple matches)
                                    </label>
                                    <Button
                                        disabled={
                                            !selectedPpaId ||
                                            !selectedAipOutputId ||
                                            !selectedPpaFundingSourceId ||
                                            importableItems.length === 0 ||
                                            importing
                                        }
                                        onClick={handleImport}
                                    >
                                        {importing
                                            ? 'Importing…'
                                            : `Import ${importableItems.length} to PPMP`}
                                    </Button>
                                    {(!selectedPpaId ||
                                        !selectedAipOutputId ||
                                        !selectedPpaFundingSourceId) && (
                                        <span className="text-muted-foreground text-xs">
                                            Select office, year, PPA, output,
                                            and funding source above to enable
                                            import.
                                        </span>
                                    )}
                                </div>

                                <ScrollArea className="w-full rounded-lg border">
                                    <Table className="[&_th]:border-l [&_td]:border-l [&_th:first-child]:border-l-0 [&_td:first-child]:border-l-0">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-right">
                                                    Row
                                                </TableHead>
                                                <TableHead>
                                                    Description
                                                </TableHead>
                                                <TableHead>Unit</TableHead>
                                                <TableHead className="text-right">
                                                    Total qty
                                                </TableHead>
                                                <TableHead>
                                                    Price list match
                                                </TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {mappedItems
                                                .filter(
                                                    (m) =>
                                                        !showOnlyUnmapped ||
                                                        m.status !== 'matched',
                                                )
                                                .filter(
                                                    (m) =>
                                                        !showOnlyWithQty ||
                                                        m.monthTotal > 0,
                                                )
                                                .map((m) => (
                                                <TableRow key={m.key}>
                                                    <TableCell className="text-right tabular-nums">
                                                        {m.rows.join(', ')}
                                                    </TableCell>
                                                    <TableCell className="max-w-80 whitespace-normal break-words">
                                                        {m.description}
                                                    </TableCell>
                                                    <TableCell>
                                                        {m.unit}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {m.monthTotal === 0
                                                            ? ''
                                                            : m.monthTotal}
                                                    </TableCell>
                                                    <TableCell>
                                                        {m.status === 'matched'
                                                            ? `₱${m.priceListPrice}`
                                                            : '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={
                                                                m.status ===
                                                                'matched'
                                                                    ? 'default'
                                                                    : 'destructive'
                                                            }
                                                        >
                                                            {m.status ===
                                                            'matched'
                                                                ? 'Mapped'
                                                                : 'Unmapped'}
                                                        </Badge>
                                                        <p className="text-muted-foreground mt-1 text-xs">
                                                            {m.message}
                                                        </p>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    <ScrollBar orientation="horizontal" />
                                </ScrollArea>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}

function ReviewItemsTable({ items }: { items: UniqueQuantityItem[] }) {
    const monthSums = QUANTITY_MONTHS.map((_, i) =>
        items.reduce((sum, item) => sum + (item.qtys[i] ?? 0), 0),
    );
    const grandTotal = monthSums.reduce((sum, q) => sum + q, 0);
    const fmtQty = (q: number): number | '' => (q === 0 ? '' : q);

    return (
        <ScrollArea className="w-full rounded-lg border">
            <Table className="[&_th]:border-l [&_td]:border-l [&_th:first-child]:border-l-0 [&_td:first-child]:border-l-0">
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-right">Row</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Unit</TableHead>
                        {QUANTITY_MONTHS.map((m) => (
                            <TableHead
                                key={m}
                                className="text-right capitalize"
                            >
                                {m}
                            </TableHead>
                        ))}
                        <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item) => (
                        <TableRow key={item.key}>
                            <TableCell className="text-right tabular-nums">
                                {item.rows.join(', ')}
                            </TableCell>
                            <TableCell className="max-w-80 whitespace-normal break-words">
                                {item.description}
                            </TableCell>
                            <TableCell>{item.unit}</TableCell>
                            {item.qtys.map((q, i) => (
                                <TableCell
                                    key={QUANTITY_MONTHS[i]}
                                    className="text-right"
                                >
                                    {fmtQty(q)}
                                </TableCell>
                            ))}
                            <TableCell className="text-right font-medium">
                                {fmtQty(item.monthTotal)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell
                            colSpan={3}
                            className="text-right font-medium"
                        >
                            Total
                        </TableCell>
                        {monthSums.map((sum, i) => (
                            <TableCell
                                key={QUANTITY_MONTHS[i]}
                                className="text-right font-medium"
                            >
                                {fmtQty(sum)}
                            </TableCell>
                        ))}
                        <TableCell className="text-right font-medium">
                            {fmtQty(grandTotal)}
                        </TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    );
}

PriceListQuantitiesImport.layout = {
    breadcrumbs: [
        { title: 'Imports', href: '/imports' },
        {
            title: 'Price List Quantities Import',
            href: '/price-list-quantities-import',
        },
    ],
};
