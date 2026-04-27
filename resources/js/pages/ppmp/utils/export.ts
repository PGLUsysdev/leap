import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import type {
    Ppmp,
    PriceList,
    PpmpCategory,
    ChartOfAccount,
    AipEntry,
    FundingSource,
    FiscalYear,
    AuthData,
} from '@/types/global';

interface ExportToExcelProps {
    filteredPpmpItems: Ppmp[];
    priceLists: PriceList[];
    ppmpCategories: PpmpCategory[];
    chartOfAccounts: ChartOfAccount[];
    aipEntry: AipEntry;
    fundingSources: FundingSource[];
    selectedFundingSourceId: number;
    fiscalYear: FiscalYear;
    auth: AuthData;
}

export async function exportToExcel({
    filteredPpmpItems,
    priceLists,
    ppmpCategories,
    chartOfAccounts,
    aipEntry,
    fundingSources,
    selectedFundingSourceId,
    auth,
    fiscalYear,
}: ExportToExcelProps) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('PPMP');
    const initailRowCount = worksheet.rowCount + 5; // returns the number of the very first row
    const headerRowCount = initailRowCount + 1; // returns the number where the header row is
    const firstRowCount = headerRowCount + 1; // returns the number where the header row is
    // const headerRow = worksheet.getRow(headerRowCount); // returns the header row data

    worksheet.columns = [
        { header: 'EXPENSE ACCOUNT', key: 'expenseAccount', width: 15 },
        { header: 'Item No.', key: 'itemNo', width: 4 },
        { header: 'Description', key: 'description', width: 20 },
        { header: 'Unit of Measure', key: 'unitOfMeasurement', width: 9 },
        { header: 'PRICELIST', key: 'price', width: 10 },
        { header: 'CY 2026-QTY', key: 'totalQuantity', width: 8 },
        { header: 'TOTAL', key: 'totalAmount', width: 12 },
        { header: 'JAN-QTY', key: 'janQuantity', width: 8 },
        { header: 'JAN', key: 'janAmount', width: 8 },
        { header: 'FEB-QTY', key: 'febQuantity', width: 8 },
        { header: 'FEB', key: 'febAmount', width: 8 },
        { header: 'MAR-QTY', key: 'marQuantity', width: 8 },
        { header: 'MAR', key: 'marAmount', width: 8 },
        { header: 'APR-QTY', key: 'aprQuantity', width: 8 },
        { header: 'APR', key: 'aprAmount', width: 8 },
        { header: 'MAY-QTY', key: 'mayQuantity', width: 8 },
        { header: 'MAY', key: 'mayAmount', width: 8 },
        { header: 'JUN-QTY', key: 'junQuantity', width: 8 },
        { header: 'JUN', key: 'junAmount', width: 8 },
        { header: 'JUL-QTY', key: 'julQuantity', width: 8 },
        { header: 'JUL', key: 'julAmount', width: 8 },
        { header: 'AUG-QTY', key: 'augQuantity', width: 8 },
        { header: 'AUG', key: 'augAmount', width: 8 },
        { header: 'SEP-QTY', key: 'sepQuantity', width: 8 },
        { header: 'SEP', key: 'sepAmount', width: 8 },
        { header: 'OCT-QTY', key: 'octQuantity', width: 8 },
        { header: 'OCT', key: 'octAmount', width: 8 },
        { header: 'NOV-QTY', key: 'novQuantity', width: 8 },
        { header: 'NOV', key: 'novAmount', width: 8 },
        { header: 'DEC-QTY', key: 'decQuantity', width: 8 },
        { header: 'DEC', key: 'decAmount', width: 8 },
    ];

    worksheet.spliceRows(1, 0, [], [], [], [], []);

    [8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30].forEach((columnNumber) => {
        const column = worksheet.getColumn(columnNumber);
        column.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '92d050' },
        };
    });

    let currentRow = firstRowCount;

    // --- DATA PREPARATION ---
    // Join filteredPpmpItems with priceLists and ppmpCategories to get is_non_procurement
    const itemsWithCategory = filteredPpmpItems.map((item) => {
        const priceList = priceLists.find(
            (pl) => pl.id === item.ppmp_price_list_id,
        );
        const category = priceList
            ? ppmpCategories.find((c) => c.id === priceList.ppmp_category_id)
            : null;
        return {
            ...item,
            priceList,
            category,
            is_non_procurement: category?.is_non_procurement ?? false,
        };
    });

    // Group by is_non_procurement first
    const groupedByProcurementType = itemsWithCategory.reduce(
        (acc, item) => {
            const key = item.is_non_procurement ? 'true' : 'false';
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
        },
        {} as Record<string, typeof itemsWithCategory>,
    );

    const allProcurementTypeTotals: {
        type: string;
        totalAmount: number;
        monthlyTotals: number[];
        startRow: number;
        endRow: number;
        totalRow: number;
        categoryTotalRows: number[];
    }[] = [];

    // Process each procurement type
    Object.entries(groupedByProcurementType).forEach(
        ([isNonProcurement, items]: [string, typeof itemsWithCategory]) => {
            const procurementType =
                isNonProcurement === 'true'
                    ? 'NON-PROCUREMENT ITEMS'
                    : 'PROCUREMENT ITEMS';

            // Procurement Type Header Row
            worksheet.addRow({
                description: procurementType,
            });
            const procurementTypeHeaderRow = worksheet.getRow(currentRow);
            procurementTypeHeaderRow.font = {
                bold: true,
                name: 'Century Gothic',
                size: 10,
            };
            procurementTypeHeaderRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'ffffff' },
            };
            currentRow++;

            const procurementTypeStartRow = currentRow;
            const categoryTotalRows: number[] = [];

            // Group by category within procurement type
            const groupedByCategory = items.reduce((acc: any, item) => {
                const key = item.category?.id?.toString() || 'undefined';
                if (!acc[key]) acc[key] = [];
                acc[key].push(item);
                return acc;
            }, {});

            const groupedByExpenseAccount = Object.fromEntries(
                (
                    Object.entries(groupedByCategory) as [
                        string,
                        typeof itemsWithCategory,
                    ][]
                ).map(([key, value]) => {
                    const subGrouped = value.reduce(
                        (
                            acc: Record<string, typeof itemsWithCategory>,
                            item: (typeof itemsWithCategory)[number],
                        ) => {
                            const subKey =
                                item.priceList?.chart_of_account_id?.toString() ||
                                'undefined';
                            if (!acc[subKey]) {
                                acc[subKey] = [];
                            }
                            acc[subKey].push(item);
                            return acc;
                        },
                        {} as Record<string, typeof itemsWithCategory>,
                    );

                    return [key, subGrouped];
                }),
            );

            // Process each category
            Object.entries(groupedByExpenseAccount).forEach(
                ([categoryId, accounts]) => {
                    const categoryName = ppmpCategories.find(
                        (category) => category.id === Number(categoryId),
                    )?.name;

                    worksheet.addRow({
                        description: categoryName,
                    }).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'd0cece' },
                    };

                    currentRow++;
                    const itemRows: number[] = [];

                    Object.entries(accounts).forEach(
                        ([accountId, items]: [
                            string,
                            typeof itemsWithCategory,
                        ]) => {
                            worksheet.addRow({
                                description: chartOfAccounts.find(
                                    (account) =>
                                        account.id === Number(accountId),
                                )?.account_title,
                            }).fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'fbe4d5' },
                            };

                            currentRow++;

                            items.forEach(
                                (item: (typeof itemsWithCategory)[number]) => {
                                    itemRows.push(currentRow);
                                    const priceList = item.priceList;
                                    worksheet.addRow({
                                        expenseAccount: chartOfAccounts.find(
                                            (account) => {
                                                return (
                                                    account.id ===
                                                    priceList?.chart_of_account_id
                                                );
                                            },
                                        )?.account_title,
                                        itemNo: priceList?.item_number,
                                        description: priceList?.description,
                                        unitOfMeasurement:
                                            priceList?.unit_of_measurement,
                                        price: Number(priceList?.price),
                                        totalQuantity: {
                                            formula: `SUM(H${currentRow}, J${currentRow}, L${currentRow}, N${currentRow}, P${currentRow}, R${currentRow}, T${currentRow}, V${currentRow}, X${currentRow}, Z${currentRow}, AB${currentRow}, AD${currentRow})`,
                                        },
                                        totalAmount: {
                                            formula: `PRODUCT(E${currentRow}, F${currentRow})`,
                                        },
                                        janQuantity: Number(item.jan_qty),
                                        janAmount: Number(item.jan_amount),
                                        febQuantity: Number(item.feb_qty),
                                        febAmount: Number(item.feb_amount),
                                        marQuantity: Number(item.mar_qty),
                                        marAmount: Number(item.mar_amount),
                                        aprQuantity: Number(item.apr_qty),
                                        aprAmount: Number(item.apr_amount),
                                        mayQuantity: Number(item.may_qty),
                                        mayAmount: Number(item.may_amount),
                                        junQuantity: Number(item.jun_qty),
                                        junAmount: Number(item.jun_amount),
                                        julQuantity: Number(item.jul_qty),
                                        julAmount: Number(item.jul_amount),
                                        augQuantity: Number(item.aug_qty),
                                        augAmount: Number(item.aug_amount),
                                        sepQuantity: Number(item.sep_qty),
                                        sepAmount: Number(item.sep_amount),
                                        octQuantity: Number(item.oct_qty),
                                        octAmount: Number(item.oct_amount),
                                        novQuantity: Number(item.nov_qty),
                                        novAmount: Number(item.nov_amount),
                                        decQuantity: Number(item.dec_qty),
                                        decAmount: Number(item.dec_amount),
                                    });

                                    worksheet.getRow(currentRow).height = 30;

                                    // Format price column to show 2 decimal places
                                    const priceCell = worksheet.getCell(
                                        `E${currentRow}`,
                                    );
                                    priceCell.numFmt = '0.00';

                                    currentRow++;
                                },
                            );
                        },
                    );

                    const categoryTotalRow = currentRow;
                    categoryTotalRows.push(categoryTotalRow);

                    const buildCategoryFormula = (column: string) =>
                        `SUM(${itemRows.map((row) => `${column}${row}`).join(',')})`;

                    worksheet.addRow({
                        description: `${categoryName} - TOTAL`,
                        totalAmount: {
                            formula: buildCategoryFormula('G'),
                        },
                        janAmount: {
                            formula: buildCategoryFormula('I'),
                        },
                        febAmount: {
                            formula: buildCategoryFormula('K'),
                        },
                        marAmount: {
                            formula: buildCategoryFormula('M'),
                        },
                        aprAmount: {
                            formula: buildCategoryFormula('O'),
                        },
                        mayAmount: {
                            formula: buildCategoryFormula('Q'),
                        },
                        junAmount: {
                            formula: buildCategoryFormula('S'),
                        },
                        julAmount: {
                            formula: buildCategoryFormula('U'),
                        },
                        augAmount: {
                            formula: buildCategoryFormula('W'),
                        },
                        sepAmount: {
                            formula: buildCategoryFormula('Y'),
                        },
                        octAmount: {
                            formula: buildCategoryFormula('AA'),
                        },
                        novAmount: {
                            formula: buildCategoryFormula('AC'),
                        },
                        decAmount: {
                            formula: buildCategoryFormula('AE'),
                        },
                    }).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'fef2cb' },
                    };

                    currentRow++;
                },
            );

            const procurementTypeEndRow = currentRow - 1;

            // Procurement Type Total Row - Only sum category total rows
            const buildProcurementTypeFormula = (column: string) =>
                `SUM(${categoryTotalRows.map((row) => `${column}${row}`).join(',')})`;

            worksheet.addRow({
                description: `TOTAL - FOR ${procurementType}`,
                totalAmount: {
                    formula: buildProcurementTypeFormula('G'),
                },
                janAmount: {
                    formula: buildProcurementTypeFormula('I'),
                },
                febAmount: {
                    formula: buildProcurementTypeFormula('K'),
                },
                marAmount: {
                    formula: buildProcurementTypeFormula('M'),
                },
                aprAmount: {
                    formula: buildProcurementTypeFormula('O'),
                },
                mayAmount: {
                    formula: buildProcurementTypeFormula('Q'),
                },
                junAmount: {
                    formula: buildProcurementTypeFormula('S'),
                },
                julAmount: {
                    formula: buildProcurementTypeFormula('U'),
                },
                augAmount: {
                    formula: buildProcurementTypeFormula('W'),
                },
                sepAmount: {
                    formula: buildProcurementTypeFormula('Y'),
                },
                octAmount: {
                    formula: buildProcurementTypeFormula('AA'),
                },
                novAmount: {
                    formula: buildProcurementTypeFormula('AC'),
                },
                decAmount: {
                    formula: buildProcurementTypeFormula('AE'),
                },
            }).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'ffff00' },
            };
            const procurementTypeTotalRow = worksheet.getRow(currentRow);
            procurementTypeTotalRow.font = {
                bold: true,
                name: 'Century Gothic',
                size: 8,
            };

            // Save procurement type totals for grand total
            allProcurementTypeTotals.push({
                type: procurementType,
                totalAmount: 0, // Will be calculated by formula
                monthlyTotals: Array(12).fill(0), // Will be calculated by formula
                startRow: procurementTypeStartRow,
                endRow: procurementTypeEndRow,
                totalRow: currentRow,
                categoryTotalRows: [...categoryTotalRows],
            });

            currentRow++;
        },
    );

    // GRAND TOTAL Row - Only sum procurement type total rows
    const procurementTypeTotalRows = allProcurementTypeTotals.map(
        (pt) => pt.totalRow,
    );
    const buildFormula = (column: string) =>
        `SUM(${procurementTypeTotalRows.map((row) => `${column}${row}`).join(',')})`;
    worksheet.addRow({
        description: 'GRAND TOTAL - FOR THE AIP/PPA',
        totalAmount: {
            formula: buildFormula('G'),
        },
        janAmount: {
            formula: buildFormula('I'),
        },
        febAmount: {
            formula: buildFormula('K'),
        },
        marAmount: {
            formula: buildFormula('M'),
        },
        aprAmount: {
            formula: buildFormula('O'),
        },
        mayAmount: {
            formula: buildFormula('Q'),
        },
        junAmount: {
            formula: buildFormula('S'),
        },
        julAmount: {
            formula: buildFormula('U'),
        },
        augAmount: {
            formula: buildFormula('W'),
        },
        sepAmount: {
            formula: buildFormula('Y'),
        },
        octAmount: {
            formula: buildFormula('AA'),
        },
        novAmount: {
            formula: buildFormula('AC'),
        },
        decAmount: {
            formula: buildFormula('AE'),
        },
    }).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '00b050' },
    };
    const grandTotalRow = worksheet.getRow(currentRow);
    grandTotalRow.font = {
        bold: true,
        name: 'Century Gothic',
        size: 8,
    };
    grandTotalRow.alignment = {
        horizontal: 'center',
    };

    // first is by column styles
    // set all cols font and size
    worksheet.columns.forEach((column) => {
        column.font = {
            name: 'Century Gothic',
            size: 8,
        };
        column.alignment = {
            vertical: 'middle',
            wrapText: true,
        };
        column.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
        };
    });

    // set certain rows to font size 5
    [1, 2, 3, 4, 5].forEach((rowNumber) => {
        const column = worksheet.getColumn(rowNumber);
        column.font = {
            size: 5,
        };
    });

    // center certain fields
    [1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30].forEach(
        (columnNumber) => {
            const column = worksheet.getColumn(columnNumber);
            column.alignment = {
                ...column.alignment,
                horizontal: 'center',
            };
        },
    );

    [7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31].forEach(
        (columnNumber) => {
            const column = worksheet.getColumn(columnNumber);
            column.numFmt = '#,##0.00';
        },
    );

    // Set integer format (no decimals) for quantity columns
    [8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32].forEach(
        (columnNumber) => {
            const column = worksheet.getColumn(columnNumber);
            column.numFmt = '#,##0';
        },
    );

    const headerRow = worksheet.getRow(headerRowCount);

    headerRow.font = {
        bold: true,
        name: 'Century Gothic',
        size: 8,
    };
    headerRow.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true,
    };
    headerRow.height = 30;
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'deeaf6' },
    };

    [1, 2, 3, 4, 5].forEach((rowNumber) => {
        const row = worksheet.getRow(rowNumber);

        // Setting border to an empty object removes all borders
        row.border = {};
        row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'ffffff' },
        };
        row.alignment = {};
    });

    worksheet.mergeCells('B1:G2');
    worksheet.mergeCells('B3:G3');
    worksheet.mergeCells('B4:G4');
    worksheet.mergeCells('B5:G5');
    worksheet.mergeCells('H1:AE3');
    worksheet.mergeCells('H4:AE5');

    const officeName = worksheet.getCell('B1');
    const fundingSource = worksheet.getCell('B3'); // not the final name and is dynamic
    const aipRefCode = worksheet.getCell('B4');
    const ppaDesc = worksheet.getCell('B5');
    const headerTitle = worksheet.getCell('H1');
    const headerSubTitle = worksheet.getCell('H4');

    const fundingSourceSpacer = worksheet.getCell(
        fundingSource.row,
        String(Number(fundingSource.col) - 1),
    );
    const aipRefCodeSpacer = worksheet.getCell(
        aipRefCode.row,
        String(Number(aipRefCode.col) - 1),
    );
    const ppaDescSpacer = worksheet.getCell(
        ppaDesc.row,
        String(Number(ppaDesc.col) - 1),
    );

    // officeName.value = auth.user.name;
    officeName.value = auth.user.office?.acronym || auth.user.office?.name;
    officeName.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'ffff00' },
    };
    officeName.font = {
        bold: true,
        size: 12,
        name: 'Century Gothic',
    };
    officeName.alignment = {
        vertical: 'middle',
    };

    const selectedFunding = fundingSources.find(
        (fs) => fs.id === selectedFundingSourceId,
    );
    fundingSource.value = `${selectedFunding?.code || 'N/A'}`;
    aipRefCode.value = `${aipEntry?.ppa?.full_code || 'N/A'}`;
    ppaDesc.value = `${aipEntry?.ppa?.name || 'N/A'}`;
    headerTitle.value = 'PROVINCIAL GOVERNMENT OF LA UNION';
    headerSubTitle.value = `PROJECT PROCUREMENT MANAGEMENT PLAN(PPMP) CY ${fiscalYear.year}`;

    [
        fundingSource,
        aipRefCode,
        ppaDesc,
        fundingSourceSpacer,
        aipRefCodeSpacer,
        ppaDescSpacer,
    ].map(
        (cell) => (
            (cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '92d050' },
            }),
            (cell.font = {
                bold: true,
                size: 8,
                name: 'Century Gothic',
                underline: true,
            })
        ),
    );

    headerTitle.alignment = {
        vertical: 'bottom',
        horizontal: 'center',
    };
    headerTitle.font = { bold: true, size: 30, name: 'Century Gothic' };

    headerSubTitle.alignment = {
        vertical: 'top',
        horizontal: 'center',
    };
    headerSubTitle.font = { bold: true, size: 20, name: 'Century Gothic' };

    const buf = await workbook.xlsx.writeBuffer();

    saveAs(new Blob([buf]), 'PPMP_Export.xlsx');
}

