import { View, Text, StyleSheet } from '@react-pdf/renderer';
import React from 'react';
import type { ColumnDef } from './colDefs';

const styles = StyleSheet.create({
    table: {
        width: '100%',
        marginVertical: 4,
        // FIXED: Removed parent borderLeft properties to prevent page break artifacts!
    },

    /* BASE / GLOBAL TEXT STYLE (DEFAULT FONT SIZE = 5) */
    cellText: {
        fontSize: 5,
        color: '#000000',
    },

    /* HEADER ROW: #DEEAF6 */
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
        textAlign: 'center',
        color: '#000000',
    },

    /* LEVEL 1: PROGRAM BANNER (PROCUREMENT / NON-PROCUREMENT) */
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

    /* CATEGORY ROW: #D0CECE */
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

    /* COA ROW: #FBE4D5 */
    coaRow: {
        flexDirection: 'row',
        backgroundColor: '#FBE4D5',
        borderBottomWidth: 0.5,
        borderBottomColor: '#000000',
        minHeight: 11,
        alignItems: 'stretch',
    },
    coaText: {
        fontSize: 5,
        fontWeight: 'normal',
        color: '#000000',
    },

    /* ITEM DATA ROWS */
    row: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#000000',
        minHeight: 11,
        alignItems: 'stretch',
    },
    rowEven: {
        // backgroundColor: '#F8FAFC',
    },
    cell: {
        padding: 1.5,
        borderRightWidth: 0.5,
        borderRightColor: '#000000',
        justifyContent: 'center',
    },

    /* TOTAL CATEGORY ROW: #FEF2CB */
    categoryTotalRow: {
        flexDirection: 'row',
        backgroundColor: '#FEF2CB',
        borderBottomWidth: 0.5,
        borderBottomColor: '#000000',
        minHeight: 11,
        alignItems: 'stretch',
    },

    /* PROGRAM TOTAL ROW (PROCUREMENT / NON-PROCUREMENT): #FFFF00 */
    programTotalRow: {
        flexDirection: 'row',
        backgroundColor: '#FFFF00',
        borderBottomWidth: 0.5,
        borderBottomColor: '#000000',
        minHeight: 12,
        alignItems: 'stretch',
    },

    /* GRAND TOTAL ROW - AIP/PPA: #00B050 */
    grandTotalRow: {
        flexDirection: 'row',
        backgroundColor: '#00B050',
        borderBottomWidth: 0.5,
        borderBottomColor: '#000000',
        minHeight: 13,
        alignItems: 'stretch',
    },

    /* TOTAL TEXT – BOLD FOR ALL SUMMARY ROWS (5pt) */
    totalText: {
        fontSize: 5,
        fontWeight: 'bold',
        color: '#000000',
    },
});

// Helper style to draw outer left border cleanly on the first column of every row
const leftBorderStyle = {
    borderLeftWidth: 0.5,
    borderLeftColor: '#000000',
};

// Helper function to accumulate totals for items
function calculateTotals(items: any[]) {
    const months = [
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
    ];
    const totals: Record<string, number> = {
        total_qty: 0,
        total_amount: 0,
    };

    months.forEach((m) => {
        totals[`${m}_qty`] = 0;
        totals[`${m}_amount`] = 0;
    });

    items.forEach((item) => {
        months.forEach((m) => {
            totals[`${m}_qty`] += Number(item[`${m}_qty`]) || 0;
            totals[`${m}_amount`] += Number(item[`${m}_amount`]) || 0;
        });
        totals.total_qty += months.reduce(
            (sum, m) => sum + (Number(item[`${m}_qty`]) || 0),
            0,
        );
        totals.total_amount += months.reduce(
            (sum, m) => sum + (Number(item[`${m}_amount`]) || 0),
            0,
        );
    });

    return totals;
}

interface PpmpPdfTableProps<T> {
    columns?: ColumnDef<T>[];
    groupedData?: T[];
}

