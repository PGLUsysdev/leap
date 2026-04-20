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
} from '@/types/global';

interface ExportToExcelProps {
    filteredPpmpItems: Ppmp[];
    priceLists: PriceList[];
    ppmpCategories: PpmpCategory[];
    chartOfAccounts: ChartOfAccount[];
    aipEntry: AipEntry;
    fundingSources: FundingSource[];
    selectedFundingSource: number;
    auth: any;
}

export async function exportToExcel({
    filteredPpmpItems,
    priceLists,
    ppmpCategories,
    chartOfAccounts,
    aipEntry,
    fundingSources,
    selectedFundingSource,
    auth,
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

    // processing data
    const groupedByCategory = filteredPpmpItems.reduce(
        (acc, item) => {
            const priceList = priceLists.find(
                (pl) => pl.id === item.ppmp_price_list_id,
            );
            const key = priceList?.ppmp_category_id?.toString() || 'undefined';
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(item);
            return acc;
        },
        {} as Record<string, typeof filteredPpmpItems>,
    );
    const groupedByExpenseAccount = Object.fromEntries(
        Object.entries(groupedByCategory).map(([key, value]) => {
            const subGrouped = value.reduce(
                (acc, item) => {
                    const priceList = priceLists.find(
                        (pl) => pl.id === item.ppmp_price_list_id,
                    );
                    const subKey =
                        priceList?.chart_of_account_id?.toString() ||
                        'undefined';
                    if (!acc[subKey]) {
                        acc[subKey] = [];
                    }
                    acc[subKey].push(item);
                    return acc;
                },
                {} as Record<string, typeof value>,
            );

            return [key, subGrouped];
        }),
    );
    // console.log(groupedByExpenseAccount);
    // console.log(ppmpCategories);

    // Process each group
    Object.entries(groupedByExpenseAccount).forEach(
        ([categoryId, accounts]) => {
            // console.log(categoryId, accounts);

            worksheet.addRow({
                description: ppmpCategories.find(
                    (category) => category.id === Number(categoryId),
                )?.name,
            }).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'd0cece' },
            };

            currentRow++;

            Object.entries(accounts).forEach(([accountId, items]) => {
                // console.log(accountId, items);

                worksheet.addRow({
                    description: chartOfAccounts.find(
                        (account) => account.id === Number(accountId),
                    )?.account_title,
                }).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'fbe4d5' },
                };

                currentRow++;
                const groupStartRow = currentRow;

                items.forEach((item) => {
                    const priceList = priceLists.find(
                        (pl) => pl.id === item.ppmp_price_list_id,
                    );
                    worksheet.addRow({
                        expenseAccount: chartOfAccounts.find((account) => {
                            return (
                                account.id === priceList?.chart_of_account_id
                            );
                        })?.account_title,
                        itemNo: priceList?.item_number,
                        description: priceList?.description,
                        unitOfMeasurement: priceList?.unit_of_measurement,
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
                    const priceCell = worksheet.getCell(`E${currentRow}`);
                    priceCell.numFmt = '0.00';

                    currentRow++;
                });

                const groupEndRow = currentRow - 1;

                worksheet.addRow({
                    description: 'TOTAL',
                    totalAmount: {
                        formula: `SUM(G${groupStartRow}:G${groupEndRow})`,
                    },
                    janAmount: {
                        formula: `SUM(I${groupStartRow}:I${groupEndRow})`,
                    },
                    febAmount: {
                        formula: `SUM(K${groupStartRow}:K${groupEndRow})`,
                    },
                    marAmount: {
                        formula: `SUM(M${groupStartRow}:M${groupEndRow})`,
                    },
                    aprAmount: {
                        formula: `SUM(O${groupStartRow}:O${groupEndRow})`,
                    },
                    mayAmount: {
                        formula: `SUM(Q${groupStartRow}:Q${groupEndRow})`,
                    },
                    junAmount: {
                        formula: `SUM(S${groupStartRow}:S${groupEndRow})`,
                    },
                    julAmount: {
                        formula: `SUM(U${groupStartRow}:U${groupEndRow})`,
                    },
                    augAmount: {
                        formula: `SUM(W${groupStartRow}:W${groupEndRow})`,
                    },
                    sepAmount: {
                        formula: `SUM(Y${groupStartRow}:Y${groupEndRow})`,
                    },
                    octAmount: {
                        formula: `SUM(AA${groupStartRow}:AA${groupEndRow})`,
                    },
                    novAmount: {
                        formula: `SUM(AC${groupStartRow}:AC${groupEndRow})`,
                    },
                    decAmount: {
                        formula: `SUM(AE${groupStartRow}:AE${groupEndRow})`,
                    },
                }).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'fef2cb' },
                };

                currentRow++;
            });
        },
    );

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

    officeName.value = auth.user.name;
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
        (fs) => fs.id === selectedFundingSource,
    );
    fundingSource.value = `${selectedFunding?.code || 'N/A'}`;
    aipRefCode.value = `${aipEntry?.ppa?.full_code || 'N/A'}`;
    ppaDesc.value = `${aipEntry?.ppa?.name || 'N/A'}`;
    headerTitle.value = 'PROVINCIAL GOVERNMENT OF LA UNION';
    headerSubTitle.value = 'PROJECT PROCUREMENT MANAGEMENT PLAN(PPMP) CY 2026';

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
    selectedFundingSource,
    auth,
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
        (fs) => fs.id === selectedFundingSource,
    );

    const tableBody = [];

    // --- DATA PREPARATION ---
    const groupedByCategory = filteredPpmpItems.reduce((acc, item) => {
        const priceList = priceLists.find(
            (pl) => pl.id === item.ppmp_price_list_id,
        );
        const key = priceList?.ppmp_category_id?.toString() || 'undefined';
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});

    Object.entries(groupedByCategory).forEach(([categoryId, items]) => {
        const categoryName =
            ppmpCategories.find((c) => c.id === Number(categoryId))?.name ||
            'Unknown';

        // Category Row (Gray)
        tableBody.push({
            isCategory: true,
            data: Array(31)
                .fill('')
                .map((_, i) => (i === 2 ? categoryName : '')),
        });

        const accounts = items.reduce((acc, item) => {
            const priceList = priceLists.find(
                (pl) => pl.id === item.ppmp_price_list_id,
            );
            const key =
                priceList?.chart_of_account_id?.toString() || 'undefined';
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
        }, {});

        Object.entries(accounts).forEach(([accountId, accountItems]) => {
            const accountTitle =
                chartOfAccounts.find((a) => a.id === Number(accountId))
                    ?.account_title || 'Unknown';

            // Account Row (Peach)
            tableBody.push({
                isAccount: true,
                data: Array(31)
                    .fill('')
                    .map((_, i) => (i === 2 ? accountTitle : '')),
            });

            let groupTotalAmount = 0;
            // Initialize totals for the 12 month amount columns
            const monthlyTotals = Array(12).fill(0);

            accountItems.forEach((item) => {
                const priceList = priceLists.find(
                    (pl) => pl.id === item.ppmp_price_list_id,
                );
                const price = Number(priceList?.price || 0);

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
                groupTotalAmount += totalAmt;

                // Sum up monthly amounts
                monthlyAmts.forEach((amt, idx) => {
                    monthlyTotals[idx] += Number(amt || 0);
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

            // Total Row (Yellow) - Includes Monthly Column Totals
            tableBody.push({
                isTotal: true,
                data: Array(31)
                    .fill('')
                    .map((_, i) => {
                        if (i === 2) return 'TOTAL';
                        if (i === 6)
                            return groupTotalAmount.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            });

                        // Monthly Amount Columns are 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30
                        const monthAmtCols = [
                            8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30,
                        ];
                        if (monthAmtCols.includes(i)) {
                            const monthIdx = (i - 8) / 2;
                            return monthlyTotals[monthIdx] > 0
                                ? monthlyTotals[monthIdx].toLocaleString(
                                      undefined,
                                      {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                      },
                                  )
                                : '';
                        }
                        return '';
                    }),
            });
        });
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
                    content: `${auth.user.name}`,
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
                    content:
                        'PROJECT PROCUREMENT MANAGEMENT PLAN(PPMP) CY 2026',
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
    selectedFundingSource,
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
        (fs) => fs.id === selectedFundingSource,
    );

    const tableBody = [];

    // --- DATA PREPARATION ---
    const groupedByCategory = filteredPpmpItems.reduce((acc, item) => {
        const priceList = priceLists.find(
            (pl) => pl.id === item.ppmp_price_list_id,
        );
        const key = priceList?.ppmp_category_id?.toString() || 'undefined';
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});

    Object.entries(groupedByCategory).forEach(([categoryId, items]) => {
        const categoryName =
            ppmpCategories.find((c) => c.id === Number(categoryId))?.name ||
            'Unknown';

        // Category Row (Gray)
        tableBody.push({
            isCategory: true,
            data: Array(31)
                .fill('')
                .map((_, i) => (i === 2 ? categoryName : '')),
        });

        const accounts = items.reduce((acc, item) => {
            const priceList = priceLists.find(
                (pl) => pl.id === item.ppmp_price_list_id,
            );
            const key =
                priceList?.chart_of_account_id?.toString() || 'undefined';
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
        }, {});

        Object.entries(accounts).forEach(([accountId, accountItems]) => {
            const accountTitle =
                chartOfAccounts.find((a) => a.id === Number(accountId))
                    ?.account_title || 'Unknown';

            // Account Row (Peach)
            tableBody.push({
                isAccount: true,
                data: Array(31)
                    .fill('')
                    .map((_, i) => (i === 2 ? accountTitle : '')),
            });

            let groupTotalAmount = 0;
            // Initialize totals for the 12 month amount columns
            const monthlyTotals = Array(12).fill(0);

            accountItems.forEach((item) => {
                const priceList = priceLists.find(
                    (pl) => pl.id === item.ppmp_price_list_id,
                );
                const price = Number(priceList?.price || 0);

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
                groupTotalAmount += totalAmt;

                // Sum up monthly amounts
                monthlyAmts.forEach((amt, idx) => {
                    monthlyTotals[idx] += Number(amt || 0);
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

            // Total Row (Yellow) - Includes Monthly Column Totals
            tableBody.push({
                isTotal: true,
                data: Array(31)
                    .fill('')
                    .map((_, i) => {
                        if (i === 2) return 'TOTAL';
                        if (i === 6)
                            return groupTotalAmount.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            });

                        // Monthly Amount Columns are 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30
                        const monthAmtCols = [
                            8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30,
                        ];
                        if (monthAmtCols.includes(i)) {
                            const monthIdx = (i - 8) / 2;
                            return monthlyTotals[monthIdx] > 0
                                ? monthlyTotals[monthIdx].toLocaleString(
                                      undefined,
                                      {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                      },
                                  )
                                : '';
                        }
                        return '';
                    }),
            });
        });
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
                    content: 'NAME OF OFFICE',
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
                    content:
                        'PROJECT PROCUREMENT MANAGEMENT PLAN(PPMP) CY 2026',
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
            }
        },
    });

    const filename = `PPMP_Export_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
}
