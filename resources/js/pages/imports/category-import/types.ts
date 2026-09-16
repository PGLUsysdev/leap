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
    CatLocation as HelperLocation,
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

export type CatLocation = HelperLocation;

export type ExtractResult = CategoryExtractResult;

export type ExtractionStats = CategoryExtractionStats;

export type CategoryReviewRow = {
    normalized: string;
    raw: string;
    sheets: string[];
    sheetCount: number;
    count: number;
    locations: CatLocation[];
    firstAddress: string;
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

    // verify
    verifyResults: Record<string, VerifyResult>;
    setVerifyResults: Dispatch<SetStateAction<Record<string, VerifyResult>>>;
    activeVerifySheet: string;
    setActiveVerifySheet: (s: string) => void;
    handleVerify: () => void;

    // extract (separate: raw preview + domain candidates)
    extractResult: ExtractResult | null;
    setExtractResult: Dispatch<SetStateAction<ExtractResult | null>>;
    extractionStats: ExtractionStats | null;
    handleExtract: () => void;
    ppmpExtractResults: Record<string, PpmpExtractResult>;
    setPpmpExtractResults: Dispatch<
        SetStateAction<Record<string, PpmpExtractResult>>
    >;
    ppmpRawItems: RawPpmpItem[];
    setPpmpRawItems: Dispatch<SetStateAction<RawPpmpItem[]>>;
    rawSheets: Record<string, RawSheet>;
    setRawSheets: Dispatch<SetStateAction<Record<string, RawSheet>>>;
    handlePpmpExtract: () => void;
    selected: Set<string>;
    setSelected: Dispatch<SetStateAction<Set<string>>>;
    importing: boolean;
    handleImport: () => void;

    // page props
    existingCategories: ExistingCategory[];
};
