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
    TableFooter,
} from '@/components/ui/table';
import { getCommonPinningStyles } from '@/pages/utils/column-pinning-styles';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

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
    children,
    withSearch = false,
    withRowSpan = false,
    withFooter = false,
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
        meta: {
            onAdd,
            onEdit,
            onDelete,
            onUpdateStatus,
            onOpen,
            onGeneratePdf,
        },

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
                        <></> // Spacer to keep children on the right
                    )}
                    <div>{children}</div>
                </div>
            )}

            <ScrollArea className="h-[calc(100vh-8rem)] rounded-md border">
                <Table style={{ tableLayout: 'fixed', width: '100%' }}>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            colSpan={header.colSpan}
                                            style={{
                                                width: `${header.getSize()}px`,
                                                ...getCommonPinningStyles(
                                                    header.column,
                                                ),
                                                // border: 'solid 1px white', // for debugging
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
                                    {row.getVisibleCells().map((cell) => {
                                        const columnMeta = cell.column.columnDef
                                            .meta as any;

                                        // FIX: Check BOTH the prop and the column meta
                                        const isSpannedCol =
                                            withRowSpan && columnMeta?.rowSpan;

                                        const rowData = row.original as any;

                                        // IMPORTANT SAFETY:
                                        // If the data doesn't have spanning info (like your User table),
                                        // we should treat it as a normal cell even if withRowSpan is true.
                                        const hasSpanningData =
                                            typeof rowData.isFirstInGroup !==
                                            'undefined';
                                        const activeSpan =
                                            isSpannedCol && hasSpanningData;

                                        // Skip rendering if spanning is active and this isn't the first row
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
                                                    ...getCommonPinningStyles(
                                                        cell.column,
                                                    ),
                                                    // backgroundColor: `var(--background)`,
                                                    // verticalAlign: activeSpan
                                                    //     ? 'top'
                                                    //     : 'middle',
                                                    // border: 'solid 1px white', // for debugging
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
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>

                    {withFooter && (
                        <TableFooter className="sticky bottom-0 bg-secondary">
                            {table.getFooterGroups().map((footerGroup) => (
                                <TableRow key={footerGroup.id}>
                                    {footerGroup.headers.map((column) => {
                                        return (
                                            <TableCell
                                                key={column.id}
                                                colSpan={column.colSpan}
                                                style={{
                                                    width: `${column.getSize()}px`,
                                                    ...getCommonPinningStyles(
                                                        column.column,
                                                    ),
                                                }}
                                            >
                                                {column.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          column.column
                                                              .columnDef.footer,
                                                          column.getContext(),
                                                      )}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableFooter>
                    )}
                </Table>

                <ScrollBar orientation="horizontal" className="z-10" />
                <ScrollBar orientation="vertical" className="z-10" />
            </ScrollArea>
        </div>
    );
}
