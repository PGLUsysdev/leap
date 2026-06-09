import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { DataTable } from '@/components/data-table';
import columns from './columns/cc-sub-sector-cols';
import type { CcSubSector } from '@/types/global';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'CC Sub Sectors', href: '#' }];

interface CcSubSectorPageProps {
    subSectors: CcSubSector[];
}

export default function CcSubSectorPage({
    subSectors,
}: CcSubSectorPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="pt-4">
                <DataTable
                    columns={columns}
                    data={subSectors}
                    withSearch
                    negativeHeight={7}
                />
            </div>
        </AppLayout>
    );
}
