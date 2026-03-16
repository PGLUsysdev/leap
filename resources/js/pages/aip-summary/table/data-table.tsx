import { useState, useEffect } from 'react';
// import type { ReactElement } from 'react';
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    useReactTable,
} from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
// import { Input } from '@/components/ui/input';
// import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { getCommonPinningStyles } from '@/pages/utils/column-pinning-styles';

import type { ColumnFiltersState, SortingState } from '@tanstack/react-table';
import { getSortedRowModel, getExpandedRowModel } from '@tanstack/react-table';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    searchKey?: string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    getSubRows?: (originalRow: TData, index: number) => TData[] | undefined;
}

export default function DataTable<TData, TValue>({
    columns,
    data,
    searchKey = 'title',
    searchValue,
    onSearchChange,
    getSubRows,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnFilters,
            expanded: true,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        getSubRows,
        filterFromLeafRows: true,
        maxLeafRowFilterDepth: 100,
        enableColumnPinning: true,
        initialState: {
            columnPinning: { right: ['actions'] },
        },
        columnResizeMode: 'onChange',
    });

    // Sync external search value with table filter
    useEffect(() => {
        if (searchValue !== undefined && onSearchChange) {
            const currentFilter = table
                .getColumn(searchKey)
                ?.getFilterValue() as string;
            if (currentFilter !== searchValue) {
                table.getColumn(searchKey)?.setFilterValue(searchValue);
            }
        }
    }, [searchValue, searchKey, table, onSearchChange]);

    return (
        <Table
            style={{
                //     width: table.getTotalSize(),
                tableLayout: 'fixed',
            }}
        >
            <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                            <TableHead
                                key={header.id}
                                colSpan={header.colSpan}
                                style={{
                                    width: header.getSize(),
                                    ...getCommonPinningStyles(header.column),
                                    backgroundColor: 'var(--primary)',
                                    color: 'var(--primary-foreground)',
                                }}
                            >
                                {header.isPlaceholder
                                    ? null
                                    : flexRender(
                                          header.column.columnDef.header,
                                          header.getContext(),
                                      )}
                            </TableHead>
                        ))}
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
                                        ...getCommonPinningStyles(cell.column),
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
                            No results found.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}