export function PpmpPdfTable<T extends Record<string, any>>({
    columns = [],
    groupedData = [],
}: PpmpPdfTableProps<T>) {
    // 3-TIER GROUPING LOGIC
    const { threeTierStructure, grandTotals } = React.useMemo(() => {
        if (!groupedData || groupedData.length === 0) {
            return { threeTierStructure: [], grandTotals: calculateTotals([]) };
        }

        const level1Map = new Map<
            string,
            {
                title: string;
                categories: Map<
                    string,
                    {
                        categoryName: string;
                        coas: Map<
                            string,
                            {
                                accountCode: string;
                                accountTitle: string;
                                items: T[];
                            }
                        >;
                    }
                >;
            }
        >();

        groupedData.forEach((item) => {
            const capc = item.ppmp_price_list?.chart_of_account_ppmp_category;
            const category = capc?.ppmp_category;
            const coa = capc?.chart_of_account;

            const isNonProcurement = Boolean(
                category?.is_non_procurement ?? false,
            );
            const level1Key = isNonProcurement
                ? 'NON_PROCUREMENT'
                : 'PROCUREMENT';
            const level1Title = isNonProcurement
                ? 'NON-PROCUREMENT ITEMS'
                : 'PROCUREMENT ITEMS';

            if (!level1Map.has(level1Key)) {
                level1Map.set(level1Key, {
                    title: level1Title,
                    categories: new Map(),
                });
            }

            const categoryName = category?.name || 'GENERAL CATEGORY';
            const level1Group = level1Map.get(level1Key)!;

            if (!level1Group.categories.has(categoryName)) {
                level1Group.categories.set(categoryName, {
                    categoryName,
                    coas: new Map(),
                });
            }

            const accountCode = coa?.account_number || 'UNCATEGORIZED';
            const accountTitle = coa?.account_title || 'General Expenses';
            const level2Group = level1Group.categories.get(categoryName)!;

            if (!level2Group.coas.has(accountCode)) {
                level2Group.coas.set(accountCode, {
                    accountCode,
                    accountTitle,
                    items: [],
                });
            }

            level2Group.coas.get(accountCode)!.items.push(item);
        });

        const structure = Array.from(level1Map.values()).map((l1) => ({
            title: l1.title,
            categories: Array.from(l1.categories.values()).map((l2) => ({
                categoryName: l2.categoryName,
                coas: Array.from(l2.coas.values()),
            })),
        }));

        return {
            threeTierStructure: structure,
            grandTotals: calculateTotals(groupedData),
        };
    }, [groupedData]);

    // Helper to render GRID-ALIGNED BANNER ROWS
    const renderBannerGridRow = (
        titleText: string,
        rowStyle: any,
        textStyle: any,
    ) => (
        <View style={rowStyle} wrap={false}>
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
                            <Text style={textStyle}>{titleText}</Text>
                        ) : null}
                    </View>
                );
            })}
        </View>
    );

    // Helper to render SUMMARY TOTAL ROWS
    const renderSummaryRow = (
        label: string,
        totals: Record<string, number>,
        rowStyle: any,
        textStyle: any,
    ) => (
        <View style={rowStyle} wrap={false}>
            {columns.map((col, cIdx) => {
                let content: React.ReactNode = '';

                if (col.id === 'description') {
                    content = label;
                } else if (
                    col.id === 'item_no' ||
                    col.id === 'uom' ||
                    col.id === 'price' ||
                    col.id === 'coa'
                ) {
                    content = '';
                } else {
                    content = col.cell(totals as any);
                }

                return (
                    <View
                        key={col.id}
                        style={[
                            styles.cell,
                            {
                                width: col.width,
                                alignItems:
                                    col.id === 'description'
                                        ? 'flex-start'
                                        : col.align === 'right'
                                          ? 'flex-end'
                                          : 'center',
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

    return (
        <View style={styles.table}>
            {/* 1. HEADER ROW: #DEEAF6 */}
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
                        <Text style={styles.headerText}>{col.header}</Text>
                    </View>
                ))}
            </View>

            {/* 2. TABLE BODY */}
            {threeTierStructure.map((programGroup, pIdx) => {
                const programItems = programGroup.categories.flatMap((c) =>
                    c.coas.flatMap((coa) => coa.items),
                );
                const programTotals = calculateTotals(programItems);

                return (
                    <View key={pIdx}>
                        {/* PROGRAM BANNER GRID ROW */}
                        {renderBannerGridRow(
                            programGroup.title,
                            styles.programBannerRow,
                            styles.programBannerText,
                        )}

                        {programGroup.categories.map((catGroup, cIdx) => {
                            const categoryItems = catGroup.coas.flatMap(
                                (coa) => coa.items,
                            );
                            const categoryTotals =
                                calculateTotals(categoryItems);

                            return (
                                <View key={cIdx}>
                                    {/* CATEGORY GRID ROW: #D0CECE */}
                                    {renderBannerGridRow(
                                        catGroup.categoryName,
                                        styles.categoryRow,
                                        styles.categoryText,
                                    )}

                                    {catGroup.coas.map((coaGroup, coaIdx) => (
                                        <View key={coaIdx}>
                                            {/* COA GRID ROW: #FBE4D5 */}
                                            {renderBannerGridRow(
                                                coaGroup.accountTitle,
                                                styles.coaRow,
                                                styles.coaText,
                                            )}

                                            {/* ITEM DATA ROWS */}
                                            {coaGroup.items.map(
                                                (item, rIdx) => (
                                                    <View
                                                        key={rIdx}
                                                        wrap={false}
                                                        style={[
                                                            styles.row,
                                                            rIdx % 2 === 0
                                                                ? styles.rowEven
                                                                : {},
                                                        ]}
                                                    >
                                                        {columns.map(
                                                            (col, colIdx) => (
                                                                <View
                                                                    key={col.id}
                                                                    style={[
                                                                        styles.cell,
                                                                        {
                                                                            width: col.width,
                                                                            alignItems:
                                                                                col.align ===
                                                                                'right'
                                                                                    ? 'flex-end'
                                                                                    : col.align ===
                                                                                        'center'
                                                                                      ? 'center'
                                                                                      : 'flex-start',
                                                                        },
                                                                        colIdx ===
                                                                        0
                                                                            ? leftBorderStyle
                                                                            : {},
                                                                    ]}
                                                                >
                                                                    <Text
                                                                        style={
                                                                            styles.cellText
                                                                        }
                                                                    >
                                                                        {col.cell(
                                                                            item,
                                                                        )}
                                                                    </Text>
                                                                </View>
                                                            ),
                                                        )}
                                                    </View>
                                                ),
                                            )}
                                        </View>
                                    ))}

                                    {/* TOTAL CATEGORY ROW: #FEF2CB */}
                                    {renderSummaryRow(
                                        `${catGroup.categoryName} - TOTAL`,
                                        categoryTotals,
                                        styles.categoryTotalRow,
                                        styles.totalText,
                                    )}
                                </View>
                            );
                        })}

                        {/* TOTAL PROGRAM ROW */}
                        {renderSummaryRow(
                            `TOTAL FOR ${programGroup.title}`,
                            programTotals,
                            styles.programTotalRow,
                            styles.totalText,
                        )}
                    </View>
                );
            })}

            {/* 3. GRAND TOTAL - FOR THE AIP/PPA */}
            {renderSummaryRow(
                'GRAND TOTAL - FOR THE AIP/PPA',
                grandTotals,
                styles.grandTotalRow,
                styles.totalText,
            )}
        </View>
    );
}
