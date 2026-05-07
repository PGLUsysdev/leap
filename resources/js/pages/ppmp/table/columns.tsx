import { createColumnHelper } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Ppmp } from '@/types/global';
import { Decimal } from 'decimal.js';
import { Trash } from 'lucide-react';
import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';

interface EditableCellProps {
    getValue: () => any;
    row: any;
    column: any;
}

const formatNumber = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) || num === null
        ? '0.00'
        : num.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
          });
};

const formatInteger = (val: string | number) => {
    const num =
        typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : val;

    if (isNaN(num) || num === null) return '0';

    return num.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
};

const EditableCell: React.FC<EditableCellProps> = ({
    getValue,
    row,
    column,
}) => {
    const initialValue = getValue(); // Current value from the database/Inertia props

    // localValue holds what the user sees/types
    const [localValue, setLocalValue] = useState<string>(
        formatInteger(initialValue),
    );
    const [isUpdating, setIsUpdating] = useState(false);

    // CRITICAL: Sync local state when the server data changes (initialValue changes)
    // This ensures that after the router.put finishes and the page props refresh,
    // the input displays the new "source of truth".
    useEffect(() => {
        setLocalValue(formatInteger(initialValue));
    }, [initialValue]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur(); // Triggers handleBlur
        }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        // Remove commas on focus so the user can type a normal number
        const rawValue = localValue.replace(/,/g, '');
        setLocalValue(rawValue);

        // Use timeout to ensure selection happens after value update
        setTimeout(() => e.target.select(), 0);
    };

    const handleBlur = () => {
        const cleanValue = localValue.replace(/,/g, '');
        const cleanInitial = String(initialValue || '0').replace(/,/g, '');

        // 1. If the value hasn't actually changed, just put the commas back
        if (cleanValue === cleanInitial) {
            setLocalValue(formatInteger(cleanValue));
            return;
        }

        // 2. If it has changed, send to server
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
                only: ['ppmps'], // Tells Inertia to only refresh the table data
                onSuccess: () => {
                    // Success: The useEffect above will handle updating localValue
                },
                onError: () => {
                    // Fail: Revert to the old database value
                    setLocalValue(formatInteger(initialValue));
                },
                onFinish: () => {
                    setIsUpdating(false);
                },
            },
        );
    };

    return (
        <Input
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            disabled={isUpdating}
            className="w-full rounded border bg-transparent px-2 py-1 text-right focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
        />
    );
};

const columnHelper = createColumnHelper<Ppmp>();

