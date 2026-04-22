import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { AipEntry, FundingSource } from '@/types/global';
import { Page, Text, View, Document, PDFViewer } from '@react-pdf/renderer';

interface ExpenseAccountSummaryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    coaWithPriceListsByExpenseClass: any;
    aipEntry: AipEntry;
    fundingSource: FundingSource | undefined;
    auth: any;
}

const formatCurrency = (num: number) => {
    return num === 0
        ? '-'
        : new Intl.NumberFormat('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
          }).format(num);
};

const sumMonths = (priceLists: any[], months: string[]) => {
    return (priceLists || []).reduce((acc, item) => {
        const itemSum = months.reduce(
            (mAcc, m) => mAcc + (parseFloat(item[`${m}_amount`]) || 0),
            0,
        );
        return acc + itemSum;
    }, 0);
};

// reusable single row component
function ReusableRow({
    columnData,
    displayText,
    height,
}: {
    columnData: any[];
    displayText: string;
    height?: number;
}) {
    return (
        <View
            style={{
                flexDirection: 'row',
            }}
            wrap={false}
        >
            {columnData.map((col, index) => (
                <View
                    key={`${index}`}
                    style={{
                        width: `${col.size}%`,
                        borderBottom: '1pt solid #000',
                        borderLeft: index === 0 ? '1pt solid black' : '0pt',
                        borderRight: '1pt solid #000',
                        height: height,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 9,
                            fontWeight: 'bold',
                            padding: 2,
                            textTransform: 'uppercase',
                        }}
                    >
                        {index === 0 ? displayText : ''}
                    </Text>
                </View>
            ))}
        </View>
    );
}

