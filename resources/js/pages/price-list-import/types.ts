// resources/js/pages/price-list-import/types.ts

import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import type ExcelJS from 'exceljs';
import type { ExtractedCoaGroup } from '@/lib/ppmp/batch-match';
import type { ExistingCategory, ExistingCoa } from '@/lib/ppmp/normalize';
import type { SharedSheetConfig } from '@/lib/ppmp/sheet-config';

export type PriceListSheetConfig = SharedSheetConfig;

export type PliStep = 'upload' | 'calibrate' | 'verify' | 'review';
export type CalibrationMode = 'shared' | 'per-sheet';
export type ReviewFilter = 'all' | 'errors' | 'duplicates' | 'longDesc';

export type VerifyResult = {
    valid: boolean;
    message: string;
    errors: Array<{ row: number; message: string }>;
    details: string[];
};

export type RawItem = {
    sheet: string;
    row: number;
    category: string;
    coa: string;
    description: string;
    unit: string;
    price: number | null;
    priceRaw: string | null;
};

export type UniqueItem = {
    key: string;
    category: string;
    coa: string;
    description: string;
    unit: string;
    price: number | null;
    sheets: string[];
    rows: number[];
    count: number;
};

export type VerifiedItem = UniqueItem & {
    catNorm: string;
    coaNorm: string;
    categoryId: number | null;
    coaId: number | null;
    mappingId: number | null;
    catExists: boolean;
    coaExists: boolean;
    mappingExists: boolean;
    priceListExists: boolean;
    junctionId: number | null;
    catMatchType: 'strict' | 'partial' | 'none';
    coaMatchType: 'strict' | 'partial' | 'none';
    catTopMatches: Array<{ category: ExistingCategory; score: number }>;
    coaTopMatches: Array<{ coa: ExistingCoa; score: number }>;
    catMatch: ExistingCategory | null;
    coaMatch: ExistingCoa | null;
    effectiveCoa: ExistingCoa | null;
    effectiveCoaId: number | null;
    effectiveCoaExists: boolean;
    effectiveCoaMatchType: 'strict' | 'partial' | 'none';
    effectiveJunctionId: number | null;
    effectiveMappingExists: boolean;
    effectivePriceListExists: boolean;
    overrideId: number | null;
    priceValid: boolean;
    unitValid: boolean;
    descriptionValid: boolean;
    status: 'ready' | 'update' | 'error' | 'skipped';
    message: string;
};

export type ExistingMapping = {
    id: number;
    chart_of_account_id: number;
    ppmp_category_id: number;
};

export type ExistingPriceList = {
    id: number;
    description: string;
    unit_of_measurement: string;
    price: string;
    chart_of_account_ppmp_category_id: number;
};

export type PriceListImportState = {
    // workbook
    sheets: string[];
    workbook: ExcelJS.Workbook | null;
    fileName: string | null;
    selectedSheets: string[];
    loading: boolean;
    error: string | null;
    isMounted: boolean;

    // pipeline
    step: PliStep;
    setStep: (s: PliStep) => void;
    canCalibrate: boolean;
    canVerify: boolean;
    allVerifyValid: boolean;
    hasAnyVerify: boolean;
    canReview: boolean;

    // calibration
    calibrationMode: CalibrationMode;
    setCalibrationMode: (m: CalibrationMode) => void;
    sharedConfig: PriceListSheetConfig | null;
    setSharedConfig: Dispatch<SetStateAction<PriceListSheetConfig | null>>;
    calibrations: Record<string, PriceListSheetConfig>;
    setCalibrations: Dispatch<
        SetStateAction<Record<string, PriceListSheetConfig>>
    >;
    currentSheet: string;
    setCurrentSheet: (s: string) => void;
    getEffectiveConfig: (sheet: string) => PriceListSheetConfig;
    ensureCalibrationsInitialized: () => void;
    handleApplySharedToAll: () => void;
    handleCopyCurrentToAll: () => void;
    updateSharedConfig: (patch: Partial<PriceListSheetConfig>) => void;
    updateCurrentCalibration: (patch: Partial<PriceListSheetConfig>) => void;

    // upload
    handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleSheetToggle: (sheet: string) => void;

    // verify
    verifyResults: Record<string, VerifyResult>;
    setVerifyResults: Dispatch<SetStateAction<Record<string, VerifyResult>>>;
    activeVerifySheet: string;
    setActiveVerifySheet: (s: string) => void;
    handleVerify: () => void;

    // extract
    rawItems: RawItem[];
    setRawItems: Dispatch<SetStateAction<RawItem[]>>;
    uniqueItems: UniqueItem[];
    setUniqueItems: Dispatch<SetStateAction<UniqueItem[]>>;
    handleExtract: () => void;

    // review
    verifiedItems: VerifiedItem[];
    filteredItems: VerifiedItem[];
    batchGroups: ExtractedCoaGroup[];
    batchSelections: Record<string, string>;
    setBatchSelections: Dispatch<SetStateAction<Record<string, string>>>;
    coaOverrides: Record<string, number>;
    setCoaOverrides: Dispatch<SetStateAction<Record<string, number>>>;
    handleCoaOverrideChange: (
        rowKey: string,
        selectedValue: string | null,
    ) => void;
    handleClearOverride: (rowKey: string) => void;
    handleClearAllOverrides: () => void;
    handleBatchApplyGroup: (group: ExtractedCoaGroup) => void;
    handleTruncateDescription: (rowKey: string) => void;
    handleTruncateAllLongDescriptions: () => void;

    selected: Set<string>;
    setSelected: Dispatch<SetStateAction<Set<string>>>;

    reviewFilter: ReviewFilter;
    setReviewFilter: (f: ReviewFilter) => void;
    showDuplicateDetails: boolean;
    setShowDuplicateDetails: Dispatch<SetStateAction<boolean>>;
    excludeMissingCategory: boolean;
    setExcludeMissingCategory: (v: boolean) => void;

    // counts
    readyCount: number;
    errorCount: number;
    updateCount: number;
    insertCount: number;
    missingMappingCount: number;
    missingCategoryCount: number;
    skippedCount: number;
    duplicateCount: number;
    duplicateItems: VerifiedItem[];
    longDescriptionCount: number;
    importable: VerifiedItem[];
    importableSelected: VerifiedItem[];

    // import
    importing: boolean;
    handleImport: () => void;

    // page props
    existingCategories: ExistingCategory[];
    existingCoas: ExistingCoa[];
    existingMappings: ExistingMapping[];
    existingPriceLists: ExistingPriceList[];
};
