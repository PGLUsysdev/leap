import type ExcelJS from 'exceljs';

interface ColumnMap {
    chartOfAccount: string;
    category: string;
    description: string;
    unit: string;
    price: string;
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
}

export interface ExtractResult {
    items: PriceListItem[];
    uniqueChartOfAccounts: string[];
    uniqueCategories: string[];
}

function cellText(cell: ExcelJS.Cell): string | null {
    let value: any = cell.value;

    if (typeof value === 'object' && value !== null && 'result' in value) {
        value = value.result;
    }

    if (value == null) {
        return null;
    }

    return String(value).trim() || null;
}

function cellNumber(cell: ExcelJS.Cell): number | null {
    let value: any = cell.value;

    if (typeof value === 'object' && value !== null && 'result' in value) {
        value = value.result;
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

        items.push({
            tempId: nextTempId++,
            chartOfAccount,
            description,
            unitOfMeasurement: unit ?? '',
            price,
            category: currentCategory,
        });
    }

    return {
        items,
        uniqueChartOfAccounts: [...chartOfAccountSet].sort(),
        uniqueCategories: [...categorySet].sort(),
    };
}
