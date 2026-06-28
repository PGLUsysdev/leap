import {
    Page,
    Text,
    View,
    Document,
    PDFViewer,
    StyleSheet,
} from '@react-pdf/renderer';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import type { ChartOfAccount, Position } from '@/types/global';
import { getCellNumericValue } from '@/lib/ps-calculations';

interface CoaRow {
    account_number: string;
    account_title: string;
    amount: string;
}

interface SectionData {
    total: string;
    coas: CoaRow[];
}

interface PreviewPdfDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sections: {
        ps: SectionData;
        mooe: SectionData;
        fe: SectionData;
        co: SectionData;
    };
    /** Raw data for computing PS COA amounts locally using the same logic as the PS Breakdown table */
    psComputationData?: {
        positions: Position[];
        chartOfAccounts: ChartOfAccount[];
        rates: Record<string, number>;
        annualRateMap: Record<number, { current: number; budget: number }>;
    };
}

const COL_WIDTHS = {
    object: '28%',
    code: '12%',
    pastYear: '12%',
    firstSem: '12%',
    secondSem: '12%',
    total: '12%',
    budget: '12%',
};

// Set a uniform border width for crisp lines
const BORDER_WIDTH = 0.75;

const styles = StyleSheet.create({
    page: {
        padding: 40,
        paddingTop: 20,
        fontSize: 9,
        fontFamily: 'Helvetica',
        backgroundColor: '#ffffff',
    },
    header: {
        alignItems: 'center',
        marginBottom: 8,
    },
    headerTitle: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 12,
        marginBottom: 2,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 12,
        textAlign: 'center',
    },
    table: {
        display: 'flex',
        flexDirection: 'column',
        borderColor: '#000000',
    },
    container: {
        display: 'flex',
        flexDirection: 'column',
    },
    colGroup: {
        display: 'flex',
        flexDirection: 'column',
    },
    rowGroup: {
        display: 'flex',
        flexDirection: 'row',
    },
    dataRow: {
        minHeight: 11,
    },
    tableHeaderCell: {
        padding: 1,
        textAlign: 'center',
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
    },
    tableSubHeaderCell: {
        padding: 1,
        textAlign: 'center',
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
    },
    tableNumberCell: {
        padding: 1,
        textAlign: 'center',
        fontSize: 8,
        fontFamily: 'Helvetica',
    },
    tableCell: {
        padding: 1,
        textAlign: 'center',
        fontSize: 8,
        fontFamily: 'Helvetica',
    },
    tableCellLeft: {
        padding: 1,
        textAlign: 'left',
        fontSize: 8,
        fontFamily: 'Helvetica',
    },
    borderRight: {
        borderRightWidth: BORDER_WIDTH,
        borderRightColor: '#000000',
    },
    // Used on the very top header row of the table
    tableHeaderFirst: {
        borderTopWidth: BORDER_WIDTH,
        borderBottomWidth: BORDER_WIDTH,
        borderLeftWidth: BORDER_WIDTH,
        borderRightWidth: BORDER_WIDTH,
        borderColor: '#000000',
    },
    // Standard row border (bottom only to prevent stacking issues)
    tableRowBorder: {
        borderBottomWidth: BORDER_WIDTH,
        borderBottomColor: '#000000',
        borderLeftWidth: BORDER_WIDTH,
        borderRightWidth: BORDER_WIDTH,
        borderLeftColor: '#000000',
        borderRightColor: '#000000',
    },
    // Dedicated nested top-only border for the "Current Year" division
    nestedHeaderBorder: {
        borderTopWidth: BORDER_WIDTH,
        borderTopColor: '#000000',
    },
    signatoriesContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 30,
    },
    signatoryBlock: {
        width: '30%',
        display: 'flex',
        flexDirection: 'column',
        gap: 25,
    },
    signatoryLabel: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 9,
    },
    signatoryRole: {
        borderTopWidth: 1,
        borderTopColor: '#000000',
        paddingTop: 4,
        fontSize: 8,
        textAlign: 'center',
    },
    tableCellRight: {
        padding: 1,
        paddingRight: 4, // Adds spacing so the numbers don't touch the right border
        textAlign: 'right',
        fontSize: 8,
        fontFamily: 'Helvetica',
    },
});

