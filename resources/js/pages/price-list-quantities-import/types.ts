// resources/js/pages/price-list-quantities-import/types.ts

import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import type ExcelJS from 'exceljs';
import type { QuantitiesSheetConfig } from '@/lib/ppmp/sheet-config';
import type {
    QuantitiesExtractResult,
    QuantitiesVerifyResult,
} from '@/lib/ppmp/quantities-extract';
import type { matchQuantityItems } from '@/lib/ppmp/quantities-match';
import type {
    ExistingMapping,
    ExistingPriceList,
} from '@/lib/ppmp/quantities-match';
import type { ExistingCategory, ExistingCoa } from '@/lib/ppmp/normalize';

export type PliQtyStep =
    | 'upload'
    | 'calibrate'
    | 'verify'
    | 'review'
    | 'import';

export type CalibrationMode = 'shared' | 'per-sheet';

export type MappedItem = ReturnType<typeof matchQuantityItems>[number];

export type ExistingOffice = {
    id: number;
    name: string;
    acronym: string | null;
};

export type ExistingPpa = {
    id: number;
    office_id: number;
    parent_id: number | null;
    name: string;
    type: string;
    full_code: string;
    fiscal_year_id: number;
};

export type FiscalYearOption = {
    id: number;
    year: number;
    status: string;
};

export type ExistingFundingSource = {
    id: number;
    aip_output_id: number;
    funding_source_id: number | null;
    funding_source_code: string | null;
    funding_source_title: string | null;
    expected_output: string | null;
    ppa_id: number | null;
};

export type ExistingOutput = {
    id: number;
    expected_output: string | null;
    sort_order: number | null;
    ppa_id: number | null;
};

export type PriceListQuantitiesImportState = {
    // workbook
    workbook: ExcelJS.Workbook | null;
    sheets: string[];
    selectedSheets: string[];
    fileName: string | null;
    error: string;

    // pipeline
    step: PliQtyStep;
    setStep: (s: PliQtyStep) => void;
    canCalibrate: boolean;
    canVerify: boolean;
    hasAnyVerify: boolean;
    allVerifyValid: boolean;
    canReview: boolean;
    canImport: boolean;

    // calibration
    calibrationMode: CalibrationMode;
    setCalibrationMode: (m: CalibrationMode) => void;
    sharedConfig: QuantitiesSheetConfig | null;
    setSharedConfig: Dispatch<SetStateAction<QuantitiesSheetConfig | null>>;
    calibrations: Record<string, QuantitiesSheetConfig>;
    setCalibrations: Dispatch<
        SetStateAction<Record<string, QuantitiesSheetConfig>>
    >;
    currentSheet: string;
    setCurrentSheet: (s: string) => void;
    getEffectiveConfig: (sheet: string) => QuantitiesSheetConfig;
    ensureCalibrationsInitialized: () => void;
    handleApplySharedToAll: () => void;
    handleCopyCurrentToAll: () => void;
    updateSharedConfig: (patch: Partial<QuantitiesSheetConfig>) => void;
    updateCurrentCalibration: (patch: Partial<QuantitiesSheetConfig>) => void;

    // upload / extract / verify
    handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleSheetToggle: (name: string) => void;
    handleVerify: () => void;
    runExtraction: () => void;

    // verify results
    verifyResults: Record<string, QuantitiesVerifyResult>;
    setVerifyResults: Dispatch<
        SetStateAction<Record<string, QuantitiesVerifyResult>>
    >;
    activeVerifySheet: string;
    setActiveVerifySheet: (s: string) => void;

    // extract results / review
    extractResults: Record<string, QuantitiesExtractResult>;
    setExtractResults: Dispatch<
        SetStateAction<Record<string, QuantitiesExtractResult>>
    >;
    activeExtractSheet: string;
    setActiveExtractSheet: (s: string) => void;
    hideEmptyQty: boolean;
    setHideEmptyQty: (v: boolean) => void;

    // mapping / import
    mappedBySheet: Record<string, MappedItem[]>;
    importSheets: string[];
    effectiveImportSheet: string;
    mappedItems: MappedItem[];
    matchedCount: number;
    activeImportSheet: string;
    setActiveImportSheet: (s: string) => void;

    // selection
    selectedOfficeId: number | null;
    setSelectedOfficeId: (v: number | null) => void;
    selectedFiscalYearId: number | null;
    setSelectedFiscalYearId: (v: number | null) => void;
    selectedPpaId: number | null;
    setSelectedPpaId: (v: number | null) => void;
    selectedAipOutputId: number | null;
    setSelectedAipOutputId: (v: number | null) => void;
    selectedPpaFundingSourceId: number | null;
    setSelectedPpaFundingSourceId: (v: number | null) => void;

    // combobox items/values
    officeItems: string[];
    officeValue: string;
    ppasForSelection: ExistingPpa[];
    ppaItems: string[];
    ppaValue: string;
    fundingSourcesForSelection: ExistingFundingSource[];
    fundingSourceItems: string[];
    fundingSourceValue: string;
    outputsForSelection: ExistingOutput[];
    outputItems: string[];
    outputValue: string;

    // filters
    showOnlyUnmapped: boolean;
    setShowOnlyUnmapped: (v: boolean) => void;
    showOnlyWithQty: boolean;
    setShowOnlyWithQty: (v: boolean) => void;
    excludeUnmapped: boolean;
    setExcludeUnmapped: (v: boolean) => void;
    excludeAmbiguous: boolean;
    setExcludeAmbiguous: (v: boolean) => void;
    excludeUnclassified: boolean;
    setExcludeUnclassified: (v: boolean) => void;

    // import action
    importing: boolean;
    importableItems: MappedItem[];
    unclassifiedCount: number;
    isUnclassified: (m: MappedItem) => boolean;
    handleImport: () => void;

    // page props
    existingCategories: ExistingCategory[];
    existingCoas: ExistingCoa[];
    existingMappings: ExistingMapping[];
    existingPriceLists: ExistingPriceList[];
    existingOffices: ExistingOffice[];
    fiscalYears: FiscalYearOption[];
    existingPpas: ExistingPpa[];
    existingFundingSources: ExistingFundingSource[];
    existingOutputs: ExistingOutput[];
};
