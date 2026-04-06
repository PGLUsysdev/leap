import {
    PDFViewer,
    Page,
    Text,
    View,
    Document,
    StyleSheet,
} from '@react-pdf/renderer';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { App, FiscalYear } from '@/types/global';

import { useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { router, usePage } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';

interface PdfPreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: App[];
    fiscalYear: FiscalYear | null;
    offices: any[];
}

const COLUMN_WIDTHS = [5, 20, 5, 10, 5, 11, 4, 6, 4, 6, 4, 6, 4, 10];

const styles = StyleSheet.create({
    page: { padding: 30, fontFamily: 'Helvetica' },
    tableHeaderCell: {
        margin: 2,
        fontSize: 6,
        fontWeight: 'bold',
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    tableCell: {
        margin: 2,
        fontSize: 6.5,
        paddingVertical: 1,
        textAlign: 'center',
    },
    headerGroup: { flexDirection: 'column', padding: 0 },
    borderRight: { borderRightWidth: 1 },
    borderBottom: { borderBottomWidth: 1 },
    borderLeft: { borderLeftWidth: 1 },
    borderTop: { borderTopWidth: 1 },
    row: { flexDirection: 'row' },
    centered: { justifyContent: 'center', alignItems: 'center' },
    flex1: { flex: 1 },
});

const formatNumber = (value: number | string | undefined) => {
    if (value === undefined || value === null) return '-';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num === 0) return '-';
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
};

