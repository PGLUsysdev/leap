import type ExcelJS from 'exceljs';

interface ColumnMap {
    chartOfAccount: string;
    category: string;
    description: string;
    unit: string;
    price: string;
    itemNumber: string;
    janQty: string;
    febQty: string;
    marQty: string;
    aprQty: string;
    mayQty: string;
    junQty: string;
    julQty: string;
    augQty: string;
    sepQty: string;
    octQty: string;
    novQty: string;
    decQty: string;
}

interface ExtractConfig {
    worksheet: ExcelJS.Worksheet;
    startRow: number;
    endRow?: number;
    columnMap: ColumnMap;
}

export interface PriceListItem {
    tempId: number;
    chartOfAccount: string;
    description: string;
    unitOfMeasurement: string;
    price: number | null;
    category: string;
    itemNumber: number | null;
    janQty: number | null;
    febQty: number | null;
    marQty: number | null;
    aprQty: number | null;
    mayQty: number | null;
    junQty: number | null;
    julQty: number | null;
    augQty: number | null;
    sepQty: number | null;
    octQty: number | null;
    novQty: number | null;
    decQty: number | null;
}

export interface ExtractResult {
    items: PriceListItem[];
    uniqueChartOfAccounts: string[];
    uniqueCategories: string[];
    uniquePairs: Array<{ category: string; chartOfAccount: string }>;
}

function cellText(cell: ExcelJS.Cell): string | null {
    let value: any = cell.value;

    if (typeof value === 'object' && value !== null) {
        if ('result' in value) {
            value = value.result;
        } else {
            return null;
        }
    }

    if (value == null) {
        return null;
    }

    return String(value).trim() || null;
}

function cellNumber(cell: ExcelJS.Cell): number | null {
    let value: any = cell.value;

    if (typeof value === 'object' && value !== null) {
        if ('result' in value) {
            value = value.result;
        } else {
            return null;
        }
    }

    if (value == null || value === '') {
        return null;
    }

    if (typeof value === 'number') {
        return value;
    }

    const parsed = Number(String(value).replace(/,/g, '').trim());

    return Number.isNaN(parsed) ? null : parsed;
}

export function extractData(config: ExtractConfig): ExtractResult {
    const { worksheet, startRow, endRow, columnMap } = config;

    const items: PriceListItem[] = [];
    const chartOfAccountSet = new Set<string>();
    const categorySet = new Set<string>();
    const pairsSet = new Set<string>();

    let nextTempId = 1;

    let currentCategory: string | null = null;

    const lastRow = endRow ?? worksheet.rowCount;

    for (let rowNumber = startRow; rowNumber <= lastRow; rowNumber++) {
        const row = worksheet.getRow(rowNumber);

        const chartOfAccount = cellText(row.getCell(columnMap.chartOfAccount));
        const category = cellText(row.getCell(columnMap.category));
        const description = cellText(row.getCell(columnMap.description));
        const unit = cellText(row.getCell(columnMap.unit));
        const price = cellNumber(row.getCell(columnMap.price));
        const itemNumber = cellNumber(row.getCell(columnMap.itemNumber));
        const janQty = cellNumber(row.getCell(columnMap.janQty));
        const febQty = cellNumber(row.getCell(columnMap.febQty));
        const marQty = cellNumber(row.getCell(columnMap.marQty));
        const aprQty = cellNumber(row.getCell(columnMap.aprQty));
        const mayQty = cellNumber(row.getCell(columnMap.mayQty));
        const junQty = cellNumber(row.getCell(columnMap.junQty));
        const julQty = cellNumber(row.getCell(columnMap.julQty));
        const augQty = cellNumber(row.getCell(columnMap.augQty));
        const sepQty = cellNumber(row.getCell(columnMap.sepQty));
        const octQty = cellNumber(row.getCell(columnMap.octQty));
        const novQty = cellNumber(row.getCell(columnMap.novQty));
        const decQty = cellNumber(row.getCell(columnMap.decQty));

        // Skip fully empty rows
        if (
            !chartOfAccount &&
            !category &&
            !description &&
            !unit &&
            price === null
        ) {
            continue;
        }

        // Row with chart of account empty but description filled
        // Could be: category header, COA label, or subtotal
        if (!chartOfAccount) {
            const headerName = category ?? description;

            if (headerName) {
                // Skip subtotal rows like "ACCOUNTABLE FORMS - TOTAL"
                if (/\s*-\s*TOTAL$/i.test(headerName)) {
                    currentCategory = null;

                    continue;
                }

                // Look ahead to distinguish category header vs COA label
                // Category header: next item rows have DIFFERENT chart of accounts
                // COA label: next item rows have the SAME chart of account as this text
                let isCoaLabel = false;

                for (
                    let lookRow = rowNumber + 1;
                    lookRow <= lastRow;
                    lookRow++
                ) {
                    const nextRow = worksheet.getRow(lookRow);
                    const nextCoa = cellText(
                        nextRow.getCell(columnMap.chartOfAccount),
                    );

                    if (nextCoa) {
                        if (nextCoa === headerName) {
                            isCoaLabel = true;
                        }

                        break;
                    }
                }

                if (!isCoaLabel) {
                    // New category header
                    currentCategory = headerName;
                    categorySet.add(headerName);
                }
                // COA label: leave currentCategory unchanged
            }

            continue;
        }

        // Skip rows without a category header yet
        if (!currentCategory) {
            continue;
        }

        // Must have a description to be a valid item
        if (!description) {
            continue;
        }

        chartOfAccountSet.add(chartOfAccount);
        pairsSet.add(`${currentCategory}|${chartOfAccount}`);

        items.push({
            tempId: nextTempId++,
            chartOfAccount,
            description,
            unitOfMeasurement: unit ?? '',
            price,
            category: currentCategory,
            itemNumber,
            janQty,
            febQty,
            marQty,
            aprQty,
            mayQty,
            junQty,
            julQty,
            augQty,
            sepQty,
            octQty,
            novQty,
            decQty,
        });
    }

    return {
        items,
        uniqueChartOfAccounts: [...chartOfAccountSet].sort(),
        uniqueCategories: [...categorySet].sort(),
        uniquePairs: [...pairsSet]
            .sort()
            .map((p) => {
                const [category, chartOfAccount] = p.split('|');
                return { category, chartOfAccount };
            }),
    };
}

