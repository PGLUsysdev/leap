import { createColumnHelper } from '@tanstack/react-table';
import { Pencil, ExternalLink, FileText } from 'lucide-react';
import { Badge } from '@/components/base-ui-components/ui/badge';
import { Button } from '@/components/base-ui-components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/base-ui-components/ui/dropdown-menu';
import type { FiscalYear } from '@/types';

const columnHelper = createColumnHelper<FiscalYear>();

const columns = [
    columnHelper.accessor('year', {
        header: () => <div className="px-1">Fiscal Year</div>,
        size: 150,
        cell: (info) => <div className="px-1 text-wrap">{info.getValue()}</div>,
    }),
    columnHelper.accessor('status', {
        header: () => <div className="px-1">Status</div>,
        size: 150,
        cell: (info) => {
            const status = info.getValue();

            const STATUS_MAP = {
                draft: { label: 'Draft', variant: 'secondary' as const },
                open: { label: 'Open', variant: 'default' as const },
                locked: { label: 'Locked', variant: 'outline' as const },
                archived: {
                    label: 'Archived',
                    variant: 'outline' as const,
                },
            } as const;

            const config = STATUS_MAP[status] || {
                label: status,
                variant: 'secondary',
            };

            return (
                <div className="text-warp px-1">
                    <Badge variant={config.variant} className="capitalize">
                        {config.label}
                    </Badge>
                </div>
            );
        },
    }),
    columnHelper.accessor('created_at', {
        header: () => <div className="px-1">Created At</div>,
        size: 200,
        cell: (info) => {
            const rawValue = info.getValue();
            const date = new Date(String(rawValue));
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });

            return <div className="px-1 text-wrap">{formattedDate}</div>;
        },
    }),
    columnHelper.accessor('updated_at', {
        header: () => <div className="px-1">Updated At</div>,
        size: 200,
        cell: (info) => {
            const rawValue = info.getValue();
            const date = new Date(String(rawValue));
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });

            return <div className="px-1 text-wrap">{formattedDate}</div>;
        },
    }),
    columnHelper.display({
        id: 'actions',
        size: 154,
        cell: ({ row, table }) => {
            const initialStatus = row.original.status;

            return (
                <div className="flex items-center gap-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                title="Change AIP status"
                                disabled={!table.options.meta?.canUpdateStatus}
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
                                            'draft',
                                        )
                                    }
                                    disabled={initialStatus === 'draft'}
                                >
                                    Draft
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        table.options.meta?.onUpdateStatus?.(
                                            row.original,
                                            'open',
                                        )
                                    }
                                    disabled={initialStatus === 'open'}
                                >
                                    Open
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        table.options.meta?.onUpdateStatus?.(
                                            row.original,
                                            'locked',
                                        )
                                    }
                                    disabled={initialStatus === 'locked'}
                                >
                                    Locked
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        table.options.meta?.onUpdateStatus?.(
                                            row.original,
                                            'archived',
                                        )
                                    }
                                    disabled={initialStatus === 'archived'}
                                >
                                    Archived
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        variant="outline"
                        title="Generate APP"
                        size="icon"
                        disabled={!table.options.meta?.canGenerateApp}
                        onClick={() => {
                            table.options.meta?.onGeneratePdf?.(row.original);
                        }}
                    >
                        <FileText />
                    </Button>

                    <Button
                        variant="outline"
                        size="icon"
                        title="Open AIP"
                        disabled={
                            !table.options.meta?.canOpenAip ||
                            table.options.meta?.disableOpenAip
                        }
                        onClick={() =>
                            table.options.meta?.onOpen?.(row.original)
                        }
                    >
                        <ExternalLink />
                    </Button>

                    <Button
                        variant="outline"
                        title="Open PPMP Summary"
                        size="icon"
                        disabled={!table.options.meta?.canOpenPpmpSummary}
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
