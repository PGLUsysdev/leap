export type SheetRowConfig = {
    headerRow: number | "";
    additionalItemsHeaderRow?: number | null;
    nonProcurementHeaderRow?: number | null;
};

export type SheetColumnConfig = {
    category: string;
    coa: string;
    unit: string;
    price: string;
};

export type SharedSheetConfig = {
    columnConfig: SheetColumnConfig;
    rowConfig: SheetRowConfig;
    coaLabelMode: "with-label" | "without-label";
    coaMatchField?: "auto" | "account_number" | "account_title";
};

export function getDefaultSharedConfig(): SharedSheetConfig {
    return {
        columnConfig: { category: "F", coa: "D", unit: "G", price: "H" },
        rowConfig: { headerRow: 7, additionalItemsHeaderRow: null, nonProcurementHeaderRow: null },
        coaLabelMode: "with-label",
        coaMatchField: "auto",
    };
}

// Adapter for category-import flat shape
export type CatSheetConfig = {
    dataColumn: string;
    coaColumn: string;
    headerRow: number | "";
    additionalItemsHeaderRow?: number;
    nonProcurementHeaderRow?: number;
    coaLabelMode: "with-label" | "without-label";
};

export function toCatSheetConfig(shared: SharedSheetConfig): CatSheetConfig {
    return {
        dataColumn: shared.columnConfig.category,
        coaColumn: shared.columnConfig.coa,
        headerRow: shared.rowConfig.headerRow,
        additionalItemsHeaderRow: shared.rowConfig.additionalItemsHeaderRow ?? undefined,
        nonProcurementHeaderRow: shared.rowConfig.nonProcurementHeaderRow ?? undefined,
        coaLabelMode: shared.coaLabelMode,
    };
}

export function fromCatSheetConfig(cat: CatSheetConfig): SharedSheetConfig {
    return {
        columnConfig: { category: cat.dataColumn, coa: cat.coaColumn, unit: "G", price: "H" },
        rowConfig: {
            headerRow: cat.headerRow,
            additionalItemsHeaderRow: cat.additionalItemsHeaderRow ?? null,
            nonProcurementHeaderRow: cat.nonProcurementHeaderRow ?? null,
        },
        coaLabelMode: cat.coaLabelMode,
    };
}

// Adapter for category-coa-mapping nested shape (same as SharedSheetConfig)
export type CategoryCoaSheetConfig = SharedSheetConfig;
export type CategoryCoaColumnConfig = SheetColumnConfig;
export type CategoryCoaRowConfig = SheetRowConfig;

export function getDefaultMappingConfig(): CategoryCoaSheetConfig {
    return getDefaultSharedConfig() as CategoryCoaSheetConfig;
}
