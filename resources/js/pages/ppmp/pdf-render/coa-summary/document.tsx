// resources\js\pages\ppmp\pdf-render\coa-summary\document.tsx

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
import { PpmpPdfTable } from '../table'; // generic table
import { getSummaryColumnDefs } from './cols';
import { prepareSummaryRows } from './prepare-summary-rows';

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

const headerRowNoBg = {
    backgroundColor: 'transparent', // or remove background entirely
};

interface PpmpSummaryDocumentProps {
    aipEntry?: AipEntry;
    fiscalYear?: FiscalYear;
    groupedData?: any[];
    ppaFundingSource?: PpaFundingSource;
    sheetNumber?: number;
}

export const PpmpSummaryDocument: React.FC<PpmpSummaryDocumentProps> = ({
    aipEntry,
    groupedData = [],
    ppaFundingSource,
    sheetNumber = 1,
}) => {
    const columns = getSummaryColumnDefs();
    const rows = prepareSummaryRows(groupedData);

    return (
        <Document>
            <Page size={[612, 936]} orientation="landscape" style={styles.page}>
                {/* Header */}
                <View>
                    <Text style={styles.headerText}>SHEET # {sheetNumber}</Text>
                    <Text style={styles.headerText}>
                        {ppaFundingSource?.funding_source?.code || '-'}
                    </Text>
                    <Text style={styles.headerText}>
                        {aipEntry?.ppa?.full_code || '-'}
                    </Text>
                    <Text style={styles.headerText}>
                        {aipEntry?.ppa?.name || '-'}
                    </Text>
                </View>

                {/* Table */}
                <PpmpPdfTable
                    columns={columns}
                    rows={rows}
                    headerStyle={headerRowNoBg}
                />

                {/* Footer */}
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
