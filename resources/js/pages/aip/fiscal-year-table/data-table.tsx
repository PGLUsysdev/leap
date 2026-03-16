import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import type {
    ColumnDef,
    ColumnFiltersState,
    Column,
} from '@tanstack/react-table';
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    useReactTable,
} from '@tanstack/react-table';
import type { CSSProperties } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getCommonPinningStyles } from '@/pages/utils/column-pinning-styles';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    searchKey?: string;
    children?: ReactNode;
}

export function FiscalYearDataTable<TData, TValue>({
    columns,
    data,
    searchKey,
    children,
}: DataTableProps<TData, TValue>) {
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    // Reset filters and sorting when data changes
    useEffect(() => {
        setColumnFilters([]);
    }, [data]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            columnFilters,
        },
        enableColumnPinning: true,
        columnResizeMode: 'onChange',
    });

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between">
                {searchKey && (
                    <Input
                        placeholder={`Filter ${searchKey}...`}
                        value={
                            (table
                                .getColumn(searchKey)
                                ?.getFilterValue() as string) ?? ''
                        }
                        onChange={(event) =>
                            table
                                .getColumn(searchKey)
                                ?.setFilterValue(event.target.value)
                        }
                        className="max-w-sm"
                    />
                )}

                <div className="flex gap-2">{children}</div>
            </div>

            <ScrollArea className="h-[calc(100vh-8rem)] rounded-md border">
                <Table
                // className="fixed"
                >
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    const { column } = header;
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className="bg-primary font-bold text-primary-foreground"
                                            style={{
                                                ...getCommonPinningStyles(
                                                    column,
                                                ),
                                                width: header.getSize(),
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
                                    {row
                                        .getVisibleCells()
                                        .map((cell, index) => {
                                            const { column } = cell;
                                            return (
                                                <TableCell
                                                    key={cell.id}
                                                    style={{
                                                        ...getCommonPinningStyles(
                                                            column,
                                                        ),
                                                    }}
                                                >
                                                    {flexRender(
                                                        cell.column.columnDef
                                                            .cell,
                                                        cell.getContext(),
                                                    )}
                                                </TableCell>
                                            );
                                        })}
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
            </ScrollArea>
        </div>
    );
}
