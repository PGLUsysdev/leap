// PpmpSummaryTable.tsx
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import React from 'react';
import type { SummaryColumnDef } from './colDefsSummary';

const styles = StyleSheet.create({
    table: { width: '100%', marginVertical: -0.5 },
    cellText: { fontSize: 5, color: '#000000' },
    headerRow: {
        flexDirection: 'row',
        borderTopWidth: 0.5,
        borderTopColor: '#000000',
        borderBottomWidth: 0.5,
        borderBottomColor: '#000000',
    },
    headerCell: {
        padding: 2,
        borderRightWidth: 0.5,
        borderRightColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: { fontSize: 5, fontWeight: 'bold', textAlign: 'center' },
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
    leftBorder: { borderLeftWidth: 0.5, borderLeftColor: '#000000' },
    expenseClassRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#000000',
        minHeight: 11,
        alignItems: 'stretch',
    },
    expenseClassText: {
        fontSize: 5,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    subtotalRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#000000',
        minHeight: 11,
        alignItems: 'stretch',
    },
    subtotalText: { fontSize: 5, fontWeight: 'bold' },
    grandTotalRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#000000',
        minHeight: 11,
        alignItems: 'stretch',
    },
    grandTotalText: { fontSize: 5, fontWeight: 'bold' },
    spacer: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#000000',
        minHeight: 11,
        alignItems: 'stretch',
    },
});

interface SummaryItem {
    accountCode: string;
    accountTitle: string;
    expenseClass: string;
    total: number;
    q1: number;
    q2: number;
    q3: number;
    q4: number;
}

interface PpmpSummaryTableProps {
    columns: SummaryColumnDef[];
    groupedData: any[];
}

