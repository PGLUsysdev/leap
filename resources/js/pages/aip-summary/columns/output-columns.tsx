// resources\js\pages\aip-summary\columns\output-columns.tsx

import { createColumnHelper } from "@tanstack/react-table";
import { Coins, Pencil, Trash } from "lucide-react";
import { Button } from "@/components/base-ui-components/ui/button";
import type { AipOutput } from "@/types";

const columnHelper = createColumnHelper<AipOutput>();

function formatText(value: string | null | undefined) {
    return value?.trim() ? value : <div className="text-muted-foreground">-</div>;
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);

    const month = new Intl.DateTimeFormat("en-US", {
        month: "short",
    }).format(date);

    const year = new Intl.DateTimeFormat("en-US", {
        year: "2-digit",
    }).format(date);

    return `${month}-${year}`;
}

function formatDateCell(value: string | null | undefined) {
    return value ? formatDate(value) : <div className="text-muted-foreground">-</div>;
}

const columns = [
    columnHelper.accessor("sort_order", {
        id: "sort_order",
        size: 50,
        header: () => <div className="text-center text-wrap">#</div>,
        cell: (info) => <div className="text-center tabular-nums">{info.getValue()}</div>,
    }),
    columnHelper.accessor("office.acronym", {
        id: "office",
        size: 150,
        header: () => <div className="text-center text-wrap">Office</div>,
        cell: (info) => <div className="text-center text-wrap">{formatText(info.getValue())}</div>,
    }),
    columnHelper.accessor("start_date", {
        id: "start_date",
        size: 90,
        header: () => <div className="text-center text-wrap">Start</div>,
        cell: (info) => (
            <div className="text-center text-wrap">{formatDateCell(info.getValue())}</div>
        ),
    }),
    columnHelper.accessor("end_date", {
        id: "end_date",
        size: 90,
        header: () => <div className="text-center text-wrap">End</div>,
        cell: (info) => (
            <div className="text-center text-wrap">{formatDateCell(info.getValue())}</div>
        ),
    }),
    columnHelper.accessor("expected_output", {
        id: "expected_output",
        size: 400,
        header: () => <div className="text-center text-wrap">Expected Output</div>,
        cell: (info) => <div className="text-wrap">{formatText(info.getValue())}</div>,
    }),
    columnHelper.display({
        id: "actions",
        size: 120,
        cell: ({ row, table }) => {
            const meta = table.options.meta;
            const output = row.original;

            return (
                <div className="flex items-center gap-1">
                    <Button
                        size="icon"
                        variant="outline"
                        title="Manage funding sources"
                        onClick={() => meta?.onEditFundingSources?.(output)}
                    >
                        <Coins className="h-4 w-4" />
                    </Button>

                    <Button
                        size="icon"
                        variant="outline"
                        title="Edit output details"
                        onClick={() => meta?.onEditOutput?.(output)}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>

                    <Button
                        size="icon"
                        variant="destructive"
                        title="Delete output"
                        disabled={Boolean(meta?.disabled)}
                        onClick={() => meta?.onDeleteOutput?.(output)}
                    >
                        <Trash />
                    </Button>
                </div>
            );
        },
    }),
];

export default columns;
