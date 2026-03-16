import type { ColumnDef } from '@tanstack/react-table';
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
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
import { columns } from './columns';
import type { Ppmp } from '@/pages/types/types';
import { getCommonPinningStyles } from '@/pages/utils/column-pinning-styles';

interface PpmpTableProps {
    ppmpItems: Ppmp[];
    onDelete: (item: Ppmp) => void;
}

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    onDelete: (item: TData) => void;
}

export default function PpmpTable({ ppmpItems, onDelete }: PpmpTableProps) {
    return (
        <div>
            <DataTable<Ppmp, unknown>
                columns={columns}
                data={ppmpItems}
                onDelete={onDelete}
            />
        </div>
    );
}

export function DataTable<TData, TValue>({
    columns,
    data,
    onDelete,
}: DataTableProps<TData, TValue>) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        initialState: {
            columnPinning: {
                right: ['actions'],
            },
        },
        enableColumnPinning: true,
        columnResizeMode: 'onChange',
        meta: {
            onDelete: (item: TData) => onDelete(item),
        },
    });

    return (
        // <div className="overflow-hidden rounded-md border">
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
                                        style={{
                                            ...getCommonPinningStyles(column),
                                            width: header.getSize(),
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
                                );
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
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
                                No PPMP items found.
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
                                              header.column.columnDef.footer,
                                              header.getContext(),
                                          )}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableFooter>
            </Table>
        </div>
    );
}
