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
    Font,
} from '@react-pdf/renderer';
import type { FiscalYear, Ppa } from '@/types/global';

interface ExportToPdfDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    aipEntries: Ppa[];
    fiscalYear: FiscalYear;
}

// Disable hyphenation globally
Font.registerHyphenationCallback((word) => [word]);

export default function ExportToPdfDialog({
    open,
    onOpenChange,
    aipEntries,
    fiscalYear,
}: ExportToPdfDialogProps) {
    const COLUMN_WIDTHS = [
        7.14, 17.86, 7.14, 5.36, 5.36, 7.14, 5.36, 5.36, 7.14, 5.36, 5.36, 5.36,
        5.36, 5.36, 5.34,
    ];

    const office =
        'OFFICE OF THE PROVINCIAL GOVERNOR - INFORMATION AND COMMUNICATIONS TECHNOLOGY UNIT';

    const styles = StyleSheet.create({
        page: { padding: 36 },
        tableHeaderCell: {
            margin: 0,
            padding: 2,
            fontSize: 6,
            textAlign: 'center',
            fontWeight: 'bold',
        },
        tableCellContainer: {
            margin: 0,
            padding: 0,
            borderRightWidth: 1,
            borderColor: 'black',
            justifyContent: 'center',
            flexGrow: 1, // Crucial for connecting vertical lines
        },
        tableCellText: {
            margin: 0,
            fontSize: 7,
            paddingVertical: 4,
            paddingHorizontal: 2,
            textAlign: 'center',
        },
        headerGroup: { flexDirection: 'column', padding: 0 },
    });

    const formatNumber = (value: any) => {
        const num = parseFloat(value);
        if (!value || isNaN(num) || num === 0) return '-';
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(num);
    };

    const formatDate = (value: string | null | undefined) => {
        if (!value) return '-';
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
        return value;
    };

    const renderOrderedRows = (initialEntries: Ppa[]) => {
        const result: React.ReactNode[] = [];
        let rootCounter = 0;

        const stack = [...initialEntries].toReversed().map((item) => ({
            item,
            level: 0,
            path: [] as number[],
        }));

        while (stack.length > 0) {
            const { item, level, path } = stack.pop()!;

            let displayTitle = item.name;
            if (level === 0) {
                const letter = String.fromCharCode(65 + rootCounter);
                displayTitle = `${letter}. ${displayTitle}`;
                rootCounter++;
            } else {
                const outlineString = path.join('.');
                const suffix = level === 1 ? '.' : '';
                displayTitle = `${outlineString}${suffix} ${displayTitle}`;
            }

            const aipEntry = item.aip_entries?.[0];
            const fundingSources =
                aipEntry?.ppa_funding_sources &&
                aipEntry.ppa_funding_sources.length > 0
                    ? aipEntry.ppa_funding_sources
                    : [{}];

            result.push(
                <View
                    key={`${item.id}-${level}`}
                    style={{ flexDirection: 'row' }}
                    wrap={false}
                >
                    {/* LEFT SIDE: Columns 0 to 5 (Static per PPA) */}
                    {COLUMN_WIDTHS.slice(0, 6).map((width, colIndex) => (
                        <View
                            key={colIndex}
                            style={[
                                styles.tableCellContainer,
                                {
                                    width: `${width}%`,
                                    borderLeftWidth: colIndex === 0 ? 1 : 0,
                                    alignItems: [2, 3, 4].includes(colIndex)
                                        ? 'center'
                                        : 'stretch',
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.tableCellText,
                                    colIndex === 0 ? { fontSize: 4.5 } : {},
                                    [1, 5].includes(colIndex)
                                        ? { textAlign: 'left' }
                                        : {},
                                    colIndex === 1
                                        ? {
                                              fontWeight:
                                                  level <= 1
                                                      ? 'bold'
                                                      : 'normal',
                                              paddingLeft: level * 6,
                                          }
                                        : {},
                                ]}
                            >
                                {(() => {
                                    if (colIndex === 0)
                                        return item.full_code || '-';
                                    if (colIndex === 1)
                                        return displayTitle || '-';
                                    if (colIndex === 2) {
                                        const office = item.office;
                                        if (
                                            office?.parent?.acronym &&
                                            office?.acronym
                                        ) {
                                            return `${office.parent.acronym}/${office.acronym}`;
                                        }
                                        return office?.acronym || '-';
                                    }
                                    if (colIndex === 3)
                                        return formatDate(aipEntry?.start_date);
                                    if (colIndex === 4)
                                        return formatDate(aipEntry?.end_date);
                                    if (colIndex === 5)
                                        return aipEntry?.expected_output || '-';
                                    return '-';
                                })()}
                            </Text>
                        </View>
                    ))}

                    {/* RIGHT SIDE: Columns 6 to 14 (Iterating Funding Sources) */}
                    <View
                        style={{
                            width: `${COLUMN_WIDTHS.slice(6, 15).reduce((a, b) => a + b, 0)}%`,
                            flexDirection: 'column',
                        }}
                    >
                        {fundingSources.map((fs: any, fsIndex) => {
                            const total = (
                                parseFloat(fs.ps_amount || 0) +
                                parseFloat(fs.mooe_amount || 0) +
                                parseFloat(fs.fe_amount || 0) +
                                parseFloat(fs.co_amount || 0)
                            ).toString();

                            return (
                                <View
                                    key={fsIndex}
                                    style={{
                                        flexDirection: 'row',
                                        flexGrow: 1,
                                    }}
                                >
                                    {COLUMN_WIDTHS.slice(6, 15).map(
                                        (width, subIndex) => {
                                            const colIndex = subIndex + 6;
                                            const containerWidth =
                                                COLUMN_WIDTHS.slice(
                                                    6,
                                                    15,
                                                ).reduce((a, b) => a + b, 0);
                                            const relativeWidth =
                                                (width / containerWidth) * 100;

                                            return (
                                                <View
                                                    key={colIndex}
                                                    style={[
                                                        styles.tableCellContainer,
                                                        {
                                                            width: `${relativeWidth}%`,
                                                            alignItems:
                                                                colIndex >= 7 &&
                                                                colIndex <= 13
                                                                    ? 'flex-end'
                                                                    : 'stretch',
                                                        },
                                                    ]}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.tableCellText,
                                                            { width: '100%' },
                                                        ]}
                                                    >
                                                        {(() => {
                                                            if (colIndex === 6)
                                                                return (
                                                                    fs
                                                                        .funding_source
                                                                        ?.code ||
                                                                    '-'
                                                                );
                                                            if (colIndex === 7)
                                                                return formatNumber(
                                                                    fs.ps_amount,
                                                                );
                                                            if (colIndex === 8)
                                                                return formatNumber(
                                                                    fs.mooe_amount,
                                                                );
                                                            if (colIndex === 9)
                                                                return formatNumber(
                                                                    fs.fe_amount,
                                                                );
                                                            if (colIndex === 10)
                                                                return formatNumber(
                                                                    fs.co_amount,
                                                                );
                                                            if (colIndex === 11)
                                                                return formatNumber(
                                                                    total,
                                                                );
                                                            if (colIndex === 12)
                                                                return formatNumber(
                                                                    fs.ccet_adaptation,
                                                                );
                                                            if (colIndex === 13)
                                                                return formatNumber(
                                                                    fs.ccet_mitigation,
                                                                );
                                                            // Always return something for Col 14 to keep vertical line intact
                                                            if (colIndex === 14)
                                                                return fsIndex ===
                                                                    0
                                                                    ? (
                                                                          aipEntry as any
                                                                      )
                                                                          ?.typology
                                                                          ?.code ||
                                                                          '-'
                                                                    : '-';
                                                            return '-';
                                                        })()}
                                                    </Text>
                                                </View>
                                            );
                                        },
                                    )}
                                </View>
                            );
                        })}
                    </View>
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

    const calculateTotals = (data: Ppa[]) => {
        let totals = {
            ps: 0,
            mooe: 0,
            fe: 0,
            co: 0,
            adaptation: 0,
            mitigation: 0,
        };

        const traverse = (items: Ppa[]) => {
            items.forEach((item) => {
                const entry = item.aip_entries?.[0];
                entry?.ppa_funding_sources?.forEach((fs) => {
                    totals.ps += parseFloat(fs.ps_amount || '0');
                    totals.mooe += parseFloat(fs.mooe_amount || '0');
                    totals.fe += parseFloat(fs.fe_amount || '0');
                    totals.co += parseFloat(fs.co_amount || '0');
                    totals.adaptation += parseFloat(fs.ccet_adaptation || '0');
                    totals.mitigation += parseFloat(fs.ccet_mitigation || '0');
                });

                if (item.children) traverse(item.children);
            });
        };

        traverse(data);
        const grandTotal = totals.ps + totals.mooe + totals.fe + totals.co;
        return { ...totals, grandTotal };
    };

    const RenderTotalRow = ({
        totals,
    }: {
        totals: ReturnType<typeof calculateTotals>;
    }) => {
        // Width for the label side (Cols 1-7)
        const labelWidth = COLUMN_WIDTHS.slice(0, 7).reduce((a, b) => a + b, 0);

        return (
            <View
                style={{
                    flexDirection: 'row',
                    borderTopWidth: 1,
                    borderBottomWidth: 1,
                }}
                wrap={false}
            >
                {/* Label Column */}
                <View
                    style={[
                        styles.tableCellContainer,
                        { width: `${labelWidth}%`, borderLeftWidth: 1 },
                    ]}
                >
                    <Text
                        style={[
                            styles.tableCellText,
                            {
                                fontWeight: 'bold',
                                textAlign: 'right',
                                paddingRight: 10,
                            },
                        ]}
                    >
                        GRAND TOTAL
                    </Text>
                </View>

                {/* Financial Columns */}
                {[
                    totals.ps,
                    totals.mooe,
                    totals.fe,
                    totals.co,
                    totals.grandTotal,
                    totals.adaptation,
                    totals.mitigation,
                ].map((val, i) => (
                    <View
                        key={i}
                        style={[
                            styles.tableCellContainer,
                            {
                                width: `${COLUMN_WIDTHS[7 + i]}%`,
                                alignItems: 'flex-end',
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.tableCellText,
                                { fontWeight: 'bold' },
                            ]}
                        >
                            {formatNumber(val)}
                        </Text>
                    </View>
                ))}

                {/* Empty space for Typology Code col */}
                <View
                    style={[
                        styles.tableCellContainer,
                        { width: `${COLUMN_WIDTHS[14]}%` },
                    ]}
                >
                    <Text style={styles.tableCellText}>-</Text>
                </View>
            </View>
        );
    };

    const MyDocument = ({ data }: { data: Ppa[] }) => {
        const totals = calculateTotals(data);

        return (
            <Document>
                <Page
                    size={[612, 936]}
                    orientation="landscape"
                    style={styles.page}
                >
                    <View fixed>
                        <View
                            style={{
                                marginBottom: 10,
                                marginTop: 5,
                                textAlign: 'center',
                            }}
                        >
                            <Text style={{ fontSize: 10, fontWeight: 'bold' }}>
                                CY {fiscalYear.year} Annual Investment Program
                                (AIP)
                            </Text>

                            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>
                                By Program / Project / Activity - by Sector
                            </Text>
                        </View>

                        <View style={{ marginBottom: 5, textAlign: 'left' }}>
                            <Text style={{ fontSize: 8, fontWeight: 'bold' }}>
                                {`OFFICE: `}
                                <Text
                                    style={{ textDecoration: 'underline' }}
                                >{`${office}`}</Text>
                            </Text>
                        </View>

                        {/* Table Headers */}
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
                                <Text style={styles.tableHeaderCell}>
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
                                    PROGRAM / PROJECT / ACTIVITY DESCRIPTION
                                </Text>
                            </View>

                            <View
                                style={{
                                    width: `${COLUMN_WIDTHS[2]}%`,
                                    borderRightWidth: 1,
                                    justifyContent: 'center',
                                }}
                            >
                                <Text style={styles.tableHeaderCell}>
                                    IMPLEMENTING OFFICE / DEPARTMENT / LOCATION
                                </Text>
                            </View>

                            <View
                                style={{
                                    width: `${COLUMN_WIDTHS[3] + COLUMN_WIDTHS[4]}%`,
                                    flexDirection: 'column',
                                }}
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

                                <View style={{ flexDirection: 'row', flex: 1 }}>
                                    <View
                                        style={{
                                            width: '50%',
                                            borderRightWidth: 1,
                                        }}
                                    >
                                        <Text style={styles.tableHeaderCell}>
                                            STARTING DATE
                                        </Text>
                                    </View>

                                    <View
                                        style={{
                                            width: '50%',
                                            borderRightWidth: 1,
                                        }}
                                    >
                                        <Text style={styles.tableHeaderCell}>
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
                                style={{
                                    width: `${COLUMN_WIDTHS.slice(7, 12).reduce((a, b) => a + b, 0)}%`,
                                    flexDirection: 'column',
                                }}
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

                                <View style={{ flexDirection: 'row' }}>
                                    {[
                                        'PERSONAL SERVICES (PS)',
                                        'MAINTENANCE & OTHER OPERATING EXPENSES (MOOE)',
                                        'FINANCIAL EPENCES (FE)',
                                        'CAPITAL OUTALY (CO)',
                                        'TOTAL',
                                    ].map((label, i) => (
                                        <View
                                            key={label}
                                            style={{
                                                width: `${(COLUMN_WIDTHS[7 + i] / COLUMN_WIDTHS.slice(7, 12).reduce((a, b) => a + b, 0)) * 100}%`,
                                                borderRightWidth: 1,
                                            }}
                                        >
                                            <Text
                                                style={styles.tableHeaderCell}
                                            >
                                                {label}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            <View
                                style={{
                                    width: `${COLUMN_WIDTHS.slice(12, 14).reduce((a, b) => a + b, 0)}%`,
                                    flexDirection: 'column',
                                }}
                            >
                                <View
                                    style={{
                                        borderRightWidth: 1,
                                        borderBottomWidth: 1,
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text style={styles.tableHeaderCell}>
                                        AMOUNT of Climate Change Expenditure (in
                                        thousand pesos)
                                    </Text>
                                </View>

                                <View style={{ flexDirection: 'row' }}>
                                    {[
                                        'Climate Change Adaptation',
                                        'Climate Change Mitigation',
                                    ].map((label, i) => (
                                        <View
                                            key={label}
                                            style={{
                                                width: `${(COLUMN_WIDTHS[12 + i] / COLUMN_WIDTHS.slice(12, 14).reduce((a, b) => a + b, 0)) * 100}%`,
                                                borderRightWidth: 1,
                                            }}
                                        >
                                            <Text
                                                style={styles.tableHeaderCell}
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

                        {/* Column Numbers */}
                        <View
                            style={{
                                flexDirection: 'row',
                                borderBottomWidth: 1,
                            }}
                        >
                            {COLUMN_WIDTHS.map((width, index) => (
                                <View
                                    key={index}
                                    style={{
                                        width: `${width}%`,
                                        borderRightWidth: 1,
                                        borderLeftWidth: index === 0 ? 1 : 0,
                                    }}
                                >
                                    <Text style={styles.tableHeaderCell}>
                                        {index + 1}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Data Rows */}
                    {renderOrderedRows(data)}

                    <RenderTotalRow totals={totals} />

                    {/* Closing Border */}
                    <View
                        fixed
                        style={{
                            borderTopWidth: 1,
                            borderColor: 'black',
                            width: '100%',
                            marginTop: -1, // Pulls it up to touch the vertical lines perfectly
                        }}
                    />

                    <Text
                        fixed
                        style={{
                            fontSize: 10,
                            textAlign: 'center',
                            paddingTop: 10,
                        }}
                        render={({ pageNumber }) => `${pageNumber}`}
                    />
                </Page>
            </Document>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="m-0 flex h-full flex-col gap-0 rounded-none bg-[#3c3c3c] p-0 text-white sm:max-w-full">
                <div className="p-4 pb-0">
                    <DialogTitle>PDF Preview</DialogTitle>
                    <DialogDescription className="sr-only">
                        AIP Report Preview
                    </DialogDescription>
                </div>
                <div className="h-full bg-white">
                    <PDFViewer width="100%" height="100%" showToolbar={true}>
                        <MyDocument data={aipEntries} />
                    </PDFViewer>
                </div>
            </DialogContent>
        </Dialog>
    );
}
