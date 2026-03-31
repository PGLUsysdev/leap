import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { User, Ppa } from '@/types/global';

import { DataTable } from '@/components/data-table';

import columns from './data-table/columns';
import twoColumns from './data-table-two/columns';
import threeColumns from './data-table-three/columns';
import AipSummaryCols from './aip-summary-cols/columns';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Users', href: '#' }];

interface UsersIndexProps {
    users: User[];
    ppas: Ppa[];
    aipEntries: Ppa[];
}

export interface Employee {
    id: number;
    name: string;
    role: string;
    department: string;
    email: string;
    status: 'Active' | 'Inactive' | 'On Leave';
    years_tenure: number;
}

const dataTwo: Employee[] = [
    {
        id: 1,
        name: 'Alice Johnson',
        role: 'Software Engineer',
        department: 'Engineering',
        email: 'alice.j@company.com',
        status: 'Active',
        years_tenure: 4,
    },
    {
        id: 2,
        name: 'Marcus Chen',
        role: 'Product Designer',
        department: 'Design',
        email: 'm.chen@company.com',
        status: 'On Leave',
        years_tenure: 2,
    },
    {
        id: 3,
        name: 'Sarah Smith',
        role: 'Operations Manager',
        department: 'Management',
        email: 's.smith@company.com',
        status: 'Active',
        years_tenure: 7,
    },
    {
        id: 4,
        name: 'Leo Rodriguez',
        role: 'Data Analyst',
        department: 'Engineering',
        email: 'l.rod@company.com',
        status: 'Inactive',
        years_tenure: 1,
    },
];

export default function UsersIndex({
    users,
    ppas,
    aipEntries,
}: UsersIndexProps) {
    console.log({ users, ppas });

    const flattenAipEntries = (aipEntries: Ppa[], depth = 0) => {
        const rows: any[] = [];

        aipEntries.forEach((aipEntry) => {
            const sources = aipEntry.ppa_funding_sources || [];
            const rowCount = Math.max(sources.length, 1);

            if (sources.length === 0) {
                rows.push({
                    ...aipEntry,
                    current_fs: null,
                    isFirstInGroup: true,
                    groupSize: 1,
                    depth,
                });
            } else {
                sources.forEach((fs, index) => {
                    rows.push({
                        ...aipEntry,
                        current_fs: fs,
                        isFirstInGroup: index === 0,
                        groupSize: rowCount,
                        depth,
                    });
                });
            }

            if (aipEntry.children && aipEntry.children.length > 0) {
                rows.push(...flattenAipEntries(aipEntry.children, depth + 1));
            }
        });

        return rows;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex flex-col gap-4 p-4">
                <DataTable columns={columns} data={users} withSearch={true}>
                    <div>e</div>
                </DataTable>

                <DataTable
                    columns={twoColumns}
                    data={dataTwo}
                    withSearch={true}
                />

                <DataTable
                    columns={threeColumns}
                    data={ppas}
                    withSearch={true}
                />

                <DataTable
                    columns={AipSummaryCols}
                    data={flattenAipEntries(aipEntries)}
                    withSearch={true}
                />
            </div>
        </AppLayout>
    );
}
