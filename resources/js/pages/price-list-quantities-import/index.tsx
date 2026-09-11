// resources/js/pages/price-list-quantities-import/index.tsx

import { Head, router } from '@inertiajs/react';
import ExcelJS from 'exceljs';
import type { ChangeEvent } from 'react';
import { useMemo, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getDefaultQuantitiesConfig } from '@/lib/ppmp/sheet-config';
import type { QuantitiesSheetConfig } from '@/lib/ppmp/sheet-config';
import {
    extractQuantitiesSheet,
    verifyQuantitiesSheet,
} from '@/lib/ppmp/quantities-extract';
import type {
    QuantitiesExtractResult,
    QuantitiesVerifyResult,
} from '@/lib/ppmp/quantities-extract';
import { matchQuantityItems } from '@/lib/ppmp/quantities-match';
import type {
    ExistingMapping,
    ExistingPriceList,
} from '@/lib/ppmp/quantities-match';
import type { ExistingCategory, ExistingCoa } from '@/lib/ppmp/normalize';

import type {
    CalibrationMode,
    ExistingFundingSource,
    ExistingOffice,
    ExistingOutput,
    ExistingPpa,
    FiscalYearOption,
    MappedItem,
    PriceListQuantitiesImportState,
    PliQtyStep,
} from './types';
import { UploadStep } from './steps/upload-step';
import { CalibrateStep } from './steps/calibrate-step';
import { VerifyStep } from './steps/verify-step';
import { ReviewStep } from './steps/review-step';
import { ImportStep } from './steps/import-step';

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
    const [step, setStep] = useState<PliQtyStep>('upload');

    const [calibrationMode, setCalibrationMode] =
        useState<CalibrationMode>('shared');
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

        return found
            ? `ppa:${found.id}:${found.full_code} — ${found.name}`
            : '';
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
                (o) =>
                    `output:${o.id}:${o.expected_output ?? `Output #${o.id}`}`,
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
    const [excludeUnclassified, setExcludeUnclassified] = useState(true);
    const [importing, setImporting] = useState(false);

    const isAmbiguous = (message: string): boolean =>
        message.includes('Multiple price list matches');
    const isUnmapped = (message: string): boolean =>
        message.includes('Item not in price list');

    const priceListClassById = useMemo(() => {
        const next = new Map<number, string | null>();

        for (const p of existingPriceLists) {
            next.set(p.id, p.expense_class ?? null);
        }

        return next;
    }, [existingPriceLists]);

    const CLASSIFIED = ['PS', 'MOOE', 'FE', 'CO'];

    function isUnclassified(
        m: Pick<MappedItem, 'status' | 'priceListId'>,
    ): boolean {
        if (m.status !== 'matched' || m.priceListId == null) {
            return false;
        }

        const cls = priceListClassById.get(m.priceListId) ?? null;

        return cls === null || !CLASSIFIED.includes(cls);
    }

    const unclassifiedCount = useMemo(
        () =>
            mappedItems.filter(
                (m) => m.status === 'matched' && isUnclassified(m),
            ).length,
        [mappedItems, priceListClassById],
    );

    const importableItems = useMemo(
        () =>
            mappedItems.filter((m) => {
                if (m.status === 'matched') {
                    if (m.monthTotal <= 0) {
                        return false;
                    }

                    if (excludeUnclassified && isUnclassified(m)) {
                        return false;
                    }

                    return true;
                }
                if (excludeAmbiguous && isAmbiguous(m.message)) {
                    return false;
                }
                if (excludeUnmapped && isUnmapped(m.message)) {
                    return false;
                }
                return false;
            }),
        [mappedItems, excludeAmbiguous, excludeUnmapped, excludeUnclassified],
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

    // ----- Build the state object once -----
    const s: PriceListQuantitiesImportState = {
        workbook,
        sheets,
        selectedSheets,
        fileName,
        error,

        step,
        setStep,
        canCalibrate,
        canVerify,
        hasAnyVerify,
        allVerifyValid,
        canReview,
        canImport,

        calibrationMode,
        setCalibrationMode,
        sharedConfig,
        setSharedConfig,
        calibrations,
        setCalibrations,
        currentSheet,
        setCurrentSheet,
        getEffectiveConfig,
        ensureCalibrationsInitialized,
        handleApplySharedToAll,
        handleCopyCurrentToAll,
        updateSharedConfig,
        updateCurrentCalibration,

        handleFileChange,
        handleSheetToggle,
        handleVerify,
        runExtraction,

        verifyResults,
        setVerifyResults,
        activeVerifySheet,
        setActiveVerifySheet,

        extractResults,
        setExtractResults,
        activeExtractSheet,
        setActiveExtractSheet,
        hideEmptyQty,
        setHideEmptyQty,

        mappedBySheet,
        importSheets,
        effectiveImportSheet,
        mappedItems,
        matchedCount,
        activeImportSheet,
        setActiveImportSheet,

        selectedOfficeId,
        setSelectedOfficeId,
        selectedFiscalYearId,
        setSelectedFiscalYearId,
        selectedPpaId,
        setSelectedPpaId,
        selectedAipOutputId,
        setSelectedAipOutputId,
        selectedPpaFundingSourceId,
        setSelectedPpaFundingSourceId,

        officeItems,
        officeValue,
        ppasForSelection,
        ppaItems,
        ppaValue,
        fundingSourcesForSelection,
        fundingSourceItems,
        fundingSourceValue,
        outputsForSelection,
        outputItems,
        outputValue,

        showOnlyUnmapped,
        setShowOnlyUnmapped,
        showOnlyWithQty,
        setShowOnlyWithQty,
        excludeUnmapped,
        setExcludeUnmapped,
        excludeAmbiguous,
        setExcludeAmbiguous,
        excludeUnclassified,
        setExcludeUnclassified,

        importing,
        importableItems,
        unclassifiedCount,
        isUnclassified: (m: MappedItem) => isUnclassified(m),
        handleImport,

        existingCategories,
        existingCoas,
        existingMappings,
        existingPriceLists,
        existingOffices,
        fiscalYears,
        existingPpas,
        existingFundingSources,
        existingOutputs,
    };

    return (
        <ScrollArea className="h-[calc(100vh-3rem)]">
            <Head title="Price List Quantities Import" />
            <div className="flex flex-col gap-4 p-4">
                <h1 className="text-2xl font-bold">
                    Price List Quantities Import
                </h1>
                <p className="text-muted-foreground text-sm">
                    Import quantities against existing price list items from
                    XLSX.
                </p>

                <Tabs
                    value={step}
                    onValueChange={(v) => setStep(v as PliQtyStep)}
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

                    <UploadStep s={s} />
                    <CalibrateStep s={s} />
                    <VerifyStep s={s} />
                    <ReviewStep s={s} />
                    <ImportStep s={s} />
                </Tabs>
            </div>
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
