import * as React from 'react';
import type {
    ColumnDef,
    RowSelectionState,
    ExpandedState,
} from '@tanstack/react-table';
import {
    getCoreRowModel,
    getFilteredRowModel,
    getExpandedRowModel,
    useReactTable,
} from '@tanstack/react-table';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { flexRender } from '@tanstack/react-table';

interface DataTableProps<TData> {
    columns: ColumnDef<TData, any>[];
    data: TData[];
    rowSelection: RowSelectionState;
    setRowSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>;
    globalFilter: string;
    setGlobalFilter: React.Dispatch<React.SetStateAction<string>>;
    getSubRows: (row: TData) => TData[] | undefined;
}

export function DataTable<TData>({
    columns,
    data,
    rowSelection,
    setRowSelection,
    globalFilter,
    setGlobalFilter,
    getSubRows,
}: DataTableProps<TData>) {
    const [expanded, setExpanded] = React.useState<ExpandedState>(true);

    const table = useReactTable({
        data,
        columns,
        getSubRows,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setGlobalFilter,
        onExpandedChange: setExpanded,

        // Ensure that selecting a parent row selects all sub-rows logic
        // is handled in the column definition, but we need correct IDs here
        getRowId: (row: any) => row.id.toString(),
        enableSubRowSelection: false,
        filterFromLeafRows: true,

        state: {
            rowSelection,
            globalFilter,
            expanded,
        },
    });

    return (
        <Table
            style={{
                // width: table.getTotalSize(),
                tableLayout: 'fixed',
            }}
        >
            <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                            return (
                                <TableHead
                                    key={header.id}
                                    style={{ width: header.getSize() }}
                                >
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                              header.column.columnDef.header,
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
                        <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && 'selected'}
                        >
                            {row.getVisibleCells().map((cell) => (
                                <TableCell
                                    key={cell.id}
                                    style={{ width: cell.column.getSize() }}
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
    );
}
