import { router } from "@inertiajs/react";
import { createColumnHelper } from "@tanstack/react-table";
import { Decimal } from "decimal.js";
import { Trash } from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Ppmp } from "@/types";

interface EditableCellProps {
    getValue: () => any;
    row: any;
    column: any;
    table: any;
}

const formatNumber = (val: string | number) => {
    const num = typeof val === "string" ? parseFloat(val) : val;

    return isNaN(num) || num === null
        ? "0.00"
        : num.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
          });
};

const formatInteger = (val: string | number) => {
    const num = typeof val === "string" ? parseFloat(val.replace(/,/g, "")) : val;

    if (isNaN(num) || num === null) {
return "0";
}

    return num.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
};

const EditableCell: React.FC<EditableCellProps> = ({ getValue, row, column, table }) => {
    const initialValue = getValue();
    const [localValue, setLocalValue] = useState<string>(formatInteger(initialValue));
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        setLocalValue(formatInteger(initialValue));
    }, [initialValue]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.currentTarget.blur();
        }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        const rawValue = localValue.replace(/,/g, "");
        setLocalValue(rawValue);
        setTimeout(() => e.target.select(), 0);
    };

    const handleBlur = () => {
        const cleanValue = localValue.replace(/,/g, "");
        const cleanInitial = String(initialValue || "0").replace(/,/g, "");

        if (cleanValue === cleanInitial) {
            setLocalValue(formatInteger(cleanValue));

            return;
        }

        setIsUpdating(true);

        router.put(
            `/ppmp/${row.original.id}/update-monthly-quantity`,
            {
                month: column.id,
                quantity: cleanValue,
            },
            {
                preserveScroll: true,
                preserveState: true,
                only: ["ppmps"],
                onSuccess: () => {},
                onError: () => {
                    setLocalValue(formatInteger(initialValue));
                },
                onFinish: () => {
                    setIsUpdating(false);
                },
            },
        );
    };

    const isReadOnly = table.options.meta?.readOnly || !row.original.can?.edit;

    return (
        <Input
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            disabled={isUpdating || isReadOnly}
            className="w-full rounded border bg-transparent px-2 py-1 text-right focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
        />
    );
};

// Define keys to safely access dynamic month properties on the object
type MonthKey =
    | "jan"
    | "feb"
    | "mar"
    | "apr"
    | "may"
    | "jun"
    | "jul"
    | "aug"
    | "sep"
    | "oct"
    | "nov"
    | "dec";

interface MonthConfig {
    qtyKey: `${MonthKey}_qty`;
    amountKey: `${MonthKey}_amount`;
    qtyHeader: string;
    amountHeader: string;
}

// 12 Months Configuration Array
const MONTHS: MonthConfig[] = [
    {
        qtyKey: "jan_qty",
        amountKey: "jan_amount",
        qtyHeader: "JAN-QTY",
        amountHeader: "JAN",
    },
    {
        qtyKey: "feb_qty",
        amountKey: "feb_amount",
        qtyHeader: "FEB-QTY",
        amountHeader: "FEB",
    },
    {
        qtyKey: "mar_qty",
        amountKey: "mar_amount",
        qtyHeader: "MAR-QTY",
        amountHeader: "MAR",
    },
    {
        qtyKey: "apr_qty",
        amountKey: "apr_amount",
        qtyHeader: "APR-QTY",
        amountHeader: "APR",
    },
    {
        qtyKey: "may_qty",
        amountKey: "may_amount",
        qtyHeader: "MAY-QTY",
        amountHeader: "MAY",
    },
    {
        qtyKey: "jun_qty",
        amountKey: "jun_amount",
        qtyHeader: "JUN-QTY",
        amountHeader: "JUNE",
    },
    {
        qtyKey: "jul_qty",
        amountKey: "jul_amount",
        qtyHeader: "JUL-QTY",
        amountHeader: "JULY",
    },
    {
        qtyKey: "aug_qty",
        amountKey: "aug_amount",
        qtyHeader: "AUG-QTY",
        amountHeader: "AUG",
    },
    {
        qtyKey: "sep_qty",
        amountKey: "sep_amount",
        qtyHeader: "SEP-QTY",
        amountHeader: "SEP",
    },
    {
        qtyKey: "oct_qty",
        amountKey: "oct_amount",
        qtyHeader: "OCT-QTY",
        amountHeader: "OCT",
    },
    {
        qtyKey: "nov_qty",
        amountKey: "nov_amount",
        qtyHeader: "NOV-QTY",
        amountHeader: "NOV",
    },
    {
        qtyKey: "dec_qty",
        amountKey: "dec_amount",
        qtyHeader: "DEC-QTY",
        amountHeader: "DEC",
    },
];

const columnHelper = createColumnHelper<Ppmp>();

