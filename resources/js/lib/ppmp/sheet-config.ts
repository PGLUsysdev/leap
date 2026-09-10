export type SheetRowConfig = {
    headerRow: number | '';
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
    coaLabelMode: 'with-label' | 'without-label';
    coaMatchField?: 'auto' | 'account_number' | 'account_title';
};

export function getDefaultSharedConfig(): SharedSheetConfig {
    return {
        columnConfig: {
            category: 'F',
            coa: 'D',
            unit: 'G',
            price: 'H',
            itemNumber: 'E',
        },
        rowConfig: {
            headerRow: 7,
            additionalItemsHeaderRow: null,
            nonProcurementHeaderRow: null,
        },
        coaLabelMode: 'with-label',
        coaMatchField: 'account_title',
    };
}

// Adapter for category-coa-mapping nested shape (same as SharedSheetConfig)
export type CategoryCoaSheetConfig = SharedSheetConfig;
export type CategoryCoaColumnConfig = SheetColumnConfig;
export type CategoryCoaRowConfig = SheetRowConfig;

export function getDefaultMappingConfig(): CategoryCoaSheetConfig {
    return getDefaultSharedConfig() as CategoryCoaSheetConfig;
}

// Price-list quantities import: same PPMP sheet layout as the price-list
// importer, plus 12 consecutive monthly quantity columns (Jan–Dec)
// starting at qtyStart.
export type QuantitiesColumnConfig = SheetColumnConfig & {
    /**
     * January quantity column — months alternate qty/amount pairs
     * (K=Jan qty, L=Jan amount, M=Feb qty …), so quantities are read
     * from every other column starting here.
     */
    qtyStart: string;
};

export type QuantitiesSheetConfig = Omit<SharedSheetConfig, 'columnConfig'> & {
    columnConfig: QuantitiesColumnConfig;
};

export function getDefaultQuantitiesConfig(): QuantitiesSheetConfig {
    const base = getDefaultSharedConfig();

    return {
        ...base,
        columnConfig: {
            ...base.columnConfig,
            qtyStart: 'K',
        },
        rowConfig: { ...base.rowConfig },
    };
}
