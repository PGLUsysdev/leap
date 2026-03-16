// resources\js\pages\ppa\ppa-masterlist-table\data-table.tsx

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getExpandedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { getCommonPinningStyles } from '@/pages/utils/column-pinning-styles';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    meta?: any; // Used for the onAdd/onEdit/onDelete callbacks
    children?: React.ReactNode;
}

export function PpaDataTable<TData, TValue>({
    columns,
    data,
    meta,
    children,
}: DataTableProps<TData, TValue>) {
    const [value, setValue] = React.useState('');
    const [globalFilter, setGlobalFilter] = React.useState('');

    // Debounce Search
    React.useEffect(() => {
        const timeout = setTimeout(() => setGlobalFilter(value), 300);
        return () => clearTimeout(timeout);
    }, [value]);

    const table = useReactTable({
        data,
        columns,
        getSubRows: (row: any) => row.children ?? [],
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        filterFromLeafRows: true,
        globalFilterFn: 'includesString',
        onGlobalFilterChange: setGlobalFilter,
        initialState: {
            columnPinning: {
                right: ['action'],
            },
        },
        state: {
            expanded: true,
            globalFilter,
        },
        meta,
    });

    return (
        <div className="space-y-4">
            <div className="flex justify-between">
                <Input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Search Programs/Projects/Activities..."
                    className="max-w-sm"
                />

                <div>{children}</div>
            </div>

            <ScrollArea className="h-[calc(100vh-8rem)] rounded-md border">
                <Table style={{ tableLayout: 'fixed' }}>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            style={{
                                                width: header.getSize(),
                                                ...getCommonPinningStyles(
                                                    header.column,
                                                ),
                                                backgroundColor:
                                                    'var(--primary)',
                                                color: 'var(--primary-foreground)',
                                            }}
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef
                                                          .header,
                                                      header.getContext(),
                                                  )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            style={{
                                                width: cell.column.getSize(),
                                                ...getCommonPinningStyles(
                                                    cell.column,
                                                ),
                                            }}
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}