const fmt = (v: string) => {
    const num = parseFloat(v || '0');
    if (isNaN(num) || !isFinite(num)) return '-';
    if (num === 0) return '-';
    return num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

interface MyDocumentProps {
    sections: PreviewPdfDialogProps['sections'];
    psComputationData?: PreviewPdfDialogProps['psComputationData'];
}

const MyDocument = ({ sections, psComputationData }: MyDocumentProps) => {
    const sectionConfigs: {
        key: keyof PreviewPdfDialogProps['sections'];
        label: string;
    }[] = [
        { key: 'ps', label: 'PERSONAL SERVICES' },
        { key: 'mooe', label: 'MAINTENANCE AND OTHER OPERATING EXPENSES' },
        { key: 'fe', label: 'FINANCIAL EXPENSES' },
        { key: 'co', label: 'CAPITAL OUTLAYS' },
    ];

    // If psComputationData is provided, compute PS section dynamically to
    // match the same per-position logic used in the PS Breakdown table.
    const effectivePsSection: SectionData = (() => {
        if (!psComputationData) return sections.ps;

        const { positions, chartOfAccounts, rates, annualRateMap } =
            psComputationData;
        const psCoas = chartOfAccounts.filter(
            (coa) => coa.expense_class === 'PS',
        );

        const coas: CoaRow[] = psCoas.map((coa) => {
            let total = 0;
            for (const pos of positions) {
                const val = getCellNumericValue(pos, coa, rates, annualRateMap);
                if (val !== null) total += val;
            }
            return {
                account_number: coa.account_number,
                account_title: coa.account_title,
                amount: total.toFixed(2),
            };
        });

        const computedTotal = coas
            .reduce((sum, coa) => sum + parseFloat(coa.amount), 0)
            .toFixed(2);

        return { total: computedTotal, coas };
    })();

    const totalAll = sectionConfigs
        .reduce((sum, cfg) => {
            const sec =
                cfg.key === 'ps' ? effectivePsSection : sections[cfg.key];
            return sum + parseFloat(sec?.total || '0');
        }, 0)
        .toFixed(2);

    const currentYearWidth =
        parseFloat(COL_WIDTHS.firstSem) + parseFloat(COL_WIDTHS.secondSem);
    const firstSemShare =
        (parseFloat(COL_WIDTHS.firstSem) / currentYearWidth) * 100;
    const secondSemShare =
        (parseFloat(COL_WIDTHS.secondSem) / currentYearWidth) * 100;

    return (
        <Document>
            <Page
                size={[612, 1008]}
                orientation="landscape"
                style={styles.page}
            >
                <View style={styles.container}>
                    {/* Header */}

                    <Text fixed style={{ paddingBottom: 5 }}>
                        LBP Form No. 2
                    </Text>

                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>
                            PROGRAMMED APPROPRIATION AND OBLIGATION BY OBJECT OF
                            EXPENDITURE
                        </Text>
                        <Text style={styles.headerSubtitle}>
                            Local Government Unit: {'_'.repeat(17)}
                        </Text>
                    </View>

                    <Text style={{ paddingBottom: 10 }}>
                        Department/Office: {'_'.repeat(35)}
                    </Text>

                    {/* Table */}
                    <View style={styles.table}>
                        {/* Table Header Group (repeats on page breaks) */}
                        <View
                            fixed
                            style={{ display: 'flex', flexDirection: 'column' }}
                        >
                            {/* ===== HEADER ROW 1 ===== */}
                            <View
                                style={[
                                    styles.tableHeaderFirst,
                                    {
                                        display: 'flex',
                                        flexDirection: 'row',
                                        backgroundColor: '#d9d9d9',
                                    },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.borderRight,
                                        {
                                            width: COL_WIDTHS.object,
                                            justifyContent: 'center',
                                        },
                                    ]}
                                >
                                    <Text style={styles.tableHeaderCell}>
                                        Object of Expenditure
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        styles.borderRight,
                                        {
                                            width: COL_WIDTHS.code,
                                            justifyContent: 'center',
                                        },
                                    ]}
                                >
                                    <Text style={styles.tableHeaderCell}>
                                        Account Code
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        styles.borderRight,
                                        {
                                            width: COL_WIDTHS.pastYear,
                                            justifyContent: 'center',
                                        },
                                    ]}
                                >
                                    <Text style={styles.tableHeaderCell}>
                                        Past Year (Actual)
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        styles.colGroup,
                                        styles.borderRight,
                                        {
                                            width: currentYearWidth + '%',
                                        },
                                    ]}
                                >
                                    <Text style={styles.tableHeaderCell}>
                                        Current Year
                                    </Text>
                                    <View
                                        style={[
                                            styles.rowGroup,
                                            styles.nestedHeaderBorder,
                                        ]}
                                    >
                                        <View
                                            style={[
                                                styles.borderRight,
                                                {
                                                    width: firstSemShare + '%',
                                                    display: 'flex', // Added
                                                    flexDirection: 'column', // Added
                                                    justifyContent: 'center', // Added
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={
                                                    styles.tableSubHeaderCell
                                                }
                                            >
                                                First Semester (Actual)
                                            </Text>
                                        </View>
                                        <View
                                            style={{
                                                width: secondSemShare + '%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Text
                                                style={
                                                    styles.tableSubHeaderCell
                                                }
                                            >
                                                Second Semester (Estimates)
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <View
                                    style={[
                                        styles.borderRight,
                                        {
                                            width: COL_WIDTHS.total,
                                            justifyContent: 'center',
                                        },
                                    ]}
                                >
                                    <Text style={styles.tableHeaderCell}>
                                        Total
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        width: COL_WIDTHS.budget,
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text style={styles.tableHeaderCell}>
                                        Budget Year (Proposed)
                                    </Text>
                                </View>
                            </View>

                            {/* ===== NUMBERING ROW ===== */}
                            <View
                                style={[
                                    styles.rowGroup,
                                    styles.tableRowBorder,
                                    { backgroundColor: '#ffffff' },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.borderRight,
                                        {
                                            width: COL_WIDTHS.object,
                                            justifyContent: 'center',
                                        },
                                    ]}
                                >
                                    <Text style={styles.tableNumberCell}>
                                        (1)
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        styles.borderRight,
                                        {
                                            width: COL_WIDTHS.code,
                                            justifyContent: 'center',
                                        },
                                    ]}
                                >
                                    <Text style={styles.tableNumberCell}>
                                        (2)
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        styles.borderRight,
                                        {
                                            width: COL_WIDTHS.pastYear,
                                            justifyContent: 'center',
                                        },
                                    ]}
                                >
                                    <Text style={styles.tableNumberCell}>
                                        (3)
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        styles.borderRight,
                                        {
                                            width: COL_WIDTHS.firstSem,
                                            justifyContent: 'center',
                                        },
                                    ]}
                                >
                                    <Text style={styles.tableNumberCell}>
                                        (4)
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        styles.borderRight,
                                        {
                                            width: COL_WIDTHS.secondSem,
                                            justifyContent: 'center',
                                        },
                                    ]}
                                >
                                    <Text style={styles.tableNumberCell}>
                                        (5)
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        styles.borderRight,
                                        {
                                            width: COL_WIDTHS.total,
                                            justifyContent: 'center',
                                        },
                                    ]}
                                >
                                    <Text style={styles.tableNumberCell}>
                                        (6)
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        width: COL_WIDTHS.budget,
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text style={styles.tableNumberCell}>
                                        (7)
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* ===== SECTION ROWS ===== */}
                        {sectionConfigs.flatMap((cfg) => {
                            const section =
                                cfg.key === 'ps'
                                    ? effectivePsSection
                                    : sections[cfg.key];
                            const rows: React.ReactElement[] = [];

                            // Section header row
                            rows.push(
                                <View
                                    key={`${cfg.key}-header`}
                                    wrap={false}
                                    style={[
                                        styles.rowGroup,
                                        styles.dataRow,
                                        styles.tableRowBorder,
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.borderRight,
                                            {
                                                width: COL_WIDTHS.object,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={{
                                                ...styles.tableCellLeft,
                                                fontFamily: 'Helvetica-Bold',
                                            }}
                                        >
                                            {cfg.label}
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.borderRight,
                                            {
                                                width: COL_WIDTHS.code,
                                            },
                                        ]}
                                    >
                                        <Text style={styles.tableCell} />
                                    </View>
                                    <View
                                        style={[
                                            styles.borderRight,
                                            {
                                                width: COL_WIDTHS.pastYear,
                                            },
                                        ]}
                                    >
                                        <Text style={styles.tableCell} />
                                    </View>
                                    <View
                                        style={[
                                            styles.borderRight,
                                            {
                                                width: COL_WIDTHS.firstSem,
                                            },
                                        ]}
                                    >
                                        <Text style={styles.tableCell} />
                                    </View>
                                    <View
                                        style={[
                                            styles.borderRight,
                                            {
                                                width: COL_WIDTHS.secondSem,
                                            },
                                        ]}
                                    >
                                        <Text style={styles.tableCell} />
                                    </View>
                                    <View
                                        style={[
                                            styles.borderRight,
                                            {
                                                width: COL_WIDTHS.total,
                                            },
                                        ]}
                                    >
                                        <Text style={styles.tableCell} />
                                    </View>
                                    <View
                                        style={{
                                            width: COL_WIDTHS.budget,
                                        }}
                                    >
                                        <Text style={styles.tableCell} />
                                    </View>
                                </View>,
                            );

                            // COA rows
                            for (const coa of section.coas) {
                                rows.push(
                                    <View
                                        key={`${cfg.key}-coa-${coa.account_number}`}
                                        wrap={false}
                                        style={[
                                            styles.rowGroup,
                                            styles.dataRow,
                                            styles.tableRowBorder,
                                        ]}
                                    >
                                        <View
                                            style={[
                                                styles.borderRight,
                                                {
                                                    width: COL_WIDTHS.object,
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={styles.tableCellLeft}
                                                wrap={false}
                                            >
                                                {'    '}
                                                {coa.account_title}
                                            </Text>
                                        </View>
                                        <View
                                            style={[
                                                styles.borderRight,
                                                {
                                                    width: COL_WIDTHS.code,
                                                },
                                            ]}
                                        >
                                            <Text style={styles.tableCell}>
                                                {coa.account_number}
                                            </Text>
                                        </View>
                                        <View
                                            style={[
                                                styles.borderRight,
                                                {
                                                    width: COL_WIDTHS.pastYear,
                                                },
                                            ]}
                                        >
                                            <Text style={styles.tableCellRight}>
                                                {'-'}
                                            </Text>
                                        </View>
                                        <View
                                            style={[
                                                styles.borderRight,
                                                {
                                                    width: COL_WIDTHS.firstSem,
                                                },
                                            ]}
                                        >
                                            <Text style={styles.tableCellRight}>
                                                {'-'}
                                            </Text>
                                        </View>
                                        <View
                                            style={[
                                                styles.borderRight,
                                                {
                                                    width: COL_WIDTHS.secondSem,
                                                },
                                            ]}
                                        >
                                            <Text style={styles.tableCellRight}>
                                                {'-'}
                                            </Text>
                                        </View>
                                        <View
                                            style={[
                                                styles.borderRight,
                                                {
                                                    width: COL_WIDTHS.total,
                                                },
                                            ]}
                                        >
                                            <Text style={styles.tableCellRight}>
                                                {'-'}
                                            </Text>
                                        </View>
                                        <View
                                            style={{
                                                width: COL_WIDTHS.budget,
                                            }}
                                        >
                                            <Text style={styles.tableCellRight}>
                                                {fmt(coa.amount)}
                                            </Text>
                                        </View>
                                    </View>,
                                );
                            }

                            // Section sub-total row
                            rows.push(
                                <View
                                    key={`${cfg.key}-total`}
                                    wrap={false}
                                    style={[
                                        styles.rowGroup,
                                        styles.dataRow,
                                        styles.tableRowBorder,
                                        { backgroundColor: '#f0f0f0' },
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.borderRight,
                                            { width: COL_WIDTHS.object },
                                        ]}
                                    >
                                        <Text
                                            style={{
                                                ...styles.tableCellLeft,
                                                fontFamily: 'Helvetica-Bold',
                                            }}
                                        >
                                            Sub-total
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.borderRight,
                                            { width: COL_WIDTHS.code },
                                        ]}
                                    >
                                        <Text
                                            style={{
                                                ...styles.tableCell,
                                                fontFamily: 'Helvetica-Bold',
                                            }}
                                        />
                                    </View>
                                    <View
                                        style={[
                                            styles.borderRight,
                                            { width: COL_WIDTHS.pastYear },
                                        ]}
                                    >
                                        <Text
                                            style={{
                                                ...styles.tableCellRight,
                                                fontFamily: 'Helvetica-Bold',
                                            }}
                                        >
                                            {'-'}
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.borderRight,
                                            { width: COL_WIDTHS.firstSem },
                                        ]}
                                    >
                                        <Text
                                            style={{
                                                ...styles.tableCellRight,
                                                fontFamily: 'Helvetica-Bold',
                                            }}
                                        >
                                            {'-'}
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.borderRight,
                                            { width: COL_WIDTHS.secondSem },
                                        ]}
                                    >
                                        <Text
                                            style={{
                                                ...styles.tableCellRight,
                                                fontFamily: 'Helvetica-Bold',
                                            }}
                                        >
                                            {'-'}
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.borderRight,
                                            { width: COL_WIDTHS.total },
                                        ]}
                                    >
                                        <Text
                                            style={{
                                                ...styles.tableCellRight,
                                                fontFamily: 'Helvetica-Bold',
                                            }}
                                        >
                                            {'-'}
                                        </Text>
                                    </View>
                                    <View style={{ width: COL_WIDTHS.budget }}>
                                        <Text
                                            style={{
                                                ...styles.tableCellRight,
                                                fontFamily: 'Helvetica-Bold',
                                            }}
                                        >
                                            {fmt(section.total)}
                                        </Text>
                                    </View>
                                </View>,
                            );

                            // Blank row after sub-total
                            rows.push(
                                <View
                                    key={`${cfg.key}-blank`}
                                    wrap={false}
                                    style={[
                                        styles.rowGroup,
                                        styles.dataRow,
                                        styles.tableRowBorder,
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.borderRight,
                                            { width: COL_WIDTHS.object },
                                        ]}
                                    >
                                        <Text style={styles.tableCell} />
                                    </View>
                                    <View
                                        style={[
                                            styles.borderRight,
                                            { width: COL_WIDTHS.code },
                                        ]}
                                    >
                                        <Text style={styles.tableCell} />
                                    </View>
                                    <View
                                        style={[
                                            styles.borderRight,
                                            { width: COL_WIDTHS.pastYear },
                                        ]}
                                    >
                                        <Text style={styles.tableCell} />
                                    </View>
                                    <View
                                        style={[
                                            styles.borderRight,
                                            { width: COL_WIDTHS.firstSem },
                                        ]}
                                    >
                                        <Text style={styles.tableCell} />
                                    </View>
                                    <View
                                        style={[
                                            styles.borderRight,
                                            { width: COL_WIDTHS.secondSem },
                                        ]}
                                    >
                                        <Text style={styles.tableCell} />
                                    </View>
                                    <View
                                        style={[
                                            styles.borderRight,
                                            { width: COL_WIDTHS.total },
                                        ]}
                                    >
                                        <Text style={styles.tableCell} />
                                    </View>
                                    <View style={{ width: COL_WIDTHS.budget }}>
                                        <Text style={styles.tableCell} />
                                    </View>
                                </View>,
                            );

                            return rows;
                        })}

                        {/* TOTAL APPROPRIATIONS row */}
                        <View
                            wrap={false}
                            style={[
                                styles.rowGroup,
                                styles.dataRow,
                                styles.tableRowBorder,
                                { backgroundColor: '#d9d9d9' },
                            ]}
                        >
                            <View
                                style={[
                                    styles.borderRight,
                                    { width: COL_WIDTHS.object },
                                ]}
                            >
                                <Text
                                    style={{
                                        ...styles.tableCellLeft,
                                        fontFamily: 'Helvetica-Bold',
                                    }}
                                >
                                    Total Appropriations
                                </Text>
                            </View>
                            <View
                                style={[
                                    styles.borderRight,
                                    { width: COL_WIDTHS.code },
                                ]}
                            >
                                <Text
                                    style={{
                                        ...styles.tableCell,
                                        fontFamily: 'Helvetica-Bold',
                                    }}
                                />
                            </View>
                            <View
                                style={[
                                    styles.borderRight,
                                    { width: COL_WIDTHS.pastYear },
                                ]}
                            >
                                <Text
                                    style={{
                                        ...styles.tableCellRight,
                                        fontFamily: 'Helvetica-Bold',
                                    }}
                                >
                                    {'-'}
                                </Text>
                            </View>
                            <View
                                style={[
                                    styles.borderRight,
                                    { width: COL_WIDTHS.firstSem },
                                ]}
                            >
                                <Text
                                    style={{
                                        ...styles.tableCellRight,
                                        fontFamily: 'Helvetica-Bold',
                                    }}
                                >
                                    {'-'}
                                </Text>
                            </View>
                            <View
                                style={[
                                    styles.borderRight,
                                    { width: COL_WIDTHS.secondSem },
                                ]}
                            >
                                <Text
                                    style={{
                                        ...styles.tableCellRight,
                                        fontFamily: 'Helvetica-Bold',
                                    }}
                                >
                                    {'-'}
                                </Text>
                            </View>
                            <View
                                style={[
                                    styles.borderRight,
                                    { width: COL_WIDTHS.total },
                                ]}
                            >
                                <Text
                                    style={{
                                        ...styles.tableCellRight,
                                        fontFamily: 'Helvetica-Bold',
                                    }}
                                >
                                    {'-'}
                                </Text>
                            </View>
                            <View style={{ width: COL_WIDTHS.budget }}>
                                <Text
                                    style={{
                                        ...styles.tableCellRight,
                                        fontFamily: 'Helvetica-Bold',
                                    }}
                                >
                                    {fmt(totalAll)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Signatories */}
                    <View style={styles.signatoriesContainer}>
                        <View style={styles.signatoryBlock}>
                            <Text style={styles.signatoryLabel}>
                                Prepared by:
                            </Text>
                            <Text style={styles.signatoryRole}>
                                Department Head
                            </Text>
                        </View>
                        <View style={styles.signatoryBlock}>
                            <Text style={styles.signatoryLabel}>
                                Reviewed by:
                            </Text>
                            <Text style={styles.signatoryRole}>
                                Local Budget Officer
                            </Text>
                        </View>
                        <View style={styles.signatoryBlock}>
                            <Text style={styles.signatoryLabel}>
                                Approved by:
                            </Text>
                            <Text style={styles.signatoryRole}>
                                Local Chief Executive
                            </Text>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
};

export default function PreviewPdfDialog({
    open,
    onOpenChange,
    sections,
    psComputationData,
}: PreviewPdfDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[100vh] flex-col gap-0 rounded-none p-0 sm:max-w-[100vw]">
                <DialogHeader>
                    <DialogTitle className="sr-only">
                        LBP Form No. 2 PDF Preview
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Preview of the Programmed Appropriation and Obligation
                        by Object of Expenditure.
                    </DialogDescription>
                </DialogHeader>

                <PDFViewer
                    width="100%"
                    height="100%"
                    style={{ border: 'none' }}
                >
                    <MyDocument
                        sections={sections}
                        psComputationData={psComputationData}
                    />
                </PDFViewer>
            </DialogContent>
        </Dialog>
    );
}
