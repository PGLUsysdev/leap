// resources/js/pages/imports/aip-summary-import/index.tsx

import { useCallback, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { ImportPageShell } from '@/components/imports/import-page-shell';
import { useImportWorkbook } from '@/hooks/use-import-workbook';
import { index as importsIndex } from '@/routes/imports';
import {
    store as aipSummaryImportStore,
    storeFundingSources as aipSummaryImportStoreFundingSources,
    storeOutputs as aipSummaryImportStoreOutputs,
} from '@/routes/aip-summary-import';
import { ImportAipUploadStep } from '@/components/imports/import-aip-upload-step';
import { ImportAipCalibrateStep } from '@/components/imports/import-aip-calibrate-step';
import { ImportAipVerifyStep } from '@/components/imports/import-aip-verify-step';
import { ImportAipExtractStep } from '@/components/imports/import-aip-extract-step';
import { getDefaultAipSummaryConfig } from '@/lib/aip-summary-import/sheet-config';
import { verifyAipSummarySheet } from '@/lib/aip-summary-import/verify';
import type { AipSummaryVerifyResult } from '@/lib/aip-summary-import/verify';
import { extractAipSummaryRecords } from '@/lib/aip-summary-import/extract';
import type { AipSummaryExtractResult } from '@/lib/aip-summary-import/extract';
import { normalize } from '@/lib/ppmp/normalize';
import {
    effectiveOfficeIds,
    matchRecordOffices,
    visibleUnmatched,
} from '@/lib/aip-summary-import/match-offices';
import type {
    RecordOfficeMatch,
    TokenMapping,
} from '@/lib/aip-summary-import/match-offices';
import {
    matchRecordFunds,
    normalizeCode,
    unmatchedFundFrequency,
} from '@/lib/aip-summary-import/match-funds';
import type { RecordFundMatch } from '@/lib/aip-summary-import/match-funds';
import type {
    AipSummaryField,
    AipSummarySheetConfig,
} from '@/lib/aip-summary-import/sheet-config';
import { ImportPpaStep } from './steps/import-ppa-step';
import { ImportOutputsStep } from './steps/import-outputs-step';
import { ImportFundingStep } from './steps/import-funding-step';
import { ReviewImportStep } from './steps/review-import-step';
import type {
    CcTypology,
    ExistingFundLink,
    ExistingOutput,
    ExistingPpa,
    FiscalYear,
    FundLinkStatus,
    ImportableFundLink,
    ImportableOutput,
    ImportFund,
    ImportOffice,
    ImportStep,
    ImportTarget,
    OutputImportStatus,
    PpaBlock,
    UnmatchedFrequencyEntry,
} from './types';

interface AipSummaryImportProps {
    activeFiscalYear?: { id: number; year: number; status: string } | null;
    fiscalYears?: FiscalYear[];
    existingOffices?: ImportOffice[];
    existingPpas?: ExistingPpa[];
    existingOutputs?: ExistingOutput[];
    fundingSources?: ImportFund[];
    ccTypologies?: CcTypology[];
    existingFundLinks?: ExistingFundLink[];
}

export default function AipSummaryImport({
    activeFiscalYear = null,
    fiscalYears = [],
    existingOffices = [],
    existingPpas = [],
    existingOutputs = [],
    fundingSources = [],
    ccTypologies = [],
    existingFundLinks = [],
}: AipSummaryImportProps) {
    const [selectedSheet, setSelectedSheet] = useState<string>('');
    const [step, setStep] = useState<ImportStep>('upload');
    const [config, setConfig] = useState<AipSummarySheetConfig>(() =>
        getDefaultAipSummaryConfig(),
    );
    const [verifyResult, setVerifyResult] =
        useState<AipSummaryVerifyResult | null>(null);
    const [extractResult, setExtractResult] =
        useState<AipSummaryExtractResult | null>(null);
    const [selectedOffice, setSelectedOffice] = useState<string>('');
    const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>(
        activeFiscalYear ? String(activeFiscalYear.id) : '',
    );
    const [importing, setImporting] = useState(false);
    const [importTarget, setImportTarget] = useState<ImportTarget>('ppa');
    const [officeOverrides, setOfficeOverrides] = useState<
        Record<string, number[]>
    >({});
    const [tokenMappings, setTokenMappings] = useState<
        Record<string, TokenMapping>
    >({});
    const [dismissedTokens, setDismissedTokens] = useState<
        Record<string, string[]>
    >({});
    const [officePickerKey, setOfficePickerKey] = useState<string | null>(null);
    const [mappingTarget, setMappingTarget] = useState<{
        key: string;
        token: string;
    } | null>(null);
    const [importingOutputs, setImportingOutputs] = useState(false);
    const [fundOverrides, setFundOverrides] = useState<Record<string, number>>(
        {},
    );
    const [dismissedFunds, setDismissedFunds] = useState<
        Record<string, boolean>
    >({});
    const [fundPickerKey, setFundPickerKey] = useState<string | null>(null);
    const [bulkFundToken, setBulkFundToken] = useState<string | null>(null);
    const [importingFunds, setImportingFunds] = useState(false);

    const { sheets, workbook, fileName, loading, error, handleFileChange } =
        useImportWorkbook(() => {
            resetFundMapping();
            setSelectedSheet('');
            setConfig(getDefaultAipSummaryConfig());
            setVerifyResult(null);
            setExtractResult(null);
            setOfficeOverrides({});
            setTokenMappings({});
            setDismissedTokens({});
            setOfficePickerKey(null);
            setMappingTarget(null);
            setStep('upload');
        });

    const canCalibrate = selectedSheet !== '';
    const canVerify = canCalibrate && config.headerRow !== '';
    const canExtract = verifyResult?.valid === true && canVerify;
    const canImportPpa =
        canExtract &&
        extractResult !== null &&
        extractResult.records.length > 0;

    function resetOfficeMapping() {
        setOfficeOverrides({});
        setTokenMappings({});
        setDismissedTokens({});
        setOfficePickerKey(null);
        setMappingTarget(null);
    }

    function resetFundMapping() {
        setFundOverrides({});
        setDismissedFunds({});
        setFundPickerKey(null);
        setBulkFundToken(null);
    }

    function handleSheetChange(sheet: string) {
        setSelectedSheet(sheet);
        setVerifyResult(null);
        setExtractResult(null);
        resetOfficeMapping();
        resetFundMapping();
    }

    function updateColumn(field: AipSummaryField, letter: string) {
        setConfig((prev) => ({
            ...prev,
            columnConfig: { ...prev.columnConfig, [field]: letter },
        }));
        setVerifyResult(null);
        setExtractResult(null);
        resetOfficeMapping();
        resetFundMapping();
    }

    function updateHeaderRow(v: string) {
        setConfig((prev) => ({
            ...prev,
            headerRow: v === '' ? '' : Number(v),
        }));
        setVerifyResult(null);
        setExtractResult(null);
        resetOfficeMapping();
        resetFundMapping();
    }

    function updateHasNumberRow(v: boolean) {
        setConfig((prev) => ({ ...prev, hasNumberRow: v }));
        setVerifyResult(null);
        setExtractResult(null);
        resetOfficeMapping();
        resetFundMapping();
    }

    function handleResetDefaults() {
        setConfig(getDefaultAipSummaryConfig());
        setVerifyResult(null);
        setExtractResult(null);
        resetOfficeMapping();
        resetFundMapping();
    }

    function handleVerify() {
        if (!workbook || !canVerify) {
            return;
        }

        setVerifyResult(verifyAipSummarySheet(workbook, selectedSheet, config));
        setExtractResult(null);
    }

    function handleExtract() {
        if (!workbook || !canExtract || config.headerRow === '') {
            return;
        }

        const ws = workbook.getWorksheet(selectedSheet);

        if (!ws) {
            return;
        }

        setExtractResult(
            extractAipSummaryRecords(ws, { ...config, headerRow: config.headerRow }),
        );
    }

    const selectedOfficeLabel = useMemo(() => {
        const found = existingOffices.find(
            (o) => String(o.id) === selectedOffice,
        );

        return found ? found.acronym || found.name : '';
    }, [existingOffices, selectedOffice]);

    const selectedFiscalYearLabel = useMemo(() => {
        const found = fiscalYears.find(
            (fy) => String(fy.id) === selectedFiscalYear,
        );

        return found ? String(found.year) : '';
    }, [fiscalYears, selectedFiscalYear]);

    const blocksForImport = useMemo<PpaBlock[]>(() => {
        if (!extractResult || !selectedOffice || !selectedFiscalYear) {
            return [];
        }

        const officeId = Number(selectedOffice);
        const fiscalYearId = Number(selectedFiscalYear);
        const existingByCode = new Map<string, true>();

        for (const ppa of existingPpas) {
            if (
                ppa.office_id === officeId &&
                ppa.fiscal_year_id === fiscalYearId
            ) {
                existingByCode.set(normalize(ppa.full_code), true);
            }
        }

        const seen = new Map<string, PpaBlock>();

        for (const record of extractResult.records) {
            let block = seen.get(record.fullCode);

            if (!block) {
                block = {
                    fullCode: record.fullCode,
                    name: record.name,
                    type: record.type,
                    rows: [],
                    status: existingByCode.has(
                        normalize(record.fullCode),
                    )
                        ? 'exists'
                        : 'new',
                };
                seen.set(record.fullCode, block);
            }

            block.rows.push(record.row);
        }

        return [...seen.values()];
    }, [extractResult, selectedOffice, selectedFiscalYear, existingPpas]);

    const newBlocks = useMemo(
        () => blocksForImport.filter((b) => b.status === 'new'),
        [blocksForImport],
    );

    function handleConfirmImport() {
        if (
            !selectedOffice ||
            !selectedFiscalYear ||
            newBlocks.length === 0 ||
            importing
        ) {
            return;
        }

        setImporting(true);
        router.post(
            aipSummaryImportStore().url as never,
            {
                office_id: Number(selectedOffice),
                fiscal_year_id: Number(selectedFiscalYear),
                blocks: newBlocks.map((b) => ({
                    full_code: b.fullCode,
                    name: b.name,
                    type: b.type,
                })),
            } as never,
            {
                onFinish: () => setImporting(false),
            },
        );
    }

    const officeMatches = useMemo(() => {
        const next = new Map<string, RecordOfficeMatch>();

        if (!extractResult) {
            return next;
        }

        for (const record of extractResult.records) {
            next.set(
                record.key,
                matchRecordOffices(record.key, record.offices, existingOffices),
            );
        }

        return next;
    }, [extractResult, existingOffices]);

    const unmatchedFrequency = useMemo<UnmatchedFrequencyEntry[]>(() => {
        const counts = new Map<string, { token: string; count: number }>();

        for (const match of officeMatches.values()) {
            const visible = visibleUnmatched(
                match,
                tokenMappings[match.key] ?? {},
                dismissedTokens[match.key] ?? [],
            );

            for (const token of visible) {
                const key = normalize(token);
                const entry = counts.get(key);

                if (entry) {
                    entry.count++;
                } else {
                    counts.set(key, { token, count: 1 });
                }
            }
        }

        return [...counts.values()].sort((a, b) => b.count - a.count);
    }, [officeMatches, tokenMappings, dismissedTokens]);

    const officeIdsForRecord = useCallback(
        (key: string): number[] =>
            effectiveOfficeIds(
                officeMatches.get(key),
                officeOverrides[key],
                tokenMappings[key] ?? {},
            ),
        [officeMatches, officeOverrides, tokenMappings],
    );

    function setTokenMapping(
        key: string,
        token: string,
        officeId: number | null,
    ) {
        setTokenMappings((prev) => {
            const current = { ...(prev[key] ?? {}) };

            if (officeId === null) {
                delete current[token];
            } else {
                current[token] = officeId;
            }

            return { ...prev, [key]: current };
        });
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

    const importableOutputs = useMemo<ImportableOutput[]>(() => {
        if (!extractResult || !selectedOffice || !selectedFiscalYear) {
            return [];
        }

        return extractResult.records.map((record) => ({
            key: record.key,
            full_code: record.fullCode,
            fullCodeNorm: normalize(record.fullCode),
            outputNorm:
                record.expectedOutput === null
                    ? null
                    : normalize(record.expectedOutput),
            name: record.name,
            expected_output: record.expectedOutput,
            start_date: record.startDate,
            end_date: record.endDate,
            office_ids: officeIdsForRecord(record.key),
        }));
    }, [
        extractResult,
        selectedOffice,
        selectedFiscalYear,
        officeIdsForRecord,
    ]);

    const outputStatuses = useMemo(() => {
        const next = new Map<string, OutputImportStatus>();

        if (
            !extractResult ||
            !selectedOffice ||
            !selectedFiscalYear ||
            importableOutputs.length === 0
        ) {
            return next;
        }

        const officeId = Number(selectedOffice);
        const fiscalYearId = Number(selectedFiscalYear);
        const ppasByName = new Map<string, ExistingPpa[]>();

        for (const ppa of existingPpas) {
            if (
                ppa.office_id !== officeId ||
                ppa.fiscal_year_id !== fiscalYearId
            ) {
                continue;
            }

            const key = normalize(ppa.name);
            const list = ppasByName.get(key) ?? [];
            list.push(ppa);
            ppasByName.set(key, list);
        }

        for (const item of importableOutputs) {
            const candidates = ppasByName.get(normalize(item.name)) ?? [];

            if (candidates.length === 0) {
                next.set(item.key, 'no-ppa');

                continue;
            }

            let pool = candidates;

            if (pool.length > 1) {
                const byCode = pool.filter(
                    (ppa) => normalize(ppa.full_code) === item.fullCodeNorm,
                );

                if (byCode.length === 1) {
                    pool = byCode;
                }
            }

            if (pool.length > 1) {
                next.set(item.key, 'no-ppa');

                continue;
            }

            const ppa = pool[0];
            const exists = existingOutputs.some(
                (o) =>
                    o.ppa_id === ppa.id &&
                    (o.expected_output ?? null) === item.expected_output,
            );

            if (exists) {
                next.set(item.key, 'exists');
            } else if (item.office_ids.length === 0) {
                next.set(item.key, 'no-offices');
            } else {
                next.set(item.key, 'new');
            }
        }

        return next;
    }, [
        extractResult,
        selectedOffice,
        selectedFiscalYear,
        importableOutputs,
        existingPpas,
        existingOutputs,
    ]);

    const newOutputs = useMemo(
        () =>
            importableOutputs.filter((o) => {
                const status = outputStatuses.get(o.key);

                return status === 'new' || status === 'no-offices';
            }),
        [importableOutputs, outputStatuses],
    );

    function handleConfirmOutputs() {
        if (
            !selectedOffice ||
            !selectedFiscalYear ||
            newOutputs.length === 0 ||
            importingOutputs
        ) {
            return;
        }

        setImportingOutputs(true);
        router.post(
            aipSummaryImportStoreOutputs().url as never,
            {
                office_id: Number(selectedOffice),
                fiscal_year_id: Number(selectedFiscalYear),
                outputs: newOutputs.map((o) => ({
                    full_code: o.full_code,
                    name: o.name,
                    expected_output: o.expected_output,
                    start_date: o.start_date,
                    end_date: o.end_date,
                    office_ids: o.office_ids,
                })),
            } as never,
            {
                onFinish: () => setImportingOutputs(false),
            },
        );
    }

    const fundMatches = useMemo(() => {
        const next = new Map<string, RecordFundMatch>();

        if (!extractResult) {
            return next;
        }

        for (const record of extractResult.records) {
            next.set(
                record.key,
                matchRecordFunds(
                    record.key,
                    record.fundingSource,
                    record.typology,
                    fundingSources,
                    ccTypologies,
                ),
            );
        }

        return next;
    }, [extractResult, fundingSources, ccTypologies]);

    const unmatchedFundEntries = useMemo<UnmatchedFrequencyEntry[]>(
        () =>
            unmatchedFundFrequency(
                [...fundMatches.values()].filter(
                    (m) =>
                        !dismissedFunds[m.key] &&
                        fundOverrides[m.key] === undefined,
                ),
            ),
        [fundMatches, dismissedFunds, fundOverrides],
    );

    const fundIdForRecord = useCallback(
        (key: string): number | null =>
            fundOverrides[key] ?? fundMatches.get(key)?.fund?.id ?? null,
        [fundOverrides, fundMatches],
    );

    function handleBulkFundMap(fundId: number) {
        if (bulkFundToken === null || !extractResult) {
            return;
        }

        const tokenKey = normalizeCode(bulkFundToken);

        setFundOverrides((prev) => {
            const next = { ...prev };

            for (const record of extractResult.records) {
                if (
                    record.fundingSource != null &&
                    normalizeCode(record.fundingSource) === tokenKey &&
                    next[record.key] === undefined &&
                    !dismissedFunds[record.key]
                ) {
                    next[record.key] = fundId;
                }
            }

            return next;
        });
        setBulkFundToken(null);
    }

    /** PPA resolution shared by fund link matching (mirrors outputs). */
    const resolvePpaForRecord = useCallback(
        (name: string, fullCodeNorm: string): ExistingPpa | null => {
            const officeId = Number(selectedOffice);
            const fiscalYearId = Number(selectedFiscalYear);
            const candidates = existingPpas.filter(
                (ppa) =>
                    ppa.office_id === officeId &&
                    ppa.fiscal_year_id === fiscalYearId &&
                    normalize(ppa.name) === normalize(name),
            );

            if (candidates.length === 0) {
                return null;
            }

            let pool = candidates;

            if (pool.length > 1) {
                const byCode = pool.filter(
                    (ppa) => normalize(ppa.full_code) === fullCodeNorm,
                );

                if (byCode.length === 1) {
                    pool = byCode;
                }
            }

            return pool.length === 1 ? pool[0] : null;
        },
        [existingPpas, selectedOffice, selectedFiscalYear],
    );

    const importableFunds = useMemo<ImportableFundLink[]>(() => {
        if (!extractResult || !selectedOffice || !selectedFiscalYear) {
            return [];
        }

        const out: ImportableFundLink[] = [];

        for (const record of extractResult.records) {
            if (record.fundingSource == null || dismissedFunds[record.key]) {
                continue;
            }

            const fundingSourceId = fundIdForRecord(record.key);

            if (fundingSourceId === null) {
                continue;
            }

            const toNumber = (v: string | null): number | null => {
                if (v == null || v.trim() === '') {
                    return null;
                }

                const n = Number(v);

                return Number.isFinite(n) ? n : null;
            };

            out.push({
                key: record.key,
                full_code: record.fullCode,
                fullCodeNorm: normalize(record.fullCode),
                outputNorm:
                    record.expectedOutput === null
                        ? null
                        : normalize(record.expectedOutput),
                name: record.name,
                expected_output: record.expectedOutput,
                funding_source_id: fundingSourceId,
                ccet_adaptation: toNumber(record.adaptation) ?? 0,
                ccet_mitigation: toNumber(record.mitigation) ?? 0,
                cc_typology_id:
                    fundMatches.get(record.key)?.typology?.id ?? null,
            });
        }

        return out;
    }, [
        extractResult,
        selectedOffice,
        selectedFiscalYear,
        dismissedFunds,
        fundIdForRecord,
        fundMatches,
    ]);

    const fundStatuses = useMemo(() => {
        const next = new Map<string, FundLinkStatus>();

        if (
            !extractResult ||
            !selectedOffice ||
            !selectedFiscalYear ||
            importableFunds.length === 0
        ) {
            return next;
        }

        for (const item of importableFunds) {
            const ppa = resolvePpaForRecord(item.name, item.fullCodeNorm);

            if (!ppa) {
                next.set(item.key, 'no-output');

                continue;
            }

            const output = existingOutputs.find(
                (o) =>
                    o.ppa_id === ppa.id &&
                    (o.expected_output ?? null) === item.expected_output,
            );

            if (!output) {
                next.set(item.key, 'no-output');

                continue;
            }

            const exists = existingFundLinks.some(
                (l) =>
                    l.output_id === output.id &&
                    l.funding_source_id === item.funding_source_id,
            );

            next.set(item.key, exists ? 'exists' : 'new');
        }

        return next;
    }, [
        extractResult,
        selectedOffice,
        selectedFiscalYear,
        importableFunds,
        resolvePpaForRecord,
        existingOutputs,
        existingFundLinks,
    ]);

    const newFunds = useMemo(
        () => importableFunds.filter((f) => fundStatuses.get(f.key) === 'new'),
        [importableFunds, fundStatuses],
    );

    function goToImport(t: ImportTarget) {
        setImportTarget(t);
        setStep('review');
    }

    function handleConfirmFunds() {
        if (
            !selectedOffice ||
            !selectedFiscalYear ||
            newFunds.length === 0 ||
            importingFunds
        ) {
            return;
        }

        setImportingFunds(true);
        router.post(
            aipSummaryImportStoreFundingSources().url as never,
            {
                office_id: Number(selectedOffice),
                fiscal_year_id: Number(selectedFiscalYear),
                links: newFunds.map((f) => ({
                    full_code: f.full_code,
                    name: f.name,
                    expected_output: f.expected_output,
                    funding_source_id: f.funding_source_id,
                    ccet_adaptation: f.ccet_adaptation,
                    ccet_mitigation: f.ccet_mitigation,
                    cc_typology_id: f.cc_typology_id,
                })),
            } as never,
            {
                onFinish: () => setImportingFunds(false),
            },
        );
    }

    return (
        <ImportPageShell
            title="AIP Summary Import"
            description="Import AIP Summary from XLSX. Upload a workbook and pick a sheet."
            fileName={fileName}
            loading={loading}
            step={step}
            onStepChange={(v) => setStep(v as ImportStep)}
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
                    disabled: !canImportPpa,
                },
            ]}
        >
            <ImportAipUploadStep
                error={error}
                loading={loading}
                onFileChange={handleFileChange}
                sheets={sheets}
                selectedSheet={selectedSheet}
                onSheetChange={handleSheetChange}
                canCalibrate={canCalibrate}
                onNext={() => setStep('calibrate')}
            />
            <ImportAipCalibrateStep
                config={config}
                selectedSheet={selectedSheet}
                canVerify={canVerify}
                onHeaderRowChange={updateHeaderRow}
                onHasNumberRowChange={updateHasNumberRow}
                onColumnChange={updateColumn}
                onResetDefaults={handleResetDefaults}
                onBack={() => setStep('upload')}
                onNext={() => setStep('verify')}
            />
            <ImportAipVerifyStep
                selectedSheet={selectedSheet}
                config={config}
                canVerify={canVerify}
                verifyResult={verifyResult}
                canExtract={canExtract}
                onVerify={handleVerify}
                onBack={() => setStep('calibrate')}
                onNext={() => setStep('extract')}
            />
            <ImportAipExtractStep
                selectedSheet={selectedSheet}
                canExtract={canExtract}
                extractResult={extractResult}
                canImportPpa={canImportPpa}
                onExtract={handleExtract}
                onImportPpa={() => goToImport('ppa')}
                onImportOutputs={() => goToImport('outputs')}
                onImportFunding={() => goToImport('funding')}
                onBack={() => setStep('verify')}
            />
            <ReviewImportStep
                target={importTarget}
                onTargetChange={setImportTarget}
                ppaContent={
                    <ImportPpaStep
                        tabsValue="ppa"
                        selectedSheet={selectedSheet}
                        existingOffices={existingOffices}
                        fiscalYears={fiscalYears}
                        selectedOffice={selectedOffice}
                        onOfficeChange={setSelectedOffice}
                        selectedOfficeLabel={selectedOfficeLabel}
                        selectedFiscalYear={selectedFiscalYear}
                        onFiscalYearChange={setSelectedFiscalYear}
                        selectedFiscalYearLabel={selectedFiscalYearLabel}
                        blocksForImport={blocksForImport}
                        newBlocks={newBlocks}
                        importing={importing}
                        onConfirm={handleConfirmImport}
                        onBack={() => setStep('extract')}
                    />
                }
                outputsContent={
                    <ImportOutputsStep
                        tabsValue="outputs"
                        selectedSheet={selectedSheet}
                        existingOffices={existingOffices}
                        fiscalYears={fiscalYears}
                        selectedOffice={selectedOffice}
                        onOfficeChange={setSelectedOffice}
                        selectedOfficeLabel={selectedOfficeLabel}
                        selectedFiscalYear={selectedFiscalYear}
                        onFiscalYearChange={setSelectedFiscalYear}
                        selectedFiscalYearLabel={selectedFiscalYearLabel}
                        records={extractResult?.records ?? []}
                        outputStatuses={outputStatuses}
                        newOutputs={newOutputs}
                        officeMatches={officeMatches}
                        officeOverrides={officeOverrides}
                        setOfficeOverrides={setOfficeOverrides}
                        tokenMappings={tokenMappings}
                        dismissedTokens={dismissedTokens}
                        setDismissedTokens={setDismissedTokens}
                        unmatchedFrequency={unmatchedFrequency}
                        officeIdsForRecord={officeIdsForRecord}
                        setTokenMapping={setTokenMapping}
                        resetRowOffices={resetRowOffices}
                        officePickerKey={officePickerKey}
                        setOfficePickerKey={setOfficePickerKey}
                        mappingTarget={mappingTarget}
                        setMappingTarget={setMappingTarget}
                        importingOutputs={importingOutputs}
                        onConfirm={handleConfirmOutputs}
                        onBack={() => setStep('extract')}
                    />
                }
                fundingContent={
                    <ImportFundingStep
                        tabsValue="funding"
                        selectedSheet={selectedSheet}
                        selectedOffice={selectedOffice}
                        selectedFiscalYear={selectedFiscalYear}
                        existingOffices={existingOffices}
                        fiscalYears={fiscalYears}
                        selectedOfficeLabel={selectedOfficeLabel}
                        selectedFiscalYearLabel={selectedFiscalYearLabel}
                        onOfficeChange={setSelectedOffice}
                        onFiscalYearChange={setSelectedFiscalYear}
                        fundingSources={fundingSources}
                        records={extractResult?.records ?? []}
                        fundMatches={fundMatches}
                        fundOverrides={fundOverrides}
                        setFundOverrides={setFundOverrides}
                        dismissedFunds={dismissedFunds}
                        setDismissedFunds={setDismissedFunds}
                        importableFunds={importableFunds}
                        fundStatuses={fundStatuses}
                        newFunds={newFunds}
                        unmatchedFundEntries={unmatchedFundEntries}
                fundIdForRecord={fundIdForRecord}
                fundPickerKey={fundPickerKey}
                setFundPickerKey={setFundPickerKey}
                bulkFundToken={bulkFundToken}
                setBulkFundToken={setBulkFundToken}
                onBulkConfirm={handleBulkFundMap}
                importingFunds={importingFunds}
                        onConfirm={handleConfirmFunds}
                        onBack={() => setStep('extract')}
                    />
                }
            />
        </ImportPageShell>
    );
}

AipSummaryImport.layout = {
    breadcrumbs: [
        { title: 'Imports', href: importsIndex().url },
        { title: 'AIP Summary Import', href: '/imports/aip-summary-import' },
    ],
};