const columns = [
    columnHelper.accessor('funding_source_id', {
        header: () => <div>Funding Source</div>,
        cell: ({ row }) => (
            <span className="text-wrap">
                {row.original.fundingSource?.code}
            </span>
        ),
    }),
    columnHelper.display({
        id: 'expense_class',
        header: () => <div>Expense Class</div>,
        cell: ({ row }) => (
            <span className="font-medium text-wrap">
                {row.original.chartOfAccount?.expense_class}
            </span>
        ),
    }),
    columnHelper.display({
        id: 'expense_account',
        size: 300,
        header: () => <div>Expense Account</div>,
        cell: ({ row }) => (
            <div className="text-wrap">
                {row.original.chartOfAccount?.account_title}
            </div>
        ),
    }),
    // priceList
    columnHelper.display({
        id: 'item_number',
        size: 150,
        header: () => <div className="pr-20 text-right">Item No.</div>,
        cell: ({ row }) => (
            <div className="pr-20 text-right">
                {row.original.priceList?.item_number}
            </div>
        ),
    }),
    columnHelper.accessor('priceListDescription', {
        header: () => <div>Description</div>,
        size: 300,
        enableGlobalFilter: true,
        cell: (info) => <div className="text-wrap">{info.getValue()}</div>,
    }),
    columnHelper.accessor('ppmp_price_list_id', {
        id: 'unit_of_measurement',
        size: 150,
        header: () => <div>Unit of Measurement</div>,
        cell: ({ getValue, table }) => {
            const meta = table.options.meta?.meta;
            const priceLists = meta?.priceLists;
            const priceList = priceLists?.find((pl) => pl.id === getValue());

            return (
                <div className="text-wrap">
                    {priceList?.unit_of_measurement}
                </div>
            );
        },
    }),
    columnHelper.accessor('ppmp_price_list_id', {
        id: 'price',
        size: 150,
        header: () => <div className="text-right">PRICELIST</div>,
        cell: ({ getValue, table }) => {
            const meta = table.options.meta?.meta;
            const priceLists = meta?.priceLists;
            const priceList = priceLists?.find((pl) => pl.id === getValue());

            return (
                <div className="text-right">
                    {formatNumber(priceList?.price ?? 0)}
                </div>
            );
        },
    }),

    // ppmps
    columnHelper.display({
        id: 'cy_qty',
        size: 150,
        header: () => <div className="text-right">CY 2026-QTY</div>,
        cell: ({ row }) => {
            const ppmp = row.original;
            const totalQty =
                (ppmp.jan_qty || 0) +
                (ppmp.feb_qty || 0) +
                (ppmp.mar_qty || 0) +
                (ppmp.apr_qty || 0) +
                (ppmp.may_qty || 0) +
                (ppmp.jun_qty || 0) +
                (ppmp.jul_qty || 0) +
                (ppmp.aug_qty || 0) +
                (ppmp.sep_qty || 0) +
                (ppmp.oct_qty || 0) +
                (ppmp.nov_qty || 0) +
                (ppmp.dec_qty || 0);

            return (
                <div className="text-right">
                    {formatInteger(totalQty.toString())}
                </div>
            );
        },
    }),
    columnHelper.accessor(
        (row) => {
            return new Decimal(row.jan_amount || 0)
                .plus(row.feb_amount || 0)
                .plus(row.mar_amount || 0)
                .plus(row.apr_amount || 0)
                .plus(row.may_amount || 0)
                .plus(row.jun_amount || 0)
                .plus(row.jul_amount || 0)
                .plus(row.aug_amount || 0)
                .plus(row.sep_amount || 0)
                .plus(row.oct_amount || 0)
                .plus(row.nov_amount || 0)
                .plus(row.dec_amount || 0)
                .toNumber();
        },
        {
            id: 'total_amount',
            size: 150,
            header: () => <div className="text-right">TOTAL</div>,
            cell: ({ getValue }) => (
                <div className="text-right">
                    {formatNumber(String(getValue()))}
                </div>
            ),
            footer: ({ table }) => {
                const sum = table
                    .getFilteredRowModel()
                    .rows.reduce((acc, row) => {
                        const val = row.getValue<number>('total_amount');
                        return acc.plus(val || 0);
                    }, new Decimal(0));

                return (
                    <div className="text-right">
                        {formatNumber(sum.toString())}
                    </div>
                );
            },
        },
    ),

    // JANUARY
    columnHelper.accessor('jan_qty', {
        size: 150,
        header: () => <div className="text-right">JAN-QTY</div>,
        cell: EditableCell,
    }),
    columnHelper.accessor('jan_amount', {
        size: 150,
        header: () => <div className="text-right">JAN</div>,
        cell: ({ getValue }) => (
            <div className="text-right">
                {formatNumber(String(getValue() ?? 0))}
            </div>
        ),
        footer: ({ table }) => {
            const sum = table.getFilteredRowModel().rows.reduce((acc, row) => {
                return acc.plus(new Decimal(row.getValue('jan_amount') || 0));
            }, new Decimal(0));

            return (
                <div className="text-right">{formatNumber(sum.toString())}</div>
            );
        },
    }),

    // FEBRUARY
    columnHelper.accessor('feb_qty', {
        size: 150,
        header: () => <div className="text-right">FEB-QTY</div>,
        cell: EditableCell,
    }),
    columnHelper.accessor('feb_amount', {
        size: 150,
        header: () => <div className="text-right">FEB</div>,
        cell: ({ getValue }) => (
            <div className="text-right">
                {formatNumber(String(getValue() ?? 0))}
            </div>
        ),
        footer: ({ table }) => {
            const sum = table.getFilteredRowModel().rows.reduce((acc, row) => {
                return acc.plus(new Decimal(row.getValue('feb_amount') || 0));
            }, new Decimal(0));

            return (
                <div className="text-right">{formatNumber(sum.toString())}</div>
            );
        },
    }),

    // MARCH
    columnHelper.accessor('mar_qty', {
        size: 150,
        header: () => <div className="text-right">MAR-QTY</div>,
        cell: EditableCell,
    }),
    columnHelper.accessor('mar_amount', {
        size: 150,
        header: () => <div className="text-right">MAR</div>,
        cell: ({ getValue }) => (
            <div className="text-right">
                {formatNumber(String(getValue() ?? 0))}
            </div>
        ),
        footer: ({ table }) => {
            const sum = table.getFilteredRowModel().rows.reduce((acc, row) => {
                return acc.plus(new Decimal(row.getValue('mar_amount') || 0));
            }, new Decimal(0));

            return (
                <div className="text-right">{formatNumber(sum.toString())}</div>
            );
        },
    }),

    // APRIL
    columnHelper.accessor('apr_qty', {
        size: 150,
        header: () => <div className="text-right">APR-QTY</div>,
        cell: EditableCell,
    }),
    columnHelper.accessor('apr_amount', {
        size: 150,
        header: () => <div className="text-right">APR</div>,
        cell: ({ getValue }) => (
            <div className="text-right">
                {formatNumber(String(getValue() ?? 0))}
            </div>
        ),
        footer: ({ table }) => {
            const sum = table.getFilteredRowModel().rows.reduce((acc, row) => {
                return acc.plus(new Decimal(row.getValue('apr_amount') || 0));
            }, new Decimal(0));

            return (
                <div className="text-right">{formatNumber(sum.toString())}</div>
            );
        },
    }),

    // MAY
    columnHelper.accessor('may_qty', {
        size: 150,
        header: () => <div className="text-right">MAY-QTY</div>,
        cell: EditableCell,
    }),
    columnHelper.accessor('may_amount', {
        size: 150,
        header: () => <div className="text-right">MAY</div>,
        cell: ({ getValue }) => (
            <div className="text-right">
                {formatNumber(String(getValue() ?? 0))}
            </div>
        ),
        footer: ({ table }) => {
            const sum = table.getFilteredRowModel().rows.reduce((acc, row) => {
                return acc.plus(new Decimal(row.getValue('may_amount') || 0));
            }, new Decimal(0));

            return (
                <div className="text-right">{formatNumber(sum.toString())}</div>
            );
        },
    }),

    // JUNE
    columnHelper.accessor('jun_qty', {
        size: 150,
        header: () => <div className="text-right">JUN-QTY</div>,
        cell: EditableCell,
    }),
    columnHelper.accessor('jun_amount', {
        size: 150,
        header: () => <div className="text-right">JUNE</div>,
        cell: ({ getValue }) => (
            <div className="text-right">
                {formatNumber(String(getValue() ?? 0))}
            </div>
        ),
        footer: ({ table }) => {
            const sum = table.getFilteredRowModel().rows.reduce((acc, row) => {
                return acc.plus(new Decimal(row.getValue('jun_amount') || 0));
            }, new Decimal(0));

            return (
                <div className="text-right">{formatNumber(sum.toString())}</div>
            );
        },
    }),

    // JULY
    columnHelper.accessor('jul_qty', {
        size: 150,
        header: () => <div className="text-right">JUL-QTY</div>,
        cell: EditableCell,
    }),
    columnHelper.accessor('jul_amount', {
        size: 150,
        header: () => <div className="text-right">JULY</div>,
        cell: ({ getValue }) => (
            <div className="text-right">
                {formatNumber(String(getValue() ?? 0))}
            </div>
        ),
        footer: ({ table }) => {
            const sum = table.getFilteredRowModel().rows.reduce((acc, row) => {
                return acc.plus(new Decimal(row.getValue('jul_amount') || 0));
            }, new Decimal(0));

            return (
                <div className="text-right">{formatNumber(sum.toString())}</div>
            );
        },
    }),

    // AUGUST
    columnHelper.accessor('aug_qty', {
        size: 150,
        header: () => <div className="text-right">AUG-QTY</div>,
        cell: EditableCell,
    }),
    columnHelper.accessor('aug_amount', {
        size: 150,
        header: () => <div className="text-right">AUG</div>,
        cell: ({ getValue }) => (
            <div className="text-right">
                {formatNumber(String(getValue() ?? 0))}
            </div>
        ),
        footer: ({ table }) => {
            const sum = table.getFilteredRowModel().rows.reduce((acc, row) => {
                return acc.plus(new Decimal(row.getValue('aug_amount') || 0));
            }, new Decimal(0));

            return (
                <div className="text-right">{formatNumber(sum.toString())}</div>
            );
        },
    }),

    // SEPTEMBER
    columnHelper.accessor('sep_qty', {
        size: 150,
        header: () => <div className="text-right">SEP-QTY</div>,
        cell: EditableCell,
    }),
    columnHelper.accessor('sep_amount', {
        size: 150,
        header: () => <div className="text-right">SEP</div>,
        cell: ({ getValue }) => (
            <div className="text-right">
                {formatNumber(String(getValue() ?? 0))}
            </div>
        ),
        footer: ({ table }) => {
            const sum = table.getFilteredRowModel().rows.reduce((acc, row) => {
                return acc.plus(new Decimal(row.getValue('sep_amount') || 0));
            }, new Decimal(0));

            return (
                <div className="text-right">{formatNumber(sum.toString())}</div>
            );
        },
    }),

    // OCTOBER
    columnHelper.accessor('oct_qty', {
        size: 150,
        header: () => <div className="text-right">OCT-QTY</div>,
        cell: EditableCell,
    }),
    columnHelper.accessor('oct_amount', {
        size: 150,
        header: () => <div className="text-right">OCT</div>,
        cell: ({ getValue }) => (
            <div className="text-right">
                {formatNumber(String(getValue() ?? 0))}
            </div>
        ),
        footer: ({ table }) => {
            const sum = table.getFilteredRowModel().rows.reduce((acc, row) => {
                return acc.plus(new Decimal(row.getValue('oct_amount') || 0));
            }, new Decimal(0));

            return (
                <div className="text-right">{formatNumber(sum.toString())}</div>
            );
        },
    }),

    // NOVEMBER
    columnHelper.accessor('nov_qty', {
        size: 150,
        header: () => <div className="text-right">NOV-QTY</div>,
        cell: EditableCell,
    }),
    columnHelper.accessor('nov_amount', {
        size: 150,
        header: () => <div className="text-right">NOV</div>,
        cell: ({ getValue }) => (
            <div className="text-right">
                {formatNumber(String(getValue() ?? 0))}
            </div>
        ),
        footer: ({ table }) => {
            const sum = table.getFilteredRowModel().rows.reduce((acc, row) => {
                return acc.plus(new Decimal(row.getValue('nov_amount') || 0));
            }, new Decimal(0));

            return (
                <div className="text-right">{formatNumber(sum.toString())}</div>
            );
        },
    }),

    // DECEMBER
    columnHelper.accessor('dec_qty', {
        size: 150,
        header: () => <div className="text-right">DEC-QTY</div>,
        cell: EditableCell,
    }),
    columnHelper.accessor('dec_amount', {
        size: 150,
        header: () => <div className="text-right">DEC</div>,
        cell: ({ getValue }) => (
            <div className="text-right">
                {formatNumber(String(getValue() ?? 0))}
            </div>
        ),
        footer: ({ table }) => {
            const sum = table.getFilteredRowModel().rows.reduce((acc, row) => {
                return acc.plus(new Decimal(row.getValue('dec_amount') || 0));
            }, new Decimal(0));

            return (
                <div className="text-right">{formatNumber(sum.toString())}</div>
            );
        },
    }),

    // action
    columnHelper.display({
        id: 'action',
        size: 52,
        cell: ({ row, table }) => (
            <div className="flex justify-center">
                <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => table.options.meta?.onDelete?.(row.original)}
                >
                    <Trash />
                </Button>
            </div>
        ),
    }),
];

export default columns;
