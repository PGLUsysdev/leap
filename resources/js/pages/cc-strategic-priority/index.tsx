import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { DataTable } from '@/components/data-table';
import columns from './columns/cc-strategic-priority-cols';
import type { CcStrategicPriority } from '@/types/global';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'CC Strategic Priorities', href: '#' },
];

interface CcStrategicPriorityPageProps {
    strategicPriorities: CcStrategicPriority[];
}

export default function CcStrategicPriorityPage({
    strategicPriorities,
}: CcStrategicPriorityPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="pt-4">
                <DataTable
                    columns={columns}
                    data={strategicPriorities}
                    withSearch
                    negativeHeight={7}
                />
            </div>
        </AppLayout>
    );
}
