import {
    type ReactElement,
    type CSSProperties,
    useState,
    useRef,
    useMemo,
    useEffect,
} from 'react';
import {
    type Row,
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
} from 'lucide-react';
// needed for table body level scope DnD setup
import {
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    closestCenter,
    type DragEndEvent,
    type UniqueIdentifier,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

// needed for row & cell level scope DnD setup
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { PaginatedResponse } from '@/types/global';

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

    paginationObj?: PaginatedResponse<TData>;

    meta?: any;
}

const reorderTree = (data: any[], activeId: string, overId: string): any[] => {
    // 1. Check if the items are in the current level
    const activeIndex = data.findIndex(
        (item) => item.id.toString() === activeId,
    );
    const overIndex = data.findIndex((item) => item.id.toString() === overId);

    if (activeIndex !== -1 && overIndex !== -1) {
        return arrayMove(data, activeIndex, overIndex);
    }

    // 2. If not found, recurse into children
    return data.map((item) => {
        if (item.children && item.children.length > 0) {
            return {
                ...item,
                children: reorderTree(item.children, activeId, overId),
            };
        }
        return item;
    });
};

export function DataTable<TData extends { id: unknown }>({
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
    negativeHeight = 8,
    onReorder,
    onMove,
    onShowChildren,
    meta,
    paginationObj,
    filters,
}: DataTableProps<TData>) {
    const [localData, setLocalData] = useState(data);
    const [errorDialogOpen, setErrorDialogOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // for global search
    const [searchValue, setSearchValue] = useState(filters.search || '');

    // 2. Sync local state with props (if URL changes via browser back/forward)
    useEffect(() => {
        setSearchValue(filters.search || '');
    }, [filters.search]);

    // 3. Debounce and Trigger Inertia
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            // Only trigger if the value is actually different from the URL state
            if (searchValue !== (filters.search || '')) {
                router.get(
                    window.location.pathname,
                    {
                        ...filters, // preserve other filters (like category, date, etc)
                        search: searchValue,
                        page: 1,
                    },
                    {
                        preserveState: true,
                        replace: true,
                        preserveScroll: true, // Crucial for UX in tables
                        only: ['ppaTree', 'filters'],
                    },
                );
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchValue]);

    useEffect(() => {
        setLocalData(data);
    }, [data]);

    const [globalFilter, setGlobalFilter] = useState('');

    // 1. Setup the ref for ScrollArea
    const tableContainerRef = useRef<HTMLDivElement>(null);

    const table = useReactTable({
        data: localData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        initialState: {
            columnPinning: { right: ['action'] },
        },

        // SERVER-SIDE SEARCH CONFIG
        manualFiltering: true,
        // onGlobalFilterChange: setSearchValue,

        getFilteredRowModel: withSearch ? getFilteredRowModel() : undefined,
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
            meta,
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
                pageIndex: paginationObj?.current_page
                    ? paginationObj.current_page - 1
                    : 0,
                pageSize: paginationObj?.per_page ?? 0,
            },
        },

        // for dnd
        getRowId: (row) => row.id?.toString() ?? '',

        // for pagination
        manualPagination: true,
        pageCount: paginationObj ? paginationObj.last_page : undefined,
    });

    const { rows } = table.getRowModel();

    const dataIds = useMemo<UniqueIdentifier[]>(
        () => rows.map((row) => row.id?.toString() ?? ''),
        [rows],
    );

    // 2. Setup Virtualizer
    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        // This is the "magic" line that finds the actual scrolling div inside ScrollArea
        getScrollElement: () =>
            tableContainerRef.current?.querySelector(
                '[data-radix-scroll-area-viewport]',
            ) as HTMLElement,
        estimateSize: () => 50, // Match your typical row height
        overscan: 10,
        getItemKey: (index) => rows[index]?.id,
        measureElement: (el) => el.getBoundingClientRect().height,
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

    const sensors = useSensors(
        useSensor(MouseSensor, {}),
        useSensor(TouchSensor, {}),
        useSensor(KeyboardSensor, {}),
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (active && over && active.id !== over.id) {
            const activeId = active.id.toString();
            const overId = over.id.toString();

            // Find the objects in your flat 'rows' list
            const activeRow = rows.find((r) => r.id === active.id);
            const overRow = rows.find((r) => r.id === over.id);

            if (!activeRow || !overRow) return;

            // LOGIC CHECK: Are they siblings?
            // In your PPA data, siblings share the same parent_id
            if (
                (activeRow.original as any).parent_id !==
                (overRow.original as any).parent_id
            ) {
                setErrorMessage('Moving between levels is not supported');
                setErrorDialogOpen(true);
                return;
            }

            const updatedData = reorderTree([...localData], activeId, overId);
            setLocalData(updatedData);

            // Call the backend
            onReorder?.(activeId, overId);
        }
    }

    return (
        <>
            <div className="flex flex-col gap-4">
                {(withSearch || children) && (
                    <div className="flex items-center justify-between gap-4">
                        {withSearch ? (
                            <Input
                                placeholder="Filter..."
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                className="max-w-sm"
                            />
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
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        modifiers={[restrictToVerticalAxis]}
                        onDragEnd={handleDragEnd} // We'll write this in Phase 3
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
                                                          header.column
                                                              .columnDef.header,
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

                                <SortableContext
                                    items={dataIds}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {virtualRows.length > 0 ? (
                                        virtualRows.map((virtualRow) => {
                                            const row = rows[virtualRow.index];

                                            return (
                                                <DraggableRow
                                                    // key={row.id}
                                                    key={
                                                        (row.original as any)
                                                            .current_fs?.id
                                                            ? `${row.id}-${(row.original as any).current_fs.id}`
                                                            : `${row.id}-${row.index}`
                                                    }
                                                    row={row}
                                                    table={table}
                                                    withRowSpan={withRowSpan}
                                                    rowVirtualizer={
                                                        rowVirtualizer
                                                    }
                                                />
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
                                </SortableContext>

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
                                        {table
                                            .getAllLeafColumns()
                                            .map((column) => (
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
                                                              column.columnDef
                                                                  .footer,
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
                    </DndContext>

                    <ScrollBar orientation="horizontal" className="z-30" />
                    <ScrollBar orientation="vertical" className="z-30" />
                </ScrollArea>

                {paginationObj === undefined || (
                    <div className="flex items-center gap-1">
                        <Button
                            size="icon"
                            onClick={() =>
                                router.get(paginationObj.first_page_url)
                            }
                            disabled={paginationObj?.current_page === 1}
                        >
                            <ChevronFirst />
                        </Button>
                        <Button
                            size="icon"
                            onClick={() =>
                                router.get(paginationObj.prev_page_url ?? '')
                            }
                            disabled={paginationObj?.current_page === 1}
                        >
                            <ChevronLeft />
                        </Button>
                        <Input
                            defaultValue={paginationObj?.current_page}
                            disabled
                            className="w-10 text-center"
                        />
                        <Button
                            size="icon"
                            onClick={() =>
                                router.get(paginationObj.next_page_url ?? '')
                            }
                            disabled={
                                paginationObj?.current_page ===
                                paginationObj?.last_page
                            }
                        >
                            <ChevronRight />
                        </Button>
                        <Button
                            size="icon"
                            onClick={() =>
                                router.get(paginationObj.last_page_url)
                            }
                            disabled={
                                paginationObj?.current_page ===
                                paginationObj?.last_page
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

interface DraggableRowProps<TData> {
    row: Row<TData>;
    table: any;
    withRowSpan?: boolean;
    rowVirtualizer: any;
}

const DraggableRow = <TData,>({
    row,
    withRowSpan,
    table,
    rowVirtualizer,
}: DraggableRowProps<TData>) => {
    const { transform, transition, setNodeRef, isDragging } = useSortable({
        id: row.id,
    });

    const style: CSSProperties = {
        transform: CSS.Translate.toString(transform), //let dnd-kit do its thing
        transition: transition,
        opacity: isDragging ? 0.4 : 1,
        // zIndex: isDragging ? 10 : 0,
        position: 'relative',
        minHeight: '50px', // LOCK: Must match estimateSize exactly
    };

    return (
        <TableRow
            // key={row.id}
            ref={(node) => {
                setNodeRef(node); // Connect dnd-kit
                if (node) {
                    rowVirtualizer.measureElement(node); // Connect virtualizer measurement
                }
            }}
            // style={style}
            style={style}
            data-state={row.getIsSelected() && 'selected'}
            data-index={row.index}
            className="group transition-colors data-[state=selected]:bg-muted"
        >
            {row.getVisibleCells().map((cell) => {
                const columnMeta = cell.column.columnDef.meta as any;
                const isSpannedCol = withRowSpan && columnMeta?.rowSpan;
                const rowData = row.original as any;
                const hasSpanningData =
                    typeof rowData.isFirstInGroup !== 'undefined';
                const activeSpan = isSpannedCol && hasSpanningData;

                if (activeSpan && !rowData.isFirstInGroup) {
                    return null;
                }

                return (
                    <TableCell
                        key={cell.id}
                        rowSpan={activeSpan ? rowData.groupSize : 1}
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
                        {/* <div className="flex h-[50px] items-center truncate overflow-hidden whitespace-nowrap"> */}
                        {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                        )}
                        {/* </div> */}
                    </TableCell>
                );
            })}
        </TableRow>
    );
};
