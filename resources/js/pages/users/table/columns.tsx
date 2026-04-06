import { createColumnHelper } from '@tanstack/react-table';
import type { User } from '@/types/global';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

const columnHelper = createColumnHelper<User>();

const columns = [
    columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => {
            return <div className="text-wrap">{info.getValue()}</div>;
        },
    }),
    columnHelper.accessor('email', {
        header: 'Email',
        cell: (info) => {
            return <div className="text-wrap">{info.getValue()}</div>;
        },
    }),
    columnHelper.accessor('office.name', {
        header: 'Department / Office',
        size: 300,
        cell: (info) => {
            return <div className="text-wrap">{info.getValue()}</div>;
        },
    }),
    columnHelper.accessor('status', {
        header: 'Status',
        size: 100,
        cell: (info) => {
            return <div className="text-wrap">{info.getValue()}</div>;
        },
    }),
    columnHelper.display({
        id: 'action',
        size: 22,
        cell: ({ row, table }) => {
            return (
                <div>
                    <Button
                        size="icon"
                        onClick={() =>
                            table.options.meta?.onEdit?.(row.original)
                        }
                    >
                        <Pencil />
                    </Button>
                </div>
            );
        },
    }),
];

export default columns;
