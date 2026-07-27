import { createColumnHelper } from '@tanstack/react-table';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/base-ui-components/ui/button';
import type { User } from '@/types';

const columnHelper = createColumnHelper<User>();

const columns = [
    columnHelper.accessor('name', {
        size: 200,
        header: () => <div className="px-1">Name</div>,
        cell: (info) => <div className="px-1 text-wrap">{info.getValue()}</div>,
    }),
    columnHelper.accessor('email', {
        size: 250,
        header: () => <div className="px-1">Email</div>,
        cell: (info) => <div className="px-1 text-wrap">{info.getValue()}</div>,
    }),
    columnHelper.accessor('office.name', {
        size: 300,
        header: () => <div className="px-1">Department / Office</div>,
        cell: (info) => <div className="px-1 text-wrap">{info.getValue()}</div>,
    }),
    columnHelper.accessor('role.name', {
        size: 100,
        header: () => <div className="px-1">Role</div>,
        cell: (info) => (
            <div className="px-1 text-wrap">{info.getValue() ?? '-'}</div>
        ),
    }),
    columnHelper.accessor('position', {
        size: 200,
        header: () => <div className="px-1">Assigned Position</div>,
        cell: (info) => {
            const position = info.getValue();

            if (!position) {
                return <div className="px-1 text-wrap">-</div>;
            }

            return (
                <div className="px-1 text-wrap">
                    {position.item_number}
                    {position.ios ? ` — ${position.ios.class}` : ''}
                </div>
            );
        },
    }),
    columnHelper.accessor('step', {
        size: 100,
        header: () => <div className="px-1">Step</div>,
        cell: (info) => {
            const step = info.getValue();

            return <div className="px-1 text-wrap">{step ?? '-'}</div>;
        },
    }),
    columnHelper.accessor('status', {
        size: 100,
        header: () => <div className="px-1">Status</div>,
        cell: (info) => <div className="px-1 text-wrap">{info.getValue()}</div>,
    }),
    columnHelper.display({
        id: 'actions',
        size: 46,
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

            return (
                <div>
                    <Button
                        size="icon"
                        variant="outline"
                        disabled={!canEditRow}
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
