import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { PDFViewer } from '@react-pdf/renderer';
import type { FiscalYear, Ppa } from '@/types/global';
import { Font } from '@react-pdf/renderer';

interface ExportToPdfDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    aipEntries: Ppa[];
    fiscalYear: FiscalYear;
}

// This disables hyphenation on wrap globally
Font.registerHyphenationCallback((word) => [word]);

export default function ExportToPdfDialog({
    open,
    onOpenChange,
    aipEntries,
    fiscalYear,
}: ExportToPdfDialogProps) {
    // console.log(aipEntries);

    const COLUMN_WIDTHS = [
        7.14, 17.86, 7.14, 5.36, 5.36, 7.14, 5.36, 5.36, 7.14, 5.36, 5.36, 5.36,
        5.36, 5.36, 5.34,
    ];

    const keys = [
        'full_code',
        'title',
        'office.acronym',
        'aip_entry.start_date',
        'aip_entry.end_date',
        'aip_entry.expected_output',
        'aip_entry.funding_source.code',
        'aip_entry.ps_amount',
        'aip_entry.mooe_amount',
        'aip_entry.fe_amount',
        'aip_entry.co_amount',
        'aip_entry.total_amount',
        'aip_entry.ccet_adaptation',
        'aip_entry.ccet_mitigation',
        'aip_entry.typology.code',
    ];

    const office =
        'OFFICE OF THE PROVINCIAL GOVERNOR - INFORMATION AND COMMUNICATIONS TECHNOLOGY UNIT';

    const styles = StyleSheet.create({
        page: { padding: 36 },
        tableHeaderCell: {
            margin: 2,
            fontSize: 6,
            textAlign: 'center',
        },
        tableCell: {
            margin: 2,
            fontSize: 7,
            paddingVertical: 2,
            textAlign: 'center',
        },
        headerGroup: { flexDirection: 'column', padding: 0 },
    });

    const formatNumber = (value: string) => {
        const num = parseFloat(value);
        // If it's null, undefined, NaN, or exactly 0, return "-"
        if (!value || isNaN(num) || num === 0) return '-';

        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(num);
    };

    const getNestedValue = (obj: Ppa, path: string) => {
        const value = path
            .split('.')
            .reduce((acc, part) => acc && acc[part], obj as any);

        // 1. Handle Dates
        if (
            (path.includes('start_date') || path.includes('end_date')) &&
            value
        ) {
            const parts = value.split('-');
            if (parts.length === 3) {
                const shortMonths = [
                    'Jan',
                    'Feb',
                    'Mar',
                    'Apr',
                    'May',
                    'Jun',
                    'Jul',
                    'Aug',
                    'Sep',
                    'Oct',
                    'Nov',
                    'Dec',
                ];
                const monthName = shortMonths[parseInt(parts[1]) - 1];
                const day = parseInt(parts[2]);
                return `${monthName}-${day}`;
            }
        }

        // 2. Handle Amounts
        const amountFields = [
            'ps_amount',
            'mooe_amount',
            'fe_amount',
            'co_amount',
            'total_amount',
            'ccet_adaptation',
            'ccet_mitigation',
        ];
        if (amountFields.some((field) => path.includes(field))) {
            return formatNumber(value);
        }

        // 3. Fallback for any other null/undefined/empty string values
        return value === null || value === undefined || value === ''
            ? '-'
            : value;
    };

    // Helper to safely get value directly from funding source object or fallback
    const getFsValue = (fs: any, originalKey: string, item: Ppa) => {
        console.log(fs);
        console.log(originalKey);
        console.log(item);

        let value;

        if (originalKey === 'aip_entry.funding_source.code') {
            value = fs.code ?? fs.funding_source?.code;
        } else {
            const field = originalKey.replace('aip_entry.', '');
            console.log(field);
            value = fs.pivot?.[field];
            console.log(value);

            if (field === 'total_amount') {
                const ps = parseFloat(fs.pivot?.ps_amount || 0);
                const mooe = parseFloat(fs.pivot?.mooe_amount || 0);
                const fe = parseFloat(fs.pivot?.fe_amount || 0);
                const co = parseFloat(fs.pivot?.co_amount || 0);
                value = ps + mooe + fe + co;
            } else {
                value = fs.pivot?.[field];
            }

            // Fallback to item.aip_entry if value isn't in fs (in case API places them differently)
            if (value === undefined && item.aip_entry) {
                value = (item.aip_entry as any)[field];
            }
        }

        const amountFields = [
            'ps_amount',
            'mooe_amount',
            'fe_amount',
            'co_amount',
            'total_amount',
            'ccet_adaptation',
            'ccet_mitigation',
        ];

        if (amountFields.some((field) => originalKey.includes(field))) {
            return formatNumber(value);
        }

        return value === null || value === undefined || value === ''
            ? '-'
            : value;
    };

    const renderOrderedRows = (initialEntries: Ppa[]) => {
        const result = [];
        let rootCounter = 0;

        // We use a stack for Depth-First Search (DFS)
        const stack = [...initialEntries].toReversed().map((item) => ({
            item,
            level: 0,
            path: [] as number[],
        }));

        while (stack.length > 0) {
            const { item, level, path } = stack.pop()!;
            let displayTitle = getNestedValue(item, 'title');

            if (level === 0) {
                // Level 0: Programs use Letters (A, B, C...)
                const letter = String.fromCharCode(65 + rootCounter);
                displayTitle = `${letter}. ${displayTitle}`;
                rootCounter++;
            } else {
                // Level 1+: Hierarchical numbers (1., 1.1, 1.1.1)
                const outlineString = path.join('.');
                const suffix = level === 1 ? '.' : '';
                displayTitle = `${outlineString}${suffix} ${displayTitle}`;
            }

            result.push(
                <View
                    key={`${item.id}-${level}`}
                    style={{ flexDirection: 'row' }}
                    wrap={false}
                >
                    {/* Cols 0 to 5: Base Details */}
                    {COLUMN_WIDTHS.slice(0, 6).map((width, colIndex) => (
                        <View
                            key={colIndex}
                            style={{
                                width: `${width}%`,
                                borderRightWidth: 1,
                                borderLeftWidth: colIndex === 0 ? 1 : 0,
                                alignItems:
                                    colIndex === 2 ||
                                    colIndex === 3 ||
                                    colIndex === 4
                                        ? 'center'
                                        : 'baseline',
                            }}
                        >
                            <Text
                                style={[
                                    styles.tableCell,
                                    colIndex === 0 ? { fontSize: 4.5 } : {},
                                    colIndex === 1 || colIndex === 5
                                        ? { textAlign: 'left' }
                                        : {},
                                    colIndex === 1
                                        ? {
                                              fontWeight:
                                                  level === 0 || level === 1
                                                      ? 'bold'
                                                      : 'normal',
                                          }
                                        : {},
                                ]}
                            >
                                {colIndex === 1
                                    ? displayTitle
                                    : getNestedValue(item, keys[colIndex])}
                            </Text>
                        </View>
                    ))}

                    {/* Cols 6 to 14: Split into Multiple Rows for Funding Sources */}
                    {(() => {
                        let fundingSources: any[] = [];
                        if (
                            Array.isArray(item.aip_entry?.funding_source) &&
                            item.aip_entry.funding_source.length > 0
                        ) {
                            fundingSources = item.aip_entry.funding_source;
                        } else if (item.aip_entry?.funding_source) {
                            fundingSources = [item.aip_entry.funding_source];
                        } else {
                            fundingSources = [{}]; // fallback render
                        }

                        // CHANGE 1: Slice up to 15 to include Col 14 in the wrapper width
                        const containerWidth = COLUMN_WIDTHS.slice(
                            6,
                            15,
                        ).reduce((a, b) => a + b, 0);

                        return (
                            <View
                                style={{
                                    width: `${containerWidth}%`,
                                    flexDirection: 'column',
                                }}
                            >
                                {fundingSources.map((fs, fsIndex) => (
                                    <View
                                        key={fsIndex}
                                        style={{
                                            flexDirection: 'row',
                                            flexGrow: 1,
                                            // borderBottomWidth:
                                            //     fsIndex <
                                            //     fundingSources.length - 1
                                            //         ? 1
                                            //         : 0,
                                        }}
                                    >
                                        {/* CHANGE 2: Slice up to 15 to map Col 14 inside the inner loop */}
                                        {COLUMN_WIDTHS.slice(6, 15).map(
                                            (width, subIndex) => {
                                                const colIndex = subIndex + 6;
                                                const relativeWidth =
                                                    (width / containerWidth) *
                                                    100;

                                                return (
                                                    <View
                                                        key={colIndex}
                                                        style={{
                                                            width: `${relativeWidth}%`,
                                                            borderRightWidth: 1,
                                                            justifyContent:
                                                                'center',
                                                            alignItems:
                                                                (colIndex >=
                                                                    7 &&
                                                                    colIndex <=
                                                                        11) ||
                                                                colIndex ===
                                                                    12 ||
                                                                colIndex === 13
                                                                    ? 'flex-end'
                                                                    : colIndex ===
                                                                            6 ||
                                                                        colIndex ===
                                                                            14 // center Col 14
                                                                      ? 'center'
                                                                      : 'baseline',
                                                        }}
                                                    >
                                                        <Text
                                                            style={
                                                                styles.tableCell
                                                            }
                                                        >
                                                            {/* CHANGE 3: Fetch main nested value for Col 14, else use getFsValue */}
                                                            {colIndex === 14
                                                                ? getNestedValue(
                                                                      item,
                                                                      keys[
                                                                          colIndex
                                                                      ],
                                                                  )
                                                                : getFsValue(
                                                                      fs,
                                                                      keys[
                                                                          colIndex
                                                                      ],
                                                                      item,
                                                                  )}
                                                        </Text>
                                                    </View>
                                                );
                                            },
                                        )}
                                    </View>
                                ))}
                            </View>
                        );
                    })()}

                    {/* Col 14: CC Typology Code */}
                    {/* <View
                        style={{
                            width: `${COLUMN_WIDTHS[14]}%`,
                            borderRightWidth: 1,
                            alignItems: 'center',
                        }}
                    >
                        <Text style={styles.tableCell}>
                            {getNestedValue(item, keys[14])}
                        </Text>
                    </View> */}
                </View>,
            );

            if (item.children && item.children.length > 0) {
                for (let i = item.children.length - 1; i >= 0; i--) {
                    stack.push({
                        item: item.children[i],
                        level: level + 1,
                        path: level === 0 ? [i + 1] : [...path, i + 1],
                    });
                }
            }
        }
        return result;
    };

    const MyDocument = ({ data }: { data: Ppa[] }) => {
        return (
            <Document>
                <Page
                    size={[612, 936]}
                    orientation="landscape"
                    style={[styles.page]}
                >
                    <View>
                        <View fixed>
                            <View
                                style={{
                                    marginBottom: 10,
                                    marginTop: 5,
                                    textAlign: 'center',
                                }}
                            >
                                <Text
                                    style={{ fontSize: 10, fontWeight: 'bold' }}
                                >
                                    CY {fiscalYear.year} Annual Investment
                                    Program (AIP)
                                </Text>
                                <Text
                                    style={{ fontSize: 9, fontWeight: 'bold' }}
                                >
                                    By Program / Project / Activity - by Sector
                                </Text>
                            </View>

                            <View
                                style={{ marginBottom: 5, textAlign: 'left' }}
                            >
                                <Text
                                    style={{
                                        fontSize: 8,
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {`OFFICE: `}
                                    <Text
                                        style={{ textDecoration: 'underline' }}
                                    >{`${office}`}</Text>
                                </Text>
                            </View>

                            {/* header main row */}
                            <View
                                style={{
                                    flexDirection: 'row',
                                    borderTopWidth: 1,
                                    borderBottomWidth: 1,
                                }}
                            >
                                <View
                                    style={{
                                        width: `${COLUMN_WIDTHS[0]}%`,
                                        borderLeftWidth: 1,
                                        borderRightWidth: 1,
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text style={[styles.tableHeaderCell]}>
                                        AIP REF. CODE
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        width: `${COLUMN_WIDTHS[1]}%`,
                                        borderRightWidth: 1,
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text style={styles.tableHeaderCell}>
                                        PROGRAM / PROJECT / ACTITIVTY
                                        DESCRIPTION
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        width: `${COLUMN_WIDTHS[2]}%`,
                                        borderRightWidth: 1,
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text style={[styles.tableHeaderCell]}>
                                        IMPLEMENTING OFFICE / DEPARTMENT /
                                        LOCATION
                                    </Text>
                                </View>

                                <View
                                    style={[
                                        styles.headerGroup,
                                        {
                                            width: `${COLUMN_WIDTHS[3] + COLUMN_WIDTHS[4]}%`,
                                        },
                                    ]}
                                >
                                    <View
                                        style={{
                                            borderBottomWidth: 1,
                                            borderRightWidth: 1,
                                            flex: 1,
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Text style={styles.tableHeaderCell}>
                                            SCHEDULE OF IMPLEMENTATION
                                        </Text>
                                    </View>
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            display: 'flex',
                                            flex: 1,
                                        }}
                                    >
                                        <View
                                            style={{
                                                width: '50%',
                                                borderRightWidth: 1,
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Text
                                                style={styles.tableHeaderCell}
                                            >
                                                STARTING DATE
                                            </Text>
                                        </View>
                                        <View
                                            style={{
                                                width: '50%',
                                                borderRightWidth: 1,
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Text
                                                style={styles.tableHeaderCell}
                                            >
                                                COMPLETION DATE
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View
                                    style={{
                                        width: `${COLUMN_WIDTHS[5]}%`,
                                        borderRightWidth: 1,
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text style={styles.tableHeaderCell}>
                                        EXPECTED OUTPUTS
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        width: `${COLUMN_WIDTHS[6]}%`,
                                        borderRightWidth: 1,
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text style={styles.tableHeaderCell}>
                                        FUNDING SOURCE
                                    </Text>
                                </View>

                                <View
                                    style={[
                                        styles.headerGroup,
                                        {
                                            width: `${COLUMN_WIDTHS.slice(7, 12).reduce((a, b) => a + b, 0)}%`,
                                        },
                                    ]}
                                >
                                    <View
                                        style={{
                                            borderRightWidth: 1,
                                            borderBottomWidth: 1,
                                            justifyContent: 'center',
                                            flex: 1,
                                        }}
                                    >
                                        <Text style={styles.tableHeaderCell}>
                                            AMOUNT (In thousand pesos)
                                        </Text>
                                    </View>
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                        }}
                                    >
                                        {[
                                            'PERSONAL SERVICES (PS)',
                                            'MAINTENANCE & OTHER OPERATING EXPENSES (MOOE)',
                                            'FINANCIAL EXPENSES (FE)',
                                            'CAPITAL OUTLAY (CO)',
                                            'TOTAL',
                                        ].map((label, i) => (
                                            <View
                                                key={label}
                                                style={{
                                                    width: `${(COLUMN_WIDTHS[7 + i] / COLUMN_WIDTHS.slice(7, 12).reduce((a, b) => a + b, 0)) * 100}%`,
                                                    borderRightWidth: 1,
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Text
                                                    style={
                                                        styles.tableHeaderCell
                                                    }
                                                >
                                                    {label}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                <View
                                    style={[
                                        styles.headerGroup,
                                        {
                                            width: `${COLUMN_WIDTHS.slice(12, 14).reduce((a, b) => a + b, 0)}%`,
                                        },
                                    ]}
                                >
                                    <View
                                        style={{
                                            borderRightWidth: 1,
                                            borderBottomWidth: 1,
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Text style={styles.tableHeaderCell}>
                                            AMOUNT of Climate Change Expenditure
                                            (in thousand pesos)
                                        </Text>
                                    </View>
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                        }}
                                    >
                                        {[
                                            'Climate Change Adaptation',
                                            'Climate Change Mitigation',
                                        ].map((label, i) => (
                                            <View
                                                key={label}
                                                style={{
                                                    width: `${(COLUMN_WIDTHS[12 + i] / COLUMN_WIDTHS.slice(12, 14).reduce((a, b) => a + b, 0)) * 100}%`,
                                                    justifyContent: 'center',
                                                    borderRightWidth: 1,
                                                }}
                                            >
                                                <Text
                                                    style={
                                                        styles.tableHeaderCell
                                                    }
                                                >
                                                    {label}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                                <View
                                    style={{
                                        width: `${COLUMN_WIDTHS[14]}%`,
                                        borderRightWidth: 1,
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text style={styles.tableHeaderCell}>
                                        CC Typology Code
                                    </Text>
                                </View>
                            </View>

                            {/* header number row */}
                            <View
                                style={{
                                    flexDirection: 'row',
                                }}
                            >
                                {COLUMN_WIDTHS.map((width, index) => (
                                    <View
                                        key={index}
                                        style={{
                                            width: `${width}%`,
                                            borderRightWidth: 1,
                                            borderBottomWidth: 1,
                                            borderLeftWidth:
                                                index === 0 ? 1 : 0,
                                        }}
                                    >
                                        <Text style={styles.tableHeaderCell}>
                                            {index + 1}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* data rows */}
                        {renderOrderedRows(data)}

                        <View
                            fixed
                            style={{
                                borderTopWidth: 1,
                                borderColor: 'black',
                                width: '100%',
                                marginTop: -1,
                            }}
                        />

                        <View
                            fixed
                            style={{
                                textAlign: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 10,
                                    paddingTop: 10,
                                    fontWeight: 'bold',
                                }}
                                render={({ pageNumber }) => `${pageNumber}`}
                            ></Text>
                        </View>
                    </View>
                </Page>
            </Document>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="m-0 flex h-full flex-col gap-0 rounded-none p-0 sm:max-w-full">
                <div className="p-4 pb-3">
                    <DialogTitle>PDF Preview</DialogTitle>

                    <DialogDescription className="sr-only">
                        Visual preview of the AIP Report.
                    </DialogDescription>
                </div>

                <div className="h-full rounded-none bg-white sm:max-w-full">
                    <PDFViewer width="100%" height="100%" showToolbar={true}>
                        <MyDocument data={aipEntries} />
                    </PDFViewer>
                </div>
            </DialogContent>
        </Dialog>
    );
}