const columns = [
    // columnHelper.accessor('ppa_funding_source.funding_source.code', {
    //     // id: 'funding_source',
    //     header: () => <div>Funding Source</div>,
    //     cell: ({ getValue }) => <span className="text-wrap">{getValue()}</span>,
    // }),
    // columnHelper.accessor(
    //     'ppmp_price_list.chart_of_account_ppmp_category.chart_of_account.expense_class',
    //     {
    //         // id: 'expense_class',
    //         header: () => <div>Expense Class</div>,
    //         cell: ({ getValue }) => (
    //             <span className="font-medium text-wrap">{getValue()}</span>
    //         ),
    //     },
    // ),
    // columnHelper.accessor(
    //     'ppmp_price_list.chart_of_account_ppmp_category.chart_of_account.account_title',
    //     {
    //         // id: 'expense_account',
    //         size: 300,
    //         header: () => <div>Expense Account</div>,
    //         cell: ({ getValue }) => (
    //             <div className="text-wrap">{getValue()}</div>
    //         ),
    //     },
    // ),
    columnHelper.accessor("ppmp_price_list.item_number", {
        // id: 'item_number',
        size: 150,
        header: () => <div className="pr-20 text-right">Item No.</div>,
        cell: ({ getValue }) => <div className="pr-20 text-right">{getValue()}</div>,
    }),
    columnHelper.accessor("ppmp_price_list.description", {
        // id: 'description',
        header: () => <div>Description</div>,
        size: 300,
        enableGlobalFilter: true,
        cell: ({ row, getValue }) => {
            const ppmp = row.original;

            return (
                <div className="flex flex-col py-1">
                    <span className="font-medium text-wrap">{getValue()}</span>
                    {ppmp.isCombined ? (
                        <div className="mt-1">
                            <Badge
                                variant="outline"
                                className="h-4 border-indigo-300 bg-indigo-50/50 px-1.5 py-0 text-[9px] font-semibold tracking-wider text-indigo-700 uppercase dark:border-indigo-900/50 dark:bg-indigo-950/20 dark:text-indigo-400"
                            >
                                Combined
                            </Badge>
                        </div>
                    ) : ppmp.ppa_funding_source?.supplemental_aip_id ? (
                        <div className="mt-1">
                            <Badge
                                variant="outline"
                                className="h-4 border-sky-300 bg-sky-50/50 px-1.5 py-0 text-[9px] font-semibold tracking-wider text-sky-700 uppercase dark:border-sky-900/50 dark:bg-sky-950/20 dark:text-sky-400"
                            >
                                Supplemental
                            </Badge>
                        </div>
                    ) : (
                        <div className="mt-1">
                            <Badge
                                variant="secondary"
                                className="h-4 px-1.5 py-0 text-[9px] font-semibold tracking-wider uppercase"
                            >
                                Original
                            </Badge>
                        </div>
                    )}
                </div>
            );
        },
    }),
    columnHelper.accessor("ppmp_price_list.unit_of_measurement", {
        // id: 'unit_of_measurement',
        size: 150,
        header: () => <div>Unit of Measurement</div>,
        cell: ({ getValue }) => <div className="text-wrap">{getValue()}</div>,
    }),
    columnHelper.accessor("ppmp_price_list.price", {
        // id: 'price',
        size: 150,
        header: () => <div className="text-right">PRICELIST</div>,
        cell: ({ getValue }) => (
            <div className="text-right">{formatNumber(Number(getValue()) || 0)}</div>
        ),
    }),
    columnHelper.display({
        id: "cy_qty",
        size: 150,
        header: () => <div className="text-right">CY 2026-QTY</div>,
        cell: ({ row }) => {
            const ppmp = row.original;
            const totalQty = MONTHS.reduce(
                (sum, month) => sum + (Number(ppmp[month.qtyKey]) || 0),
                0,
            );

            return <div className="text-right">{formatInteger(totalQty.toString())}</div>;
        },
    }),
    columnHelper.accessor(
        (row) =>
            MONTHS.reduce(
                (acc, m) => acc.plus(new Decimal(row[m.amountKey] || 0)),
                new Decimal(0),
            ).toNumber(),
        {
            id: "total_amount",
            size: 150,
            header: () => <div className="text-right">TOTAL</div>,
            cell: ({ getValue }) => (
                <div className="text-right">{formatNumber(String(getValue()))}</div>
            ),
            footer: ({ table }) => {
                const sum = table
                    .getFilteredRowModel()
                    .rows.reduce(
                        (acc, row) => acc.plus(row.getValue<number>("total_amount") || 0),
                        new Decimal(0),
                    );

                return <div className="text-right">{formatNumber(sum.toString())}</div>;
            },
        },
    ),

    ...MONTHS.flatMap((month) => [
        columnHelper.accessor(month.qtyKey, {
            size: 150,
            header: () => <div className="text-right">{month.qtyHeader}</div>,
            cell: EditableCell,
        }),
        columnHelper.accessor(month.amountKey, {
            size: 150,
            header: () => <div className="text-right">{month.amountHeader}</div>,
            cell: ({ getValue }) => (
                <div className="text-right">{formatNumber(String(getValue() ?? 0))}</div>
            ),
            footer: ({ table }) => {
                const sum = table.getFilteredRowModel().rows.reduce((acc, row) => {
                    return acc.plus(new Decimal(row.getValue(month.amountKey) || 0));
                }, new Decimal(0));

                return <div className="text-right">{formatNumber(sum.toString())}</div>;
            },
        }),
    ]),

    // action
    columnHelper.display({
        id: "action",
        size: 46,
        cell: ({ row, table }) => {
            // if (!row.original.can?.delete) return null;
            return (
                <div className="flex justify-center">
                    <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => table.options.meta?.onDelete?.(row.original)}
                        disabled={!row.original.can?.delete}
                    >
                        <Trash />
                    </Button>
                </div>
            );
        },
    }),
];

export default columns;