import { centuryGothicBase64 } from '@/fonts/CenturyGothic';
import { centuryGothicBoldBase64 } from '@/fonts/CenturyGothicBold';

export async function exportToPrint({
    filteredPpmpItems,
    priceLists,
    ppmpCategories,
    chartOfAccounts,
    aipEntry,
    fundingSources,
    selectedFundingSourceId,
    auth,
    fiscalYear,
}: ExportToExcelProps) {
    const longBondPaper = [8.5, 13];
    const convertInchToMm = (inch) => inch.map((value) => value * 25.4);

    // 1. Setup Document (Landscape, Long Bond Paper / 13 inches wide)
    const doc = new jsPDF('l', 'mm', convertInchToMm(longBondPaper));

    // 2. Register Custom Fonts (Regular and Bold)
    doc.addFileToVFS('CenturyGothic.ttf', centuryGothicBase64);
    doc.addFont('CenturyGothic.ttf', 'CenturyGothic', 'normal');
    doc.addFileToVFS('CenturyGothic-Bold.ttf', centuryGothicBoldBase64);
    doc.addFont('CenturyGothic-Bold.ttf', 'CenturyGothic', 'bold');

    doc.setFont('CenturyGothic');

    const selectedFunding = fundingSources.find(
        (fs) => fs.id === selectedFundingSourceId,
    );

    const tableBody = [];

    // --- DATA PREPARATION ---
    // Join filteredPpmpItems with priceLists and ppmpCategories to get is_non_procurement
    const itemsWithCategory = filteredPpmpItems.map((item) => {
        const priceList = priceLists.find(
            (pl) => pl.id === item.ppmp_price_list_id,
        );
        const category = priceList
            ? ppmpCategories.find((c) => c.id === priceList.ppmp_category_id)
            : null;
        return {
            ...item,
            priceList,
            category,
            is_non_procurement: category?.is_non_procurement ?? false,
        };
    });

    // Group by is_non_procurement first
    const groupedByProcurementType = itemsWithCategory.reduce(
        (acc, item) => {
            const key = item.is_non_procurement ? 'true' : 'false';
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
        },
        {} as Record<string, typeof itemsWithCategory>,
    );

    const allProcurementTypeTotals: {
        type: string;
        totalAmount: number;
        monthlyTotals: number[];
    }[] = [];

    Object.entries(groupedByProcurementType).forEach(
        ([isNonProcurement, items]: [string, typeof itemsWithCategory]) => {
            const procurementType =
                isNonProcurement === 'true'
                    ? 'NON-PROCUREMENT ITEMS'
                    : 'PROCUREMENT ITEMS';

            // Initialize procurement type totals
            let procurementTypeTotalAmount = 0;
            let procurementTypeMonthlyTotals = Array(12).fill(0);

            // Procurement Type Header Row
            tableBody.push({
                isProcurementType: true,
                data: Array(31)
                    .fill('')
                    .map((_, i) => (i === 2 ? procurementType : '')),
            });

            // Group by category within procurement type
            const groupedByCategory = items.reduce((acc: any, item) => {
                const key = item.category?.id?.toString() || 'undefined';
                if (!acc[key]) acc[key] = [];
                acc[key].push(item);
                return acc;
            }, {});

            Object.entries(groupedByCategory).forEach(
                ([categoryId, items]: [string, any]) => {
                    const categoryName =
                        ppmpCategories.find((c) => c.id === Number(categoryId))
                            ?.name || 'Unknown';

                    // Category Row (Gray)
                    tableBody.push({
                        isCategory: true,
                        data: Array(31)
                            .fill('')
                            .map((_, i) => (i === 2 ? categoryName : '')),
                    });

                    // Initialize category-level totals
                    let categoryTotalAmount = 0;
                    const categoryMonthlyTotals = Array(12).fill(0);
                    let categoryTotalPrice = 0;

                    const accounts = items.reduce((acc: any, item: any) => {
                        const key =
                            item.priceList?.chart_of_account_id?.toString() ||
                            'undefined';
                        if (!acc[key]) acc[key] = [];
                        acc[key].push(item);
                        return acc;
                    }, {});

                    Object.entries(accounts).forEach(
                        ([accountId, accountItems]) => {
                            const accountTitle =
                                chartOfAccounts.find(
                                    (a) => a.id === Number(accountId),
                                )?.account_title || 'Unknown';

                            // Account Row (Peach)
                            tableBody.push({
                                isAccount: true,
                                data: Array(31)
                                    .fill('')
                                    .map((_, i) =>
                                        i === 2 ? accountTitle : '',
                                    ),
                            });

                            accountItems.forEach((item) => {
                                const price = Number(
                                    item.priceList?.price || 0,
                                );

                                categoryTotalPrice += price;

                                // Array of monthly amounts to accumulate
                                const monthlyAmts = [
                                    item.jan_amount,
                                    item.feb_amount,
                                    item.mar_amount,
                                    item.apr_amount,
                                    item.may_amount,
                                    item.jun_amount,
                                    item.jul_amount,
                                    item.aug_amount,
                                    item.sep_amount,
                                    item.oct_amount,
                                    item.nov_amount,
                                    item.dec_amount,
                                ];

                                const totalQty = [
                                    item.jan_qty,
                                    item.feb_qty,
                                    item.mar_qty,
                                    item.apr_qty,
                                    item.may_qty,
                                    item.jun_qty,
                                    item.jul_qty,
                                    item.aug_qty,
                                    item.sep_qty,
                                    item.oct_qty,
                                    item.nov_qty,
                                    item.dec_qty,
                                ].reduce((a, b) => a + Number(b || 0), 0);

                                const totalAmt = price * totalQty;
                                categoryTotalAmount += totalAmt;

                                // Sum up monthly amounts
                                monthlyAmts.forEach((amt, idx) => {
                                    categoryMonthlyTotals[idx] += Number(
                                        amt || 0,
                                    );
                                });

                                tableBody.push({
                                    isItem: true,
                                    data: [
                                        accountTitle,
                                        item.priceList?.item_number,
                                        item.priceList?.description,
                                        item.priceList?.unit_of_measurement,
                                        price.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        }),
                                        totalQty,
                                        totalAmt.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        }),
                                        item.jan_qty,
                                        item.jan_amount?.toLocaleString(),
                                        item.feb_qty,
                                        item.feb_amount?.toLocaleString(),
                                        item.mar_qty,
                                        item.mar_amount?.toLocaleString(),
                                        item.apr_qty,
                                        item.apr_amount?.toLocaleString(),
                                        item.may_qty,
                                        item.may_amount?.toLocaleString(),
                                        item.jun_qty,
                                        item.jun_amount?.toLocaleString(),
                                        item.jul_qty,
                                        item.jul_amount?.toLocaleString(),
                                        item.aug_qty,
                                        item.aug_amount?.toLocaleString(),
                                        item.sep_qty,
                                        item.sep_amount?.toLocaleString(),
                                        item.oct_qty,
                                        item.oct_amount?.toLocaleString(),
                                        item.nov_qty,
                                        item.nov_amount?.toLocaleString(),
                                        item.dec_qty,
                                        item.dec_amount?.toLocaleString(),
                                    ],
                                });
                            });
                        },
                    );

                    // Category Total Row (Yellow) - Includes Monthly Column Totals
                    tableBody.push({
                        isTotal: true,
                        data: Array(31)
                            .fill('')
                            .map((_, i) => {
                                // Label
                                if (i === 2) return `${categoryName} - TOTAL`;

                                if (i === 4) {
                                    return categoryTotalPrice.toLocaleString(
                                        undefined,
                                        {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        },
                                    );
                                }

                                // Category Total
                                if (i === 6) {
                                    return categoryTotalAmount.toLocaleString(
                                        undefined,
                                        {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        },
                                    );
                                }

                                // Monthly Amount Columns
                                const monthAmtCols = [
                                    8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28,
                                    30,
                                ];
                                if (monthAmtCols.includes(i)) {
                                    const monthIdx = (i - 8) / 2;
                                    const value =
                                        categoryMonthlyTotals[monthIdx] || 0;

                                    return value.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    });
                                }

                                return '';
                            }),
                    });

                    // Accumulate category totals into procurement type totals
                    procurementTypeTotalAmount += categoryTotalAmount;
                    categoryMonthlyTotals.forEach((amt, idx) => {
                        procurementTypeMonthlyTotals[idx] += amt;
                    });
                },
            );

            // Procurement Type Total Row
            tableBody.push({
                isProcurementTypeTotal: true,
                data: Array(31)
                    .fill('')
                    .map((_, i) => {
                        if (i === 2) return `TOTAL - FOR ${procurementType}`;

                        if (i === 6) {
                            return procurementTypeTotalAmount.toLocaleString(
                                undefined,
                                {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                },
                            );
                        }

                        // Monthly Amount Columns
                        const monthAmtCols = [
                            8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30,
                        ];
                        if (monthAmtCols.includes(i)) {
                            const monthIdx = (i - 8) / 2;
                            const value =
                                procurementTypeMonthlyTotals[monthIdx] || 0;
                            return value.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            });
                        }

                        return '';
                    }),
            });

            // Save procurement type totals for grand total
            allProcurementTypeTotals.push({
                type: procurementType,
                totalAmount: procurementTypeTotalAmount,
                monthlyTotals: [...procurementTypeMonthlyTotals],
            });
        },
    );

    // GRAND TOTAL Row
    const grandTotalAmount = allProcurementTypeTotals.reduce(
        (sum, pt) => sum + pt.totalAmount,
        0,
    );
    const grandMonthlyTotals = Array(12).fill(0);
    allProcurementTypeTotals.forEach((pt) => {
        pt.monthlyTotals.forEach((amt, idx) => {
            grandMonthlyTotals[idx] += amt;
        });
    });

    tableBody.push({
        isGrandTotal: true,
        data: Array(31)
            .fill('')
            .map((_, i) => {
                if (i === 2) return 'GRAND TOTAL - FOR THE AIP/PPA';

                if (i === 6) {
                    return grandTotalAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    });
                }

                // Monthly Amount Columns
                const monthAmtCols = [
                    8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30,
                ];
                if (monthAmtCols.includes(i)) {
                    const monthIdx = (i - 8) / 2;
                    const value = grandMonthlyTotals[monthIdx] || 0;
                    return value.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    });
                }

                return '';
            }),
    });

    // --- TABLE GENERATION ---
    autoTable(doc, {
        startY: 5,
        margin: { left: 5, right: 5, top: 5, bottom: 5 },
        showHead: 'firstPage' as any, // TypeScript bypass
        head: [
            [
                { content: '', styles: { fillColor: [255, 255, 255] } },
                {
                    content: `${auth.user.office?.acronym || auth.user.office?.name}`,
                    colSpan: 6,
                    rowSpan: 2,
                    styles: {
                        valign: 'middle',
                        fillColor: [255, 255, 0],
                        fontSize: 9,
                        halign: 'left',
                        fontStyle: 'bold',
                    },
                },
                {
                    content: 'PROVINCIAL GOVERNMENT OF LA UNION',
                    colSpan: 24,
                    rowSpan: 3,
                    styles: {
                        halign: 'center',
                        valign: 'bottom',
                        fontSize: 28,
                        fontStyle: 'bold',
                    },
                },
            ],
            [{ content: '', styles: { fillColor: [255, 255, 255] } }],
            [
                { content: '', styles: { fillColor: [146, 208, 80] } },
                {
                    content: `${selectedFunding?.code || 'N/A'}`,
                    colSpan: 6,
                    styles: {
                        fillColor: [146, 208, 80],
                        fontSize: 5,
                        halign: 'left',
                        fontStyle: 'bold',
                    },
                },
            ],
            [
                { content: '', styles: { fillColor: [146, 208, 80] } },
                {
                    content: `${aipEntry?.ppa?.full_code || 'N/A'}`,
                    colSpan: 6,
                    styles: {
                        fillColor: [146, 208, 80],
                        fontSize: 5,
                        halign: 'left',
                        fontStyle: 'bold',
                    },
                },
                {
                    content: `PROJECT PROCUREMENT MANAGEMENT PLAN(PPMP) CY ${fiscalYear.year}`,
                    colSpan: 24,
                    rowSpan: 2,
                    styles: {
                        halign: 'center',
                        valign: 'top',
                        fontSize: 16,
                        fontStyle: 'bold',
                    },
                },
            ],
            [
                { content: '', styles: { fillColor: [146, 208, 80] } },
                {
                    content: `${aipEntry?.ppa?.name || 'N/A'}`,
                    colSpan: 6,
                    styles: {
                        fillColor: [146, 208, 80],
                        fontSize: 5,
                        halign: 'left',
                        fontStyle: 'bold',
                    },
                },
            ],
            [
                'EXPENSE ACCOUNT',
                'Item No.',
                'Description',
                'Unit',
                'Price',
                'QTY',
                'TOTAL',
                'JAN-Q',
                'JAN',
                'FEB-Q',
                'FEB',
                'MAR-Q',
                'MAR',
                'APR-Q',
                'APR',
                'MAY-Q',
                'MAY',
                'JUN-Q',
                'JUN',
                'JUL-Q',
                'JUL',
                'AUG-Q',
                'AUG',
                'SEP-Q',
                'SEP',
                'OCT-Q',
                'OCT',
                'NOV-Q',
                'NOV',
                'DEC-Q',
                'DEC',
            ],
        ],
        body: tableBody.map((row) => row.data),
        theme: 'grid',
        styles: {
            font: 'CenturyGothic',
            fontStyle: 'normal',
            fontSize: 4.5,
            lineWidth: 0.1,
            lineColor: [0, 0, 0],
            halign: 'center',
            cellPadding: 0.5,
            textColor: [0, 0, 0],
        },
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontStyle: 'normal',
        },
        columnStyles: {
            0: { cellWidth: 17 },
            1: { cellWidth: 7 },
            2: { cellWidth: 'auto', halign: 'left' },
            3: { cellWidth: 10 },
        },
        didParseCell: (data) => {
            // Hide Borders for Top Header rows
            if (data.section === 'head' && data.row.index <= 4) {
                data.cell.styles.lineWidth = 0;
            }

            // Row 5 Header (Bold Column names)
            if (data.section === 'head' && data.row.index === 5) {
                data.cell.styles.fontSize = 5;
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = [222, 234, 246];
            }

            if (data.section === 'body') {
                const rowMeta: any = tableBody[data.row.index];

                // Highlight Quantity Columns (Green)
                const greenCols = [
                    5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29,
                ];
                if (greenCols.includes(data.column.index)) {
                    data.cell.styles.fillColor = [146, 208, 80];
                }

                // Metadata Styling (Bold Categorization)
                if (rowMeta?.isProcurementType) {
                    data.cell.styles.fillColor = [255, 255, 255];
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fontSize = 6;
                }
                if (rowMeta?.isCategory) {
                    data.cell.styles.fillColor = [208, 206, 206];
                    data.cell.styles.fontStyle = 'bold';
                }
                if (rowMeta?.isAccount) {
                    data.cell.styles.fillColor = [251, 228, 213];
                    data.cell.styles.fontStyle = 'bold';
                }
                if (rowMeta?.isTotal) {
                    data.cell.styles.fillColor = [254, 242, 203];
                    data.cell.styles.fontStyle = 'bold';
                }
                if (rowMeta?.isProcurementTypeTotal) {
                    data.cell.styles.fillColor = [255, 255, 0];
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fontSize = 5;
                }
                if (rowMeta?.isGrandTotal) {
                    data.cell.styles.fillColor = [0, 176, 80];
                    data.cell.styles.textColor = [0, 0, 0];
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fontSize = 5;
                }
            }
        },
    });

    // 4. Final Output and Print
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.onload = () => {
        iframe.contentWindow.print();
    };
}