export interface QuantityRow {
    tempId: number;
    category: string;
    chartOfAccount: string;
    description: string;
    unitOfMeasurement: string;
    price: number | null;
    total: number | null;
    janQty: number | null;
    febQty: number | null;
    marQty: number | null;
    aprQty: number | null;
    mayQty: number | null;
    junQty: number | null;
    julQty: number | null;
    augQty: number | null;
    sepQty: number | null;
    octQty: number | null;
    novQty: number | null;
    decQty: number | null;
}

export interface QuantityColumnMap {
    category: string;
    chartOfAccount: string;
    description: string;
    total: string;
    unit: string;
    price: string;
    janQty: string;
    febQty: string;
    marQty: string;
    aprQty: string;
    mayQty: string;
    junQty: string;
    julQty: string;
    augQty: string;
    sepQty: string;
    octQty: string;
    novQty: string;
    decQty: string;
}

export interface ExtractQuantitiesConfig {
    worksheet: ExcelJS.Worksheet;
    startRow: number;
    endRow?: number;
    columnMap: QuantityColumnMap;
}

export function extractQuantities(
    config: ExtractQuantitiesConfig,
): QuantityRow[] {
    const { worksheet, startRow, endRow, columnMap } = config;
    const rows: QuantityRow[] = [];
    const lastRow = endRow ?? worksheet.rowCount;
    let nextTempId = 1;
    let currentCategory: string | null = null;

    for (let rowNumber = startRow; rowNumber <= lastRow; rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        const chartOfAccount = cellText(
            row.getCell(columnMap.chartOfAccount),
        );
        const category = cellText(row.getCell(columnMap.category));
        const description = cellText(row.getCell(columnMap.description)) ?? '';

        // Row without a chart of account could be a category header, COA
        // label, or subtotal
        if (!chartOfAccount) {
            const headerName = category ?? description;

            if (headerName) {
                // Skip subtotal rows like "ACCOUNTABLE FORMS - TOTAL"
                if (/\s*-\s*TOTAL$/i.test(headerName)) {
                    currentCategory = null;

                    continue;
                }

                // Look ahead to distinguish category header vs COA label
                let isCoaLabel = false;

                for (
                    let lookRow = rowNumber + 1;
                    lookRow <= lastRow;
                    lookRow++
                ) {
                    const nextRow = worksheet.getRow(lookRow);
                    const nextCoa = cellText(
                        nextRow.getCell(columnMap.chartOfAccount),
                    );

                    if (nextCoa) {
                        if (nextCoa === headerName) {
                            isCoaLabel = true;
                        }

                        break;
                    }
                }

                if (!isCoaLabel) {
                    currentCategory = headerName;
                }
            }

            continue;
        }

        // Skip rows before any category header
        if (!currentCategory) {
            continue;
        }

        const total = cellNumber(row.getCell(columnMap.total));

        if (total === null) {
            continue;
        }

        // Skip subtotal rows like "ACCOUNTABLE FORMS - TOTAL"
        if (/\s*-\s*TOTAL$/i.test(description)) {
            continue;
        }

        rows.push({
            tempId: nextTempId++,
            category: currentCategory,
            chartOfAccount,
            description,
            unitOfMeasurement: cellText(row.getCell(columnMap.unit)) ?? '',
            price: cellNumber(row.getCell(columnMap.price)),
            total,
            janQty: cellNumber(row.getCell(columnMap.janQty)),
            febQty: cellNumber(row.getCell(columnMap.febQty)),
            marQty: cellNumber(row.getCell(columnMap.marQty)),
            aprQty: cellNumber(row.getCell(columnMap.aprQty)),
            mayQty: cellNumber(row.getCell(columnMap.mayQty)),
            junQty: cellNumber(row.getCell(columnMap.junQty)),
            julQty: cellNumber(row.getCell(columnMap.julQty)),
            augQty: cellNumber(row.getCell(columnMap.augQty)),
            sepQty: cellNumber(row.getCell(columnMap.sepQty)),
            octQty: cellNumber(row.getCell(columnMap.octQty)),
            novQty: cellNumber(row.getCell(columnMap.novQty)),
            decQty: cellNumber(row.getCell(columnMap.decQty)),
        });
    }

    return rows;
}
