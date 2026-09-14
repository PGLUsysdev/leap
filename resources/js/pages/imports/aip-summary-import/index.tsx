import { router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { ImportPageShell } from '@/components/imports/import-page-shell';
import { useImportWorkbook } from '@/hooks/use-import-workbook';
import type {
    AipSummaryField,
    AipSummarySheetConfig,
} from '@/lib/aip-summary-import/sheet-config';
import { getDefaultAipSummaryConfig } from '@/lib/aip-summary-import/sheet-config';
import type { AipSummaryVerifyResult } from '@/lib/aip-summary-import/verify';
import {
    extractAipSummaryRows,
    verifyAipSummarySheet,
} from '@/lib/aip-summary-import/verify';
import type { AipSummaryExtractResult } from '@/lib/aip-summary-import/extract';
import { extractAipSummaryRecords } from '@/lib/aip-summary-import/extract';
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

import type { AipImportState, ImportStep, PpaBlock } from './types';
import { UploadStep } from './steps/upload-step';
import { CalibrateStep } from './steps/calibrate-step';
import { VerifyStep } from './steps/verify-step';
import { ExtractStep } from './steps/extract-step';
import { ReviewAndImport } from './steps/review-import-step';

export default function AipSummaryImport() {
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

    const [selectedSheet, setSelectedSheet] = useState<string>('');
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
    const [importTarget, setImportTarget] = useState<
        'ppa' | 'outputs' | 'funding'
    >('ppa');
    const [selectedOffice, setSelectedOffice] = useState<string>(
        auth.user.office_id?.toString() || '',
    );
    const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>(
        activeFiscalYear?.id.toString() || '',
    );
    const [officeOverrides, setOfficeOverrides] = useState<
        Record<string, number[]>
    >({});
    const [officePickerKey, setOfficePickerKey] = useState<string | null>(null);
    const [tokenMappings, setTokenMappings] = useState<
        Record<string, TokenMapping>
    >({});
    const [dismissedTokens, setDismissedTokens] = useState<
        Record<string, string[]>
    >({});
    const [mappingTarget, setMappingTarget] = useState<{
        key: string;
        token: string;
    } | null>(null);
    const [fundOverrides, setFundOverrides] = useState<Record<string, number>>(
        {},
    );
    const [dismissedFunds, setDismissedFunds] = useState<
        Record<string, boolean>
    >({});
    const [fundPickerKey, setFundPickerKey] = useState<string | null>(null);
    const [importingOutputs, setImportingOutputs] = useState(false);
    const [importingFunds, setImportingFunds] = useState(false);

    const { sheets, workbook, fileName, loading, error, handleFileChange } =
        useImportWorkbook(() => {
            setSelectedSheet('');
            setStep('upload');
            setVerifyResult(null);
            setExtractResult(null);
            setOfficeOverrides({});
            setOfficePickerKey(null);
            setTokenMappings({});
            setDismissedTokens({});
            setMappingTarget(null);
            setFundOverrides({});
            setDismissedFunds({});
            setFundPickerKey(null);
        });

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
        setStep('review');
    }

    const selectedOfficeLabel = useMemo(() => {
        const office = existingOffices.find(
            (o) => o.id.toString() === selectedOffice,
        );

        return office?.acronym?.trim() || office?.name || '';
    }, [existingOffices, selectedOffice]);

    const selectedFiscalYearLabel = useMemo(() => {
        const fy = fiscalYears.find(
            (f) => f.id.toString() === selectedFiscalYear,
        );

        return fy ? String(fy.year) : '';
    }, [fiscalYears, selectedFiscalYear]);

    const officeMatches = useMemo(() => {
        if (!extractResult) return new Map<string, RecordOfficeMatch>();

        return new Map(
            extractResult.records.map((record) => [
                record.key,
                matchRecordOffices(record.key, record.offices, existingOffices),
            ]),
        );
    }, [extractResult, existingOffices]);

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

    function officeIdsForRecord(key: string): number[] {
        return effectiveOfficeIds(
            officeMatches.get(key),
            officeOverrides[key],
            tokenMappings[key] ?? {},
        );
    }

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

    function fundIdForRecord(key: string): number | null {
        const override = fundOverrides[key];
        if (override !== undefined) return override;

        return fundMatches.get(key)?.fund?.id ?? null;
    }

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

    function setTokenMapping(
        key: string,
        token: string,
        officeId: number | null,
    ) {
        setTokenMappings((prev) => {
            const rowMappings = { ...prev[key] };

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

    const canCalibrate = selectedSheet !== '';
    const canVerify =
        canCalibrate &&
        config.headerRow !== '' &&
        config.headerRow != null &&
        !!workbook;
    const canExtract = canVerify && verifyResult?.valid === true;
    const canImportPpa = canExtract && !!extractResult;

    const blocksForImport = useMemo(() => {
        if (!extractResult || !selectedOffice || !selectedFiscalYear) return [];

        const officeId = Number(selectedOffice);
        const fiscalYearId = Number(selectedFiscalYear);
        const office = existingOffices.find((o) => o.id === officeId);
        if (!office) return [];

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

        const result: PpaBlock[] = [];
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

    function updateHasNumberRow(value: boolean) {
        setConfig((prev) => ({ ...prev, hasNumberRow: value }));
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
            '/imports/aip-summary-import',
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
        if (!selectedOffice || !selectedFiscalYear || newOutputs.length === 0)
            return;
        setImportingOutputs(true);

        router.post(
            '/imports/aip-summary-import/outputs',
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
                cc_typology_id: fundMatches.get(r.key)?.typology?.id ?? null,
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
        () => importableFunds.filter((r) => fundStatuses.get(r.key) === 'new'),
        [importableFunds, fundStatuses],
    );

    function handleConfirmFunds() {
        if (!selectedOffice || !selectedFiscalYear || newFunds.length === 0)
            return;
        setImportingFunds(true);

        router.post(
            '/imports/aip-summary-import/funding-sources',
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

    const s: AipImportState = {
        sheets,
        workbook,
        fileName,
        selectedSheet,
        loading,
        error,

        step,
        setStep,
        config,
        verifyResult,
        extractResult,
        canCalibrate,
        canVerify,
        canExtract,
        canImportPpa,

        selectedOffice,
        setSelectedOffice,
        selectedOfficeLabel,
        selectedFiscalYear,
        setSelectedFiscalYear,
        selectedFiscalYearLabel,
        importTarget,
        importStep,
        importTitle,
        goToImport,

        officeMatches,
        officeOverrides,
        setOfficeOverrides,
        tokenMappings,
        setTokenMappings,
        dismissedTokens,
        setDismissedTokens,
        unmatchedFrequency,
        officeIdsForRecord,
        setTokenMapping,
        resetRowOffices,
        officePickerKey,
        setOfficePickerKey,
        mappingTarget,
        setMappingTarget,

        fundMatches,
        fundOverrides,
        setFundOverrides,
        dismissedFunds,
        setDismissedFunds,
        unmatchedFundEntries,
        fundIdForRecord,
        fundPickerKey,
        setFundPickerKey,

        blocksForImport,
        newBlocks,
        handleConfirmImport,
        importing,
        importableOutputs,
        outputStatuses,
        newOutputs,
        handleConfirmOutputs,
        importingOutputs,
        importableFunds,
        fundStatuses,
        newFunds,
        handleConfirmFunds,
        importingFunds,

        handleFileChange,
        handleSheetChange,
        updateColumn,
        updateHeaderRow,
        updateHasNumberRow,
        handleResetDefaults,
        handleLogContents,
        handleVerify,
        handleExtract,

        existingOffices,
        existingPpas,
        fiscalYears,
        fundingSources,
        ccTypologies,
        existingOutputs,
        existingFundLinks,
    };

    return (
        <ImportPageShell
            title="AIP Summary Import"
            description="Import AIP Summary from XLSX."
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
            <UploadStep s={s} />
            <CalibrateStep s={s} />
            <VerifyStep s={s} />
            <ExtractStep s={s} />
            <ReviewAndImport s={s} />
        </ImportPageShell>
    );
}

AipSummaryImport.layout = {
    breadcrumbs: [
        { title: 'Imports', href: '/imports' },
        { title: 'AIP Summary Import', href: '/imports/aip-summary-import' },
    ],
};
