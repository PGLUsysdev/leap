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
import { getPpmpColumnDefs } from './colDefs';
import { PpmpPdfTable } from './PpmpPdfTable';

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
    // Signatures
    signatureSection: {
        marginTop: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    signatureBox: {
        width: '30%',
        textAlign: 'center',
    },
    signatureLabel: {
        fontSize: 6,
        color: '#475569',
        marginBottom: 20,
    },
    signatureName: {
        fontSize: 7,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        borderBottomWidth: 0.5,
        borderBottomColor: '#0F172A',
        paddingBottom: 2,
    },
    signatureTitle: {
        fontSize: 6,
        color: '#334155',
        marginTop: 2,
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

// Built-in Mock Data (so the format works instantly without props)
const DEFAULT_MOCK_DATA = [
    {
        accountCode: '5-02-03-010',
        accountTitle: 'Office Supplies Expense',
        items: [
            {
                item_number: 1,
                description: 'Ballpoint Pen, Fine Tip, Black',
                unit_of_measurement: 'box',
                price: 150.0,
                total_qty: 20,
                total_amount: 3000.0,
                jan_qty: 10,
                jan_amount: 1500.0,
                jul_qty: 10,
                jul_amount: 1500.0,
            },
            {
                item_number: 2,
                description: 'Paper, Multi-Purpose, A4 70gsm',
                unit_of_measurement: 'ream',
                price: 220.0,
                total_qty: 50,
                total_amount: 11000.0,
                jan_qty: 20,
                jan_amount: 4400.0,
                apr_qty: 10,
                apr_amount: 2200.0,
                jul_qty: 10,
                jul_amount: 2200.0,
                oct_qty: 10,
                oct_amount: 2200.0,
            },
        ],
    },
    {
        accountCode: '5-02-03-070',
        accountTitle: 'Drugs and Medicines Expense',
        items: [
            {
                item_number: 1,
                description: 'Paracetamol 500mg Tablet (500s/box)',
                unit_of_measurement: 'box',
                price: 450.0,
                total_qty: 12,
                total_amount: 5400.0,
                jan_qty: 1,
                jan_amount: 450.0,
                feb_qty: 1,
                feb_amount: 450.0,
                mar_qty: 1,
                mar_amount: 450.0,
                apr_qty: 1,
                apr_amount: 450.0,
                may_qty: 1,
                may_amount: 450.0,
                jun_qty: 1,
                jun_amount: 450.0,
                jul_qty: 1,
                jul_amount: 450.0,
                aug_qty: 1,
                aug_amount: 450.0,
                sep_qty: 1,
                sep_amount: 450.0,
                oct_qty: 1,
                oct_amount: 450.0,
                nov_qty: 1,
                nov_amount: 450.0,
                dec_qty: 1,
                dec_amount: 450.0,
            },
        ],
    },
];

interface PpmpDocumentProps {
    aipEntry?: AipEntry;
    fiscalYear?: FiscalYear;
    fundSource?: string;
    groupedData?: any[];
    officeName?: string;
    ppaFundingSource?: PpaFundingSource;
}

export const PpmpDocument: React.FC<PpmpDocumentProps> = ({
    aipEntry,
    fiscalYear,
    groupedData = DEFAULT_MOCK_DATA,
    ppaFundingSource,
}) => {
    const columns = getPpmpColumnDefs();

    return (
        <Document>
            {/* size={[612, 936]} = 8.5 x 13 */}
            <Page size={[612, 936]} orientation="landscape" style={styles.page}>
                {/* Document Header */}
                <View
                    fixed
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        width: '100%',
                        height: 58,
                        fontSize: 5,
                        // borderTopWidth: 0.5,
                        // borderLeftWidth: 0.5,
                        // borderColor: 'black',
                        // borderStyle: 'solid',
                    }}
                >
                    {/* Column 1 (Width: 6.75%) - 5 rows @ 20% each */}
                    <View
                        style={{
                            width: '6.75%',
                            display: 'flex',
                            height: '100%',
                        }}
                    >
                        {/* Row 1 */}
                        <View
                            style={{
                                height: '20%',
                                // borderRightWidth: 0.5,
                                // borderBottomWidth: 0.5,
                                // borderColor: 'black',
                                // borderStyle: 'solid',
                                padding: 2,
                            }}
                        />
                        {/* Row 2 */}
                        <View
                            style={{
                                height: '20%',
                                // borderRightWidth: 0.5,
                                // borderBottomWidth: 0.5,
                                // borderColor: 'black',
                                // borderStyle: 'solid',
                                padding: 2,
                            }}
                        />
                        {/* Row 3 */}
                        <View
                            style={{
                                height: '20%',
                                // borderRightWidth: 0.5,
                                // borderBottomWidth: 0.5,
                                // borderColor: 'black',
                                // borderStyle: 'solid',
                                padding: 2,
                                backgroundColor: '#92D050',
                            }}
                        />
                        {/* Row 4 */}
                        <View
                            style={{
                                height: '20%',
                                // borderRightWidth: 0.5,
                                // borderBottomWidth: 0.5,
                                // borderColor: 'black',
                                // borderStyle: 'solid',
                                padding: 2,
                                backgroundColor: '#92D050',
                            }}
                        />
                        {/* Row 5 */}
                        <View
                            style={{
                                height: '20%',
                                // borderRightWidth: 0.5,
                                // borderBottomWidth: 0.5,
                                // borderColor: 'black',
                                // borderStyle: 'solid',
                                padding: 2,
                                backgroundColor: '#92D050',
                            }}
                        />
                    </View>

                    {/* Column 2 (Width: 29.62%) */}
                    <View
                        style={{
                            width: '29.62%',
                            display: 'flex',
                            height: '100%',
                        }}
                    >
                        {/* Rows 1 & 2 (Spans 2 rows = 40%): office */}
                        <View
                            style={{
                                height: '40%',
                                // borderRightWidth: 0.5,
                                // borderBottomWidth: 0.5,
                                // borderColor: 'black',
                                // borderStyle: 'solid',
                                padding: 2,
                                backgroundColor: '#FF0',
                                justifyContent: 'center',
                                // alignItems: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    // textAlign: 'center',
                                    fontSize: 10,
                                    fontWeight: 'bold',
                                }}
                            >
                                {aipEntry?.ppa?.office?.acronym ||
                                    aipEntry?.ppa?.office?.name ||
                                    '-'}
                            </Text>
                        </View>

                        {/* Row 3 (20%): general fund */}
                        <View
                            style={{
                                height: '20%',
                                // borderRightWidth: 0.5,
                                // borderBottomWidth: 0.5,
                                // borderColor: 'black',
                                // borderStyle: 'solid',
                                padding: 2,
                                backgroundColor: '#92D050',
                                justifyContent: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    fontWeight: 'bold',
                                }}
                            >
                                {ppaFundingSource?.funding_source?.code ||
                                    ppaFundingSource?.funding_source?.title ||
                                    '-'}
                            </Text>
                        </View>

                        {/* Row 4 (20%): aip ref code */}
                        <View
                            style={{
                                height: '20%',
                                // borderRightWidth: 0.5,
                                // borderBottomWidth: 0.5,
                                // borderColor: 'black',
                                // borderStyle: 'solid',
                                padding: 2,
                                backgroundColor: '#92D050',
                                justifyContent: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    fontWeight: 'bold',
                                }}
                            >
                                {'-'}
                            </Text>
                        </View>

                        {/* Row 5 (20%): ppa */}
                        <View
                            style={{
                                height: '20%',
                                // borderRightWidth: 0.5,
                                // borderBottomWidth: 0.5,
                                // borderColor: 'black',
                                // borderStyle: 'solid',
                                padding: 2,
                                backgroundColor: '#92D050',
                                justifyContent: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    fontWeight: 'bold',
                                }}
                            >
                                {aipEntry?.ppa?.name || '-'}
                            </Text>
                        </View>
                    </View>

                    {/* Column 3 (Width: 63.63%) */}
                    <View
                        style={{
                            width: '63.63%',
                            display: 'flex',
                            height: '100%',
                        }}
                    >
                        {/* Rows 1, 2 & 3 (Spans 3 rows = 60%): Title aligned to bottom */}
                        <View
                            style={{
                                height: '60%',
                                // borderRightWidth: 0.5,
                                // borderBottomWidth: 0.5,
                                // borderColor: 'black',
                                // borderStyle: 'solid',
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

                        {/* Rows 4 & 5 (Spans 2 rows = 40%): Subtitle aligned to top */}
                        <View
                            style={{
                                height: '40%',
                                // borderRightWidth: 0.5,
                                // borderBottomWidth: 0.5,
                                // borderColor: 'black',
                                // borderStyle: 'solid',
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

                {/* Dynamic Table */}
                <PpmpPdfTable columns={columns} groupedData={groupedData} />

                {/* Signatures Block */}
                <View style={styles.signatureSection} wrap={false}>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureLabel}>Prepared By:</Text>
                        <Text style={styles.signatureName}>JUAN DELA CRUZ</Text>
                        <Text style={styles.signatureTitle}>
                            PPMP Focal Person / End-User
                        </Text>
                    </View>

                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureLabel}>
                            Recommending Approval:
                        </Text>
                        <Text style={styles.signatureName}>MARIA SANTOS</Text>
                        <Text style={styles.signatureTitle}>
                            Budget Officer / Department Head
                        </Text>
                    </View>

                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureLabel}>Approved By:</Text>
                        <Text style={styles.signatureName}>
                            HON. CITY MAYOR
                        </Text>
                        <Text style={styles.signatureTitle}>
                            Local Chief Executive
                        </Text>
                    </View>
                </View>

                {/* Dynamic Footer */}
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
