import { createColumnHelper } from '@tanstack/react-table';
import { Pencil, ExternalLink, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FiscalYear } from '@/types/global';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { RowData } from '@tanstack/react-table';

declare module '@tanstack/react-table' {
    interface TableMeta<TData extends RowData> {
        onEdit?: (data: TData) => void;
        onDelete?: (data: TData) => void;

        onAdd?: (
            data: TData,
            type?: 'Program' | 'Project' | 'Activity' | 'Sub-Activity',
        ) => void;
        onUpdateStatus?: (
            data: TData,
            status: 'active' | 'inactive' | 'closed',
        ) => void;
        onOpen?: (data: TData) => void;
        onGeneratePdf?: (data: TData) => void;
        onOpenPpmpSummary?: (data: TData) => void;
    }
}

const columnHelper = createColumnHelper<FiscalYear>();

const columns = [
    columnHelper.accessor('year', {
        header: 'Fiscal Year',
        cell: (value) => <span className="text-wrap">{value.getValue()}</span>,
    }),
    columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
            const status = info.getValue(); // 'active' | 'inactive' | 'closed'

            const STATUS_MAP = {
                active: { label: 'Active', variant: 'default' as const },
                inactive: { label: 'Inactive', variant: 'secondary' as const },
                closed: { label: 'Closed', variant: 'outline' as const },
            } as const;

            const config = STATUS_MAP[status] || {
                label: status,
                variant: 'secondary',
            };

            return (
                <Badge variant={config.variant} className="capitalize">
                    {config.label}
                </Badge>
            );
        },
    }),
    columnHelper.accessor('created_at', {
        header: 'Created At',
        // size: 500,
        cell: (info) => {
            const rawValue = info.getValue();
            const date = new Date(String(rawValue));
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });

            return <span className="text-wrap">{formattedDate}</span>;
        },
    }),
    columnHelper.accessor('updated_at', {
        header: 'Updated At',
        // size: 300,
        cell: (info) => {
            const rawValue = info.getValue();
            const date = new Date(String(rawValue));
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });

            return <span className="text-wrap">{formattedDate}</span>;
        },
    }),
    columnHelper.display({
        id: 'action',
        size: 154,
        cell: ({ row, table }) => {
            const initialStatus = row.original.status;

            return (
                <div className="flex items-center gap-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                size="icon"
                                title="Change AIP status"
                                onClick={() =>
                                    table.options.meta?.onEdit?.(row.original)
                                }
                            >
                                <Pencil />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>
                                    Change AIP Status
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() =>
                                        table.options.meta?.onUpdateStatus?.(
                                            row.original,
                                            'active',
                                        )
                                    }
                                    disabled={initialStatus === 'active'}
                                >
                                    Active
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        table.options.meta?.onUpdateStatus?.(
                                            row.original,
                                            'inactive',
                                        )
                                    }
                                    disabled={initialStatus === 'inactive'}
                                >
                                    Inactive
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        table.options.meta?.onUpdateStatus?.(
                                            row.original,
                                            'closed',
                                        )
                                    }
                                    disabled={initialStatus === 'closed'}
                                >
                                    Closed
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        size="icon"
                        title="Open AIP"
                        onClick={() =>
                            table.options.meta?.onOpen?.(row.original)
                        }
                    >
                        <ExternalLink />
                    </Button>

                    <Button
                        title="Generate APP"
                        size="icon"
                        onClick={() => {
                            table.options.meta?.onGeneratePdf?.(row.original);
                        }}
                    >
                        <FileText />
                    </Button>

                    <Button
                        title="Open PPMP Summary"
                        size="icon"
                        onClick={() => {
                            table.options.meta?.onOpenPpmpSummary?.(
                                row.original,
                            );
                        }}
                    >
                        <ExternalLink />
                    </Button>
                </div>
            );
        },
    }),
];

export default columns;
