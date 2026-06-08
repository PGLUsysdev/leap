import { createColumnHelper } from '@tanstack/react-table';
import type { User } from '@/types/global';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

const columnHelper = createColumnHelper<User>();

interface ColumnsOptions {
    editAll: boolean;
    editOwn: boolean;
    userOfficeId: number | null;
}

const columns = ({ editAll, editOwn, userOfficeId }: ColumnsOptions) => {
    const cols = [
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
                return (
                    <div className="text-wrap">{info.getValue() ?? '-'}</div>
                );
            },
        }),
        columnHelper.accessor('status', {
            header: 'Status',
            size: 100,
            cell: (info) => {
                return <div className="text-wrap">{info.getValue()}</div>;
            },
        }),
    ];

    if (editAll || editOwn) {
        cols.push(
            columnHelper.display({
                id: 'action',
                size: 48,
                cell: ({ row, table }) => {
                    const canEditRow =
                        editAll ||
                        (editOwn && row.original.office_id === userOfficeId);
                    if (!canEditRow) return null;
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
        );
    }

    return cols;
};

export default columns;