const MyDocument = ({
    data,
    fiscalYear,
    officeLabel, // Added prop to make the header work
}: {
    data: App[];
    fiscalYear: FiscalYear;
    officeLabel: string;
}) => {
    const getWidth = (index: number) => `${COLUMN_WIDTHS[index]}%`;

    const TitleRow = ({
        title,
        isCategory,
    }: {
        title: string;
        isCategory: boolean;
    }) => (
        <View
            style={[
                styles.row,
                styles.borderBottom,
                { backgroundColor: isCategory ? '#e2e8f0' : '#f8fafc' },
            ]}
        >
            <View
                style={[
                    { width: getWidth(0) },
                    styles.borderLeft,
                    styles.borderRight,
                ]}
            >
                <Text style={styles.tableCell} />
            </View>
            <View style={[{ width: getWidth(1) }, styles.borderRight]}>
                <Text
                    style={[
                        styles.tableCell,
                        {
                            textAlign: 'left',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                        },
                    ]}
                >
                    {title}
                </Text>
            </View>
            {COLUMN_WIDTHS.slice(2).map((_, i) => (
                <View
                    key={i}
                    style={[{ width: getWidth(i + 2) }, styles.borderRight]}
                >
                    <Text style={styles.tableCell} />
                </View>
            ))}
        </View>
    );

    return (
        <Document title="">
            <Page size={[612, 936]} orientation="landscape" style={styles.page}>
                <View style={{ gap: 20 }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold' }}>
                        FDP Form 4a - Annual Procurement Plan or Procurement
                        List
                    </Text>
                    <View
                        fixed
                        style={{ marginBottom: 10, textAlign: 'center' }}
                    >
                        <Text style={{ fontSize: 10, fontWeight: 'bold' }}>
                            ANNUAL PROCUREMENT PLAN
                        </Text>
                        <Text style={{ fontSize: 10, fontWeight: 'bold' }}>
                            FOR THE YEAR {fiscalYear.year}
                        </Text>
                    </View>
                </View>

                <View fixed>
                    <View
                        style={[
                            styles.row,
                            styles.borderTop,
                            styles.borderBottom,
                            { height: 40 },
                        ]}
                    >
                        <View
                            style={{
                                width: `${COLUMN_WIDTHS.slice(0, 5).reduce((a, b) => a + b, 0)}%`,
                                borderLeftWidth: 1,
                                borderRightWidth: 1,
                                justifyContent: 'center',
                            }}
                        >
                            <Text
                                style={[
                                    styles.tableHeaderCell,
                                    {
                                        textTransform: 'none',
                                        textAlign: 'left',
                                    },
                                ]}
                            >
                                Province, City or Municipality: La Union
                            </Text>
                            <Text
                                style={[
                                    styles.tableHeaderCell,
                                    {
                                        textTransform: 'none',
                                        textAlign: 'left',
                                    },
                                ]}
                            >
                                Plan Control No.
                            </Text>
                            <Text
                                style={[
                                    styles.tableHeaderCell,
                                    {
                                        textTransform: 'none',
                                        textAlign: 'left',
                                    },
                                ]}
                            >
                                Department / Office: {officeLabel}
                            </Text>
                        </View>

                        <View
                            style={[
                                styles.headerGroup,
                                {
                                    width: `${COLUMN_WIDTHS[5]}%`,
                                    borderRightWidth: 1,
                                },
                            ]}
                        >
                            <View
                                style={{
                                    borderBottomWidth: 1,
                                    flex: 1,
                                    justifyContent: 'center',
                                }}
                            >
                                <Text style={styles.tableHeaderCell}>
                                    Planned Amount
                                </Text>
                            </View>
                            <View style={{ flex: 1, justifyContent: 'center' }}>
                                <Text style={styles.tableHeaderCell}>
                                    Regular
                                </Text>
                            </View>
                        </View>

                        <View
                            style={[
                                styles.headerGroup,
                                {
                                    width: `${COLUMN_WIDTHS.slice(6, 10).reduce((a, b) => a + b, 0)}%`,
                                    borderRightWidth: 1,
                                },
                            ]}
                        >
                            <View
                                style={{
                                    borderBottomWidth: 1,
                                    flex: 1,
                                    justifyContent: 'center',
                                }}
                            >
                                <Text style={styles.tableHeaderCell}></Text>
                            </View>
                            <View style={{ flexDirection: 'row', flex: 1 }}>
                                <View
                                    style={{
                                        width: '50%',
                                        borderRightWidth: 1,
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text style={styles.tableHeaderCell}>
                                        Contingency
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        width: '50%',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text style={styles.tableHeaderCell}>
                                        Total
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View
                            style={{
                                width: `${COLUMN_WIDTHS.slice(10, 14).reduce((a, b) => a + b, 0)}%`,
                                borderRightWidth: 1,
                                justifyContent: 'center',
                                backgroundColor: '#f9f9f9',
                            }}
                        >
                            <Text
                                style={[
                                    styles.tableHeaderCell,
                                    { textAlign: 'left', marginLeft: 5 },
                                ]}
                            >
                                DATE SUBMITTED: ________________
                            </Text>
                        </View>
                    </View>

                    <View
                        style={[
                            styles.row,
                            styles.borderBottom,
                            { height: 40 },
                        ]}
                    >
                        <View
                            style={[
                                { width: `${COLUMN_WIDTHS[0]}%` },
                                styles.borderLeft,
                                styles.borderRight,
                                styles.centered,
                            ]}
                        >
                            <Text style={styles.tableHeaderCell}>Item No.</Text>
                        </View>
                        <View
                            style={[
                                { width: `${COLUMN_WIDTHS[1]}%` },
                                styles.borderRight,
                                styles.centered,
                            ]}
                        >
                            <Text style={styles.tableHeaderCell}>
                                Description
                            </Text>
                        </View>
                        <View
                            style={[
                                { width: `${COLUMN_WIDTHS[2]}%` },
                                styles.borderRight,
                                styles.centered,
                            ]}
                        >
                            <Text style={styles.tableHeaderCell}>UNIT</Text>
                        </View>
                        <View
                            style={[
                                { width: `${COLUMN_WIDTHS[3]}%` },
                                styles.borderRight,
                                styles.centered,
                            ]}
                        >
                            <Text style={styles.tableHeaderCell}>
                                UNIT COST
                            </Text>
                        </View>
                        <View
                            style={[
                                { width: `${COLUMN_WIDTHS[4]}%` },
                                styles.borderRight,
                                styles.centered,
                            ]}
                        >
                            <Text style={styles.tableHeaderCell}>QTY</Text>
                        </View>
                        <View
                            style={[
                                { width: `${COLUMN_WIDTHS[5]}%` },
                                styles.borderRight,
                                styles.centered,
                            ]}
                        >
                            <Text style={styles.tableHeaderCell}>
                                TOTAL COST
                            </Text>
                        </View>

                        <View
                            style={[
                                styles.headerGroup,
                                {
                                    width: `${COLUMN_WIDTHS.slice(6, 16).reduce((a, b) => a + b, 0)}%`,
                                },
                            ]}
                        >
                            <View
                                style={{
                                    borderBottomWidth: 1,
                                    borderRightWidth: 1,
                                    justifyContent: 'center',
                                }}
                            >
                                <Text style={styles.tableHeaderCell}>
                                    DISTRIBUTION
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row', flex: 1 }}>
                                {[
                                    '1ST QUARTER',
                                    '2ND QUARTER',
                                    '3RD QUARTER',
                                    '4TH QUARTER',
                                ].map((q, idx) => {
                                    const startIdx = 6 + idx * 2;
                                    const groupWidth =
                                        COLUMN_WIDTHS[startIdx] +
                                        COLUMN_WIDTHS[startIdx + 1];
                                    const parentWidth = COLUMN_WIDTHS.slice(
                                        6,
                                        14,
                                    ).reduce((a, b) => a + b, 0);
                                    return (
                                        <View
                                            key={q}
                                            style={{
                                                width: `${(groupWidth / parentWidth) * 100}%`,
                                            }}
                                        >
                                            <View
                                                style={[
                                                    styles.borderBottom,
                                                    styles.borderRight,
                                                    styles.centered,
                                                    { flex: 1 },
                                                ]}
                                            >
                                                <Text
                                                    style={
                                                        styles.tableHeaderCell
                                                    }
                                                >
                                                    {q}
                                                </Text>
                                            </View>
                                            <View style={styles.row}>
                                                <View
                                                    style={[
                                                        {
                                                            width: `${(COLUMN_WIDTHS[startIdx] / groupWidth) * 100}%`,
                                                        },
                                                        styles.borderRight,
                                                        styles.centered,
                                                    ]}
                                                >
                                                    <Text
                                                        style={
                                                            styles.tableHeaderCell
                                                        }
                                                    >
                                                        Qty
                                                    </Text>
                                                </View>
                                                <View
                                                    style={[
                                                        {
                                                            width: `${(COLUMN_WIDTHS[startIdx + 1] / groupWidth) * 100}%`,
                                                        },
                                                        styles.borderRight,
                                                        styles.centered,
                                                    ]}
                                                >
                                                    <Text
                                                        style={
                                                            styles.tableHeaderCell
                                                        }
                                                    >
                                                        Amount
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    </View>
                </View>

                {Object.entries(data).map(
                    ([categoryName, chartOfAccounts]: [string, any]) => {
                        const categoryItems = Object.values(
                            chartOfAccounts,
                        ).flat() as any[];
                        const catTotals = {
                            amt: categoryItems.reduce(
                                (sum, item) =>
                                    sum + (Number(item.total_amount) || 0),
                                0,
                            ),
                            q1: categoryItems.reduce(
                                (sum, item) =>
                                    sum + (Number(item.q1_amount) || 0),
                                0,
                            ),
                            q2: categoryItems.reduce(
                                (sum, item) =>
                                    sum + (Number(item.q2_amount) || 0),
                                0,
                            ),
                            q3: categoryItems.reduce(
                                (sum, item) =>
                                    sum + (Number(item.q3_amount) || 0),
                                0,
                            ),
                            q4: categoryItems.reduce(
                                (sum, item) =>
                                    sum + (Number(item.q4_amount) || 0),
                                0,
                            ),
                        };

                        return (
                            <View key={categoryName} break={false}>
                                <TitleRow
                                    title={categoryName}
                                    isCategory={true}
                                />
                                {Object.entries(chartOfAccounts).map(
                                    ([accountTitle, items]: [string, any]) => (
                                        <View key={accountTitle}>
                                            <TitleRow
                                                title={accountTitle}
                                                isCategory={false}
                                            />
                                            {items.map(
                                                (item: any, index: number) => (
                                                    <View
                                                        key={index}
                                                        style={[
                                                            styles.row,
                                                            styles.borderBottom,
                                                        ]}
                                                        wrap={false}
                                                    >
                                                        <View
                                                            style={[
                                                                {
                                                                    width: getWidth(
                                                                        0,
                                                                    ),
                                                                },
                                                                styles.borderLeft,
                                                                styles.borderRight,
                                                            ]}
                                                        >
                                                            <Text
                                                                style={
                                                                    styles.tableCell
                                                                }
                                                            >
                                                                {index + 1}
                                                            </Text>
                                                        </View>
                                                        <View
                                                            style={[
                                                                {
                                                                    width: getWidth(
                                                                        1,
                                                                    ),
                                                                },
                                                                styles.borderRight,
                                                            ]}
                                                        >
                                                            <Text
                                                                style={[
                                                                    styles.tableCell,
                                                                    {
                                                                        textAlign:
                                                                            'left',
                                                                    },
                                                                ]}
                                                            >
                                                                {
                                                                    item
                                                                        .ppmp_price_list
                                                                        ?.description
                                                                }
                                                            </Text>
                                                        </View>
                                                        <View
                                                            style={[
                                                                {
                                                                    width: getWidth(
                                                                        2,
                                                                    ),
                                                                },
                                                                styles.borderRight,
                                                            ]}
                                                        >
                                                            <Text
                                                                style={
                                                                    styles.tableCell
                                                                }
                                                            >
                                                                {
                                                                    item
                                                                        .ppmp_price_list
                                                                        ?.unit_of_measurement
                                                                }
                                                            </Text>
                                                        </View>
                                                        <View
                                                            style={[
                                                                {
                                                                    width: getWidth(
                                                                        3,
                                                                    ),
                                                                },
                                                                styles.borderRight,
                                                            ]}
                                                        >
                                                            <Text
                                                                style={[
                                                                    styles.tableCell,
                                                                    {
                                                                        textAlign:
                                                                            'right',
                                                                    },
                                                                ]}
                                                            >
                                                                {formatNumber(
                                                                    item
                                                                        .ppmp_price_list
                                                                        ?.price,
                                                                )}
                                                            </Text>
                                                        </View>
                                                        <View
                                                            style={[
                                                                {
                                                                    width: getWidth(
                                                                        4,
                                                                    ),
                                                                },
                                                                styles.borderRight,
                                                            ]}
                                                        >
                                                            <Text
                                                                style={
                                                                    styles.tableCell
                                                                }
                                                            >
                                                                {item.total_qty}
                                                            </Text>
                                                        </View>
                                                        <View
                                                            style={[
                                                                {
                                                                    width: getWidth(
                                                                        5,
                                                                    ),
                                                                },
                                                                styles.borderRight,
                                                            ]}
                                                        >
                                                            <Text
                                                                style={[
                                                                    styles.tableCell,
                                                                    {
                                                                        textAlign:
                                                                            'right',
                                                                    },
                                                                ]}
                                                            >
                                                                {formatNumber(
                                                                    item.total_amount,
                                                                )}
                                                            </Text>
                                                        </View>
                                                        <View
                                                            style={[
                                                                {
                                                                    width: getWidth(
                                                                        6,
                                                                    ),
                                                                },
                                                                styles.borderRight,
                                                            ]}
                                                        >
                                                            <Text
                                                                style={
                                                                    styles.tableCell
                                                                }
                                                            >
                                                                {item.q1_qty ||
                                                                    '-'}
                                                            </Text>
                                                        </View>
                                                        <View
                                                            style={[
                                                                {
                                                                    width: getWidth(
                                                                        7,
                                                                    ),
                                                                },
                                                                styles.borderRight,
                                                            ]}
                                                        >
                                                            <Text
                                                                style={[
                                                                    styles.tableCell,
                                                                    {
                                                                        textAlign:
                                                                            'right',
                                                                    },
                                                                ]}
                                                            >
                                                                {formatNumber(
                                                                    item.q1_amount,
                                                                )}
                                                            </Text>
                                                        </View>
                                                        <View
                                                            style={[
                                                                {
                                                                    width: getWidth(
                                                                        8,
                                                                    ),
                                                                },
                                                                styles.borderRight,
                                                            ]}
                                                        >
                                                            <Text
                                                                style={
                                                                    styles.tableCell
                                                                }
                                                            >
                                                                {item.q2_qty ||
                                                                    '-'}
                                                            </Text>
                                                        </View>
                                                        <View
                                                            style={[
                                                                {
                                                                    width: getWidth(
                                                                        9,
                                                                    ),
                                                                },
                                                                styles.borderRight,
                                                            ]}
                                                        >
                                                            <Text
                                                                style={[
                                                                    styles.tableCell,
                                                                    {
                                                                        textAlign:
                                                                            'right',
                                                                    },
                                                                ]}
                                                            >
                                                                {formatNumber(
                                                                    item.q2_amount,
                                                                )}
                                                            </Text>
                                                        </View>
                                                        <View
                                                            style={[
                                                                {
                                                                    width: getWidth(
                                                                        10,
                                                                    ),
                                                                },
                                                                styles.borderRight,
                                                            ]}
                                                        >
                                                            <Text
                                                                style={
                                                                    styles.tableCell
                                                                }
                                                            >
                                                                {item.q3_qty ||
                                                                    '-'}
                                                            </Text>
                                                        </View>
                                                        <View
                                                            style={[
                                                                {
                                                                    width: getWidth(
                                                                        11,
                                                                    ),
                                                                },
                                                                styles.borderRight,
                                                            ]}
                                                        >
                                                            <Text
                                                                style={[
                                                                    styles.tableCell,
                                                                    {
                                                                        textAlign:
                                                                            'right',
                                                                    },
                                                                ]}
                                                            >
                                                                {formatNumber(
                                                                    item.q3_amount,
                                                                )}
                                                            </Text>
                                                        </View>
                                                        <View
                                                            style={[
                                                                {
                                                                    width: getWidth(
                                                                        12,
                                                                    ),
                                                                },
                                                                styles.borderRight,
                                                            ]}
                                                        >
                                                            <Text
                                                                style={
                                                                    styles.tableCell
                                                                }
                                                            >
                                                                {item.q4_qty ||
                                                                    '-'}
                                                            </Text>
                                                        </View>
                                                        <View
                                                            style={[
                                                                {
                                                                    width: getWidth(
                                                                        13,
                                                                    ),
                                                                },
                                                                styles.borderRight,
                                                            ]}
                                                        >
                                                            <Text
                                                                style={[
                                                                    styles.tableCell,
                                                                    {
                                                                        textAlign:
                                                                            'right',
                                                                    },
                                                                ]}
                                                            >
                                                                {formatNumber(
                                                                    item.q4_amount,
                                                                )}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                ),
                                            )}
                                        </View>
                                    ),
                                )}
                                <View
                                    style={[
                                        styles.row,
                                        styles.borderBottom,
                                        { backgroundColor: '#cbd5e1' },
                                    ]}
                                    wrap={false}
                                >
                                    <View
                                        style={[
                                            { width: getWidth(0) },
                                            styles.borderLeft,
                                            styles.borderRight,
                                        ]}
                                    >
                                        <Text style={styles.tableCell} />
                                    </View>
                                    <View
                                        style={[
                                            { width: getWidth(1) },
                                            styles.borderRight,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.tableCell,
                                                {
                                                    fontWeight: 'bold',
                                                    textAlign: 'left',
                                                },
                                            ]}
                                        >
                                            {categoryName.toUpperCase()} - TOTAL
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            {
                                                width: `${COLUMN_WIDTHS.slice(2, 5).reduce((a, b) => a + b, 0)}%`,
                                            },
                                            styles.borderRight,
                                        ]}
                                    >
                                        <Text style={styles.tableCell} />
                                    </View>
                                    <View
                                        style={[
                                            { width: getWidth(5) },
                                            styles.borderRight,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.tableCell,
                                                {
                                                    fontWeight: 'bold',
                                                    textAlign: 'right',
                                                },
                                            ]}
                                        >
                                            {formatNumber(catTotals.amt)}
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            { width: getWidth(6) },
                                            styles.borderRight,
                                        ]}
                                    >
                                        <Text style={styles.tableCell} />
                                    </View>
                                    <View
                                        style={[
                                            { width: getWidth(7) },
                                            styles.borderRight,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.tableCell,
                                                {
                                                    fontWeight: 'bold',
                                                    textAlign: 'right',
                                                },
                                            ]}
                                        >
                                            {formatNumber(catTotals.q1)}
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            { width: getWidth(8) },
                                            styles.borderRight,
                                        ]}
                                    >
                                        <Text style={styles.tableCell} />
                                    </View>
                                    <View
                                        style={[
                                            { width: getWidth(9) },
                                            styles.borderRight,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.tableCell,
                                                {
                                                    fontWeight: 'bold',
                                                    textAlign: 'right',
                                                },
                                            ]}
                                        >
                                            {formatNumber(catTotals.q2)}
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            { width: getWidth(10) },
                                            styles.borderRight,
                                        ]}
                                    >
                                        <Text style={styles.tableCell} />
                                    </View>
                                    <View
                                        style={[
                                            { width: getWidth(11) },
                                            styles.borderRight,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.tableCell,
                                                {
                                                    fontWeight: 'bold',
                                                    textAlign: 'right',
                                                },
                                            ]}
                                        >
                                            {formatNumber(catTotals.q3)}
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            { width: getWidth(12) },
                                            styles.borderRight,
                                        ]}
                                    >
                                        <Text style={styles.tableCell} />
                                    </View>
                                    <View
                                        style={[
                                            { width: getWidth(13) },
                                            styles.borderRight,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.tableCell,
                                                {
                                                    fontWeight: 'bold',
                                                    textAlign: 'right',
                                                },
                                            ]}
                                        >
                                            {formatNumber(catTotals.q4)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        );
                    },
                )}

                <View
                    fixed
                    style={{
                        position: 'absolute',
                        bottom: 20,
                        width: '100%',
                        textAlign: 'center',
                    }}
                >
                    <Text
                        style={{ fontSize: 8 }}
                        render={({ pageNumber, totalPages }) =>
                            `Page ${pageNumber} of ${totalPages}`
                        }
                    />
                </View>
            </Page>
        </Document>
    );
};

