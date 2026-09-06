import {
    Document,
    Page,
    View,
    Text,
    StyleSheet,
    Font,
} from '@react-pdf/renderer';
import React from 'react';
import { formatCurrency } from '@/lib/utils';
import { PpmpPdfTable } from '@/pages/ppmp/pdf-render/table';
import type { ColumnDef, TableRow } from '@/pages/ppmp/pdf-render/types';
import type { AipEntry, FiscalYear } from '@/types';
import { getAipSummaryColumnDefs } from './cols';
import { prepareAipSummaryRows } from './prepare-rows';
import TableHeader from './table-header';

Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
    page: {
        padding: 12,
        fontFamily: 'Helvetica',
    },
    headerContainer: {
        marginBottom: 1,
    },
    title: {
        fontSize: 9,
        fontWeight: 'bold',
        textTransform: 'uppercase',
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
    headerSpacer: {
        height: 14,
    },
    officeLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        textAlign: 'left',
    },
    signatureSection: {
        marginTop: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    signatureBox: {
        width: '23%',
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

interface AipSummaryDocumentProps {
    aipEntries: AipEntry[];
    fiscalYear: FiscalYear;
    officeName: string;
    currentScope?: { scope: string; supplemental_aip_id: number | null };
    signatories: {
        preparedName: string;
        preparedPosition: string;
        reviewedName: string;
        reviewedPosition: string;
        approvedName: string;
        approvedPosition: string;
        conformeName: string;
        conformePosition: string;
    };
}

// Row style resolver for AIP Summary
const aipRowStyleResolver = (row: any) => {
    if (row.type === 'banner') {
        if (row.id.startsWith('ppa-')) {
            return {
                rowStyle: {
                    flexDirection: 'row',
                    borderBottomWidth: 0.5,
                    borderBottomColor: '#000000',
                    minHeight: 12,
                    alignItems: 'stretch',
                },
                textStyle: {
                    fontSize: 5,
                    fontWeight: 'bold',
                    color: '#000000',
                },
            };
        }

        if (row.id.startsWith('output-')) {
            return {
                rowStyle: {
                    flexDirection: 'row',
                    backgroundColor: '#DEEAF6',
                    borderBottomWidth: 0.5,
                    borderBottomColor: '#000000',
                    minHeight: 11,
                    alignItems: 'stretch',
                },
                textStyle: {
                    fontSize: 5,
                    fontWeight: 'bold',
                    color: '#000000',
                },
            };
        }
    }

    if (row.type === 'subtotal') {
        if (row.id.startsWith('subtotal-output-')) {
            return {
                rowStyle: {
                    flexDirection: 'row',
                    backgroundColor: '#FEF2CB',
                    borderBottomWidth: 0.5,
                    borderBottomColor: '#000000',
                    minHeight: 11,
                    alignItems: 'stretch',
                },
                textStyle: {
                    fontSize: 5,
                    fontWeight: 'bold',
                    color: '#000000',
                },
            };
        }

        if (row.id.startsWith('subtotal-ppa-')) {
            return {
                rowStyle: {
                    flexDirection: 'row',
                    backgroundColor: '#FFFF00',
                    borderBottomWidth: 0.5,
                    borderBottomColor: '#000000',
                    minHeight: 12,
                    alignItems: 'stretch',
                },
                textStyle: {
                    fontSize: 5,
                    fontWeight: 'bold',
                    color: '#000000',
                },
            };
        }
    }

    if (row.type === 'item' && !row.isLastInPpaGroup) {
        return {
            rowStyle: {
                borderBottomWidth: 0,
            },
        };
    }

    return null; // fallback to default
};

// Custom grand total: "TOTAL" spans the first seven columns, amounts fill the
// remaining columns, no background - borders only. The top border is provided
// by the last item row's bottom border to avoid a doubled line.
const renderAipGrandTotal = (row: TableRow, columns: ColumnDef<any>[]) => {
    const totals = row.totals || {};
    const LABEL_SPAN_END = 6; // ref_code through funding_source

    const labelWidth = columns
        .slice(0, LABEL_SPAN_END + 1)
        .reduce((sum, col) => sum + parseFloat(col.width), 0);

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
            {/* Label spanning the first seven columns */}
            <View
                style={{
                    width: `${labelWidth}%`,
                    borderLeftWidth: 0.5,
                    borderLeftColor: '#000000',
                    borderRightWidth: 0.5,
                    borderRightColor: '#000000',
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 2,
                }}
            >
                <Text
                    style={{
                        fontSize: 5,
                        fontWeight: 'bold',
                        color: '#000000',
                    }}
                >
                    TOTAL
                </Text>
            </View>

            {/* Amount + CC typology columns */}
            {columns.slice(LABEL_SPAN_END + 1).map((col) => (
                <View
                    key={col.id}
                    style={{
                        width: col.width,
                        borderRightWidth: 0.5,
                        borderRightColor: '#000000',
                        justifyContent: 'center',
                        paddingHorizontal: 1,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 5,
                            fontWeight: 'bold',
                            color: '#000000',
                            textAlign:
                                col.id === 'cc_typology' ? 'center' : 'right',
                        }}
                    >
                        {col.id === 'cc_typology'
                            ? ''
                            : formatCurrency(String(totals[col.id] || 0))}
                    </Text>
                </View>
            ))}
        </View>
    );
};

export const AipSummaryDocument: React.FC<AipSummaryDocumentProps> = ({
    aipEntries,
    fiscalYear,
    officeName,
    currentScope,
    signatories,
}) => {
    const columns = getAipSummaryColumnDefs();
    const rows = prepareAipSummaryRows(aipEntries);

    const scopeLabel =
        currentScope?.scope === 'supplemental'
            ? `Supplemental Annual Investment Program (SAIP)`
            : 'Annual Investment Program (AIP)';

    return (
        <Document>
            <Page size={[612, 936]} orientation="landscape" style={styles.page}>
                {/* Header */}
                <View fixed style={styles.headerContainer}>
                    {/* Row 1 */}
                    <Text style={styles.title}>
                        CY {fiscalYear.year} {scopeLabel}
                    </Text>

                    {/* Row 2 */}
                    <Text style={styles.subtitle}>
                        By Program / Project / Activity - by Sector
                    </Text>

                    {/* Row 3 – blank spacer */}
                    <View style={styles.headerSpacer} />

                    {/* Row 4 – office name, left-aligned */}
                    <Text style={styles.officeLabel}>
                        OFFICE:{' '}
                        <Text style={{ textDecoration: 'underline' }}>
                            {officeName.toUpperCase()}
                        </Text>
                    </Text>
                </View>

                {/* Custom header - detached from the table body */}
                <TableHeader />

                {/* Table body - header suppressed via headerComponent={null} */}
                <PpmpPdfTable
                    columns={columns}
                    rows={rows}
                    rowStyleResolver={aipRowStyleResolver}
                    headerComponent={null}
                    cellVerticalAlign="flex-start"
                    grandTotalComponent={renderAipGrandTotal}
                />

                {/* Signature Block — 4 editable signatories + positions, left-aligned, name bold underlined (full-width line when empty) */}
                <View style={styles.signatureSection} wrap={false}>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureLabel}>Prepared by:</Text>
                        {signatories.preparedName.trim() ? (
                            <Text style={styles.signatureName}>
                                {signatories.preparedName.trim()}
                            </Text>
                        ) : (
                            <View style={styles.signatureNameLine}>
                                <Text style={{ fontSize: 7 }}> </Text>
                            </View>
                        )}
                        <Text style={styles.signatureTitle}>
                            {signatories.preparedPosition.trim() ||
                                "Provincial Planning & Dev't Coordinator"}
                        </Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureLabel}>Reviewed by:</Text>
                        {signatories.reviewedName.trim() ? (
                            <Text style={styles.signatureName}>
                                {signatories.reviewedName.trim()}
                            </Text>
                        ) : (
                            <View style={styles.signatureNameLine}>
                                <Text style={{ fontSize: 7 }}> </Text>
                            </View>
                        )}
                        <Text style={styles.signatureTitle}>
                            {signatories.reviewedPosition.trim() ||
                                'OIC-Provincial Budget Officer'}
                        </Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureLabel}>Approved by:</Text>
                        {signatories.approvedName.trim() ? (
                            <Text style={styles.signatureName}>
                                {signatories.approvedName.trim()}
                            </Text>
                        ) : (
                            <View style={styles.signatureNameLine}>
                                <Text style={{ fontSize: 7 }}> </Text>
                            </View>
                        )}
                        <Text style={styles.signatureTitle}>
                            {signatories.approvedPosition.trim() ||
                                'Provincial Governor'}
                        </Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureLabel}>Conforme:</Text>
                        {signatories.conformeName.trim() ? (
                            <Text style={styles.signatureName}>
                                {signatories.conformeName.trim()}
                            </Text>
                        ) : (
                            <View style={styles.signatureNameLine}>
                                <Text style={{ fontSize: 7 }}> </Text>
                            </View>
                        )}
                        <Text style={styles.signatureTitle}>
                            {signatories.conformePosition.trim() || '-'}
                        </Text>
                    </View>
                </View>

                {/* Footer */}
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
