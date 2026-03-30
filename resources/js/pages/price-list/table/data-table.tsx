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

interface DataTableProps<TData> {
    columns: ColumnDef<TData, any>[];
    data: TData[];
    onEdit?: (record: TData) => void;
    onDelete?: (record: TData) => void;
    children: ReactElement;
}

export default function DataTable<TData>({
    columns,
    data,
    onEdit,
    onDelete,
    children,
}: DataTableProps<TData>) {
    const [globalFilter, setGlobalFilter] = useState('');

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        meta: { onEdit, onDelete },
        initialState: {
            columnPinning: {
                right: ['action'],
            },
        },
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            globalFilter,
        },
        onGlobalFilterChange: setGlobalFilter,
    });

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <Input
                    placeholder="Filter price lists..."
                    value={table.getState().globalFilter ?? ''}
                    onChange={(event) =>
                        table.setGlobalFilter(event.target.value)
                    }
                    className="max-w-sm"
                />

                {children}
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