export async function exportToPDF({
    filteredPpmpItems,
    priceLists,
    ppmpCategories,
    chartOfAccounts,
    aipEntry,
    fundingSources,
    selectedFundingSourceId,
    auth,
    fiscalYear,
}: ExportToExcelProps) {
    const longBondPaper = [8.5, 13];
    const convertInchToMm = (inch) => inch.map((value) => value * 25.4);

    // 1. Setup Document (Landscape, Long Bond Paper / 13 inches wide)
    const doc = new jsPDF('l', 'mm', convertInchToMm(longBondPaper));

    // 2. Register Custom Fonts (Regular and Bold)
    doc.addFileToVFS('CenturyGothic.ttf', centuryGothicBase64);
    doc.addFont('CenturyGothic.ttf', 'CenturyGothic', 'normal');
    doc.addFileToVFS('CenturyGothic-Bold.ttf', centuryGothicBoldBase64);
    doc.addFont('CenturyGothic-Bold.ttf', 'CenturyGothic', 'bold');

    doc.setFont('CenturyGothic');

    const selectedFunding = fundingSources.find(
        (fs) => fs.id === selectedFundingSourceId,
    );

    const tableBody = [];

    // --- DATA PREPARATION ---
    // Join filteredPpmpItems with priceLists and ppmpCategories to get is_non_procurement
    const itemsWithCategory = filteredPpmpItems.map((item) => {
        const priceList = priceLists.find(
            (pl) => pl.id === item.ppmp_price_list_id,
        );
        const category = priceList
            ? ppmpCategories.find((c) => c.id === priceList.ppmp_category_id)
            : null;
        return {
            ...item,
            priceList,
            category,
            is_non_procurement: category?.is_non_procurement ?? false,
        };
    });

    // Group by is_non_procurement first
    const groupedByProcurementType = itemsWithCategory.reduce(
        (acc, item) => {
            const key = item.is_non_procurement ? 'true' : 'false';
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
        },
        {} as Record<string, typeof itemsWithCategory>,
    );

    const allProcurementTypeTotals: {
        type: string;
        totalAmount: number;
        monthlyTotals: number[];
    }[] = [];

    Object.entries(groupedByProcurementType).forEach(
        ([isNonProcurement, items]: [string, typeof itemsWithCategory]) => {
            const procurementType =
                isNonProcurement === 'true'
                    ? 'NON-PROCUREMENT ITEMS'
                    : 'PROCUREMENT ITEMS';

            // Initialize procurement type totals
            let procurementTypeTotalAmount = 0;
            let procurementTypeMonthlyTotals = Array(12).fill(0);

            // Procurement Type Header Row
            tableBody.push({
                isProcurementType: true,
                data: Array(31)
                    .fill('')
                    .map((_, i) => (i === 2 ? procurementType : '')),
            });

            // Group by category within procurement type
            const groupedByCategory = items.reduce((acc: any, item) => {
                const key = item.category?.id?.toString() || 'undefined';
                if (!acc[key]) acc[key] = [];
                acc[key].push(item);
                return acc;
            }, {});

            Object.entries(groupedByCategory).forEach(([categoryId, items]) => {
                const categoryName =
                    ppmpCategories.find((c) => c.id === Number(categoryId))
                        ?.name || 'Unknown';

                // Category Row (Gray)
                tableBody.push({
                    isCategory: true,
                    data: Array(31)
                        .fill('')
                        .map((_, i) => (i === 2 ? categoryName : '')),
                });

                // Initialize category-level totals
                let categoryTotalAmount = 0;
                const categoryMonthlyTotals = Array(12).fill(0);
                let categoryTotalPrice = 0;

                const accounts = items.reduce((acc, item) => {
                    const priceList = priceLists.find(
                        (pl) => pl.id === item.ppmp_price_list_id,
                    );
                    const key =
                        priceList?.chart_of_account_id?.toString() ||
                        'undefined';
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(item);
                    return acc;
                }, {});

                Object.entries(accounts).forEach(
                    ([accountId, accountItems]) => {
                        const accountTitle =
                            chartOfAccounts.find(
                                (a) => a.id === Number(accountId),
                            )?.account_title || 'Unknown';

                        // Account Row (Peach)
                        tableBody.push({
                            isAccount: true,
                            data: Array(31)
                                .fill('')
                                .map((_, i) => (i === 2 ? accountTitle : '')),
                        });

                        accountItems.forEach((item) => {
                            const priceList = priceLists.find(
                                (pl) => pl.id === item.ppmp_price_list_id,
                            );
                            const price = Number(priceList?.price || 0);
                            categoryTotalPrice += price;

                            // Array of monthly amounts to accumulate
                            const monthlyAmts = [
                                item.jan_amount,
                                item.feb_amount,
                                item.mar_amount,
                                item.apr_amount,
                                item.may_amount,
                                item.jun_amount,
                                item.jul_amount,
                                item.aug_amount,
                                item.sep_amount,
                                item.oct_amount,
                                item.nov_amount,
                                item.dec_amount,
                            ];

                            const totalQty = [
                                item.jan_qty,
                                item.feb_qty,
                                item.mar_qty,
                                item.apr_qty,
                                item.may_qty,
                                item.jun_qty,
                                item.jul_qty,
                                item.aug_qty,
                                item.sep_qty,
                                item.oct_qty,
                                item.nov_qty,
                                item.dec_qty,
                            ].reduce((a, b) => a + Number(b || 0), 0);

                            const totalAmt = price * totalQty;
                            categoryTotalAmount += totalAmt;

                            // Sum up monthly amounts
                            monthlyAmts.forEach((amt, idx) => {
                                categoryMonthlyTotals[idx] += Number(amt || 0);
                            });

                            tableBody.push({
                                isItem: true,
                                data: [
                                    accountTitle,
                                    priceList?.item_number,
                                    priceList?.description,
                                    priceList?.unit_of_measurement,
                                    price.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    }),
                                    totalQty,
                                    totalAmt.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    }),
                                    item.jan_qty,
                                    item.jan_amount?.toLocaleString(),
                                    item.feb_qty,
                                    item.feb_amount?.toLocaleString(),
                                    item.mar_qty,
                                    item.mar_amount?.toLocaleString(),
                                    item.apr_qty,
                                    item.apr_amount?.toLocaleString(),
                                    item.may_qty,
                                    item.may_amount?.toLocaleString(),
                                    item.jun_qty,
                                    item.jun_amount?.toLocaleString(),
                                    item.jul_qty,
                                    item.jul_amount?.toLocaleString(),
                                    item.aug_qty,
                                    item.aug_amount?.toLocaleString(),
                                    item.sep_qty,
                                    item.sep_amount?.toLocaleString(),
                                    item.oct_qty,
                                    item.oct_amount?.toLocaleString(),
                                    item.nov_qty,
                                    item.nov_amount?.toLocaleString(),
                                    item.dec_qty,
                                    item.dec_amount?.toLocaleString(),
                                ],
                            });
                        });
                    },
                );

                // Category Total Row (Yellow) - Includes Monthly Column Totals
                tableBody.push({
                    isTotal: true,
                    data: Array(31)
                        .fill('')
                        .map((_, i) => {
                            // Label
                            if (i === 2) return `${categoryName} - TOTAL`;

                            if (i === 4) {
                                return categoryTotalPrice.toLocaleString(
                                    undefined,
                                    {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    },
                                );
                            }

                            // Category Total
                            if (i === 6) {
                                return categoryTotalAmount.toLocaleString(
                                    undefined,
                                    {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    },
                                );
                            }

                            // Monthly Amount Columns
                            const monthAmtCols = [
                                8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30,
                            ];
                            if (monthAmtCols.includes(i)) {
                                const monthIdx = (i - 8) / 2;
                                const value =
                                    categoryMonthlyTotals[monthIdx] || 0;

                                return value.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                });
                            }

                            return '';
                        }),
                });

                // Accumulate category totals into procurement type totals
                procurementTypeTotalAmount += categoryTotalAmount;
                categoryMonthlyTotals.forEach((amt, idx) => {
                    procurementTypeMonthlyTotals[idx] += amt;
                });
            });

            // Procurement Type Total Row
            tableBody.push({
                isProcurementTypeTotal: true,
                data: Array(31)
                    .fill('')
                    .map((_, i) => {
                        if (i === 2) return `TOTAL - FOR ${procurementType}`;

                        if (i === 6) {
                            return procurementTypeTotalAmount.toLocaleString(
                                undefined,
                                {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                },
                            );
                        }

                        // Monthly Amount Columns
                        const monthAmtCols = [
                            8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30,
                        ];
                        if (monthAmtCols.includes(i)) {
                            const monthIdx = (i - 8) / 2;
                            const value =
                                procurementTypeMonthlyTotals[monthIdx] || 0;
                            return value.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            });
                        }

                        return '';
                    }),
            });

            // Save procurement type totals for grand total
            allProcurementTypeTotals.push({
                type: procurementType,
                totalAmount: procurementTypeTotalAmount,
                monthlyTotals: [...procurementTypeMonthlyTotals],
            });
        },
    );

    // GRAND TOTAL Row
    const grandTotalAmount = allProcurementTypeTotals.reduce(
        (sum, pt) => sum + pt.totalAmount,
        0,
    );
    const grandMonthlyTotals = Array(12).fill(0);
    allProcurementTypeTotals.forEach((pt) => {
        pt.monthlyTotals.forEach((amt, idx) => {
            grandMonthlyTotals[idx] += amt;
        });
    });

    tableBody.push({
        isGrandTotal: true,
        data: Array(31)
            .fill('')
            .map((_, i) => {
                if (i === 2) return 'GRAND TOTAL - FOR THE AIP/PPA';

                if (i === 6) {
                    return grandTotalAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    });
                }

                // Monthly Amount Columns
                const monthAmtCols = [
                    8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30,
                ];
                if (monthAmtCols.includes(i)) {
                    const monthIdx = (i - 8) / 2;
                    const value = grandMonthlyTotals[monthIdx] || 0;
                    return value.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    });
                }

                return '';
            }),
    });

    // --- TABLE GENERATION ---
    autoTable(doc, {
        startY: 5,
        margin: { left: 5, right: 5, top: 5, bottom: 5 },
        showHead: 'firstPage' as any, // TypeScript bypass
        head: [
            [
                { content: '', styles: { fillColor: [255, 255, 255] } },
                {
                    content: `${auth.user.office?.acronym || auth.user.office?.name}`,
                    colSpan: 6,
                    rowSpan: 2,
                    styles: {
                        valign: 'middle',
                        fillColor: [255, 255, 0],
                        fontSize: 9,
                        halign: 'left',
                        fontStyle: 'bold',
                    },
                },
                {
                    content: 'PROVINCIAL GOVERNMENT OF LA UNION',
                    colSpan: 24,
                    rowSpan: 3,
                    styles: {
                        halign: 'center',
                        valign: 'bottom',
                        fontSize: 28,
                        fontStyle: 'bold',
                    },
                },
            ],
            [{ content: '', styles: { fillColor: [255, 255, 255] } }],
            [
                { content: '', styles: { fillColor: [146, 208, 80] } },
                {
                    content: `${selectedFunding?.code || 'N/A'}`,
                    colSpan: 6,
                    styles: {
                        fillColor: [146, 208, 80],
                        fontSize: 5,
                        halign: 'left',
                        fontStyle: 'bold',
                    },
                },
            ],
            [
                { content: '', styles: { fillColor: [146, 208, 80] } },
                {
                    content: `${aipEntry?.ppa?.full_code || 'N/A'}`,
                    colSpan: 6,
                    styles: {
                        fillColor: [146, 208, 80],
                        fontSize: 5,
                        halign: 'left',
                        fontStyle: 'bold',
                    },
                },
                {
                    content: `PROJECT PROCUREMENT MANAGEMENT PLAN(PPMP) CY ${fiscalYear.year}`,
                    colSpan: 24,
                    rowSpan: 2,
                    styles: {
                        halign: 'center',
                        valign: 'top',
                        fontSize: 16,
                        fontStyle: 'bold',
                    },
                },
            ],
            [
                { content: '', styles: { fillColor: [146, 208, 80] } },
                {
                    content: `${aipEntry?.ppa?.name || 'N/A'}`,
                    colSpan: 6,
                    styles: {
                        fillColor: [146, 208, 80],
                        fontSize: 5,
                        halign: 'left',
                        fontStyle: 'bold',
                    },
                },
            ],
            [
                'EXPENSE ACCOUNT',
                'Item No.',
                'Description',
                'Unit',
                'Price',
                'QTY',
                'TOTAL',
                'JAN-Q',
                'JAN',
                'FEB-Q',
                'FEB',
                'MAR-Q',
                'MAR',
                'APR-Q',
                'APR',
                'MAY-Q',
                'MAY',
                'JUN-Q',
                'JUN',
                'JUL-Q',
                'JUL',
                'AUG-Q',
                'AUG',
                'SEP-Q',
                'SEP',
                'OCT-Q',
                'OCT',
                'NOV-Q',
                'NOV',
                'DEC-Q',
                'DEC',
            ],
        ],
        body: tableBody.map((row) => row.data),
        theme: 'grid',
        styles: {
            font: 'CenturyGothic',
            fontStyle: 'normal',
            fontSize: 4.5,
            lineWidth: 0.1,
            lineColor: [0, 0, 0],
            halign: 'center',
            cellPadding: 0.5,
            textColor: [0, 0, 0],
        },
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontStyle: 'normal',
        },
        columnStyles: {
            0: { cellWidth: 17 },
            1: { cellWidth: 7 },
            2: { cellWidth: 'auto', halign: 'left' },
            3: { cellWidth: 10 },
        },
        didParseCell: (data) => {
            // Hide Borders for Top Header rows
            if (data.section === 'head' && data.row.index <= 4) {
                data.cell.styles.lineWidth = 0;
            }

            // Row 5 Header (Bold Column names)
            if (data.section === 'head' && data.row.index === 5) {
                data.cell.styles.fontSize = 5;
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = [222, 234, 246];
            }

            if (data.section === 'body') {
                const rowMeta = tableBody[data.row.index];

                // Highlight Quantity Columns (Green)
                const greenCols = [
                    5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29,
                ];
                if (greenCols.includes(data.column.index)) {
                    data.cell.styles.fillColor = [146, 208, 80];
                }

                // Metadata Styling (Bold Categorization)
                if (rowMeta?.isProcurementType) {
                    data.cell.styles.fillColor = [255, 255, 255];
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fontSize = 6;
                }
                if (rowMeta?.isCategory) {
                    data.cell.styles.fillColor = [208, 206, 206];
                    data.cell.styles.fontStyle = 'bold';
                }
                if (rowMeta?.isAccount) {
                    data.cell.styles.fillColor = [251, 228, 213];
                    data.cell.styles.fontStyle = 'bold';
                }
                if (rowMeta?.isTotal) {
                    data.cell.styles.fillColor = [254, 242, 203];
                    data.cell.styles.fontStyle = 'bold';
                }
                if (rowMeta?.isProcurementTypeTotal) {
                    data.cell.styles.fillColor = [255, 255, 0];
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fontSize = 5;
                }
                if (rowMeta?.isGrandTotal) {
                    data.cell.styles.fillColor = [0, 176, 80];
                    data.cell.styles.textColor = [0, 0, 0];
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fontSize = 5;
                }
            }
        },
    });

    const filename = `PPMP_Export_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
}
