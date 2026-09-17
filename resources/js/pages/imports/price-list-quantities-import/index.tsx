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
    ExistingFundingSource,
    ExistingOffice,
    ExistingOutput,
    ExistingPpa,
    FiscalYearOption,
    MappedItem,
    PliQtyStep,
} from './types';
import { ImportPpmpCalibrateStep } from '@/components/imports/import-ppmp-calibrate-step';
import { ImportPpmpVerifyStep } from '@/components/imports/import-verify-step';
import { ImportExtractStep } from '@/components/imports/import-extract-step';
import { ReviewImportStep } from './steps/review-import-step';

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
    const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
    const [step, setStep] = useState<PliQtyStep>('upload');
    const [config, setConfig] = useState<QuantitiesSheetConfig | null>(null);
    const [extractResults, setExtractResults] = useState<
        Record<string, QuantitiesExtractResult>
    >({});
    const [ppmpExtractResults, setPpmpExtractResults] = useState<
        Record<string, PpmpExtractResult>
    >({});
    const [ppmpRawItems, setPpmpRawItems] = useState<RawPpmpItem[]>([]);
    const [rawSheets, setRawSheets] = useState<Record<string, RawSheet>>({});
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
    const [excludeUnmapped, setExcludeUnmapped] = useState(true);
    const [excludeAmbiguous, setExcludeAmbiguous] = useState(true);
    const [excludeUnclassified, setExcludeUnclassified] = useState(true);
    const [importing, setImporting] = useState(false);

    const { sheets, workbook, fileName, loading, error, handleFileChange } =
        useImportWorkbook(() => {
            setSelectedSheet(null);
            setStep('upload');
            setConfig(null);
            setPpmpExtractResults({});
            setPpmpRawItems([]);
            setRawSheets({});
            setExtractResults({});
            setVerifyResults({});
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

    const canCalibrate = selectedSheet !== null;
    const rowsCalibrated =
        !!config &&
        config.rowConfig.headerRow !== '' &&
        config.rowConfig.headerRow != null &&
        config.rowConfig.additionalItemsHeaderRow !== '' &&
        config.rowConfig.additionalItemsHeaderRow != null;
    const canVerify = canCalibrate && !!workbook && rowsCalibrated;
    const hasAnyVerify =
        selectedSheet !== null && !!verifyResults[selectedSheet];
    const allVerifyValid =
        selectedSheet !== null && !!verifyResults[selectedSheet]?.valid;
    const canReview = canVerify && hasAnyVerify && allVerifyValid;
    const canExtract = canVerify && hasAnyVerify && allVerifyValid;
    const hasAnyExtract = ppmpRawItems.length > 0;
    const canImport = Object.keys(extractResults).length > 0;

    const mappedItems = useMemo(() => {
        if (!selectedSheet) {
            return [];
        }

        const result = extractResults[selectedSheet];

        if (!result) {
            return [];
        }

        return matchQuantityItems(result.uniqueItems, existingPriceLists);
    }, [extractResults, selectedSheet, existingPriceLists]);

    const effectiveImportSheet = selectedSheet ?? '';

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
                items: importableItems.map((m) => ({
                    ppmp_price_list_id: m.priceListId,
                    qtys: m.qtys,
                })),
            } as never,
            {
                onFinish: () => setImporting(false),
            },
        );
    }

    function getEffectiveConfig(): QuantitiesSheetConfig {
        return config ?? getDefaultQuantitiesConfig();
    }

    function ensureConfigInitialized() {
        if (config) return;

        setConfig(getDefaultQuantitiesConfig());
    }

    function runExtraction() {
        if (!workbook || !selectedSheet || !allVerifyValid) {
            return;
        }

        const result = extractQuantitiesSheet(
            workbook,
            selectedSheet,
            getEffectiveConfig(),
        );

        setExtractResults({ [selectedSheet]: result });
        setStep('review');
    }

    function handleVerify() {
        setPpmpExtractResults({});
        setPpmpRawItems([]);
        if (!workbook || !selectedSheet) {
            return;
        }

        if (!config) {
            ensureConfigInitialized();
        }

        const result = verifyPpmpSheet(
            workbook,
            selectedSheet,
            getEffectiveConfig(),
        );

        setVerifyResults({
            [selectedSheet]: {
                valid: result.valid,
                message: result.message,
                errors: result.errors,
                warnings: result.warnings,
                groups: result.groups,
                details: result.details,
            },
        });
        setActiveVerifySheet(selectedSheet);
        setExtractResults({});
    }

    function handlePpmpExtract() {
        if (!workbook || !selectedSheet) return;

        const res = extractPpmpSheet(
            workbook,
            selectedSheet,
            getEffectiveConfig(),
        );

        setPpmpExtractResults({ [selectedSheet]: res });
        setPpmpRawItems(res.rawItems);
        setRawSheets(
            extractRawSheets(workbook, [selectedSheet], () =>
                getEffectiveConfig(),
            ),
        );
    }

    function handleSheetChange(sheet: string | null) {
        setSelectedSheet(sheet);
        setActiveVerifySheet(sheet ?? '');
        setPpmpExtractResults({});
        setPpmpRawItems([]);
        setRawSheets({});
        setExtractResults({});
        setVerifyResults({});
    }

    // Scope cascades: narrowing an upstream scope clears downstream picks.
    function handleOfficeChange(id: number | null) {
        setSelectedOfficeId(id);
        setSelectedPpaId(null);
        setSelectedAipOutputId(null);
        setSelectedPpaFundingSourceId(null);
    }

    function handleFiscalYearChange(id: number | null) {
        setSelectedFiscalYearId(id);
        setSelectedPpaId(null);
        setSelectedAipOutputId(null);
        setSelectedPpaFundingSourceId(null);
    }

    function handlePpaChange(id: number | null) {
        setSelectedPpaId(id);
        setSelectedAipOutputId(null);
        setSelectedPpaFundingSourceId(null);
    }

    function handleOutputChange(id: number | null) {
        setSelectedAipOutputId(id);
        setSelectedPpaFundingSourceId(null);
    }

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
                selectedSheet={selectedSheet}
                onSheetChange={handleSheetChange}
                onNext={() => {
                    ensureConfigInitialized();
                    setStep('calibrate');
                }}
            />
            <ImportPpmpCalibrateStep
                selectedSheet={selectedSheet}
                config={config}
                setConfig={setConfig}
                getDefaultConfig={getDefaultQuantitiesConfig}
                onInvalidate={() => {
                    setExtractResults({});
                    setVerifyResults({});
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
                        Runs against the selected sheet using its calibration —
                        sane ranges with procurement data, unit + COA per item
                        row, numeric quantities (amount columns skipped),
                        quantities in at least one month. Extraction stays
                        locked until the sheet passes.
                    </>
                }
                verifyButtonLabel="Verify Sheet"
                canVerify={canVerify}
                onVerify={handleVerify}
                selectedSheet={selectedSheet}
                result={
                    selectedSheet
                        ? (verifyResults[selectedSheet] ?? null)
                        : null
                }
                allValid={allVerifyValid}
                onBack={() => setStep('calibrate')}
                onNext={() => setStep('extract')}
                canNext={allVerifyValid}
                nextLabel={
                    allVerifyValid
                        ? 'Next: Extract'
                        : hasAnyVerify
                          ? 'Next: Extract (fix verification first)'
                          : 'Next: Extract (verify first)'
                }
            />
            <ImportExtractStep
                sheet={selectedSheet}
                canExtract={allVerifyValid}
                hasAnyVerify={hasAnyVerify}
                ppmpItems={ppmpRawItems}
                rawSheets={rawSheets}
                onRunExtract={handlePpmpExtract}
                onBack={() => setStep('verify')}
                backLabel="Back: Verify"
                onNext={runExtraction}
                canNext={allVerifyValid}
                nextLabel="Next: Review & Import"
            />
            <ReviewImportStep
                selectedSheet={selectedSheet}
                extractResult={
                    selectedSheet
                        ? (extractResults[selectedSheet] ?? null)
                        : null
                }
                allVerifyValid={allVerifyValid}
                canRunExtraction={canReview}
                onRunExtraction={runExtraction}
                hideEmptyQty={hideEmptyQty}
                onHideEmptyQtyChange={setHideEmptyQty}
                mappedItems={mappedItems}
                matchedCount={matchedCount}
                effectiveImportSheet={effectiveImportSheet}
                importableCount={importableItems.length}
                unclassifiedCount={unclassifiedCount}
                isUnclassified={(m) => isUnclassified(m)}
                officeItems={officeItems}
                officeValue={officeValue}
                selectedOfficeId={selectedOfficeId}
                onOfficeChange={handleOfficeChange}
                fiscalYears={fiscalYears}
                selectedFiscalYearId={selectedFiscalYearId}
                onFiscalYearChange={handleFiscalYearChange}
                ppaScopeCount={ppasForSelection.length}
                ppaItems={ppaItems}
                ppaValue={ppaValue}
                selectedPpaId={selectedPpaId}
                onPpaChange={handlePpaChange}
                ppaTotalCount={existingPpas.length}
                outputItems={outputItems}
                outputValue={outputValue}
                selectedAipOutputId={selectedAipOutputId}
                onOutputChange={handleOutputChange}
                outputScopeCount={outputsForSelection.length}
                fundingSourceItems={fundingSourceItems}
                fundingSourceValue={fundingSourceValue}
                selectedPpaFundingSourceId={selectedPpaFundingSourceId}
                onFundingSourceChange={setSelectedPpaFundingSourceId}
                fundingSourceScopeCount={fundingSourcesForSelection.length}
                showOnlyUnmapped={showOnlyUnmapped}
                onShowOnlyUnmappedChange={setShowOnlyUnmapped}
                showOnlyWithQty={showOnlyWithQty}
                onShowOnlyWithQtyChange={setShowOnlyWithQty}
                excludeUnmapped={excludeUnmapped}
                onExcludeUnmappedChange={setExcludeUnmapped}
                excludeAmbiguous={excludeAmbiguous}
                onExcludeAmbiguousChange={setExcludeAmbiguous}
                excludeUnclassified={excludeUnclassified}
                onExcludeUnclassifiedChange={setExcludeUnclassified}
                importing={importing}
                onImport={handleImport}
            />
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
