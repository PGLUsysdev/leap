import { type ReactElement, useState, useRef } from 'react';
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
    TableFooter,
} from '@/components/ui/table';
import { getCommonPinningStyles } from '@/pages/utils/column-pinning-styles';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useVirtualizer } from '@tanstack/react-virtual';

interface DataTableProps<TData> {
    columns: ColumnDef<TData, any>[];
    data: TData[];
    isExpandedAll?: boolean;
    withSearch?: boolean;
    children?: ReactElement;
    withRowSpan?: boolean;
    withFooter?: boolean;

    onEdit?: (data: TData) => void;
    onDelete?: (data: TData) => void;
    onAdd?: (parent: TData, childType: any) => void;
    onUpdateStatus?: (
        data: TData,
        status: 'active' | 'inactive' | 'closed',
    ) => void;
    onOpen?: (data: TData) => void;
    onGeneratePdf?: (data: TData) => void;
    onOpenPpmpSummary?: (data: TData) => void;
}

export function DataTable<TData>({
    columns,
    data,
    onAdd,
    onEdit,
    onDelete,
    onUpdateStatus,
    onOpen,
    onGeneratePdf,
    onOpenPpmpSummary,
    children,
    withSearch = false,
    withRowSpan = false,
    withFooter = false,
}: DataTableProps<TData>) {
    const [globalFilter, setGlobalFilter] = useState('');

    // 1. Setup the ref for ScrollArea
    const tableContainerRef = useRef<HTMLDivElement>(null);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        initialState: {
            columnPinning: { right: ['action'] },
        },
        onGlobalFilterChange: setGlobalFilter,
        getFilteredRowModel: withSearch ? getFilteredRowModel() : undefined,
        meta: {
            onAdd,
            onEdit,
            onDelete,
            onUpdateStatus,
            onOpen,
            onGeneratePdf,
            onOpenPpmpSummary,
        },
        getSubRows: (row: any) => row.children,
        getExpandedRowModel: getExpandedRowModel(),
        filterFromLeafRows: true,
        state: {
            expanded: true,
            globalFilter,
        },
    });

    const { rows } = table.getRowModel();

    // 2. Setup Virtualizer
    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        // This is the "magic" line that finds the actual scrolling div inside ScrollArea
        getScrollElement: () =>
            tableContainerRef.current?.querySelector(
                '[data-radix-scroll-area-viewport]',
            ) as HTMLElement,
        estimateSize: () => 45, // Match your typical row height
        overscan: 10,
    });

    const virtualRows = rowVirtualizer.getVirtualItems();
    const totalSize = rowVirtualizer.getTotalSize();

    // 3. Spacing calculations
    const paddingTop =
        virtualRows.length > 0 ? virtualRows?.[0]?.start || 0 : 0;
    const paddingBottom =
        virtualRows.length > 0
            ? totalSize - (virtualRows?.[virtualRows.length - 1]?.end || 0)
            : 0;

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
                        <div />
                    )}
                    <div>{children}</div>
                </div>
            )}

            {/* Keep your ScrollArea exactly as it was */}
            <ScrollArea
                ref={tableContainerRef}
                className="h-[calc(100vh-8rem)] rounded-md border"
            >
                {/* <Table style={{ tableLayout: 'fixed', width: '100%' }}> */}
                <Table
                    style={{
                        tableLayout: 'fixed',
                        // width: `${table.getCenterTotalSize()}px`,
                        minWidth: `${table.getCenterTotalSize()}px`,
                        width: '100%',
                    }}
                    // className="w-full"
                >
                    <TableHeader className="sticky top-0 z-20 bg-background">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        colSpan={header.colSpan}
                                        className="border-b-0 shadow-[inset_0_-1px_0_0_var(--muted)]"
                                        style={{
                                            width: `${header.getSize()}px`,
                                            // minWidth: `${header.getSize()}px`,
                                            ...getCommonPinningStyles(
                                                header.column,
                                                table,
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
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody>
                        {/* Top Spacer Row */}
                        {paddingTop > 0 && (
                            <TableRow>
                                <TableCell
                                    style={{ height: `${paddingTop}px` }}
                                    colSpan={columns.length}
                                />
                            </TableRow>
                        )}

                        {virtualRows.length > 0 ? (
                            virtualRows.map((virtualRow) => {
                                const row = rows[virtualRow.index];
                                return (
                                    <TableRow
                                        key={row.id}
                                        data-state={
                                            row.getIsSelected() && 'selected'
                                        }
                                    >
                                        {row.getVisibleCells().map((cell) => {
                                            const columnMeta = cell.column
                                                .columnDef.meta as any;
                                            const isSpannedCol =
                                                withRowSpan &&
                                                columnMeta?.rowSpan;
                                            const rowData = row.original as any;
                                            const hasSpanningData =
                                                typeof rowData.isFirstInGroup !==
                                                'undefined';
                                            const activeSpan =
                                                isSpannedCol && hasSpanningData;

                                            if (
                                                activeSpan &&
                                                !rowData.isFirstInGroup
                                            ) {
                                                return null;
                                            }

                                            return (
                                                <TableCell
                                                    key={cell.id}
                                                    rowSpan={
                                                        activeSpan
                                                            ? rowData.groupSize
                                                            : 1
                                                    }
                                                    style={{
                                                        width: `${cell.column.getSize()}px`,
                                                        // minWidth: `${cell.column.getSize()}px`,
                                                        ...getCommonPinningStyles(
                                                            cell.column,
                                                            table,
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
                                );
                            })
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

                        {/* Bottom Spacer Row */}
                        {paddingBottom > 0 && (
                            <TableRow>
                                <TableCell
                                    style={{ height: `${paddingBottom}px` }}
                                    colSpan={columns.length}
                                />
                            </TableRow>
                        )}
                    </TableBody>

                    {withFooter && (
                        <TableFooter className="sticky bottom-0 z-20 bg-secondary shadow-[inset_0_1px_0_0_var(--muted)]">
                            <TableRow>
                                {table.getAllLeafColumns().map((column) => (
                                    <TableCell
                                        key={column.id}
                                        style={{
                                            width: `${column.getSize()}px`,
                                        }}
                                    >
                                        {column.columnDef.footer
                                            ? flexRender(
                                                  column.columnDef.footer,
                                                  { column, table } as any,
                                              )
                                            : null}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableFooter>
                    )}
                </Table>

                <ScrollBar orientation="horizontal" className="z-30" />
                <ScrollBar orientation="vertical" className="z-30" />
            </ScrollArea>
        </div>
    );
}
