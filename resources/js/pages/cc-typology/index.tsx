import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { DataTable } from '@/components/data-table';
import columns from './columns/cc-typology-cols';
import type { CcTypology } from '@/types/global';
import { Button } from '@/components/ui/button';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'CC Typology', href: '#' }];

interface CcTypologyPageProps {
    ccTypologies: CcTypology[];
}

export default function CcTypologyPage({ ccTypologies }: CcTypologyPageProps) {
    console.log(ccTypologies);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="pt-4">
                <DataTable
                    columns={columns}
                    data={ccTypologies}
                    withSearch
                    negativeHeight={7}
                >
                    <Button>Create CC Typology</Button>
                </DataTable>
            </div>
        </AppLayout>
    );
}
