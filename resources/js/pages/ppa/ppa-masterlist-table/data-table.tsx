import { useState } from 'react';
import type { ReactElement } from 'react';
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    useReactTable,
} from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
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
import { getExpandedRowModel } from '@tanstack/react-table';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    onAdd?: (parent: TData, childType: string) => void;
    onEdit?: (record: TData) => void;
    onDelete?: (record: TData) => void;
    children?: ReactElement;
}

export function PpaDataTable<TData, TValue>({
    columns,
    data,
    onAdd,
    onEdit,
    onDelete,
    children,
}: DataTableProps<TData, TValue>) {
    const [globalFilter, setGlobalFilter] = useState('');

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        meta: { onAdd, onEdit, onDelete },
        initialState: {
            columnPinning: {
                right: ['action'],
            },
        },
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            expanded: true,
            globalFilter,
        },
        onGlobalFilterChange: setGlobalFilter,

        // for expanded rows
        getSubRows: (row: any) => row.children ?? [], // Defines the data structure for nesting. It tells the table where to find child records within a row (e.g., row.children). Without this, the table treats all data as a flat list.
        getExpandedRowModel: getExpandedRowModel(), // Handles the ui logic for expansion. It dynamically calculates which sub-rows should be visible or hidden based on the user's toggle state.
        filterFromLeafRows: true, // allows filtering sub rows
    });

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <Input
                    placeholder="Filter programs/projects/activities..."
                    value={table.getState().globalFilter ?? ''}
                    onChange={(event) =>
                        table.setGlobalFilter(event.target.value)
                    }
                    className="max-w-sm"
                />

                <div>{children}</div>
            </div>

            <ScrollArea className="h-[calc(100vh-8rem)] rounded-md border">
                <Table style={{ tableLayout: 'fixed' }}>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        style={{
                                            width: header.getSize(),
                                            ...getCommonPinningStyles(
                                                header.column,
                                            ),
                                            backgroundColor: 'var(--primary)',
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
                                    No results found.
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
