import { DataTable } from '@/components/data-table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { Ios, PaginatedResponse } from '@/types/global';
import columns from './columns/columns';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'IOS', href: '#' }];

interface IosPageProps {
    ios: PaginatedResponse<Ios>;
}

export default function IosPage({ ios }: IosPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="pt-4">
                <DataTable
                    columns={columns}
                    data={ios.data}
                    paginationObj={ios}
                    withSearch={true}
                    negativeHeight={10.8}
                />
            </div>
        </AppLayout>
    );
}
