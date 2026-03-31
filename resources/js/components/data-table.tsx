import { type ReactElement, useState } from 'react';
import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getExpandedRowModel,
    getFilteredRowModel,
} from '@tanstack/react-table';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { getCommonPinningStyles } from '@/pages/utils/column-pinning-styles';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

interface DataTableProps<TData> {
    columns: ColumnDef<TData, any>[];
    data: TData[];
    isExpandedAll?: boolean;
    withSearch?: boolean;
    onAdd?: (parent: TData, childType: any) => void;
    onEdit?: (record: TData) => void;
    onDelete?: (record: TData) => void;
    children?: ReactElement;
}

export function DataTable<TData>({
    columns,
    data,
    onAdd,
    onEdit,
    onDelete,
    children,
    withSearch = false,
}: DataTableProps<TData>) {
    const [globalFilter, setGlobalFilter] = useState('');

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        initialState: {
            columnPinning: {
                right: ['action'],
            },
        },

        // global filter
        onGlobalFilterChange: setGlobalFilter,
        getFilteredRowModel: withSearch ? getFilteredRowModel() : undefined,

        // meta
        meta: { onAdd, onEdit, onDelete },

        // for sub rows
        getSubRows: (row: any) => row.children,
        getExpandedRowModel: getExpandedRowModel(),
        filterFromLeafRows: true,

        state: {
            expanded: true, // for sub rows
            globalFilter, // for global filter
        },
    });

    return (
        <div className="flex flex-col gap-4">
            {(withSearch || children) && (
                <div className="flex items-center justify-between gap-4">
                    {withSearch ? (
                        <Input
                            placeholder="Filter..."
                            value={globalFilter ?? ''}
                            onChange={(event) =>
                                table.setGlobalFilter(event.target.value)
                            }
                            className="max-w-sm"
                        />
                    ) : (
                        <div /> // Spacer to keep children on the right
                    )}
                    <div>{children}</div>
                </div>
            )}

            <ScrollArea className="rounded-md border">
                <Table style={{ tableLayout: 'fixed', width: '100%' }}>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            style={{
                                                width: `${header.getSize()}px`,
                                                ...getCommonPinningStyles(
                                                    header.column,
                                                ),
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
                                <TableRow
                                    key={row.id}
                                    data-state={
                                        row.getIsSelected() && 'selected'
                                    }
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            style={{
                                                // width: cell.column.getSize(),
                                                width: `${cell.column.getSize()}px`,
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
