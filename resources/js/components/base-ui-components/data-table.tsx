import { router, usePage } from '@inertiajs/react';
import {
    useReactTable,
    getCoreRowModel,
    getExpandedRowModel,
    // getFacetedMinMaxValues,
    // getFacetedRowModel,
    // getFacetedUniqueValues,
    getFilteredRowModel,
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
import {
    ChevronRight,
    ChevronLeft,
    ChevronsRight,
    ChevronsLeft,
    SearchIcon,
} from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Button } from '@/components/base-ui-components/ui/button';
import { Input } from '@/components/base-ui-components/ui/input';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from '@/components/base-ui-components/ui/input-group';
import {
    ScrollArea,
    ScrollBar,
} from '@/components/base-ui-components/ui/scroll-area';
import {
    Table as DataTable,
    TableHeader,
    TableBody,
    TableFooter,
    TableRow,
    TableHead,
    TableCell,
} from '@/components/base-ui-components/ui/table';
import { cn } from '@/lib/utils';
import type {
    // PriceList,
    // ChartOfAccount,
    // PpmpCategory,
    PaginatedResponse,
    // Filter,
    // ChartOfAccountPpmpCategory,
} from '@/types';

interface TableProps<TData> {
    data: TData[];
    paginationData?: Omit<PaginatedResponse<TData>, 'data'>;
    columns: ColumnDef<TData, any>[];
    // meta?: Partial<TableMeta<TData>>;
    meta?: TableMeta<TData>;
    children?: ReactNode;
    variant?: 'table' | 'select';
    onRowClick?: (row: TData) => void;
    selectedKey?: keyof TData;
    selectedValue?: string;
    className?: string;
    disabledKey?: keyof TData;
    disabledValue?: string;
    pageParamName?: string;
    perPageParamName?: string;
    searchParamName?: string;
    only?: string[];
    getSubRows?: (row: TData) => TData[] | undefined;
    showFooter?: boolean;

    withRowSpan?: boolean;

    withColgroup?: boolean;
}

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

