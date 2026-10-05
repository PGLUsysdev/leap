// resources\js\pages\aip\pdf-render\lbp-form-2\document.tsx

import {
    Document,
    Font,
    Page,
    StyleSheet,
    Text,
    View,
} from '@react-pdf/renderer';
import React from 'react';

Font.registerHyphenationCallback((word) => [word]);

const COL_WIDTHS = {
    object: '28%',
    code: '12%',
    pastYear: '12%',
    firstSem: '12%',
    secondSem: '12%',
    total: '12%',
    budget: '12%',
};

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
    metaRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    metaLabel: {
        fontSize: 9,
    },
    table: {
        display: 'flex',
        flexDirection: 'column',
        borderColor: '#000000',
    },
    rowGroup: {
        display: 'flex',
        flexDirection: 'row',
    },
    colGroup: {
        display: 'flex',
        flexDirection: 'column',
    },
    dataRow: {
        minHeight: 11,
    },
    blankRow: {
        minHeight: 14,
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
    tableCellRight: {
        padding: 1,
        paddingRight: 4,
        textAlign: 'right',
        fontSize: 8,
        fontFamily: 'Helvetica',
    },
    borderRight: {
        borderRightWidth: BORDER_WIDTH,
        borderRightColor: '#000000',
    },
    tableHeaderFirst: {
        borderTopWidth: BORDER_WIDTH,
        borderBottomWidth: BORDER_WIDTH,
        borderLeftWidth: BORDER_WIDTH,
        borderRightWidth: BORDER_WIDTH,
        borderColor: '#000000',
    },
    tableRowBorder: {
        borderBottomWidth: BORDER_WIDTH,
        borderBottomColor: '#000000',
        borderLeftWidth: BORDER_WIDTH,
        borderRightWidth: BORDER_WIDTH,
        borderLeftColor: '#000000',
        borderRightColor: '#000000',
    },
    nestedHeaderBorder: {
        borderTopWidth: BORDER_WIDTH,
        borderTopColor: '#000000',
    },
    sectionLabel: {
        padding: 1,
        textAlign: 'left',
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
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
    },
    signatoryLabel: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 9,
        marginBottom: 22,
    },
    signatoryNameLine: {
        paddingBottom: 2,
        marginBottom: 4,
        minHeight: 12,
    },
    signatoryName: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 9,
        textAlign: 'center',
    },
    signatoryRole: {
        fontSize: 8,
        textAlign: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 8,
        left: 40,
        right: 40,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        fontSize: 7,
        color: '#94A3B8',
    },
});

export interface LbpForm2Signatory {
    name: string;
    position: string;
}

export interface LbpForm2Signatories {
    prepared: LbpForm2Signatory;
    reviewed: LbpForm2Signatory;
    approved: LbpForm2Signatory;
}

export interface LbpForm2CoaRow {
    path: string;
    title: string;
    amount: number;
}

export interface LbpForm2Section {
    rows: LbpForm2CoaRow[];
    total: number;
}

export interface LbpForm2DocumentProps {
    fiscalYear: string;
    officeName: string;
    signatories: LbpForm2Signatories;
    sections: {
        ps: LbpForm2Section;
        mooe: LbpForm2Section;
        fe: LbpForm2Section;
        co: LbpForm2Section;
    };
}

export const emptySections = (): LbpForm2DocumentProps['sections'] => ({
    ps: { rows: [], total: 0 },
    mooe: { rows: [], total: 0 },
    fe: { rows: [], total: 0 },
    co: { rows: [], total: 0 },
});

const SECTIONS: {
    key: keyof LbpForm2DocumentProps['sections'];
    label: string;
}[] = [
    { key: 'ps', label: 'PERSONAL SERVICES' },
    { key: 'mooe', label: 'MAINTENANCE AND OTHER OPERATING EXPENSES' },
    { key: 'co', label: 'CAPITAL OUTLAYS' },
    { key: 'fe', label: 'FINANCIAL EXPENSES' },
];

const currentYearWidth =
    parseFloat(COL_WIDTHS.firstSem) + parseFloat(COL_WIDTHS.secondSem);
const firstSemShare =
    (parseFloat(COL_WIDTHS.firstSem) / currentYearWidth) * 100;
const secondSemShare =
    (parseFloat(COL_WIDTHS.secondSem) / currentYearWidth) * 100;

