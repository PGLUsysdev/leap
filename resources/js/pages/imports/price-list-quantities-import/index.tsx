// resources/js/pages/imports/price-list-quantities-import/index.tsx

import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { ImportPageShell } from '@/components/imports/import-page-shell';
import { ImportUploadStep } from '@/components/imports/import-upload-step';
import { useImportWorkbook } from '@/hooks/use-import-workbook';
import { getDefaultQuantitiesConfig } from '@/lib/ppmp/sheet-config';
import {
    extractPpmpSheet,
    type PpmpExtractResult,
    type RawPpmpItem,
} from '@/lib/ppmp/extract';
import { extractRawSheets, type RawSheet } from '@/lib/raw-extract';
import type { QuantitiesSheetConfig } from '@/lib/ppmp/sheet-config';
import { extractQuantitiesSheet } from '@/lib/ppmp/quantities-extract';
import type { QuantitiesExtractResult } from '@/lib/ppmp/quantities-extract';
import type { PpmpVerifyResult } from '@/lib/ppmp/verify';
import { verifyPpmpSheet } from '@/lib/ppmp/verify';
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
import { ImportPpmpCalibrateStep } from '@/components/imports/import-ppmp-calibrate-step';
import { ImportPpmpVerifyStep } from '@/components/imports/import-verify-step';
import { ImportExtractStep } from '@/components/imports/import-extract-step';
import { ReviewAndImport } from './steps/review-import-step';

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
    const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
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
    const [ppmpExtractResults, setPpmpExtractResults] = useState<
        Record<string, PpmpExtractResult>
    >({});
    const [ppmpRawItems, setPpmpRawItems] = useState<RawPpmpItem[]>([]);
    const [rawSheets, setRawSheets] = useState<Record<string, RawSheet>>({});
    const [activeExtractSheet, setActiveExtractSheet] = useState<string>('');
    const [verifyResults, setVerifyResults] = useState<
        Record<string, PpmpVerifyResult>
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
    const [activeImportSheet, setActiveImportSheet] = useState<string>('');
    const [excludeUnmapped, setExcludeUnmapped] = useState(true);
    const [excludeAmbiguous, setExcludeAmbiguous] = useState(true);
    const [excludeUnclassified, setExcludeUnclassified] = useState(true);
    const [importing, setImporting] = useState(false);

    const { sheets, workbook, fileName, loading, error, handleFileChange } =
        useImportWorkbook(() => {
            setSelectedSheets([]);
            setStep('upload');
            setSharedConfig(null);
            setCalibrations({});
            setCurrentSheet('');
            setPpmpExtractResults({});
            setPpmpRawItems([]);
            setRawSheets({});
            setExtractResults({});
            setVerifyResults({});
            setActiveExtractSheet('');
            setActiveVerifySheet('');
        });

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
    const rowsCalibrated =
        !!sharedConfig &&
        sharedConfig.rowConfig.headerRow !== '' &&
        sharedConfig.rowConfig.headerRow != null &&
        sharedConfig.rowConfig.additionalItemsHeaderRow !== '' &&
        sharedConfig.rowConfig.additionalItemsHeaderRow != null &&
        sharedConfig.rowConfig.nonProcurementHeaderRow !== '' &&
        sharedConfig.rowConfig.nonProcurementHeaderRow != null;
    const canVerify = canCalibrate && !!workbook && rowsCalibrated;
    const hasAnyVerify = selectedSheets.some((s) => !!verifyResults[s]);
    const allVerifyValid =
        selectedSheets.length > 0 &&
        selectedSheets.every((s) => verifyResults[s]?.valid);
    const canReview = canVerify && hasAnyVerify && allVerifyValid;
    const canExtract = canVerify && hasAnyVerify && allVerifyValid;
    const hasAnyExtract = ppmpRawItems.length > 0;
    const canImport = Object.keys(extractResults).length > 0;

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
            '/imports/price-list-quantities-import' as never,
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
        setPpmpExtractResults({});
        setPpmpRawItems([]);
        if (!workbook || selectedSheets.length === 0) {
            return;
        }

        if (!sharedConfig) {
            ensureCalibrationsInitialized();
        }

        const flatSheets = (selectedSheets as unknown[])
            .flat(Infinity)
            .map((s) => String(s).trim())
            .filter(Boolean) as string[];
        console.log(
            '[verify] selectedSheets raw:',
            selectedSheets,
            'flatSheets:',
            flatSheets,
        );
        if (flatSheets.length !== selectedSheets.length) {
            console.warn(
                '[verify] flattened nested',
                selectedSheets,
                '→',
                flatSheets,
            );
            setSelectedSheets(flatSheets);
        }

        const availableNames = workbook
            ? workbook.worksheets.map((ws) => ws.name)
            : sheets;
        const missing = flatSheets.filter((s) => !availableNames.includes(s));
        if (missing.length > 0) {
            console.warn(
                '[verify] stale selectedSheets:',
                flatSheets,
                'available:',
                availableNames,
                'missing:',
                missing,
            );
        }

        const next: Record<string, PpmpVerifyResult> = {};

        for (const sheet of flatSheets) {
            const result = verifyPpmpSheet(
                workbook,
                sheet,
                getEffectiveConfig(sheet),
            );
            next[sheet] = {
                valid: result.valid,
                message: result.message,
                errors: result.errors,
                warnings: result.warnings,
                groups: result.groups,
                details: result.details,
            };
        }

        setVerifyResults(next);
        const firstInvalid = flatSheets.find((s) => !next[s]?.valid);
        setActiveVerifySheet(firstInvalid ?? flatSheets[0] ?? '');
        setExtractResults({});
        setActiveExtractSheet('');
    }

    function handlePpmpExtract() {
        if (!workbook || selectedSheets.length === 0) return;
        const flatSheets = (selectedSheets as unknown[])
            .flat(Infinity)
            .map((s) => String(s).trim())
            .filter(Boolean) as string[];
        const next: Record<string, PpmpExtractResult> = {};
        const allRaw: RawPpmpItem[] = [];
        for (const sheet of flatSheets) {
            const cfg = getEffectiveConfig(sheet);
            const res = extractPpmpSheet(workbook, sheet, cfg);
            next[sheet] = res;
            allRaw.push(...res.rawItems);
        }
        setPpmpExtractResults(next);
        setPpmpRawItems(allRaw);
        setRawSheets(
            extractRawSheets(workbook, flatSheets, (s) =>
                getEffectiveConfig(s),
            ),
        );
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
        setPpmpExtractResults({});
        setPpmpRawItems([]);
        setRawSheets({});
        setExtractResults({});
        setVerifyResults({});
        setActiveExtractSheet('');
        setActiveVerifySheet('');
    }

    /**
     * Single-sheet mode: the shared picker emits `[picked]` or `[]`.
     * Deselect anything else, then select the picked sheet. The page's
     * `handleSheetToggle` resets downstream results on each call.
     */
    function handleSheetsChange(next: unknown) {
        console.log(
            '[price-list-quantities handleSheetsChange] raw next:',
            next,
            'selectedSheets before:',
            selectedSheets,
        );
        const flat = (
            Array.isArray(next) ? (next as unknown[]).flat(Infinity) : []
        )
            .map((s) => String(s).trim())
            .filter(Boolean) as string[];
        console.log('[price-list-quantities handleSheetsChange] flat:', flat);
        const picked = flat[0] ?? '';

        for (const sheet of selectedSheets) {
            if (sheet !== picked) {
                handleSheetToggle(String(sheet));
            }
        }

        if (picked && !selectedSheets.includes(picked)) {
            handleSheetToggle(picked);
        }
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
        canExtract,
        hasAnyExtract,
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
        ppmpExtractResults,
        setPpmpExtractResults,
        ppmpRawItems,
        setPpmpRawItems,
        rawSheets,
        setRawSheets,
        handlePpmpExtract,
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
        <ImportPageShell
            title="Price List Quantities Import"
            description="Import quantities against existing price list items from XLSX."
            fileName={fileName}
            loading={loading}
            step={step}
            onStepChange={(v) => setStep(v as PliQtyStep)}
            tabs={[
                { value: 'upload', label: '1. Upload' },
                {
                    value: 'calibrate',
                    label: '2. Calibrate',
                    disabled: !canCalibrate,
                },
                {
                    value: 'verify',
                    label: '3. Verify',
                    disabled: !canVerify,
                },
                {
                    value: 'extract',
                    label: '4. Extract',
                    disabled: !canExtract,
                },
                {
                    value: 'review',
                    label: '5. Review & Import',
                    disabled: !canReview || !hasAnyExtract,
                },
            ]}
        >
            <ImportUploadStep
                fileInputId="price-list-quantities-file"
                fileLabel="Excel File (.xlsx only)"
                fileDescription="Select a PPMP workbook (.xlsx)."
                error={error}
                loading={loading}
                onFileChange={handleFileChange}
                sheets={sheets}
                selectedSheets={selectedSheets}
                onSheetsChange={handleSheetsChange}
                onNext={() => {
                    ensureCalibrationsInitialized();
                    setStep('calibrate');
                }}
                nextDisabled={!canCalibrate}
            />
            <ImportPpmpCalibrateStep
                calibrationMode={calibrationMode}
                setCalibrationMode={setCalibrationMode}
                sharedConfig={sharedConfig}
                setSharedConfig={setSharedConfig}
                calibrations={calibrations}
                setCalibrations={setCalibrations}
                currentSheet={currentSheet}
                setCurrentSheet={setCurrentSheet}
                selectedSheets={selectedSheets}
                getDefaultConfig={getDefaultQuantitiesConfig}
                onInvalidate={() => {
                    setExtractResults({});
                    setVerifyResults({});
                    setActiveExtractSheet('');
                    setActiveVerifySheet('');
                }}
                showQtyStart
                onBack={() => setStep('upload')}
                onNext={() => setStep('verify')}
                canNext={canVerify}
                nextLabel="Next: Verify Format"
            />
            <ImportPpmpVerifyStep
                tabsValue="verify"
                title="Verify quantities format per sheet"
                description={
                    <>
                        Runs against each selected sheet (
                        {selectedSheets.length}) using its calibration — sane
                        ranges with procurement data, unit + COA per item row,
                        numeric quantities (amount columns skipped), quantities
                        in at least one month. Extraction stays locked until
                        every sheet passes.
                    </>
                }
                verifyButtonLabel={`Run Verify (${selectedSheets.length} sheets)`}
                canVerify={canVerify}
                onVerify={handleVerify}
                selectedSheets={selectedSheets}
                results={verifyResults}
                hasResult={hasAnyVerify}
                allValid={allVerifyValid}
                activeSheet={activeVerifySheet}
                onActiveChange={setActiveVerifySheet}
                onBack={() => setStep('calibrate')}
                onNext={() => setStep('extract')}
                canNext={allVerifyValid}
                nextLabel="Next: Extract"
            />
            <ImportExtractStep
                sheets={selectedSheets}
                canExtract={canExtract}
                hasAnyVerify={hasAnyVerify}
                allVerifyValid={allVerifyValid}
                ppmpItems={ppmpRawItems}
                rawSheets={rawSheets}
                onRunExtract={handlePpmpExtract}
                onBack={() => setStep('verify')}
                backLabel="Back: Verify"
                onNext={() => setStep('review')}
                canNext={
                    (rawSheets && Object.keys(rawSheets).length > 0) ||
                    hasAnyExtract
                }
                nextLabel="Next: Review"
            />
            <ReviewAndImport s={s} />
        </ImportPageShell>
    );
}

PriceListQuantitiesImport.layout = {
    breadcrumbs: [
        { title: 'Imports', href: '/imports' },
        {
            title: 'Price List Quantities Import',
            href: '/imports/price-list-quantities-import',
        },
    ],
};
