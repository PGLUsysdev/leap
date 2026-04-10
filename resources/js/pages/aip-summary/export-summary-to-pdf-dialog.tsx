// resources/js/pages/aip-summary/export-summary-to-pdf-dialog.tsx
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Page,
    Text,
    View,
    Document,
    StyleSheet,
    PDFViewer,
} from '@react-pdf/renderer';
import type { FiscalYear, Ppa } from '@/types/global';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    aipEntries: Ppa[];
    fiscalYear: FiscalYear;
}

// Helper to flatten all aip entries and collect their funding sources
const collectAllFundingSources = (ppas: Ppa[]) => {
    const sources: any[] = [];

    const traverse = (items: Ppa[]) => {
        for (const ppa of items) {
            const aip = ppa.aip_entries?.[0];
            if (aip?.ppa_funding_sources) {
                sources.push(...aip.ppa_funding_sources);
            }
            if (ppa.children) traverse(ppa.children);
        }
    };

    traverse(ppas);
    return sources;
};

// Compute totals per funding source and overall
const computeTotals = (fundingSources: any[]) => {
    const map = new Map<number, any>(); // key = funding_source_id

    for (const fs of fundingSources) {
        const id = fs.funding_source_id;
        if (!map.has(id)) {
            map.set(id, {
                funding_source: fs.funding_source,
                ps_amount: 0,
                mooe_amount: 0,
                fe_amount: 0,
                co_amount: 0,
                ccet_adaptation: 0,
                ccet_mitigation: 0,
            });
        }
        const entry = map.get(id);
        entry.ps_amount += parseFloat(fs.ps_amount || 0);
        entry.mooe_amount += parseFloat(fs.mooe_amount || 0);
        entry.fe_amount += parseFloat(fs.fe_amount || 0);
        entry.co_amount += parseFloat(fs.co_amount || 0);
        entry.ccet_adaptation += parseFloat(fs.ccet_adaptation || 0);
        entry.ccet_mitigation += parseFloat(fs.ccet_mitigation || 0);
    }

    const rows = Array.from(map.values());
    const grandTotal = rows.reduce(
        (acc, row) => {
            acc.ps_amount += row.ps_amount;
            acc.mooe_amount += row.mooe_amount;
            acc.fe_amount += row.fe_amount;
            acc.co_amount += row.co_amount;
            acc.ccet_adaptation += row.ccet_adaptation;
            acc.ccet_mitigation += row.ccet_mitigation;
            return acc;
        },
        {
            ps_amount: 0,
            mooe_amount: 0,
            fe_amount: 0,
            co_amount: 0,
            ccet_adaptation: 0,
            ccet_mitigation: 0,
        },
    );

    return { rows, grandTotal };
};

export default function ExportSummaryToPdfDialog({
    open,
    onOpenChange,
    aipEntries,
    fiscalYear,
}: Props) {
    const allSources = collectAllFundingSources(aipEntries);
    const { rows, grandTotal } = computeTotals(allSources);

    const styles = StyleSheet.create({
        page: { padding: 36, fontFamily: 'Helvetica' },
        title: {
            fontSize: 14,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 10,
        },
        subtitle: { fontSize: 12, textAlign: 'center', marginBottom: 20 },
        tableHeader: {
            flexDirection: 'row',
            borderBottomWidth: 1,
            borderTopWidth: 1,
            borderColor: '#000',
            backgroundColor: '#f0f0f0',
        },
        tableRow: {
            flexDirection: 'row',
            borderBottomWidth: 1,
            borderColor: '#ccc',
        },
        tableCell: { padding: 6, fontSize: 10, flex: 1, textAlign: 'right' },
        tableCellFirst: { flex: 2, textAlign: 'left' },
        grandTotalRow: {
            flexDirection: 'row',
            borderTopWidth: 2,
            borderBottomWidth: 1,
            borderColor: '#000',
            marginTop: 10,
            fontWeight: 'bold',
        },
    });

    const formatNumber = (value: number) => {
        if (!value) return '-';
        return value.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const SummaryDocument = () => (
        <Document>
            {/* Changed size from "A4" to [936, 612] for 13x8.5 landscape */}
            <Page size={[936, 612]} style={styles.page}>
                <Text style={styles.title}>
                    Annual Investment Program (AIP)
                </Text>
                <Text style={styles.subtitle}>
                    Fiscal Year {fiscalYear.year} – Summary of Financial Totals
                    by Funding Source
                </Text>

                {/* Header */}
                <View style={styles.tableHeader}>
                    <Text style={[styles.tableCell, styles.tableCellFirst]}>
                        Funding Source
                    </Text>
                    <Text style={styles.tableCell}>PS</Text>
                    <Text style={styles.tableCell}>MOOE</Text>
                    <Text style={styles.tableCell}>FE</Text>
                    <Text style={styles.tableCell}>CO</Text>
                    <Text style={styles.tableCell}>Adaptation</Text>
                    <Text style={styles.tableCell}>Mitigation</Text>
                </View>

                {/* Rows per funding source */}
                {rows.map((row, idx) => (
                    <View key={idx} style={styles.tableRow}>
                        <Text style={[styles.tableCell, styles.tableCellFirst]}>
                            {row.funding_source?.code ||
                                row.funding_source?.title ||
                                'Unknown'}
                        </Text>
                        <Text style={styles.tableCell}>
                            {formatNumber(row.ps_amount)}
                        </Text>
                        <Text style={styles.tableCell}>
                            {formatNumber(row.mooe_amount)}
                        </Text>
                        <Text style={styles.tableCell}>
                            {formatNumber(row.fe_amount)}
                        </Text>
                        <Text style={styles.tableCell}>
                            {formatNumber(row.co_amount)}
                        </Text>
                        <Text style={styles.tableCell}>
                            {formatNumber(row.ccet_adaptation)}
                        </Text>
                        <Text style={styles.tableCell}>
                            {formatNumber(row.ccet_mitigation)}
                        </Text>
                    </View>
                ))}

                {/* Grand Total row */}
                <View style={styles.grandTotalRow}>
                    <Text style={[styles.tableCell, styles.tableCellFirst]}>
                        GRAND TOTAL
                    </Text>
                    <Text style={styles.tableCell}>
                        {formatNumber(grandTotal.ps_amount)}
                    </Text>
                    <Text style={styles.tableCell}>
                        {formatNumber(grandTotal.mooe_amount)}
                    </Text>
                    <Text style={styles.tableCell}>
                        {formatNumber(grandTotal.fe_amount)}
                    </Text>
                    <Text style={styles.tableCell}>
                        {formatNumber(grandTotal.co_amount)}
                    </Text>
                    <Text style={styles.tableCell}>
                        {formatNumber(grandTotal.ccet_adaptation)}
                    </Text>
                    <Text style={styles.tableCell}>
                        {formatNumber(grandTotal.ccet_mitigation)}
                    </Text>
                </View>
            </Page>
        </Document>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="m-0 flex h-full flex-col gap-0 rounded-none bg-[#3c3c3c] p-0 text-white sm:max-w-full">
                <div className="p-4 pb-0">
                    <DialogTitle>Summary PDF Preview</DialogTitle>
                    <DialogDescription className="sr-only">
                        AIP Summary Report – Totals by Funding Source
                    </DialogDescription>
                </div>
                <div className="h-full bg-white">
                    <PDFViewer width="100%" height="100%" showToolbar>
                        <SummaryDocument />
                    </PDFViewer>
                </div>
            </DialogContent>
        </Dialog>
    );
}
