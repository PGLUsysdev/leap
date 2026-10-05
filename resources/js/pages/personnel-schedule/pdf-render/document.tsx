// resources\js\pages\personnel-schedule\pdf-render\document.tsx

import {
    Document,
    Font,
    Page,
    StyleSheet,
    Text,
    View,
} from '@react-pdf/renderer';
import React from 'react';
import { PpmpPdfTable } from '@/pages/ppmp/pdf-render/table';
import type { ColumnDef, TableRow } from '@/pages/ppmp/pdf-render/types';
import { getLbpForm3ColumnDefs } from './cols';
import { prepareLbpForm3Rows } from './prepare-rows';
import TableHeader from './table-header';
import type { PersonnelScheduleItem } from '../data-table/columns';

Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
    page: {
        padding: 12,
        fontFamily: 'Helvetica',
    },
    headerContainer: {
        marginBottom: 1,
    },
    formLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        textAlign: 'left',
        color: '#0F172A',
    },
    title: {
        fontSize: 9,
        fontWeight: 'bold',
        marginTop: 2,
        color: '#0F172A',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 8,
        fontWeight: 'bold',
        marginTop: 1,
        textAlign: 'center',
    },
    jurisdiction: {
        fontSize: 8,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#0F172A',
    },
    headerSpacer: {
        height: 10,
    },
    officeRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    officeLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        textAlign: 'left',
    },
    officeFill: {
        flex: 1,
        borderBottomWidth: 0.5,
        borderBottomColor: '#000000',
        marginLeft: 4,
        marginBottom: 1,
        minHeight: 9,
    },
    signatureSection: {
        marginTop: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    signatureBox: {
        width: '31%',
        textAlign: 'left',
    },
    signatureLabel: {
        fontSize: 6,
        marginBottom: 20,
        textAlign: 'left',
        fontWeight: 'bold',
    },
    signatureName: {
        fontSize: 7,
        fontWeight: 'bold',
        textAlign: 'left',
        textDecoration: 'underline',
        marginBottom: 2,
    },
    signatureNameLine: {
        borderBottomWidth: 0.5,
        paddingBottom: 2,
        marginBottom: 2,
        minHeight: 9,
    },
    signatureTitle: {
        fontSize: 5,
        textAlign: 'left',
    },
    footer: {
        position: 'absolute',
        bottom: 8,
        left: 12,
        right: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        fontSize: 5.5,
        color: '#94A3B8',
    },
});

interface LbpForm3Signatories {
    preparedName: string;
    preparedPosition: string;
    reviewedName: string;
    reviewedPosition: string;
    approvedName: string;
    approvedPosition: string;
}

interface LbpForm3DocumentProps {
    items: PersonnelScheduleItem[];
    signatories: LbpForm3Signatories;
    fiscalYear: string;
}

const formatTotal = (value: unknown): string => {
    const num = Number(value ?? 0);

    if (Number.isNaN(num)) {
        return '0.00';
    }

    return num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const AMOUNT_COLUMN_IDS = [
    'current_year_amount',
    'proposed_amount',
    'increase_decrease',
];

const leftBorderStyle = {
    borderLeftWidth: 0.5,
    borderLeftColor: '#000000',
};

// Totals row with one cell per column and no label: each summed amount lands
// under its own column, every other cell stays empty.
const renderLbpForm3GrandTotal = (
    row: TableRow,
    columns: ColumnDef<PersonnelScheduleItem>[],
) => {
    const totals = row.totals || {};

    return (
        <View
            key={row.id}
            wrap={false}
            style={{
                flexDirection: 'row',
                borderBottomWidth: 0.5,
                borderBottomColor: '#000000',
                minHeight: 13,
                alignItems: 'stretch',
            }}
        >
            {columns.map((col, colIdx) => {
                const isAmount = AMOUNT_COLUMN_IDS.includes(col.id);

                return (
                    <View
                        key={col.id}
                        style={[
                            {
                                width: col.width,
                                borderRightWidth: 0.5,
                                borderRightColor: '#000000',
                                justifyContent: 'center',
                                paddingHorizontal: 1,
                            },
                            colIdx === 0 ? leftBorderStyle : {},
                        ]}
                    >
                        <Text
                            style={{
                                fontSize: 5,
                                fontWeight: 'bold',
                                color: '#000000',
                                textAlign: isAmount ? 'right' : 'center',
                            }}
                        >
                            {isAmount ? formatTotal(totals[col.id]) : ''}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
};

const SignatoryBox = ({
    label,
    name,
    position,
}: {
    label: string;
    name: string;
    position: string;
}) => (
    <View style={styles.signatureBox}>
        <Text style={styles.signatureLabel}>{label}</Text>
        {name.trim() ? (
            <Text style={styles.signatureName}>{name.trim()}</Text>
        ) : (
            <View style={styles.signatureNameLine}>
                <Text style={{ fontSize: 7 }}> </Text>
            </View>
        )}
        <Text style={styles.signatureTitle}>{position.trim() || '-'}</Text>
    </View>
);

export const LbpForm3Document: React.FC<LbpForm3DocumentProps> = ({
    items,
    signatories,
    fiscalYear,
}) => {
    const columns = getLbpForm3ColumnDefs();
    const rows = prepareLbpForm3Rows(items);

    return (
        <Document>
            <Page size={[612, 936]} orientation="landscape" style={styles.page}>
                <View fixed style={styles.headerContainer}>
                    <Text style={styles.formLabel}>LBP Form No. 3</Text>
                    <Text style={styles.title}>
                        PLANTILLA OF PERSONNEL ({fiscalYear.trim() || '____'})
                    </Text>
                    <Text style={styles.jurisdiction}>
                        PROVINCE OF LA UNION
                    </Text>
                    <View style={styles.headerSpacer} />

                    <View style={styles.officeRow}>
                        <Text style={styles.officeLabel}>OFFICE:</Text>
                        <View style={styles.officeFill} />
                    </View>
                </View>

                <TableHeader />

                <PpmpPdfTable
                    columns={columns}
                    rows={rows}
                    headerComponent={null}
                    grandTotalComponent={renderLbpForm3GrandTotal}
                    cellVerticalAlign="center"
                />

                <View style={styles.signatureSection} wrap={false}>
                    <SignatoryBox
                        label="Prepared by:"
                        name={signatories.preparedName}
                        position={signatories.preparedPosition}
                    />
                    <SignatoryBox
                        label="Reviewed by:"
                        name={signatories.reviewedName}
                        position={signatories.reviewedPosition}
                    />
                    <SignatoryBox
                        label="Approved by:"
                        name={signatories.approvedName}
                        position={signatories.approvedPosition}
                    />
                </View>

                <View style={styles.footer} fixed>
                    <Text />
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
