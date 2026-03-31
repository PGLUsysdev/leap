import { createColumnHelper } from '@tanstack/react-table';
// import type { User } from '@/types/global';
import { Button } from '@/components/ui/button';

export interface Employee {
    id: number;
    name: string;
    role: string;
    department: string;
    email: string;
    status: 'Active' | 'Inactive' | 'On Leave';
    years_tenure: number;
}

const columnHelper = createColumnHelper<Employee>();

const columns = [
    columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => {
            return <div className="text-warp">{info.getValue()}</div>;
        },
    }),
    columnHelper.accessor('role', {
        header: 'Role',
        cell: (info) => {
            return <div className="text-warp">{info.getValue()}</div>;
        },
    }),
    columnHelper.accessor('department', {
        header: 'Department',
        cell: (info) => {
            return <div className="text-warp">{info.getValue()}</div>;
        },
    }),
    columnHelper.accessor('email', {
        header: 'Email',
        cell: (info) => {
            return <div className="text-warp">{info.getValue()}</div>;
        },
    }),
    columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
            return <div className="text-warp">{info.getValue()}</div>;
        },
    }),
    columnHelper.accessor('years_tenure', {
        header: 'Years Tenure',
        cell: (info) => {
            return <div className="text-warp">{info.getValue()}</div>;
        },
    }),
    columnHelper.display({
        id: 'action',
        header: 'Action',
        size: 80,
        cell: () => {
            return (
                <div>
                    <Button size="icon">A</Button>
                    <Button size="icon">E</Button>
                    <Button size="icon">D</Button>
                </div>
            );
        },
    }),
];

export default columns;
