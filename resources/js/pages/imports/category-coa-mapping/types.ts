// resources/js/pages/imports/category-coa-mapping/types.ts

import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import type ExcelJS from 'exceljs';
import type { CategoryCoaSheetConfig } from '@/lib/ppmp/sheet-config';
import type { ExistingCategory, ExistingCoa } from '@/lib/ppmp/normalize';
import type { PpmpExtractResult, RawPpmpItem } from '@/lib/ppmp/extract';
import type { RawSheet } from '@/lib/raw-extract';

export type CcmStep = 'upload' | 'calibrate' | 'verify' | 'extract' | 'review';

export type VerifyFormatResult = {
    valid: boolean;
    message: string;
    errors: Array<{ row: number; message: string }>;
    groups: { procurement: number; additional: number; nonProcurement: number };
    details: string[];
};

export type ExistingMapping = {
    chart_of_account_id: number;
    ppmp_category_id: number;
};

export type VerifiedPair = {
    category: string;
    coa: string;
    section: string;
    sheet: string;
    catRow: number;
    coaRow: number;
    items: number;
    catNorm: string;
    coaNorm: string;
    catExists: boolean;
    coaExists: boolean;
    mappingExists: boolean;
    catId: number | null;
    coaId: number | null;
    catMatchType: 'strict' | 'partial' | 'none';
    coaMatchType: 'strict' | 'partial' | 'none';
    catMatch: ExistingCategory | null;
    coaMatch: ExistingCoa | null;
    catTopMatches: Array<{ category: ExistingCategory; score: number }>;
    coaTopMatches: Array<{ coa: ExistingCoa; score: number }>;
};

export type VerificationState = {
    total: number;
    catFound: number;
    coaFound: number;
    mappingFound: number;
    missingCat: number;
    missingCoa: number;
    missingMapping: number;
    verifiedPairs: VerifiedPair[];
};

export type EffectiveVerifiedPair = VerifiedPair & {
    key: string;
    overrideId: number | null;
    effectiveCoa: ExistingCoa | null;
    effectiveCoaExists: boolean;
    effectiveCoaId: number | null;
    effectiveCoaMatchType: 'strict' | 'partial' | 'none';
    effectiveMappingExists: boolean;
};

export type EffectiveVerificationState = VerificationState & {
    effectivePairs: EffectiveVerifiedPair[];
    effCoaFound: number;
    effMappingFound: number;
    effMissingMapping: number;
    effMissingCoa: number;
};

export type ExtractedPair = {
    category: string;
    coa: string;
    catRow: number;
    coaRow: number;
    items: number;
    section: 'procurement' | 'additional' | 'non-procurement';
    sheet?: string;
};

export type CategoryCoaMappingState = {
    // workbook
    sheets: string[];
    workbook: ExcelJS.Workbook | null;
    fileName: string | null;
    selectedSheet: string | null;
    loading: boolean;
    error: string | null;

    // pipeline
    step: CcmStep;
    setStep: (s: CcmStep) => void;
    canCalibrate: boolean;
    canVerifyFormat: boolean;
    hasFormatResult: boolean;
    formatValid: boolean;
    canReview: boolean;
    canExtract: boolean;
    hasAnyExtract: boolean;

    // calibration
    config: CategoryCoaSheetConfig | null;
    setConfig: Dispatch<SetStateAction<CategoryCoaSheetConfig | null>>;
    getEffectiveConfig: () => CategoryCoaSheetConfig;
    ensureConfigInitialized: () => void;

    // upload
    handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleSheetToggle: (sheet: string) => void;
    handleSheetClick: (sheet: string) => void;

    // verify format
    formatResults: Record<string, VerifyFormatResult>;
    setFormatResults: Dispatch<
        SetStateAction<Record<string, VerifyFormatResult>>
    >;
    activeFormatSheet: string;
    setActiveFormatSheet: (s: string) => void;
    handleVerifyFormat: () => void;

    // verify + review
    verification: VerificationState | null;
    setVerification: Dispatch<SetStateAction<VerificationState | null>>;
    effectiveVerification: EffectiveVerificationState | null;
    coaOverrides: Record<string, number>;
    setCoaOverrides: Dispatch<SetStateAction<Record<string, number>>>;
    handleClearOverride: (rowKey: string) => void;
    isSaving: boolean;
    handleBulkCreateMappings: () => void;

    // shared ppmp raw extract
    ppmpExtractResults: Record<string, PpmpExtractResult>;
    setPpmpExtractResults: Dispatch<
        SetStateAction<Record<string, PpmpExtractResult>>
    >;
    ppmpRawItems: RawPpmpItem[];
    setPpmpRawItems: Dispatch<SetStateAction<RawPpmpItem[]>>;
    handlePpmpExtract: () => void;

    // page props
    existingCategories: ExistingCategory[];
    existingCoas: ExistingCoa[];
    existingMappings: ExistingMapping[];
};
