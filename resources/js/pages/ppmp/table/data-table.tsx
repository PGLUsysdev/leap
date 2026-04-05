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
    TableFooter,
} from '@/components/ui/table';
import { getCommonPinningStyles } from '@/pages/utils/column-pinning-styles';

interface DataTableProps<TData> {
    columns: ColumnDef<TData, any>[];
    data: TData[];
    // onEdit?: (record: TData) => void;
    onDelete?: (record: TData) => void;
    children: ReactElement;
    text: ReactElement;
}

export default function DataTable<TData>({
    columns,
    data,
    // onEdit,
    onDelete,
    children,
    // text,
}: DataTableProps<TData>) {
    const [globalFilter, setGlobalFilter] = useState('');

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        meta: {
            // onEdit,
            onDelete,
        },
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
                    placeholder="Filter funding sources..."
                    value={table.getState().globalFilter ?? ''}
                    onChange={(event) =>
                        table.setGlobalFilter(event.target.value)
                    }
                    className="max-w-sm"
                />

                {children}
            </div>

            {/* <span>{text}</span> */}

            <ScrollArea className="h-[calc(100vh-8rem)] rounded-md border">
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
                                        // colSpan={header.colSpan}
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

                    <TableFooter>
                        {table.getFooterGroups().map((footerGroup) => (
                            <TableRow key={footerGroup.id}>
                                {footerGroup.headers.map((header) => (
                                    <TableCell key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef
                                                      .footer,
                                                  header.getContext(),
                                              )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableFooter>
                </Table>

                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}
