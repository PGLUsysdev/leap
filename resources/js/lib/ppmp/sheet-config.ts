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
    /** Item number column — reserved for placeholder-vs-item detection. */
    itemNumber: string;
};

export type SharedSheetConfig = {
    columnConfig: SheetColumnConfig;
    rowConfig: SheetRowConfig;
    coaLabelMode: "with-label" | "without-label";
    coaMatchField?: "auto" | "account_number" | "account_title";
};

export function getDefaultSharedConfig(): SharedSheetConfig {
    return {
        columnConfig: { category: "F", coa: "D", unit: "G", price: "H", itemNumber: "E" },
        rowConfig: { headerRow: 7, additionalItemsHeaderRow: null, nonProcurementHeaderRow: null },
        coaLabelMode: "with-label",
        coaMatchField: "account_title",
    };
}

// Adapter for category-coa-mapping nested shape (same as SharedSheetConfig)
export type CategoryCoaSheetConfig = SharedSheetConfig;
export type CategoryCoaColumnConfig = SheetColumnConfig;
export type CategoryCoaRowConfig = SheetRowConfig;

export function getDefaultMappingConfig(): CategoryCoaSheetConfig {
    return getDefaultSharedConfig() as CategoryCoaSheetConfig;
}
