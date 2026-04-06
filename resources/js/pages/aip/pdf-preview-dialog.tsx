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

interface PdfPreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: App[];
    fiscalYear: FiscalYear;
}

// 1. Define Column Widths (Totaling 100%)
// Item(15), UOM(5), Price(7), Q1(13), Q2(13), Q3(13), Q4(13), Total(21)
const COLUMN_WIDTHS = [
    5, // 0: Item No
    20, // 1: Description (+5) - Better for long item names
    5, // 2: Unit
    10, // 3: Unit Cost (+2)
    5, // 4: Qty
    11, // 5: Total Cost (+3) - Totals are usually wider digits
    4, // 6: Q1 Qty
    6, // 7: Q1 Amt
    4, // 8: Q2 Qty
    6, // 9: Q2 Amt
    4, // 10: Q3 Qty
    6, // 11: Q3 Amt
    4, // 12: Q4 Qty
    10, // 13: Q4 Amt (+4) - Adjusted last column to hit 100
];

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
}: {
    data: App[];
    fiscalYear: FiscalYear;
}) => {
    const getWidth = (index: number) => `${COLUMN_WIDTHS[index]}%`;

    // Helper to render an empty row with a title in the description column
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
            {/* 0: Item No (Empty) */}
            <View
                style={[
                    { width: getWidth(0) },
                    styles.borderLeft,
                    styles.borderRight,
                ]}
            >
                <Text style={styles.tableCell} />
            </View>

            {/* 1: Description (Title goes here) */}
            <View style={[{ width: getWidth(1) }, styles.borderRight]}>
                <Text
                    style={[
                        styles.tableCell,
                        {
                            textAlign: 'left',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            // paddingLeft: isCategory ? 2 : 10 // Indent Account titles slightly
                        },
                    ]}
                >
                    {isCategory ? `${title}` : title}
                </Text>
            </View>

            {/* 2-13: Remaining Columns (Empty with borders) */}
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
        <Document title="Quarterly Procurement Report">
            <Page size={[612, 936]} orientation="landscape" style={styles.page}>
                {/* --- Header Section --- */}
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

                        {/* <Text style={{ fontSize: 8 }}>
                        Province of Example - Information Technology Unit
                    </Text> */}
                    </View>
                </View>

                {/* --- Table Header --- */}
                <View fixed>
                    <View
                        style={[
                            styles.row,
                            styles.borderTop,
                            styles.borderBottom,
                            { height: 40 },
                        ]}
                    >
                        {/* 1st col: Spans Item No. (0) to QTY (4) */}
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
                                Province, City or Municipality: {'location'}
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
                                Department / Office: {'office'}
                            </Text>
                        </View>

                        {/* 2nd col: Planned Amount -> Regular (Spans index 5: Total Cost) */}
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

                        {/* 3rd col: Contingency & Total (Spans Q1 Qty (6) to Q2 Amount (9)) */}
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
                                <Text style={styles.tableHeaderCell}>
                                    {/* Quarterly Funding Distribution (H1) */}
                                </Text>
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

                        {/* 4th col: Date Submitted (Takes remaining space: 10 to 15) */}
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
                        {/* Note: We removed borderTop here so it sits flush with the row above */}

                        {/* Indices 0-5 */}
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

                        {/* The Quarterly/Total group starts here (Index 6 to 15) */}
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
                                    // flex: 1,
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
                                    const qtyW = COLUMN_WIDTHS[startIdx]; // e.g., 4
                                    const amtW = COLUMN_WIDTHS[startIdx + 1]; // e.g., 6
                                    const groupWidth = qtyW + amtW; // e.g., 10

                                    const parentWidth = COLUMN_WIDTHS.slice(
                                        6,
                                        14,
                                    ).reduce((a, b) => a + b, 0);
                                    const relativeGroupWidth =
                                        (groupWidth / parentWidth) * 100;

                                    return (
                                        <View
                                            key={q}
                                            style={{
                                                width: `${relativeGroupWidth}%`,
                                            }}
                                        >
                                            {/* Quarter Label */}
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

                                            {/* Sub-labels with MATCHING widths to rows */}
                                            <View style={styles.row}>
                                                <View
                                                    style={[
                                                        {
                                                            width: `${(qtyW / groupWidth) * 100}%`,
                                                        }, // Matches the '4' in your 4/6 split
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
                                                            width: `${(amtW / groupWidth) * 100}%`,
                                                        }, // Matches the '6' in your 4/6 split
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

                {/* --- Data Rows --- */}
                {/* {data.map((item, index) => ( */}
                {Object.entries(data).map(
                    ([categoryName, chartOfAccounts]: [string, any]) => {
                        const categoryItems = Object.values(
                            chartOfAccounts,
                        ).flat() as any[];
                        const catTotalAmt = categoryItems.reduce(
                            (sum, item) =>
                                sum + (Number(item.total_amount) || 0),
                            0,
                        );
                        const catQ1Amt = categoryItems.reduce(
                            (sum, item) => sum + (Number(item.q1_amount) || 0),
                            0,
                        );
                        const catQ2Amt = categoryItems.reduce(
                            (sum, item) => sum + (Number(item.q2_amount) || 0),
                            0,
                        );
                        const catQ3Amt = categoryItems.reduce(
                            (sum, item) => sum + (Number(item.q3_amount) || 0),
                            0,
                        );
                        const catQ4Amt = categoryItems.reduce(
                            (sum, item) => sum + (Number(item.q4_amount) || 0),
                            0,
                        );

                        return (
                            <View key={categoryName} break={false}>
                                {/* CATEGORY ROW (Title in Description Col) */}
                                <TitleRow
                                    title={categoryName}
                                    isCategory={true}
                                />

                                {Object.entries(chartOfAccounts).map(
                                    ([accountTitle, items]: [string, any]) => (
                                        <View key={accountTitle}>
                                            {/* CHART OF ACCOUNT ROW (Title in Description Col) */}
                                            <TitleRow
                                                title={accountTitle}
                                                isCategory={false}
                                            />

                                            {/* ITEM ROWS */}
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

                                {/* CATEGORY FOOTER (Follows same col structure) */}
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
                                            { width: getWidth(2) },
                                            styles.borderRight,
                                        ]}
                                    >
                                        <Text style={styles.tableCell} />
                                    </View>
                                    <View
                                        style={[
                                            { width: getWidth(3) },
                                            styles.borderRight,
                                        ]}
                                    >
                                        <Text style={styles.tableCell} />
                                    </View>
                                    <View
                                        style={[
                                            { width: getWidth(4) },
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
                                            {formatNumber(catTotalAmt)}
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
                                            {formatNumber(catQ1Amt)}
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
                                            {formatNumber(catQ2Amt)}
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
                                            {formatNumber(catQ3Amt)}
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
                                            {formatNumber(catQ4Amt)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        );
                    },
                )}

                {/* --- Footer / Pagination --- */}
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
}: PdfPreviewDialogProps) {
    console.log({ data, fiscalYear });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-screen flex-col gap-0 rounded-none p-0 sm:max-w-screen">
                <DialogHeader className="p-4">
                    <DialogTitle>PDF Preview</DialogTitle>
                    <DialogDescription className="sr-only"></DialogDescription>
                </DialogHeader>

                <div className="h-full">
                    <PDFViewer width="100%" height="100%">
                        <MyDocument data={data} fiscalYear={fiscalYear} />
                    </PDFViewer>
                </div>
            </DialogContent>
        </Dialog>
    );
}
