import { View, Text, StyleSheet } from '@react-pdf/renderer';
import React from 'react';
import { formatCurrency } from '@/lib/utils';
import { formatQty } from './colDefs';
import type { ColumnDef } from './colDefs';
import type { TableRow } from './preparePpmpRows';

const styles = StyleSheet.create({
    table: { width: '100%', marginVertical: -0.5 },
    cellText: { fontSize: 5, color: '#000000' },
    headerRow: {
        flexDirection: 'row',
        backgroundColor: '#DEEAF6',
        alignItems: 'stretch',
        borderTopWidth: 0.5,
        borderTopColor: '#000000',
    },
    headerCell: {
        padding: 2,
        borderRightWidth: 0.5,
        borderRightColor: '#000000',
        borderBottomWidth: 0.5,
        borderBottomColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        fontSize: 5,
        fontWeight: 'bold',
        color: '#000000',
    },
    programBannerRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#000000',
        minHeight: 12,
        alignItems: 'stretch',
    },
    programBannerText: {
        fontSize: 5,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    categoryRow: {
        flexDirection: 'row',
        backgroundColor: '#D0CECE',
        borderBottomWidth: 0.5,
        borderBottomColor: '#000000',
        minHeight: 11,
        alignItems: 'stretch',
    },
    categoryText: {
        fontSize: 5,
        fontWeight: 'bold',
        color: '#000000',
        textTransform: 'uppercase',
    },
    coaRow: {
        flexDirection: 'row',
        backgroundColor: '#FBE4D5',
        borderBottomWidth: 0.5,
        borderBottomColor: '#000000',
        minHeight: 11,
        alignItems: 'stretch',
    },
    coaText: { fontSize: 5, fontWeight: 'normal', color: '#000000' },
    row: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#000000',
        minHeight: 11,
        alignItems: 'stretch',
    },
    rowEven: {},
    cell: {
        padding: 1.5,
        borderRightWidth: 0.5,
        borderRightColor: '#000000',
        justifyContent: 'center',
    },
    categoryTotalRow: {
        flexDirection: 'row',
        backgroundColor: '#FEF2CB',
        borderBottomWidth: 0.5,
        borderBottomColor: '#000000',
        minHeight: 11,
        alignItems: 'stretch',
    },
    programTotalRow: {
        flexDirection: 'row',
        backgroundColor: '#FFFF00',
        borderBottomWidth: 0.5,
        borderBottomColor: '#000000',
        minHeight: 12,
        alignItems: 'stretch',
    },
    grandTotalRow: {
        flexDirection: 'row',
        backgroundColor: '#00B050',
        borderBottomWidth: 0.5,
        borderBottomColor: '#000000',
        minHeight: 13,
        alignItems: 'stretch',
    },
    totalText: { fontSize: 5, fontWeight: 'bold', color: '#000000' },
});

const leftBorderStyle = {
    borderLeftWidth: 0.5,
    borderLeftColor: '#000000',
};

interface PpmpPdfTableProps<T> {
    columns: ColumnDef<T>[];
    rows: TableRow[];
}

// Helper to determine total row text alignment based on column id.
function getTotalTextAlign(columnId: string): 'left' | 'center' | 'right' {
    if (columnId === 'description') return 'left';

    if (columnId === 'total_qty' || columnId.endsWith('_qty')) return 'center';

    if (columnId === 'total_amount' || columnId.endsWith('_amount')) {
        return 'right';
    }

    // For other columns (coa, item_no, uom, price), we default to left.
    // Price could be right, but since we don't display it in totals, it doesn't matter.
    return 'left';
}

