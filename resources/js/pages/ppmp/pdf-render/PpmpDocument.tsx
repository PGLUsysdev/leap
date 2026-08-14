import {
    Document,
    Page,
    View,
    Text,
    StyleSheet,
    Font,
} from '@react-pdf/renderer';
import React from 'react';
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
    fiscalYear?: number;
    officeName?: string;
    fundSource?: string;
    groupedData?: any[];
}

export const PpmpDocument: React.FC<PpmpDocumentProps> = ({
    fiscalYear = 2026,
    officeName = 'OFFICE OF THE MAYOR',
    fundSource = 'GENERAL FUND - ANNUAL INVESTMENT PROGRAM (AIP)',
    groupedData = DEFAULT_MOCK_DATA,
}) => {
    const columns = getPpmpColumnDefs(fiscalYear);

    return (
        <Document>
            <Page size="LEGAL" orientation="landscape" style={styles.page}>
                {/* Document Header */}
                <View style={styles.headerContainer}>
                    <Text style={styles.agencyText}>
                        Republic of the Philippines • Local Government Unit
                    </Text>
                    <Text style={styles.title}>
                        PROJECT PROCUREMENT MANAGEMENT PLAN (PPMP)
                    </Text>
                    <Text style={styles.subtitle}>
                        Fiscal Year {fiscalYear}
                    </Text>
                </View>

                {/* Metadata Banner */}
                <View style={styles.metaGrid}>
                    <Text style={styles.metaText}>
                        <Text style={styles.bold}>END-USER / OFFICE:</Text>{' '}
                        {officeName}
                    </Text>
                    <Text style={styles.metaText}>
                        <Text style={styles.bold}>FUND SOURCE:</Text>{' '}
                        {fundSource}
                    </Text>
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
                    <Text>PPMP Summary Form • System Generated</Text>
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
