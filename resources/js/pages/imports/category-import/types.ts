// resources/js/pages/imports/category-import/types.ts

import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import type ExcelJS from 'exceljs';
import type { TableMeta } from '@tanstack/react-table';
import type { ExistingCategory } from '@/lib/ppmp/normalize';
import type { SharedSheetConfig } from '@/lib/ppmp/sheet-config';
import type { PpmpExtractResult, RawPpmpItem } from '@/lib/ppmp/extract';
import type { RawSheet } from '@/lib/raw-extract';
import type {
    CategoryExtractResult,
    CategoryExtractionStats,
} from '@/lib/ppmp/category-extract';

export type CimpStep = 'upload' | 'calibrate' | 'verify' | 'extract' | 'import';

export type VerifyResult = {
    valid: boolean;
    message: string;
    errors: Array<{ row: number; message: string }>;
    warnings?: Array<{ row: number; message: string }>;
    groups: { procurement: number; additional: number; nonProcurement: number };
    details: string[];
};

export type ExtractResult = CategoryExtractResult;

export type ExtractionStats = CategoryExtractionStats;

export type CategoryReviewRow = {
    normalized: string;
    raw: string;
    row: number;
    address: string;
    count: number;
    rows: number[];
    matchType: 'strict' | 'partial' | 'none';
    matchName: string | null;
    topMatches: Array<{ name: string; score: number }>;
};

export type CategoryReviewTableMeta = TableMeta<CategoryReviewRow> & {
    selected: Set<string>;
    toggleOne: (normalized: string, checked: boolean) => void;
    setSelected: (next: Set<string>) => void;
};

export type CategoryImportState = {
    // workbook
    sheets: string[];
    workbook: ExcelJS.Workbook | null;
    fileName: string | null;
    selectedSheet: string | null;
    loading: boolean;
    error: string | null;

    // pipeline
    step: CimpStep;
    setStep: (s: CimpStep) => void;
    canCalibrate: boolean;
    canVerify: boolean;
    allVerifyValid: boolean;
    hasAnyVerify: boolean;
    canExtract: boolean;
    canImport: boolean;

    // calibration
    config: SharedSheetConfig | null;
    setConfig: Dispatch<SetStateAction<SharedSheetConfig | null>>;
    getEffectiveConfig: () => SharedSheetConfig;
    ensureConfigInitialized: () => void;

    // upload
    handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleSheetChange: (sheet: string | null) => void;

    // verify (single sheet)
    verifyResult: VerifyResult | null;
    setVerifyResult: Dispatch<SetStateAction<VerifyResult | null>>;
    handleVerify: () => void;

    // extract (separate: raw preview + domain candidates, single sheet)
    extractResult: ExtractResult | null;
    setExtractResult: Dispatch<SetStateAction<ExtractResult | null>>;
    extractionStats: ExtractionStats | null;
    handleExtract: () => void;
    ppmpExtract: PpmpExtractResult | null;
    setPpmpExtract: Dispatch<SetStateAction<PpmpExtractResult | null>>;
    ppmpRawItems: RawPpmpItem[];
    setPpmpRawItems: Dispatch<SetStateAction<RawPpmpItem[]>>;
    rawSheet: RawSheet | null;
    setRawSheet: Dispatch<SetStateAction<RawSheet | null>>;
    handlePpmpExtract: () => void;
    selected: Set<string>;
    setSelected: Dispatch<SetStateAction<Set<string>>>;
    importing: boolean;
    handleImport: () => void;
    ensuringSentinels: boolean;
    handleEnsureSentinels: () => void;

    // page props
    existingCategories: ExistingCategory[];
};