export default function PdfPreviewDialog({
    open,
    onOpenChange,
    data,
    fiscalYear,
    offices,
}: PdfPreviewDialogProps) {
    const { auth } = usePage().props as any;
    const [isReloading, setIsReloading] = useState(false);
    const [selectedOfficeId, setSelectedOfficeId] = useState<string>('all');

    const isBACSU = auth.user.office_id === 4 || auth.user.role === 'admin';

    const handleOfficeChange = (officeId: string) => {
        if (!fiscalYear) return;
        setSelectedOfficeId(officeId);
        setIsReloading(true);
        router.reload({
            only: ['app'],
            data: { fiscal_year_id: fiscalYear.id, office_id: officeId },
            onFinish: () => setIsReloading(false),
        });
    };

    const getOfficeLabel = () => {
        if (!isBACSU) return `${auth.user.office?.acronym || 'My Office'}`;
        if (selectedOfficeId === 'all') return 'CONSOLIDATED - ALL OFFICES';
        const selected = offices.find(
            (o) => o.id.toString() === selectedOfficeId,
        );
        return selected ? selected.acronym : '';
    };

    if (!fiscalYear) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[95vh] flex-col gap-0 rounded-none p-0 sm:max-w-[95vw]">
                <DialogHeader className="flex flex-row items-center justify-between space-y-0 border-b p-4">
                    <DialogTitle>APP Preview - {fiscalYear.year}</DialogTitle>
                </DialogHeader>

                <div className="flex flex-1 overflow-hidden">
                    {isBACSU && (
                        <div className="w-80 space-y-4 border-r bg-muted/10 p-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase">
                                    Report Scope
                                </label>
                                <Select
                                    value={selectedOfficeId}
                                    onValueChange={handleOfficeChange}
                                    disabled={isReloading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Office" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Consolidated (Whole PGLU)
                                        </SelectItem>
                                        <div className="my-1 h-px bg-muted" />
                                        {offices.map((o) => (
                                            <SelectItem
                                                key={o.id}
                                                value={o.id.toString()}
                                            >
                                                {o.acronym}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {isReloading && (
                                <div className="flex animate-pulse items-center gap-2 text-primary">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-xs font-medium">
                                        Updating PDF...
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="relative flex-1 bg-gray-500">
                        {isReloading && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                                <Loader2 className="h-10 w-10 animate-spin text-white" />
                            </div>
                        )}
                        <PDFViewer
                            width="100%"
                            height="100%"
                            style={{ border: 'none' }}
                        >
                            <MyDocument
                                data={data}
                                fiscalYear={fiscalYear}
                                officeLabel={getOfficeLabel()}
                            />
                        </PDFViewer>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