export default function Table<TData>({
    data,
    paginationData,
    columns,
    meta,
    children,
    variant = 'table',
    onRowClick,
    selectedKey,
    selectedValue,
    className,
    disabledKey,
    disabledValue,
    pageParamName = 'page',
    // perPageParamName = 'per_page',
    searchParamName = 'search',
    only,
    getSubRows,
    showFooter = false,

    withRowSpan = false,
    withColgroup = false,
}: TableProps<TData>) {
    const isServer = !!paginationData;

    const { url } = usePage();

    const params = Object.fromEntries(
        new URLSearchParams(window.location.search),
    );

    const [globalFilter, setGlobalFilter] = useState<string>(() => {
        const params = new URLSearchParams(window.location.search);

        return params.get(searchParamName) || '';
    });
    // const [globalFilter, setGlobalFilter] = useState<string>('');

    // pagination
    const [pageInput, setPageInput] = useState<string>(() => {
        return paginationData ? String(paginationData.current_page) : '';
    });

    useEffect(() => {
        if (paginationData) {
            setPageInput(String(paginationData.current_page));
        }
    }, [paginationData]);

    const prevGlobalFilter = useRef(globalFilter);

    useEffect(() => {
        if (!isServer) {
            return;
        }

        if (globalFilter === prevGlobalFilter.current) {
            return;
        }

        prevGlobalFilter.current = globalFilter;

        const timeout = setTimeout(() => {
            router.get(
                url,
                {
                    ...params,
                    [searchParamName]: globalFilter || undefined,
                    [pageParamName]: 1, // reset to first page on search
                },
                {
                    only,
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 300);

        return () => clearTimeout(timeout);
    }, [globalFilter]);

    const goToPage = (page: number) => {
        if (!isServer) {
            return;
        }

        page = Math.max(1, Math.min(page, paginationData.last_page));

        if (page === paginationData.current_page) {
            return;
        }

        router.visit(url, {
            data: {
                ...params,
                [pageParamName]: page,
            },
            only,
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    useEffect(() => {
        if (!paginationData) {
            return;
        }

        if (pageInput === '') {
            return;
        }

        const page = Number(pageInput);

        if (Number.isNaN(page)) {
            return;
        }

        const timeout = setTimeout(() => {
            goToPage(page);
        }, 300);

        return () => clearTimeout(timeout);
    }, [pageInput, paginationData]);

    // table
    const table = useReactTable({
        columns,
        data,

        // row models
        getCoreRowModel: getCoreRowModel(),
        getExpandedRowModel: getSubRows ? getExpandedRowModel() : undefined,
        // getFacetedMinMaxValues: getFacetedMinMaxValues(),
        // getFacetedRowModel: getFacetedRowModel(),
        // getFacetedUniqueValues: getFacetedUniqueValues(),
        getFilteredRowModel: !isServer ? getFilteredRowModel() : undefined,
        // getFilteredRowModel: getFilteredRowModel(),
        // getGroupedRowModel: getGroupedRowModel(),
        // getPaginationRowModel: getPaginationRowModel(),
        // getSortedRowModel: getSortedRowModel(),

        getSubRows,
        filterFromLeafRows: true,

        initialState: {
            columnPinning: {
                right: ['actions'],
            },
        },
        state: {
            globalFilter,
            expanded: getSubRows ? true : undefined,
        },

        // for table
        // defaultColumn: {
        //     size: 110,
        // },

        enableColumnPinning: true,

        onGlobalFilterChange: setGlobalFilter,

        manualFiltering: isServer,
        manualPagination: isServer,
        pageCount: paginationData?.last_page,
        rowCount: paginationData?.total,

        meta: meta,
    });

    const rows = table.getRowModel().rows;

    /**
     * Row-span data per spanned column id. Each spanned column groups rows
     * by its own `meta.spanKey` (defaulting to `'id'`), so e.g. PPA-level
     * columns can group by `entryId` while output-level columns group by
     * `outputId`.
     */
    const visibleSpans = useMemo(() => {
        const spansByColumn: Record<
            string,
            {
                firstVisibleIdx: Record<string, number>;
                visibleCounts: Record<string, number>;
            }
        > = {};

        if (!withRowSpan) {
            return spansByColumn;
        }

        table.getAllLeafColumns().forEach((column) => {
            const columnMeta = column.columnDef.meta as
                { rowSpan?: boolean; spanKey?: string } | undefined;

            if (!columnMeta?.rowSpan) {
                return;
            }

            const spanKey = columnMeta.spanKey ?? 'id';
            const firstVisibleIdx: Record<string, number> = {};
            const visibleCounts: Record<string, number> = {};

            rows.forEach((row, index) => {
                const rawKey = (row.original as Record<string, unknown>)?.[
                    spanKey
                ];

                if (rawKey === undefined || rawKey === null) {
                    return;
                }

                const key = String(rawKey);

                if (firstVisibleIdx[key] === undefined) {
                    firstVisibleIdx[key] = index;
                }

                visibleCounts[key] = (visibleCounts[key] || 0) + 1;
            });

            spansByColumn[column.id] = {
                firstVisibleIdx,
                visibleCounts,
            };
        });

        return spansByColumn;
    }, [rows, table, withRowSpan]);

    return (
        <div className={cn('flex h-full min-h-0 flex-col', className)}>
            <div
                className={cn(
                    'flex flex-none justify-between gap-2 p-4',
                    variant === 'select' && 'pt-0',
                )}
            >
                <InputGroup className="w-100 min-w-30">
                    <InputGroupInput
                        value={globalFilter ?? ''}
                        onChange={(e) =>
                            table.setGlobalFilter(String(e.target.value))
                        }
                        placeholder="Search..."
                    />
                    <InputGroupAddon>
                        <SearchIcon />
                    </InputGroupAddon>
                </InputGroup>

                {children}
            </div>

            <ScrollArea className="min-h-0 flex-1 border-y border-r">
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
                        {withColgroup && (
                            <colgroup>
                                {table
                                    .getAllLeafColumns()
                                    .filter((col) => col.getIsVisible())
                                    .map((col) => (
                                        <col
                                            key={col.id}
                                            style={{
                                                width: col.getSize(),
                                                minWidth: col.getSize(),
                                            }}
                                        />
                                    ))}
                            </colgroup>
                        )}
                        <TableHeader className="sticky top-0 z-2">
                            {table.getHeaderGroups().map((headerGroup) => {
                                return (
                                    <TableRow
                                        key={headerGroup.id}
                                        className="shadow-[0_1px_0_0_var(--border)]"
                                    >
                                        {headerGroup.headers.map((header) => {
                                            return (
                                                <TableHead
                                                    key={header.id}
                                                    colSpan={header.colSpan}
                                                    className="border-x bg-background/95 p-1 px-2 first:border-l-0 last:border-r-0"
                                                    style={{
                                                        width: `${header.getSize()}px`,
                                                        ...getCommonPinningStyles(
                                                            header.column,
                                                            table,
                                                        ),
                                                    }}
                                                >
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                              header.column
                                                                  .columnDef
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
                            {rows.map((row, rowIndex) => {
                                const isSelected =
                                    selectedKey &&
                                    selectedValue &&
                                    String(row.original[selectedKey]) ===
                                        selectedValue;
                                const isDisabled =
                                    disabledKey &&
                                    disabledValue &&
                                    String(row.original[disabledKey]) ===
                                        disabledValue;

                                return (
                                    <TableRow
                                        key={row.id}
                                        className={cn(
                                            variant === 'select' &&
                                                'cursor-pointer hover:bg-accent',
                                            isSelected && 'bg-primary',
                                            isDisabled &&
                                                'cursor-not-allowed opacity-50',
                                        )}
                                        onClick={() => {
                                            if (
                                                variant === 'select' &&
                                                !isDisabled
                                            ) {
                                                onRowClick?.(row.original);
                                            }
                                        }}
                                    >
                                        {row.getVisibleCells().map((cell) => {
                                            const columnMeta = cell.column
                                                .columnDef.meta as any;

                                            const isSpannedColumn =
                                                withRowSpan &&
                                                columnMeta?.rowSpan;

                                            const rowData = row.original as any;

                                            let isFirstVisible = true;
                                            let spanSize: number | undefined =
                                                1;

                                            if (isSpannedColumn) {
                                                const spanKey: string =
                                                    columnMeta?.spanKey ?? 'id';
                                                const spanData =
                                                    visibleSpans[
                                                        cell.column.id
                                                    ];
                                                const rawKey =
                                                    rowData?.[spanKey];
                                                const key =
                                                    rawKey === undefined ||
                                                    rawKey === null
                                                        ? null
                                                        : String(rawKey);

                                                if (key !== null && spanData) {
                                                    isFirstVisible =
                                                        spanData
                                                            .firstVisibleIdx[
                                                            key
                                                        ] === rowIndex;
                                                    spanSize =
                                                        spanData.visibleCounts[
                                                            key
                                                        ] ?? 1;
                                                }
                                            }

                                            if (
                                                isSpannedColumn &&
                                                !isFirstVisible
                                            ) {
                                                return null;
                                            }

                                            return (
                                                <TableCell
                                                    key={cell.id}
                                                    rowSpan={
                                                        isSpannedColumn
                                                            ? spanSize
                                                            : 1
                                                    }
                                                    style={{
                                                        width: `${cell.column.getSize()}px`,
                                                        ...getCommonPinningStyles(
                                                            cell.column,
                                                            table,
                                                        ),
                                                    }}
                                                    className={cn(
                                                        'border p-1 px-2 first:border-l-0 last:border-r-0',
                                                        cell.column.getIsPinned() &&
                                                            'bg-background/95',
                                                    )}
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
                            })}
                        </TableBody>
                        {showFooter && (
                            <TableFooter className="sticky bottom-0 z-2">
                                {table
                                    .getFooterGroups()
                                    .filter((group) =>
                                        group.headers.some(
                                            (header) =>
                                                !header.isPlaceholder &&
                                                header.column.columnDef.footer,
                                        ),
                                    )
                                    .map((footerGroup) => {
                                        return (
                                            <TableRow
                                                key={footerGroup.id}
                                                className="shadow-[0_-1px_0_0_var(--border)]"
                                            >
                                                {footerGroup.headers.map(
                                                    (header) => {
                                                        return (
                                                            <TableCell
                                                                key={header.id}
                                                                className="border-x bg-background/95 p-1 px-2 first:border-l-0 last:border-r-0"
                                                                style={{
                                                                    width: `${header.getSize()}px`,
                                                                    ...getCommonPinningStyles(
                                                                        header.column,
                                                                        table,
                                                                    ),
                                                                }}
                                                            >
                                                                {header.isPlaceholder
                                                                    ? null
                                                                    : flexRender(
                                                                          header
                                                                              .column
                                                                              .columnDef
                                                                              .footer,
                                                                          header.getContext(),
                                                                      )}
                                                            </TableCell>
                                                        );
                                                    },
                                                )}
                                            </TableRow>
                                        );
                                    })}
                            </TableFooter>
                        )}
                    </DataTable>
                </div>

                <ScrollBar orientation="vertical" className="z-2" />
                <ScrollBar orientation="horizontal" className="z-2" />
            </ScrollArea>

            {paginationData && (
                <div className="flex w-full justify-center bg-background">
                    <div className="flex gap-1 px-4 py-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => goToPage(1)}
                            disabled={paginationData.current_page === 1}
                        >
                            <ChevronsLeft />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                                goToPage(paginationData.current_page - 1)
                            }
                            disabled={paginationData.current_page === 1}
                        >
                            <ChevronLeft />
                        </Button>
                        <div className="flex w-24 items-center justify-between pr-2">
                            <Input
                                className="w-12"
                                value={pageInput}
                                onChange={(e) => {
                                    const value = e.currentTarget.value;

                                    if (value === '') {
                                        setPageInput('');

                                        return;
                                    }

                                    if (!/^\d+$/.test(value)) {
                                        return;
                                    }

                                    setPageInput(value);
                                }}
                                onBlur={() => {
                                    if (pageInput === '') {
                                        setPageInput(
                                            String(paginationData.current_page),
                                        );

                                        return;
                                    }

                                    const page = Math.max(
                                        1,
                                        Math.min(
                                            Number(pageInput),
                                            paginationData.last_page,
                                        ),
                                    );

                                    setPageInput(String(page));
                                }}
                                onFocus={(e) => e.target.select()}
                                pattern="[0-9]*"
                                inputMode="numeric"
                                autoComplete="off"
                            ></Input>
                            <span>/</span>
                            <span>{paginationData.last_page}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                                goToPage(paginationData.current_page + 1)
                            }
                            disabled={
                                paginationData.current_page ===
                                paginationData.last_page
                            }
                        >
                            <ChevronRight />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => goToPage(paginationData.last_page)}
                            disabled={
                                paginationData.current_page ===
                                paginationData.last_page
                            }
                        >
                            <ChevronsRight />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