export function PpmpPdfTable<T extends Record<string, any>>({
    columns = [],
    rows = [],
}: PpmpPdfTableProps<T>) {
    console.log(rows);

    // Helper to render content that might already be a <Text> element.
    // If it's not a <Text>, wrap it with default styles.
    const renderContent = (content: React.ReactNode, defaultStyle: any) => {
        if (React.isValidElement(content) && content.type === Text) {
            return content;
        }

        return <Text style={defaultStyle}>{content}</Text>;
    };

    // Helper to render a "Banner" row (Program, Category, COA)
    const renderBannerRow = (
        row: TableRow,
        bannerStyle: any,
        textStyle: any,
    ) => (
        <View key={row.id} style={bannerStyle} wrap={false}>
            {columns.map((col, cIdx) => {
                const isDescription = col.id === 'description';

                return (
                    <View
                        key={col.id}
                        style={[
                            styles.cell,
                            {
                                width: col.width,
                                alignItems: isDescription
                                    ? 'flex-start'
                                    : 'center',
                            },
                            cIdx === 0 ? leftBorderStyle : {},
                        ]}
                    >
                        {isDescription ? (
                            <Text style={textStyle}>{row.label}</Text>
                        ) : null}
                    </View>
                );
            })}
        </View>
    );

    // Helper to render "Item" row
    const renderItemRow = (row: TableRow) => (
        <View key={row.id} wrap={false} style={[styles.row]}>
            {columns.map((col, colIdx) => (
                <View
                    key={col.id}
                    style={[
                        styles.cell,
                        { width: col.width },
                        colIdx === 0 ? leftBorderStyle : {},
                    ]}
                >
                    {renderContent(col.cell(row.item), styles.cellText)}
                </View>
            ))}
        </View>
    );

    // Helper to render "Total" row (Subtotal, Program Total, Grand Total)
    const renderTotalRow = (row: TableRow, totalStyle: any) => {
        const totals = row.totals || {};

        return (
            <View key={row.id} style={totalStyle} wrap={false}>
                {columns.map((col, cIdx) => {
                    let content: React.ReactNode = '';

                    if (col.id === 'description') {
                        content = row.label;
                    } else if (
                        col.id === 'total_qty' ||
                        col.id.endsWith('_qty')
                    ) {
                        content = formatQty(totals[col.id]);
                    } else if (
                        col.id === 'total_amount' ||
                        col.id.endsWith('_amount')
                    ) {
                        content = formatCurrency(String(totals[col.id] || 0));
                    } else {
                        content = '';
                    }

                    // Determine text alignment based on column id
                    const align = getTotalTextAlign(col.id);
                    const textStyle = {
                        ...styles.totalText,
                        textAlign: align,
                    };

                    return (
                        <View
                            key={col.id}
                            style={[
                                styles.cell,
                                {
                                    width: col.width,
                                },
                                cIdx === 0 ? leftBorderStyle : {},
                            ]}
                        >
                            <Text style={textStyle}>{content}</Text>
                        </View>
                    );
                })}
            </View>
        );
    };

    return (
        <View style={styles.table}>
            {/* Header Row - fixed */}
            <View fixed style={styles.headerRow}>
                {columns.map((col, cIdx) => (
                    <View
                        key={col.id}
                        style={[
                            styles.headerCell,
                            { width: col.width },
                            cIdx === 0 ? leftBorderStyle : {},
                        ]}
                    >
                        {renderContent(col.header, styles.headerText)}
                    </View>
                ))}
            </View>

            {/* Body - Flat loop over rows */}
            {rows.map((row) => {
                switch (row.type) {
                    case 'banner':
                        if (row.id.startsWith('prog-')) {
                            return renderBannerRow(
                                row,
                                styles.programBannerRow,
                                styles.programBannerText,
                            );
                        } else if (row.id.startsWith('cat-')) {
                            return renderBannerRow(
                                row,
                                styles.categoryRow,
                                styles.categoryText,
                            );
                        } else if (row.id.startsWith('coa-')) {
                            return renderBannerRow(
                                row,
                                styles.coaRow,
                                styles.coaText,
                            );
                        }

                        return null;

                    case 'item':
                        return renderItemRow(row);

                    case 'subtotal':
                        if (row.id.startsWith('prog-total-')) {
                            return renderTotalRow(row, styles.programTotalRow);
                        }

                        return renderTotalRow(row, styles.categoryTotalRow);

                    case 'grand-total':
                        return renderTotalRow(row, styles.grandTotalRow);

                    default:
                        return null;
                }
            })}
        </View>
    );
}
