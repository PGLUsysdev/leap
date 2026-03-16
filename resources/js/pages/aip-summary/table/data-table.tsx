import * as React from 'react';
import type {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    Column,
} from '@tanstack/react-table';
import {
    // ExpandedState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    getExpandedRowModel,
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

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    searchKey?: string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    getSubRows?: (originalRow: TData, index: number) => TData[] | undefined;
    emptyMessage?: string;
}

const PINNED_COLUMN_COLORS = {
    header: {
        background: 'var(--primary)',
    },
    cell: {
        background: 'var(--background)',
        evenBackground: 'var(--muted)',
    },
};

const getCommonPinningStyles = <TData,>(
    column: Column<TData>,
    isHeaderCell = false,
    isEvenRow = false,
): CSSProperties => {
    const isPinned = column.getIsPinned();
    const isLastLeftPinnedColumn =
        isPinned === 'left' && column.getIsLastColumn('left');
    const isFirstRightPinnedColumn =
        isPinned === 'right' && column.getIsFirstColumn('right');

    return {
        boxShadow: isLastLeftPinnedColumn
            ? '-1px 0 0 0 var(--muted) inset'
            : isFirstRightPinnedColumn
              ? '1px 0 0 0 var(--muted) inset'
              : undefined,
        left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
        right:
            isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
        position: isPinned ? 'sticky' : 'relative',
        width: column.getSize(),
        minWidth: column.columnDef.minSize,
        maxWidth: column.columnDef.maxSize,
        // zIndex: isPinned ? 0 : 0,
        backgroundColor: isPinned
            ? isHeaderCell
                ? PINNED_COLUMN_COLORS.header.background
                : isEvenRow
                  ? PINNED_COLUMN_COLORS.cell.evenBackground
                  : PINNED_COLUMN_COLORS.cell.background
            : undefined,
    };
};

export default function DataTable<TData, TValue>({
    columns,
    data,
    searchKey = 'title',
    searchValue,
    onSearchChange,
    getSubRows,
    emptyMessage = 'No results.',
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);

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
    React.useEffect(() => {
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
        <div className="border">
            <Table
                style={{
                    //     width: table.getTotalSize(),
                    tableLayout: 'fixed',
                }}
            >
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                const { column } = header;

                                return (
                                    <TableHead
                                        key={header.id}
                                        colSpan={header.colSpan}
                                        className="bg-primary font-bold text-primary-foreground"
                                        style={{
                                            ...getCommonPinningStyles(
                                                column,
                                                true,
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
                <TableBody className="[&_tr:nth-child(even)]:bg-muted">
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row, index) => (
                            <TableRow key={row.id}>
                                {row.getVisibleCells().map((cell) => {
                                    const { column } = cell;

                                    return (
                                        <TableCell
                                            key={cell.id}
                                            style={{
                                                ...getCommonPinningStyles(
                                                    column,
                                                    false,
                                                    index % 2 === 1,
                                                ),
                                            }}
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
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
                                colSpan={table.getVisibleLeafColumns().length}
                                // colSpan={columns.length}
                                className="h-24 text-center"
                            >
                                {emptyMessage}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
