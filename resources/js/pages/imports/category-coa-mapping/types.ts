// resources/js/pages/imports/category-coa-mapping/types.ts

import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import type ExcelJS from 'exceljs';
import type { CategoryCoaSheetConfig } from '@/lib/ppmp/sheet-config';
import type { ExistingCategory, ExistingCoa } from '@/lib/ppmp/normalize';
import type { PpmpExtractResult, RawPpmpItem } from '@/lib/ppmp/extract';
import type { RawSheet } from '@/lib/raw-extract';
import type { PpmpVerifySheetResult } from '@/components/imports/import-verify-step';
import type {
    EffectiveVerificationState,
    EffectiveVerifiedPair,
    ExistingMappingRef,
    ExtractedPair,
    VerificationState,
    VerifiedPair,
} from '@/lib/ppmp/mapping-extract';

export type CcmStep = 'upload' | 'calibrate' | 'verify' | 'extract' | 'review';

export type VerifyFormatResult = PpmpVerifySheetResult;

export type ExistingMapping = ExistingMappingRef;

export type {
    EffectiveVerificationState,
    EffectiveVerifiedPair,
    ExtractedPair,
    VerificationState,
    VerifiedPair,
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

    // calibration
    config: CategoryCoaSheetConfig | null;
    setConfig: Dispatch<SetStateAction<CategoryCoaSheetConfig | null>>;
    getEffectiveConfig: () => CategoryCoaSheetConfig;
    ensureConfigInitialized: () => void;

    // upload
    handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleSheetChange: (sheet: string | null) => void;

    // verify format (single sheet)
    formatResult: VerifyFormatResult | null;
    setFormatResult: Dispatch<SetStateAction<VerifyFormatResult | null>>;
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

    // shared ppmp raw extract (single sheet preview)
    ppmpExtract: PpmpExtractResult | null;
    setPpmpExtract: Dispatch<SetStateAction<PpmpExtractResult | null>>;
    ppmpRawItems: RawPpmpItem[];
    setPpmpRawItems: Dispatch<SetStateAction<RawPpmpItem[]>>;
    rawSheet: RawSheet | null;
    setRawSheet: Dispatch<SetStateAction<RawSheet | null>>;
    handlePpmpExtract: () => void;

    // page props
    existingCategories: ExistingCategory[];
    existingCoas: ExistingCoa[];
    existingMappings: ExistingMapping[];
};
