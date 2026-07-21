import { createColumnHelper } from '@tanstack/react-table';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/base-ui-components/ui/button';
import type { User } from '@/types';

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
        size: 300,
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
    columnHelper.accessor('role.name', {
        header: 'Role',
        size: 150,
        cell: (info) => {
            return <div className="text-wrap">{info.getValue() ?? '-'}</div>;
        },
    }),
    columnHelper.accessor('position', {
        header: 'Assigned Position',
        size: 250,
        cell: (info) => {
            const position = info.getValue();

            if (!position) {
                return '-';
            }

            return (
                <div className="text-wrap">
                    {position.item_number}
                    {position.ios ? ` — ${position.ios.class}` : ''}
                </div>
            );
        },
    }),
    columnHelper.accessor('step', {
        header: 'Step',
        size: 80,
        cell: (info) => {
            const step = info.getValue();

            return <div className="text-wrap">{step ?? '-'}</div>;
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
        id: 'actions',
        size: 48,
        cell: ({ row, table }) => {
            const meta = table.options.meta as
                | {
                      editAll?: boolean;
                      editOwn?: boolean;
                      userOfficeId?: number | null;
                      onEdit?: (user: User) => void;
                  }
                | undefined;
            const editAll = meta?.editAll ?? false;
            const editOwn = meta?.editOwn ?? false;
            const userOfficeId = meta?.userOfficeId ?? null;
            const canEditRow =
                editAll || (editOwn && row.original.office_id === userOfficeId);

            if (!canEditRow) {
                return null;
            }

            return (
                <div>
                    <Button
                        size="icon"
                        variant="outline"
                        onClick={() => meta?.onEdit?.(row.original)}
                    >
                        <Pencil />
                    </Button>
                </div>
            );
        },
    }),
];

export default columns;
