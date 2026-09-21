// resources\js\pages\ppmp\pdf-render\ppmp\document.tsx

import {
    Document,
    Page,
    View,
    Text,
    StyleSheet,
    Font,
} from '@react-pdf/renderer';
import React from 'react';
import type { AipEntry, FiscalYear, PpaFundingSource } from '@/types';
import { PpmpPdfTable } from '../table';
import { getPpmpColumnDefs } from './cols';
import { preparePpmpRows } from './prepare-ppmp-rows';

Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
    page: {
        padding: 12,
        fontFamily: 'Helvetica',
    },
    headerContainer: {
        marginBottom: 6,
        textAlign: 'center',
    },
    agencyText: {
        fontSize: 7,
        textTransform: 'uppercase',
        color: '#475569',
    },
    title: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginTop: 2,
        color: '#0F172A',
    },
    subtitle: {
        fontSize: 7,
        marginTop: 1,
        color: '#334155',
    },
    metaGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
        marginBottom: 4,
        padding: 4,
        backgroundColor: '#F1F5F9',
        borderRadius: 2,
    },
    metaText: {
        fontSize: 6.5,
        color: '#1E293B',
    },
    bold: {
        fontWeight: 'bold',
    },
    signatureSection: {
        marginTop: 15,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    signatureBox: {
        width: '30%',
        textAlign: 'center',
    },
    signatureLabel: {
        fontSize: 6,
        marginBottom: 20,
        textAlign: 'center',
    },
    signatureName: {
        fontSize: 7,
        fontWeight: 'bold',
        textAlign: 'center',
        textDecoration: 'underline',
        marginBottom: 2,
    },
    signatureNameLine: {
        borderBottomWidth: 0.5,
        borderBottomColor: '#0F172A',
        paddingBottom: 2,
        marginBottom: 2,
        minHeight: 9,
    },
    signatureTitle: {
        fontSize: 6,
        marginTop: 2,
        textAlign: 'center',
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

interface PpmpDocumentProps {
    aipEntry?: AipEntry;
    fiscalYear?: FiscalYear;
    fundSource?: string;
    groupedData?: any[]; // now optional – defaults to []
    officeName?: string;
    ppaFundingSource?: PpaFundingSource;
    signatories: {
        deptHead: string;
        deptHeadPosition: string;
    };
}

export const PpmpDocument: React.FC<PpmpDocumentProps> = ({
    aipEntry,
    fiscalYear,
    groupedData = [], // empty array fallback (no mock data)
    ppaFundingSource,
    signatories,
}) => {
    // console.log({ aipEntry, fiscalYear, groupedData, ppaFundingSource });

    const columns = getPpmpColumnDefs();
    const rows = preparePpmpRows(groupedData);

    return (
        <Document>
            <Page size={[612, 936]} orientation="landscape" style={styles.page}>
                {/* Document Header – unchanged */}
                <View
                    fixed
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        width: '100%',
                        height: 58,
                        fontSize: 5,
                    }}
                >
                    {/* Column 1 */}
                    <View
                        style={{
                            width: '6.75%',
                            display: 'flex',
                            height: '100%',
                        }}
                    >
                        <View style={{ height: '20%', padding: 2 }} />
                        <View style={{ height: '20%', padding: 2 }} />
                        <View
                            style={{
                                height: '20%',
                                padding: 2,
                                backgroundColor: '#92D050',
                            }}
                        />
                        <View
                            style={{
                                height: '20%',
                                padding: 2,
                                backgroundColor: '#92D050',
                            }}
                        />
                        <View
                            style={{
                                height: '20%',
                                padding: 2,
                                backgroundColor: '#92D050',
                            }}
                        />
                    </View>

                    {/* Column 2 */}
                    <View
                        style={{
                            width: '29.62%',
                            display: 'flex',
                            height: '100%',
                        }}
                    >
                        <View
                            style={{
                                height: '40%',
                                padding: 2,
                                backgroundColor: '#FF0',
                                justifyContent: 'center',
                            }}
                        >
                            <Text style={{ fontSize: 10, fontWeight: 'bold' }}>
                                {aipEntry?.ppa?.office?.acronym ||
                                    aipEntry?.ppa?.office?.name ||
                                    '-'}
                            </Text>
                        </View>
                        <View
                            style={{
                                height: '20%',
                                padding: 2,
                                backgroundColor: '#92D050',
                                justifyContent: 'center',
                            }}
                        >
                            <Text style={{ fontWeight: 'bold' }}>
                                {ppaFundingSource?.funding_source?.code ||
                                    ppaFundingSource?.funding_source?.title ||
                                    '-'}
                            </Text>
                        </View>
                        <View
                            style={{
                                height: '20%',
                                padding: 2,
                                backgroundColor: '#92D050',
                                justifyContent: 'center',
                            }}
                        >
                            <Text style={{ fontWeight: 'bold' }}>
                                {aipEntry?.ppa?.full_code || '-'}
                            </Text>
                        </View>
                        <View
                            style={{
                                height: '20%',
                                padding: 2,
                                backgroundColor: '#92D050',
                                justifyContent: 'center',
                            }}
                        >
                            <Text style={{ fontWeight: 'bold' }}>
                                {aipEntry?.ppa?.name || '-'}
                            </Text>
                        </View>
                    </View>

                    {/* Column 3 */}
                    <View
                        style={{
                            width: '63.63%',
                            display: 'flex',
                            height: '100%',
                        }}
                    >
                        <View
                            style={{
                                height: '60%',
                                padding: 2,
                                justifyContent: 'flex-end',
                                alignItems: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    fontSize: 23,
                                    fontWeight: 'bold',
                                }}
                            >
                                PROVINCIAL GOVERNMENT OF LA UNION
                            </Text>
                        </View>
                        <View
                            style={{
                                height: '40%',
                                padding: 2,
                                justifyContent: 'flex-start',
                                alignItems: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    fontSize: 15,
                                    fontWeight: 'bold',
                                }}
                            >
                                PROJECT PROCUREMENT MANAGEMENT PLAN(PPMP) CY{' '}
                                {fiscalYear?.year || '-'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Dynamic Table – now receives groupedData (empty by default) */}
                <PpmpPdfTable columns={columns} rows={rows} />

                <View style={styles.signatureSection} wrap={false}>
                    <View style={styles.signatureBox}>
                        {signatories.deptHead.trim() ? (
                            <Text style={styles.signatureName}>
                                {signatories.deptHead.trim()}
                            </Text>
                        ) : (
                            <View style={styles.signatureNameLine}>
                                <Text style={{ fontSize: 7 }}> </Text>
                            </View>
                        )}
                        <Text style={styles.signatureTitle}>
                            {signatories.deptHeadPosition.trim() ||
                                'Department Head'}
                        </Text>
                    </View>
                </View>

                {/* Page Footer */}
                <View style={styles.footer} fixed>
                    <Text></Text>
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
