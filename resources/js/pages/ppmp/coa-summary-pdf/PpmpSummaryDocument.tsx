// PpmpSummaryDocument.tsx
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
import { getSummaryColumnDefs } from './colDefsSummary';
import { PpmpSummaryTable } from './PpmpSummaryTable';

Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
    page: {
        padding: 12,
        fontFamily: 'Helvetica',
    },
    headerText: {
        fontSize: 5,
        marginBottom: 1,
        fontWeight: 'bold',
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

interface PpmpSummaryDocumentProps {
    aipEntry?: AipEntry;
    fiscalYear?: FiscalYear;
    groupedData?: any[];
    ppaFundingSource?: PpaFundingSource;
    sheetNumber?: number;
}

export const PpmpSummaryDocument: React.FC<PpmpSummaryDocumentProps> = ({
    aipEntry,
    groupedData,
    ppaFundingSource,
    sheetNumber = 1,
}) => {
    const columns = getSummaryColumnDefs();

    // Helper to get AIP reference code – adjust as needed
    const aipRefCode = '-';
    const fundingSource =
        ppaFundingSource?.funding_source?.code ??
        ppaFundingSource?.funding_source?.title ??
        '-';
    const ppaName = aipEntry?.ppa?.name ?? '-';

    return (
        <Document>
            <Page size={[612, 936]} orientation="landscape" style={styles.page}>
                {/* ---- 4‑ROW HEADER (values only, left‑aligned) ---- */}
                <View style={{ marginBottom: 0 }}>
                    <Text style={styles.headerText}>SHEET # {sheetNumber}</Text>
                    <Text style={styles.headerText}>{fundingSource}</Text>
                    <Text style={styles.headerText}>{aipRefCode}</Text>
                    <Text style={styles.headerText}>{ppaName}</Text>
                </View>

                {/* ---- The Summary Table ---- */}
                <PpmpSummaryTable columns={columns} groupedData={groupedData} />

                {/* Footer with page numbers */}
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
