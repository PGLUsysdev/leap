// resources/js/pages/category-import/types.ts

import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import type ExcelJS from 'exceljs';
import type { ExistingCategory } from '@/lib/ppmp/normalize';
import type { SharedSheetConfig } from '@/lib/ppmp/sheet-config';

export type CimpStep = 'upload' | 'calibrate' | 'verify' | 'extract';
export type CalibrationMode = 'shared' | 'per-sheet';

export type VerifyResult = {
    valid: boolean;
    message: string;
    errors: Array<{ row: number; message: string }>;
    groups: { procurement: number; additional: number; nonProcurement: number };
    details: string[];
};

export type CatLocation = {
    sheet: string;
    row: number;
    col: string;
    address: string;
};

export type ExtractResult = {
    filtered: Array<{
        row: number;
        raw: string;
        normalized: string;
        sheet: string;
        address: string;
    }>;
    unique: Array<{
        raw: string;
        normalized: string;
        rows: number[];
        count: number;
        sheets: string[];
        sheetCount: number;
        locations: CatLocation[];
    }>;
    duplicates: Array<{
        normalized: string;
        keptRow: number;
        keptSheet: string;
        keptAddress: string;
        duplicateRow: number;
        duplicateSheet: string;
        duplicateAddress: string;
        duplicateRaw: string;
    }>;
    excludedTotal: Array<{
        row: number;
        raw: string;
        normalized: string;
        sheet: string;
    }>;
    excludedCoa: Array<{
        row: number;
        raw: string;
        normalized: string;
        nextRowCoaRaw: string;
        nextRowCoaNormalized: string;
        sheet: string;
    }>;
    skippedCoaNotEmpty: Array<{
        row: number;
        coaRaw: string;
        coaNormalized: string;
        raw: string;
        normalized: string;
        sheet: string;
    }>;
    skippedProblematic: Array<{
        row: number;
        raw: string;
        normalized: string;
        reason: string;
        sheet: string;
    }>;
};

export type ExtractionStats = {
    raw: number;
    unique: number;
    duplicates: number;
};

export type CategoryImportState = {
    // workbook
    sheets: string[];
    workbook: ExcelJS.Workbook | null;
    fileName: string | null;
    selectedSheets: string[];
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

    // calibration
    calibrationMode: CalibrationMode;
    setCalibrationMode: (m: CalibrationMode) => void;
    sharedConfig: SharedSheetConfig | null;
    setSharedConfig: Dispatch<SetStateAction<SharedSheetConfig | null>>;
    calibrations: Record<string, SharedSheetConfig>;
    setCalibrations: Dispatch<
        SetStateAction<Record<string, SharedSheetConfig>>
    >;
    currentSheet: string;
    setCurrentSheet: (s: string) => void;
    getEffectiveConfig: (sheet: string) => SharedSheetConfig;
    ensureCalibrationsInitialized: () => void;
    handleApplySharedToAll: () => void;
    handleCopyCurrentToAll: () => void;
    updateSharedConfig: (patch: Partial<SharedSheetConfig>) => void;
    updateCurrentCalibration: (patch: Partial<SharedSheetConfig>) => void;

    // upload
    handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleSheetToggle: (sheet: string) => void;
    handleSheetSelect: (sheet: string) => void;

    // verify
    verifyResults: Record<string, VerifyResult>;
    setVerifyResults: Dispatch<SetStateAction<Record<string, VerifyResult>>>;
    activeVerifySheet: string;
    setActiveVerifySheet: (s: string) => void;
    handleVerify: () => void;
    skipProblematic: boolean;
    setSkipProblematic: (v: boolean) => void;

    // extract
    extractResult: ExtractResult | null;
    setExtractResult: Dispatch<SetStateAction<ExtractResult | null>>;
    extractionStats: ExtractionStats | null;
    handleExtract: () => void;
    selected: Set<string>;
    setSelected: Dispatch<SetStateAction<Set<string>>>;
    isAdditionalDraft: Record<string, boolean>;
    setIsAdditionalDraft: Dispatch<SetStateAction<Record<string, boolean>>>;
    importing: boolean;
    handleImport: () => void;

    // page props
    existingCategories: ExistingCategory[];
};
