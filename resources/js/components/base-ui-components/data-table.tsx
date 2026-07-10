// import { ScrollArea } from '@base-ui/react/scroll-area';
import {
    useReactTable,
    getCoreRowModel,
    // getExpandedRowModel,
    // getFacetedMinMaxValues,
    // getFacetedRowModel,
    // getFacetedUniqueValues,
    // getFilteredRowModel,
    // getGroupedRowModel,
    // getPaginationRowModel,
    // getSortedRowModel,
    flexRender,
} from '@tanstack/react-table';
import type {
    Column,
    ColumnDef,
    Table,
    TableMeta,
} from '@tanstack/react-table';
import type { CSSProperties } from 'react';
import { ScrollArea, ScrollBar } from '@/components/base-ui/scroll-area';
import {
    Table as DataTable,
    TableHeader,
    TableBody,
    TableFooter,
    TableRow,
    TableHead,
    TableCell,
} from '@/components/base-ui/table';
import { cn } from '@/lib/utils';

// ---

interface TableProps<TData> {
    data: TData[];
    columns: ColumnDef<TData, any>[];
    // meta?: Partial<TableMeta<TData>>;
    meta?: TableMeta<TData>;
}

// ---

const getCommonPinningStyles = <TData,>(
    column: Column<TData>,
    table: Table<TData>,
): CSSProperties => {
    const isPinned = column.getIsPinned();
    const isLastLeftPinnedColumn =
        isPinned === 'left' && column.getIsLastColumn('left');
    const isFirstRightPinnedColumn =
        isPinned === 'right' && column.getIsFirstColumn('right');

    const size = column.getSize();
    const centerTotal = table.getCenterTotalSize();
    const percentage = (size / centerTotal) * 100;

    return {
        boxShadow: isLastLeftPinnedColumn
            ? 'inset -1px 0 0 0 var(--border)'
            : isFirstRightPinnedColumn
              ? ' inset 1px 0 0 0 var(--border)'
              : undefined,
        left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
        right:
            isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
        opacity: isPinned ? 0.95 : 1,
        position: isPinned ? 'sticky' : 'relative',
        zIndex: isPinned ? 1 : 0,

        width: isPinned ? `${size}px` : `${percentage}%`,
        minWidth: `${size}px`,
        maxWidth: isPinned ? `${size}px` : undefined,
    };
};

// ---

export default function Table<TData>({
    data,
    columns,
    meta,
}: TableProps<TData>) {
    const table = useReactTable({
        columns: columns,
        data: data,
        getCoreRowModel: getCoreRowModel(),
        // getExpandedRowModel: getExpandedRowModel(),
        // getFacetedMinMaxValues: getFacetedMinMaxValues(),
        // getFacetedRowModel: getFacetedRowModel(),
        // getFacetedUniqueValues: getFacetedUniqueValues(),
        // getFilteredRowModel: getFilteredRowModel(),
        // getGroupedRowModel: getGroupedRowModel(),
        // getPaginationRowModel: getPaginationRowModel(),
        // getSortedRowModel: getSortedRowModel(),

        // for table
        // defaultColumn: {
        //     size: 110,
        // },

        // column pinning
        enableColumnPinning: true,

        // states
        initialState: {
            columnPinning: {
                right: ['actions'],
            },
        },

        meta: meta,
    });

    return (
        <ScrollArea className="h-100">
            <div>
                <DataTable
                    style={{
                        tableLayout: 'fixed',
                        // tableLayout: 'auto',
                        width: '100%',
                        minWidth: `${table.getCenterTotalSize()}px`,
                        // minWidth: `${table.getTotalSize()}px`,
                    }}
                >
                    <TableHeader className="sticky top-0 z-2">
                        {table.getHeaderGroups().map((headerGroup) => {
                            return (
                                <TableRow
                                    key={headerGroup.id}
                                    className="shadow-[inset_0_-1px_0_0_var(--border)]"
                                >
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <TableHead
                                                key={header.id}
                                                // colSpan={header.colSpan}
                                                className="border-x bg-background/95 p-1 first:border-l-0 last:border-r-0"
                                                style={{
                                                    width: `${header.getSize()}px`,
                                                    ...getCommonPinningStyles(
                                                        header.column,
                                                        table,
                                                    ),
                                                }}
                                            >
                                                {flexRender(
                                                    header.column.columnDef
                                                        .header,
                                                    header.getContext(),
                                                )}
                                            </TableHead>
                                        );
                                    })}
                                </TableRow>
                            );
                        })}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.map((row) => {
                            return (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => {
                                        return (
                                            <TableCell
                                                key={cell.id}
                                                style={{
                                                    width: `${cell.column.getSize()}px`,
                                                    ...getCommonPinningStyles(
                                                        cell.column,
                                                        table,
                                                    ),
                                                }}
                                                className={cn(
                                                    'border p-1 first:border-l-0 last:border-r-0',
                                                    cell.column.getIsPinned() &&
                                                        'bg-background/95',
                                                )}
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext(),
                                                )}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                    <TableFooter className="sticky bottom-0 z-2">
                        {table.getFooterGroups().map((footerGroup) => {
                            return (
                                <TableRow
                                    key={footerGroup.id}
                                    className="shadow-[inset_0_1px_0_0_var(--border)]"
                                >
                                    {footerGroup.headers.map((header) => {
                                        return (
                                            <TableCell
                                                key={header.id}
                                                className="border-x bg-background/95 p-1 first:border-l-0 last:border-r-0"
                                                style={{
                                                    width: `${header.getSize()}px`,
                                                    ...getCommonPinningStyles(
                                                        header.column,
                                                        table,
                                                    ),
                                                }}
                                            >
                                                {flexRender(
                                                    header.column.columnDef
                                                        .footer,
                                                    header.getContext(),
                                                )}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            );
                        })}
                    </TableFooter>
                </DataTable>
            </div>

            <ScrollBar orientation="vertical" className="z-2" />
            <ScrollBar orientation="horizontal" className="z-2" />
        </ScrollArea>
    );
}
