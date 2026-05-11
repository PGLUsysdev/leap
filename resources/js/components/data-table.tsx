import { type ReactElement, useState, useRef, useMemo, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useVirtualizer } from '@tanstack/react-virtual';
import { AlertErrorDialog } from '@/components/alert-error-dialog';
import { router } from '@inertiajs/react';
import {
    ChevronFirst,
    ChevronLast,
    ChevronLeft,
    ChevronRight,
    SearchIcon,
} from 'lucide-react';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from '@/components/ui/input-group';
import type { PaginatedResponse, Filter } from '@/types/global';

interface DataTableProps<TData extends { id: unknown }> {
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
    negativeHeight?: number;
    onReorder?: (activeId: string, overId: string) => void;
    onMove?: (data: TData) => void;
    onShowChildren?: (data: TData) => void;
    onSelect?: (data: TData) => void;
    paginationObj?: PaginatedResponse<TData> | [];
    meta?: any;
    filters?: Filter;
    onlyKeys?: { [key: string]: any };
    searchKey?: string;
    pageKey?: string;
    isDialog?: boolean;
}

export function DataTable<TData extends { id: unknown }>({
    columns,
    data,
    children,
    paginationObj,
    filters,
    isDialog,
    onAdd,
    onEdit,
    onDelete,
    onUpdateStatus,
    onOpen,
    onGeneratePdf,
    onOpenPpmpSummary,
    onSelect,
    onReorder,
    onMove,
    onShowChildren,
    withSearch = false,
    withRowSpan = false,
    withFooter = false,
    negativeHeight = 8,
    onlyKeys = [],
    searchKey = 'search',
    pageKey = 'page',
    meta,
}: DataTableProps<TData>) {
    const [localData, setLocalData] = useState(data);
    const [errorDialogOpen, setErrorDialogOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // row selection
    const [rowSelection, setRowSelection] = useState({});

    // for global search
    const [searchValue, setSearchValue] = useState('');

    // logic for server-side filtering ex. search
    const isServerSide = useMemo(() => {
        return paginationObj && !Array.isArray(paginationObj);
    }, [paginationObj]);

    // 2. Sync local state with props (if URL changes via browser back/forward)
    useEffect(() => {
        setSearchValue(filters?.[searchKey] || '');
    }, [filters, searchKey]);

    // 3. Debounce and Trigger Inertia
    useEffect(() => {
        if (!isServerSide) return;

        const delayDebounceFn = setTimeout(() => {
            const currentFilterValue = filters?.[searchKey] || '';

            // console.log({ searchValue, currentFilterValue });

            // Trigger if value is different, or if we're clearing a search that exists in URL
            if (searchValue !== currentFilterValue) {
                // console.log(searchValue);

                router.get(
                    window.location.pathname,
                    {
                        ...filters,
                        [searchKey]: searchValue || undefined,
                        [pageKey]: 1,
                    },
                    {
                        preserveState: true,
                        replace: true,
                        preserveScroll: true,
                        only:
                            onlyKeys &&
                            Array.isArray(onlyKeys) &&
                            onlyKeys.length > 0
                                ? onlyKeys
                                : undefined,
                    },
                );
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [
        isDialog,
        onlyKeys.length,
        searchKey,
        onlyKeys,
        filters,
        searchValue,
        isServerSide,
        // pageKey,
    ]);

    useEffect(() => {
        setLocalData(data);
    }, [data]);

    const tableContainerRef = useRef<HTMLDivElement>(null);

    const table = useReactTable({
        data: localData,
        columns,
        getCoreRowModel: getCoreRowModel(),

        initialState: {
            columnPinning: { right: ['action'] },
        },

        // SERVER-SIDE SEARCH CONFIG
        manualFiltering: isServerSide,

        getFilteredRowModel: getFilteredRowModel(),
        meta: {
            onAdd,
            onEdit,
            onDelete,
            onUpdateStatus,
            onOpen,
            onGeneratePdf,
            onOpenPpmpSummary,
            onReorder,
            onMove,
            onShowChildren,
            onSelect,
            ...meta,
        } as any,
        getSubRows: (row: any) => row.children,
        getExpandedRowModel: getExpandedRowModel(),
        filterFromLeafRows: true,
        state: {
            expanded: true,

            // for global search
            globalFilter: searchValue,

            // for pagination
            pagination: {
                pageIndex:
                    paginationObj &&
                    paginationObj !== undefined &&
                    !Array.isArray(paginationObj) &&
                    paginationObj.current_page
                        ? paginationObj.current_page - 1
                        : 0,
                pageSize:
                    paginationObj &&
                    paginationObj !== undefined &&
                    !Array.isArray(paginationObj)
                        ? paginationObj.per_page
                        : 0,
            },

            rowSelection,
        },

        // for dnd
        getRowId: (row) => row.id?.toString() ?? '',

        // for pagination
        manualPagination: isServerSide,
        pageCount:
            paginationObj &&
            paginationObj !== undefined &&
            !Array.isArray(paginationObj)
                ? paginationObj.last_page
                : undefined,

        // row selection
        enableRowSelection: true,
        enableMultiRowSelection: false,
        onRowSelectionChange: setRowSelection,
    });

    const { rows } = table.getRowModel();

    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () =>
            tableContainerRef.current?.querySelector(
                '[data-radix-scroll-area-viewport]',
            ) as HTMLElement,
        estimateSize: () => 50,
        overscan: 10,
        getItemKey: (index) => rows[index]?.id,
        measureElement: (el) => el.getBoundingClientRect().height,
    });

    const virtualRows = rowVirtualizer.getVirtualItems();
    const totalSize = rowVirtualizer.getTotalSize();

    const paddingTop =
        virtualRows.length > 0 ? virtualRows?.[0]?.start || 0 : 0;
    const paddingBottom =
        virtualRows.length > 0
            ? totalSize - (virtualRows?.[virtualRows.length - 1]?.end || 0)
            : 0;

    const navigate = (url: string | null) => {
        if (!url) return;
        router.get(
            url,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only:
                    onlyKeys && Array.isArray(onlyKeys) && onlyKeys.length > 0
                        ? onlyKeys
                        : undefined,
            },
        );
    };

    return (
        <>
            <div className="flex flex-col gap-4">
                {(withSearch || children) && (
                    <div className="flex items-center justify-between gap-4">
                        {withSearch ? (
                            <InputGroup className="max-w-sm">
                                <InputGroupInput
                                    placeholder="Search..."
                                    value={searchValue}
                                    onChange={(e) => {
                                        setSearchValue(e.target.value);
                                    }}
                                />
                                <InputGroupAddon>
                                    <SearchIcon />
                                </InputGroupAddon>
                            </InputGroup>
                        ) : (
                            <div />
                        )}

                        <div>{children}</div>
                    </div>
                )}

                <ScrollArea
                    ref={tableContainerRef}
                    style={{ height: `calc(100vh - ${negativeHeight}rem)` }}
                    className="rounded-md border"
                >
                    <Table
                        style={{
                            tableLayout: 'fixed',
                            minWidth: `${table.getCenterTotalSize()}px`,
                            width: '100%',
                        }}
                    >
                        <TableHeader className="sticky top-0 z-20 bg-background">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead
                                            key={header.id}
                                            colSpan={header.colSpan}
                                            className="border-b-0 bg-primary text-primary-foreground"
                                            style={{
                                                width: `${header.getSize()}px`,
                                                ...getCommonPinningStyles(
                                                    header.column,
                                                    table,
                                                    false,
                                                    true,
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
                            {paddingTop > 0 && (
                                <TableRow>
                                    <TableCell
                                        style={{
                                            height: `${paddingTop}px`,
                                        }}
                                        colSpan={columns.length}
                                    />
                                </TableRow>
                            )}

                            {virtualRows.length > 0 ? (
                                virtualRows.map((virtualRow) => {
                                    const row = rows[virtualRow.index];
                                    const rowData = row.original as any;

                                    return (
                                        <TableRow
                                            key={`${row.id}-${virtualRow.index}`}
                                            data-index={virtualRow.index}
                                            ref={(node) =>
                                                rowVirtualizer.measureElement(
                                                    node,
                                                )
                                            }
                                            data-state={
                                                row.getIsSelected() &&
                                                'selected'
                                            }
                                            className="group transition-colors data-[state=selected]:bg-muted"
                                        >
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => {
                                                    const columnMeta = cell
                                                        .column.columnDef
                                                        .meta as any;
                                                    const isSpannedCol =
                                                        withRowSpan &&
                                                        columnMeta?.rowSpan;
                                                    const hasSpanningData =
                                                        typeof rowData.isFirstInGroup !==
                                                        'undefined';
                                                    const activeSpan =
                                                        isSpannedCol &&
                                                        hasSpanningData;

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
                                                                    table,
                                                                    false,
                                                                    false,
                                                                ),
                                                            }}
                                                            className="py-2"
                                                        >
                                                            {flexRender(
                                                                cell.column
                                                                    .columnDef
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

                            {paddingBottom > 0 && (
                                <TableRow>
                                    <TableCell
                                        style={{
                                            height: `${paddingBottom}px`,
                                        }}
                                        colSpan={columns.length}
                                    />
                                </TableRow>
                            )}
                        </TableBody>

                        {withFooter && (
                            <TableFooter className="sticky bottom-0 z-20 shadow-[inset_0_1px_0_0_var(--muted)]">
                                <TableRow>
                                    {table.getAllLeafColumns().map((column) => (
                                        <TableCell
                                            key={column.id}
                                            style={{
                                                width: `${column.getSize()}px`,
                                                ...getCommonPinningStyles(
                                                    column,
                                                    table,
                                                    true,
                                                ),
                                            }}
                                        >
                                            {column.columnDef.footer
                                                ? flexRender(
                                                      column.columnDef.footer,
                                                      {
                                                          column,
                                                          table,
                                                      } as any,
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

                {paginationObj &&
                    paginationObj !== undefined &&
                    !Array.isArray(paginationObj) && (
                        <div className="flex items-center gap-1">
                            <Button
                                size="icon"
                                onClick={() =>
                                    navigate(paginationObj.first_page_url)
                                }
                                disabled={paginationObj.current_page === 1}
                            >
                                <ChevronFirst />
                            </Button>

                            <Button
                                size="icon"
                                onClick={() =>
                                    paginationObj.prev_page_url &&
                                    navigate(paginationObj.prev_page_url)
                                }
                                disabled={paginationObj.current_page === 1}
                            >
                                <ChevronLeft />
                            </Button>

                            <Input
                                value={paginationObj.current_page}
                                disabled
                                className="w-10 text-center"
                            />

                            <Button
                                size="icon"
                                onClick={() =>
                                    paginationObj.next_page_url &&
                                    navigate(paginationObj.next_page_url)
                                }
                                disabled={
                                    paginationObj.current_page ===
                                    paginationObj.last_page
                                }
                            >
                                <ChevronRight />
                            </Button>

                            <Button
                                size="icon"
                                onClick={() =>
                                    navigate(paginationObj.last_page_url)
                                }
                                disabled={
                                    paginationObj.current_page ===
                                    paginationObj.last_page
                                }
                            >
                                <ChevronLast />
                            </Button>
                        </div>
                    )}
            </div>

            <AlertErrorDialog
                open={errorDialogOpen}
                onOpenChange={setErrorDialogOpen}
                error={errorMessage}
            />
        </>
    );
}