export default function ExpenseAccountSummaryDialog({
    open,
    onOpenChange,
    coaWithPriceListsByExpenseClass,
    aipEntry,
    fundingSource,
    auth,
}: ExpenseAccountSummaryDialogProps) {
    // const styles = StyleSheet.create({});

    const mooePpmps = coaWithPriceListsByExpenseClass.MOOE ?? [];
    const coPpmps = coaWithPriceListsByExpenseClass.CO ?? [];

    console.log(coaWithPriceListsByExpenseClass);
    console.log(mooePpmps);
    console.log(coPpmps);

    const columns = [
        {
            header: 'EXPENSE ACCOUNT',
            size: 33.33,
            key: 'account_title',
            alignHeader: 'center',
            footer: () => {
                return 'Sub-total';
            },
        },
        {
            header: 'ACCOUNT CODE',
            size: 11.11,
            key: 'account_number',
            align: 'center',
            alignHeader: 'center',
        },
        {
            header: 'TOTAL (IN PPMP)',
            size: 11.11,
            key: 'principal',
            align: 'right',
            alignHeader: 'center',
            cell: (row) =>
                formatCurrency(
                    sumMonths(row.price_lists, [
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
                    ]),
                ),
            footer: (data) => {
                return formatCurrency(
                    data.reduce(
                        (acc, row) =>
                            acc +
                            sumMonths(row.price_lists, [
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
                            ]),
                        0,
                    ),
                );
            },
        },
        {
            header: '1ST QTR',
            size: 11.11,
            key: 'interest',
            align: 'right',
            alignHeader: 'center',
            cell: (row) =>
                formatCurrency(
                    sumMonths(row.price_lists, ['jan', 'feb', 'mar']),
                ),
            footer: (data) =>
                formatCurrency(
                    data.reduce(
                        (acc, row) =>
                            acc +
                            sumMonths(row.price_lists, ['jan', 'feb', 'mar']),
                        0,
                    ),
                ),
        },
        {
            header: '2ND QTR',
            size: 11.11,
            key: 'balance',
            align: 'right',
            alignHeader: 'center',
            cell: (row) =>
                formatCurrency(
                    sumMonths(row.price_lists, ['apr', 'may', 'jun']),
                ),
            footer: (data) =>
                formatCurrency(
                    data.reduce(
                        (acc, row) =>
                            acc +
                            sumMonths(row.price_lists, ['apr', 'may', 'jun']),
                        0,
                    ),
                ),
        },
        {
            header: '3RD QTR',
            size: 11.11,
            key: 'total',
            align: 'right',
            alignHeader: 'center',
            cell: (row) =>
                formatCurrency(
                    sumMonths(row.price_lists, ['jul', 'aug', 'sep']),
                ),
            footer: (data) =>
                formatCurrency(
                    data.reduce(
                        (acc, row) =>
                            acc +
                            sumMonths(row.price_lists, ['jul', 'aug', 'sep']),
                        0,
                    ),
                ),
        },
        {
            header: '4TH QTR',
            size: 11.11,
            key: 'total',
            align: 'right',
            alignHeader: 'center',
            cell: (row) =>
                formatCurrency(
                    sumMonths(row.price_lists, ['oct', 'nov', 'dec']),
                ),
            footer: (data) =>
                formatCurrency(
                    data.reduce(
                        (acc, row) =>
                            acc +
                            sumMonths(row.price_lists, ['oct', 'nov', 'dec']),
                        0,
                    ),
                ),
        },
    ];

    const MyDocument = () => (
        <Document>
            <Page
                size={[936, 612]}
                style={{
                    flexDirection: 'row',
                    padding: 36,
                }}
            >
                <View style={{ flexDirection: 'column' }}>
                    {/* page header */}
                    <View
                        style={{
                            gap: 2,
                            paddingBottom: 2,
                        }}
                    >
                        <Text style={{ fontSize: 9, fontWeight: 'bold' }}>
                            {auth.user.name}
                        </Text>

                        <Text style={{ fontSize: 9, fontWeight: 'bold' }}>
                            {fundingSource?.title.toUpperCase()}
                        </Text>

                        <Text style={{ fontSize: 9, fontWeight: 'bold' }}>
                            {aipEntry.ppa?.full_code}
                        </Text>

                        <Text style={{ fontSize: 9, fontWeight: 'bold' }}>
                            {aipEntry.ppa?.name}
                        </Text>
                    </View>

                    {/* table container */}
                    <View style={{ flexDirection: 'column' }} >
                        {/* header */}
                        <View style={{ flexDirection: 'row' }} wrap={false} fixed>
                            {columns.map((col, index) => (
                                <View
                                    key={index}
                                    style={{
                                        width: `${col.size}%`,
                                        borderTop: '1pt solid black',
                                        borderBottom: '1pt solid black',
                                        borderLeft:
                                            index === 0
                                                ? '1pt solid black'
                                                : '0pt',
                                        borderRight: '1pt solid black',
                                        padding: 2,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 9,
                                            textAlign:
                                                col.alignHeader || 'left',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {col.header}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* mooe */}
                        <ReusableRow
                            columnData={columns}
                            displayText="Maintenance and Other Operating Expenses"
                        />

                        {/* body */}
                        {mooePpmps.map((row, rowIndex) => (
                            <View
                                key={rowIndex}
                                style={{ flexDirection: 'row' }}
                                wrap={false}
                            >
                                {columns.map((col, colIndex) => (
                                    <View
                                        key={colIndex}
                                        style={{
                                            width: `${col.size}%`,
                                            borderBottom: '1pt solid black',
                                            borderLeft:
                                                colIndex === 0
                                                    ? '1pt solid black'
                                                    : 0,
                                            borderRight: '1pt solid black',
                                            padding: 2,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 9,
                                                textAlign: col.align || 'left',
                                            }}
                                        >
                                            {typeof col.cell === 'function'
                                                ? col.cell(row)
                                                : row[col.key]}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        ))}

                        {/* footer */}
                        {coPpmps.length > 0 && (
                            <View
                                style={{
                                    flexDirection: 'row',
                                }}
                                wrap={false}
                            >
                                {columns.map((col, colIndex) => (
                                    <View
                                        key={`footer-${colIndex}`}
                                        style={{
                                            width: `${col.size}%`,
                                            borderBottom: '1pt solid black',
                                            borderLeft:
                                                colIndex === 0
                                                    ? '1pt solid black'
                                                    : 0,
                                            borderRight: '1pt solid black',
                                            padding: 2,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 9,
                                                fontWeight: 'bold',
                                                textAlign: col.align || 'left',
                                            }}
                                        >
                                            {typeof col.footer === 'function'
                                                ? col.footer(mooePpmps)
                                                : ''}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* blank row */}
                        <ReusableRow
                            columnData={columns}
                            displayText=""
                            height={16}
                        />

                        {/* co */}
                        <ReusableRow
                            columnData={columns}
                            displayText="Capital Outlay"
                        />

                        {/* body */}
                        {coPpmps.map((row, rowIndex) => (
                            <View
                                key={rowIndex}
                                style={{ flexDirection: 'row' }}
                                wrap={false}
                            >
                                {columns.map((col, colIndex) => (
                                    <View
                                        key={colIndex}
                                        style={{
                                            width: `${col.size}%`,
                                            borderBottom: '1pt solid black',
                                            borderLeft:
                                                colIndex === 0
                                                    ? '1pt solid black'
                                                    : 0,
                                            borderRight: '1pt solid black',
                                            padding: 2,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 9,
                                                textAlign: col.align || 'left',
                                            }}
                                        >
                                            {typeof col.cell === 'function'
                                                ? col.cell(row)
                                                : row[col.key]}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        ))}

                        {/* footer */}
                        {coPpmps.length > 0 && (
                            <View
                                style={{
                                    flexDirection: 'row',
                                }}
                                wrap={false}
                            >
                                {columns.map((col, colIndex) => (
                                    <View
                                        key={`footer-${colIndex}`}
                                        style={{
                                            width: `${col.size}%`,
                                            borderBottom: '1pt solid black',
                                            borderLeft:
                                                colIndex === 0
                                                    ? '1pt solid black'
                                                    : 0,
                                            borderRight: '1pt solid black',
                                            padding: 2,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 9,
                                                fontWeight: 'bold',
                                                textAlign: col.align || 'left',
                                            }}
                                        >
                                            {typeof col.footer === 'function'
                                                ? col.footer(coPpmps)
                                                : ''}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* blank row */}
                        <ReusableRow
                            columnData={columns}
                            displayText=""
                            height={16}
                        />

                        {/* fe */}
                        <ReusableRow
                            columnData={columns}
                            displayText="Financial Expense"
                        />

                        {/* blank row */}
                        <ReusableRow
                            columnData={columns}
                            displayText=""
                            height={16}
                        />

                        {/* TOTAL FOR THE PPA */}
                        <View
                            style={{
                                flexDirection: 'row',
                            }}
                            wrap={false}
                        >
                            {columns.map((col, index) => (
                                <View
                                    key={`${index}`}
                                    style={{
                                        width: `${col.size}%`,
                                        borderBottom: '1pt solid #000',
                                        borderLeft:
                                            index === 0
                                                ? '1pt solid black'
                                                : '0pt',
                                        borderRight: '1pt solid #000',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 9,
                                            fontWeight: 'bold',
                                            padding: 2,
                                            textTransform: 'uppercase',
                                            textAlign: col.align || 'left',
                                        }}
                                    >
                                        {index === 0
                                            ? 'TOTAL FOR THE PPA'
                                            : typeof col.footer === 'function'
                                              ? col.footer([
                                                    ...mooePpmps,
                                                    ...coPpmps,
                                                ])
                                              : ''}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[100vh] flex-col gap-0 rounded-none p-0 sm:max-w-[100vw]">
                <DialogHeader className="flex flex-row items-center justify-between space-y-0 border-b p-4">
                    <DialogTitle>Expense Account Summary</DialogTitle>

                    <DialogDescription className="sr-only" />
                </DialogHeader>

                <div className="h-full w-full">
                    <PDFViewer height={'100%'} width={'100%'}>
                        <MyDocument />
                    </PDFViewer>
                </div>
            </DialogContent>
        </Dialog>
    );
}