export function PpmpSummaryTable({
    columns,
    groupedData,
}: PpmpSummaryTableProps) {
    // Group and aggregate – always include MOOE, CO, FE
    const { expenseClassGroups, grandTotal } = React.useMemo(() => {
        const expenseMap = new Map<string, Map<string, SummaryItem>>();
        const allowedClasses = ['MOOE', 'CO', 'FE'];

        allowedClasses.forEach((cls) => {
            expenseMap.set(cls, new Map());
        });

        groupedData.forEach((item) => {
            const coa =
                item.ppmp_price_list?.chart_of_account_ppmp_category
                    ?.chart_of_account;

            if (!coa) return;

            const expenseClass = coa.expense_class;

            if (!expenseClass || !allowedClasses.includes(expenseClass)) return;

            const accountCode = coa.account_number;
            const accountTitle = coa.account_title;

            const monthlyTotal = (monthKeys: string[]) =>
                monthKeys.reduce(
                    (sum, m) => sum + (Number(item[`${m}_amount`]) || 0),
                    0,
                );

            const total = monthlyTotal([
                'jan',
                'feb',
                'mar',
                'apr',
                'may',
                'jun',
                'jul',
                'aug',
                'sep',
                'oct',
                'nov',
                'dec',
            ]);
            const q1 = monthlyTotal(['jan', 'feb', 'mar']);
            const q2 = monthlyTotal(['apr', 'may', 'jun']);
            const q3 = monthlyTotal(['jul', 'aug', 'sep']);
            const q4 = monthlyTotal(['oct', 'nov', 'dec']);

            const coaMap = expenseMap.get(expenseClass)!;

            if (!coaMap.has(accountCode)) {
                coaMap.set(accountCode, {
                    accountCode,
                    accountTitle,
                    expenseClass,
                    total: 0,
                    q1: 0,
                    q2: 0,
                    q3: 0,
                    q4: 0,
                });
            }

            const entry = coaMap.get(accountCode)!;
            entry.total += total;
            entry.q1 += q1;
            entry.q2 += q2;
            entry.q3 += q3;
            entry.q4 += q4;
        });

        const groups = allowedClasses.map((expenseClass) => ({
            expenseClass,
            coas: Array.from(expenseMap.get(expenseClass)!.values()),
        }));

        const grandTotal = { total: 0, q1: 0, q2: 0, q3: 0, q4: 0 };
        groups.forEach((g) => {
            g.coas.forEach((coa) => {
                grandTotal.total += coa.total;
                grandTotal.q1 += coa.q1;
                grandTotal.q2 += coa.q2;
                grandTotal.q3 += coa.q3;
                grandTotal.q4 += coa.q4;
            });
        });

        return { expenseClassGroups: groups, grandTotal };
    }, [groupedData]);

    const renderRow = (
        item: any,
        rowStyle: any,
        textStyle: any,
        key: string,
    ) => (
        <View key={key} style={rowStyle} wrap={false}>
            {columns.map((col, idx) => {
                const isFirst = idx === 0;
                const content = col.cell(item);

                return (
                    <View
                        key={col.id}
                        style={[
                            styles.cell,
                            {
                                width: col.width,
                                alignItems:
                                    col.align === 'right'
                                        ? 'flex-end'
                                        : col.align === 'center'
                                          ? 'center'
                                          : 'flex-start',
                            },
                            isFirst && styles.leftBorder,
                        ]}
                    >
                        <Text style={textStyle}>{content}</Text>
                    </View>
                );
            })}
        </View>
    );

    const renderExpenseClassBanner = (label: string, key: string) => (
        <View key={key} style={styles.expenseClassRow} wrap={false}>
            {columns.map((col, idx) => {
                const isFirst = idx === 0;

                return (
                    <View
                        key={col.id}
                        style={[
                            styles.cell,
                            { width: col.width, alignItems: 'flex-start' },
                            isFirst && styles.leftBorder,
                        ]}
                    >
                        {isFirst && (
                            <Text style={styles.expenseClassText}>{label}</Text>
                        )}
                    </View>
                );
            })}
        </View>
    );

    const renderSubtotal = (
        expenseClass: string,
        totals: {
            total: number;
            q1: number;
            q2: number;
            q3: number;
            q4: number;
        },
        key: string,
    ) => {
        const label = `${expenseClass} - SUBTOTAL`;
        const item = {
            accountCode: '',
            accountTitle: label,
            total: totals.total,
            q1: totals.q1,
            q2: totals.q2,
            q3: totals.q3,
            q4: totals.q4,
        };

        return renderRow(item, styles.subtotalRow, styles.subtotalText, key);
    };

    // Spacer row – empty grid with borders
    const renderSpacer = (key: string) => (
        <View key={key} style={styles.spacer}>
            {columns.map((col, idx) => (
                <View
                    key={col.id}
                    style={[
                        {
                            width: col.width,
                            borderRightWidth: 0.5,
                            borderRightColor: '#000000',
                        },
                        idx === 0 && styles.leftBorder,
                    ]}
                />
            ))}
        </View>
    );

    return (
        <View style={styles.table}>
            {/* Header – already has keys */}
            <View fixed style={styles.headerRow}>
                {columns.map((col, idx) => (
                    <View
                        key={col.id}
                        style={[
                            styles.headerCell,
                            { width: col.width },
                            idx === 0 && styles.leftBorder,
                        ]}
                    >
                        <Text style={styles.headerText}>{col.header}</Text>
                    </View>
                ))}
            </View>

            {/* Body */}
            {expenseClassGroups.map((group, gIdx) => {
                const isLast = gIdx === expenseClassGroups.length - 1;
                const groupKey = group.expenseClass; // MOOE, CO, FE are unique

                const subtotals = {
                    total: group.coas.reduce((s, c) => s + c.total, 0),
                    q1: group.coas.reduce((s, c) => s + c.q1, 0),
                    q2: group.coas.reduce((s, c) => s + c.q2, 0),
                    q3: group.coas.reduce((s, c) => s + c.q3, 0),
                    q4: group.coas.reduce((s, c) => s + c.q4, 0),
                };

                return (
                    <View key={groupKey}>
                        {renderExpenseClassBanner(
                            group.expenseClass,
                            `${groupKey}-banner`,
                        )}

                        {group.coas.map((coa, cIdx) => {
                            const item = {
                                accountCode: coa.accountCode,
                                accountTitle: coa.accountTitle,
                                total: coa.total,
                                q1: coa.q1,
                                q2: coa.q2,
                                q3: coa.q3,
                                q4: coa.q4,
                            };

                            return renderRow(
                                item,
                                styles.row,
                                styles.cellText,
                                `${groupKey}-coa-${cIdx}`, // unique key
                            );
                        })}

                        {renderSubtotal(
                            group.expenseClass,
                            subtotals,
                            `${groupKey}-subtotal`,
                        )}

                        {!isLast && renderSpacer(`${groupKey}-spacer`)}
                    </View>
                );
            })}

            {/* Grand Total */}
            {renderRow(
                {
                    accountCode: '',
                    accountTitle: 'GRAND TOTAL - FOR THE PPA',
                    total: grandTotal.total,
                    q1: grandTotal.q1,
                    q2: grandTotal.q2,
                    q3: grandTotal.q3,
                    q4: grandTotal.q4,
                },
                styles.grandTotalRow,
                styles.grandTotalText,
                'grand-total', // unique key
            )}
        </View>
    );
}
