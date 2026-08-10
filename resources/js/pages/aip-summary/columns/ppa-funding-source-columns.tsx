import { createColumnHelper } from '@tanstack/react-table';
import { Trash, List, UserRound, Landmark, Construction } from 'lucide-react';
import { Button } from '@/components/base-ui-components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/base-ui-components/ui/dropdown-menu';
import type { PpaFundingSource } from '@/types';

const columnHelper = createColumnHelper<PpaFundingSource>();

const columns = [
    columnHelper.accessor('funding_source.code', {
        size: 100,
        header: () => (
            <div className="text-center text-wrap">Funding Source</div>
        ),
        cell: (info) => (
            <div className="text-center text-wrap">{info.getValue()}</div>
        ),
    }),
    columnHelper.accessor('ps_amount', {
        size: 100,
        header: () => (
            <div className="text-center text-wrap">Personal Services (PS)</div>
        ),
        cell: (info) => (
            <div className="text-center text-wrap">{info.getValue()}</div>
        ),
    }),
    columnHelper.accessor('mooe_amount', {
        size: 100,
        header: () => (
            <div className="text-center text-wrap">
                Maintenance & Other Operating Expenses (MOOE)
            </div>
        ),
        cell: (info) => (
            <div className="text-center text-wrap">{info.getValue()}</div>
        ),
    }),
    columnHelper.accessor('fe_amount', {
        size: 100,
        header: () => (
            <div className="text-center text-wrap">Financial Expenses (FE)</div>
        ),
        cell: (info) => (
            <div className="text-center text-wrap">{info.getValue()}</div>
        ),
    }),
    columnHelper.accessor('co_amount', {
        size: 100,
        header: () => (
            <div className="text-center text-wrap">Capital Outlay (CO)</div>
        ),
        cell: (info) => (
            <div className="text-center text-wrap">{info.getValue()}</div>
        ),
    }),
    columnHelper.display({
        id: 'total',
        size: 100,
        header: () => <div className="text-center text-wrap">Total</div>,
        cell: () => <div className="text-center text-wrap">-</div>,
    }),
    columnHelper.accessor('ccet_adaptation', {
        size: 100,
        header: () => (
            <div className="text-center text-wrap">
                Climate Change Adaptation
            </div>
        ),
        cell: (info) => (
            <div className="text-center text-wrap">{info.getValue()}</div>
        ),
    }),
    columnHelper.accessor('ccet_mitigation', {
        size: 100,
        header: () => (
            <div className="text-center text-wrap">
                Climate Change Mitigation
            </div>
        ),
        cell: (info) => (
            <div className="text-center text-wrap">{info.getValue()}</div>
        ),
    }),
    columnHelper.accessor('cc_typology.code', {
        size: 100,
        header: () => (
            <div className="text-center text-wrap">CC Typology Code</div>
        ),
        cell: (info) => (
            <div className="text-center text-wrap">{info.getValue()}</div>
        ),
    }),
    columnHelper.display({
        id: 'actions',
        size: 83,
        cell: ({ row, table }) => {
            const rowData = row.original;
            const meta = table.options.meta;
            const isOptimistic = (rowData as any).isOptimistic === true;

            return (
                <div className="flex gap-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={<Button size="icon" variant="outline" />}
                        >
                            <List />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-36">
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>PPMP</DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() =>
                                        meta?.onOpenPpmp?.(rowData.id, 'mooe')
                                    }
                                >
                                    <Construction />
                                    for MOOE
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        meta?.onOpenPpmp?.(rowData.id, 'co')
                                    }
                                >
                                    <Landmark />
                                    for CO
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => {
                                    console.log('to ps breakdown');
                                }}
                            >
                                <UserRound /> PS Breakdown
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => meta?.onDelete?.(rowData.id)}
                        disabled={isOptimistic || Boolean(meta?.disabled)}
                    >
                        <Trash />
                    </Button>
                </div>
            );
        },
    }),
];

export default columns;