const fmt = (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;

    if (!Number.isFinite(num) || num === 0) {
        return '-';
    }

    return num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const EmptyCells = () => (
    <>
        <View style={[styles.borderRight, { width: COL_WIDTHS.code }]}>
            <Text style={styles.tableCell} />
        </View>
        <View style={[styles.borderRight, { width: COL_WIDTHS.pastYear }]}>
            <Text style={styles.tableCell} />
        </View>
        <View style={[styles.borderRight, { width: COL_WIDTHS.firstSem }]}>
            <Text style={styles.tableCell} />
        </View>
        <View style={[styles.borderRight, { width: COL_WIDTHS.secondSem }]}>
            <Text style={styles.tableCell} />
        </View>
        <View style={[styles.borderRight, { width: COL_WIDTHS.total }]}>
            <Text style={styles.tableCell} />
        </View>
        <View style={{ width: COL_WIDTHS.budget }}>
            <Text style={styles.tableCell} />
        </View>
    </>
);

const SignatoryBlock = ({
    label,
    signatory,
}: {
    label: string;
    signatory: LbpForm2Signatory;
}) => (
    <View style={styles.signatoryBlock}>
        <Text style={styles.signatoryLabel}>{label}</Text>
        <View style={styles.signatoryNameLine}>
            <Text style={styles.signatoryName}>
                {signatory.name.trim() || '—'}
            </Text>
        </View>
        <Text style={styles.signatoryRole}>
            {signatory.position.trim() || '—'}
        </Text>
    </View>
);

export const LbpForm2Document: React.FC<LbpForm2DocumentProps> = ({
    fiscalYear,
    officeName,
    signatories,
    sections,
}) => {
    const grandTotal =
        sections.ps.total +
        sections.mooe.total +
        sections.fe.total +
        sections.co.total;

    return (
        <Document>
            <Page
                size={[612, 1008]}
                orientation="landscape"
                style={styles.page}
            >
                <View>
                    <Text fixed style={{ paddingBottom: 5 }}>
                        LBP Form No. 2
                    </Text>

                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>
                            PROGRAMMED APPROPRIATION AND OBLIGATION BY OBJECT OF
                            EXPENDITURE
                        </Text>
                        <Text style={styles.headerSubtitle}>
                            Province of La Union, FY{' '}
                            {fiscalYear.trim() || '____'}
                        </Text>
                    </View>

                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>
                            Department/Office: {officeName.trim() || '____'}
                        </Text>
                    </View>

                    {/* Table */}
                    <View style={styles.table}>
                        {/* Header (repeats on page breaks) */}
                        <View
                            fixed
                            style={{ display: 'flex', flexDirection: 'column' }}
                        >
                            <View
                                style={[
                                    styles.tableHeaderFirst,
                                    {
                                        display: 'flex',
                                        flexDirection: 'row',
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
                                        { width: currentYearWidth + '%' },
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
                                                    justifyContent: 'center',
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

                            <View
                                style={[styles.rowGroup, styles.tableRowBorder]}
                            >
                                <View
                                    style={[
                                        styles.borderRight,
                                        { width: COL_WIDTHS.object },
                                    ]}
                                >
                                    <Text style={styles.tableNumberCell}>
                                        (1)
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        styles.borderRight,
                                        { width: COL_WIDTHS.code },
                                    ]}
                                >
                                    <Text style={styles.tableNumberCell}>
                                        (2)
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        styles.borderRight,
                                        { width: COL_WIDTHS.pastYear },
                                    ]}
                                >
                                    <Text style={styles.tableNumberCell}>
                                        (3)
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        styles.borderRight,
                                        { width: COL_WIDTHS.firstSem },
                                    ]}
                                >
                                    <Text style={styles.tableNumberCell}>
                                        (4)
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        styles.borderRight,
                                        { width: COL_WIDTHS.secondSem },
                                    ]}
                                >
                                    <Text style={styles.tableNumberCell}>
                                        (5)
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        styles.borderRight,
                                        { width: COL_WIDTHS.total },
                                    ]}
                                >
                                    <Text style={styles.tableNumberCell}>
                                        (6)
                                    </Text>
                                </View>
                                <View style={{ width: COL_WIDTHS.budget }}>
                                    <Text style={styles.tableNumberCell}>
                                        (7)
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Body: section label + detail rows + sub-total */}
                        {SECTIONS.map(({ key, label }, sectionIndex) => {
                            const section = sections[key];
                            const isLastSection =
                                sectionIndex === SECTIONS.length - 1;

                            return (
                                <React.Fragment key={label}>
                                    <View
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
                                            <Text style={styles.sectionLabel}>
                                                {label}
                                            </Text>
                                        </View>
                                        <EmptyCells />
                                    </View>
                                    {section.rows.map((row) => (
                                        <View
                                            key={`${label}-${row.path}`}
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
                                                >
                                                    {'    '}
                                                    {row.title}
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
                                                    {row.path}
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
                                                <Text
                                                    style={
                                                        styles.tableCellRight
                                                    }
                                                >
                                                    -
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
                                                <Text
                                                    style={
                                                        styles.tableCellRight
                                                    }
                                                >
                                                    -
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
                                                <Text
                                                    style={
                                                        styles.tableCellRight
                                                    }
                                                >
                                                    -
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
                                                <Text
                                                    style={
                                                        styles.tableCellRight
                                                    }
                                                >
                                                    -
                                                </Text>
                                            </View>
                                            <View
                                                style={{
                                                    width: COL_WIDTHS.budget,
                                                }}
                                            >
                                                <Text
                                                    style={
                                                        styles.tableCellRight
                                                    }
                                                >
                                                    {fmt(row.amount)}
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                                    <View
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
                                            <Text style={styles.sectionLabel}>
                                                Sub-total
                                            </Text>
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
                                                {
                                                    width: COL_WIDTHS.pastYear,
                                                },
                                            ]}
                                        >
                                            <Text style={styles.tableCellRight}>
                                                -
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
                                                -
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
                                                -
                                            </Text>
                                        </View>
                                        <View
                                            style={[
                                                styles.borderRight,
                                                { width: COL_WIDTHS.total },
                                            ]}
                                        >
                                            <Text style={styles.tableCellRight}>
                                                -
                                            </Text>
                                        </View>
                                        <View
                                            style={{ width: COL_WIDTHS.budget }}
                                        >
                                            <Text style={styles.tableCellRight}>
                                                {fmt(section.total)}
                                            </Text>
                                        </View>
                                    </View>
                                    {!isLastSection && (
                                        <View
                                            wrap={false}
                                            style={[
                                                styles.rowGroup,
                                                styles.blankRow,
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
                                                    style={styles.tableCell}
                                                />
                                            </View>
                                            <EmptyCells />
                                        </View>
                                    )}
                                </React.Fragment>
                            );
                        })}

                        {/* Total appropriations */}
                        <View
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
                                <Text style={styles.sectionLabel}>
                                    Total Appropriations
                                </Text>
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
                                <Text style={styles.tableCellRight}>-</Text>
                            </View>
                            <View
                                style={[
                                    styles.borderRight,
                                    { width: COL_WIDTHS.firstSem },
                                ]}
                            >
                                <Text style={styles.tableCellRight}>-</Text>
                            </View>
                            <View
                                style={[
                                    styles.borderRight,
                                    { width: COL_WIDTHS.secondSem },
                                ]}
                            >
                                <Text style={styles.tableCellRight}>-</Text>
                            </View>
                            <View
                                style={[
                                    styles.borderRight,
                                    { width: COL_WIDTHS.total },
                                ]}
                            >
                                <Text style={styles.tableCellRight}>-</Text>
                            </View>
                            <View style={{ width: COL_WIDTHS.budget }}>
                                <Text style={styles.tableCellRight}>
                                    {fmt(grandTotal)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Signatories: prepared, reviewed, approved side by side */}
                    <View style={styles.signatoriesContainer} wrap={false}>
                        <SignatoryBlock
                            label="Prepared by:"
                            signatory={signatories.prepared}
                        />
                        <SignatoryBlock
                            label="Reviewed by:"
                            signatory={signatories.reviewed}
                        />
                        <SignatoryBlock
                            label="Approved by:"
                            signatory={signatories.approved}
                        />
                    </View>
                </View>

                <View style={styles.footer} fixed>
                    <Text
                        render={({ pageNumber, totalPages }) =>
                            `Page ${pageNumber} of ${totalPages}`
                        }
                    />
                </View>
            </Page>
        </Document>
    );
};
