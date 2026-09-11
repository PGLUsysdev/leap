// resources/js/pages/aip-summary-import/types.ts

import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import type ExcelJS from 'exceljs';
import type {
    AipSummaryField,
    AipSummarySheetConfig,
} from '@/lib/aip-summary-import/sheet-config';
import type { AipSummaryVerifyResult } from '@/lib/aip-summary-import/verify';
import type { AipSummaryExtractResult } from '@/lib/aip-summary-import/extract';
import type {
    RecordOfficeMatch,
    TokenMapping,
} from '@/lib/aip-summary-import/match-offices';
import type { RecordFundMatch } from '@/lib/aip-summary-import/match-funds';

export type ImportOffice = {
    id: number;
    acronym: string | null;
    name: string;
    full_code: string;
};

export type ImportFund = {
    id: number;
    fund_type: string;
    code: string;
    title: string;
};

export type ImportStep =
    | 'upload'
    | 'calibrate'
    | 'verify'
    | 'extract'
    | 'import-ppa'
    | 'import-outputs'
    | 'import-funding';

export type ImportTarget = 'ppa' | 'outputs' | 'funding';

export type ExistingPpa = {
    id: number;
    office_id: number;
    parent_id: number | null;
    name: string;
    type: string;
    code_suffix: string | null;
    full_code: string;
    fiscal_year_id: number;
};

export type ExistingOutput = {
    id: number;
    ppa_id: number;
    office_id: number;
    fiscal_year_id: number | null;
    expected_output: string | null;
};

export type ExistingFundLink = {
    id: number;
    output_id: number;
    funding_source_id: number;
    ppa_id: number;
    office_id: number;
    fiscal_year_id: number | null;
};

export type FiscalYear = { id: number; year: number; status: string };
export type CcTypology = { id: number; code: string };

export type PpaBlock = {
    fullCode: string;
    name: string;
    type: string;
    rows: number[];
    status: 'new' | 'exists';
};

export type OutputImportStatus = 'exists' | 'new' | 'no-ppa' | 'no-offices';
export type FundLinkStatus = 'exists' | 'new' | 'no-output';

export type ImportableOutput = {
    key: string;
    full_code: string;
    fullCodeNorm: string;
    outputNorm: string | null;
    name: string;
    expected_output: string | null;
    start_date: string | null;
    end_date: string | null;
    office_ids: number[];
};

export type ImportableFundLink = {
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
};

export type UnmatchedFrequencyEntry = { token: string; count: number };

/** Everything a step component needs. Built once in the page. */
export type AipImportState = {
    // file / workbook
    sheets: string[];
    workbook: ExcelJS.Workbook | null;
    fileName: string | null;
    selectedSheet: string;
    loading: boolean;
    error: string | null;

    // pipeline
    step: ImportStep;
    setStep: (s: ImportStep) => void;
    config: AipSummarySheetConfig;
    verifyResult: AipSummaryVerifyResult | null;
    extractResult: AipSummaryExtractResult | null;
    canCalibrate: boolean;
    canVerify: boolean;
    canExtract: boolean;
    canImportPpa: boolean;

    // targets
    selectedOffice: string;
    setSelectedOffice: (v: string) => void;
    selectedOfficeLabel: string;
    selectedFiscalYear: string;
    setSelectedFiscalYear: (v: string) => void;
    selectedFiscalYearLabel: string;
    importTarget: ImportTarget;
    importStep: ImportStep;
    importTitle: string;
    goToImport: (t: ImportTarget) => void;

    // office resolution
    officeMatches: Map<string, RecordOfficeMatch>;
    officeOverrides: Record<string, number[]>;
    setOfficeOverrides: Dispatch<SetStateAction<Record<string, number[]>>>;
    tokenMappings: Record<string, TokenMapping>;
    setTokenMappings: Dispatch<SetStateAction<Record<string, TokenMapping>>>;
    dismissedTokens: Record<string, string[]>;
    setDismissedTokens: Dispatch<SetStateAction<Record<string, string[]>>>;
    unmatchedFrequency: UnmatchedFrequencyEntry[];
    officeIdsForRecord: (key: string) => number[];
    setTokenMapping: (
        key: string,
        token: string,
        officeId: number | null,
    ) => void;
    resetRowOffices: (key: string) => void;
    officePickerKey: string | null;
    setOfficePickerKey: (k: string | null) => void;
    mappingTarget: { key: string; token: string } | null;
    setMappingTarget: (t: { key: string; token: string } | null) => void;

    // fund resolution
    fundMatches: Map<string, RecordFundMatch>;
    fundOverrides: Record<string, number>;
    setFundOverrides: Dispatch<SetStateAction<Record<string, number>>>;
    dismissedFunds: Record<string, boolean>;
    setDismissedFunds: Dispatch<SetStateAction<Record<string, boolean>>>;
    unmatchedFundEntries: UnmatchedFrequencyEntry[];
    fundIdForRecord: (key: string) => number | null;
    fundPickerKey: string | null;
    setFundPickerKey: (k: string | null) => void;

    // per-flow
    blocksForImport: PpaBlock[];
    newBlocks: PpaBlock[];
    handleConfirmImport: () => void;
    importing: boolean;

    importableOutputs: ImportableOutput[];
    outputStatuses: Map<string, OutputImportStatus>;
    newOutputs: ImportableOutput[];
    handleConfirmOutputs: () => void;
    importingOutputs: boolean;

    importableFunds: ImportableFundLink[];
    fundStatuses: Map<string, FundLinkStatus>;
    newFunds: ImportableFundLink[];
    handleConfirmFunds: () => void;
    importingFunds: boolean;

    // handlers
    handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleSheetChange: (v: string[]) => void;
    updateColumn: (field: AipSummaryField, letter: string) => void;
    updateHeaderRow: (v: string) => void;
    handleResetDefaults: () => void;
    handleLogContents: () => void;
    handleVerify: () => void;
    handleExtract: () => void;

    // page props
    existingOffices: ImportOffice[];
    existingPpas: ExistingPpa[];
    fiscalYears: FiscalYear[];
    fundingSources: ImportFund[];
    ccTypologies: CcTypology[];
    existingOutputs: ExistingOutput[];
    existingFundLinks: ExistingFundLink[];
};
