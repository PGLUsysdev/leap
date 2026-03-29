import AppLayout from '@/layouts/app-layout';
import FiscalYearFormDialog from '@/pages/aip/fiscal-year-form-dialog';
import { type BreadcrumbItem } from '@/types';
import type { FiscalYear, FiscalYearStatus } from '@/types/global';
import FiscalYearTablePage from './table/page';
import { router } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Annual Investment Programs',
        // href: index().url,
        href: '#',
    },
];

interface AipProps {
    fiscalYears: FiscalYear[];
}

export default function AipPage({ fiscalYears }: AipProps) {
    console.log(fiscalYears);

    function onUpdateStatus(data: FiscalYear, status: FiscalYearStatus) {
        console.log(data);
        console.log(status);

        router.patch(
            `/aip/${data.id}/status`,
            { status: status },
            {
                preserveScroll: true,
                onSuccess: () => {
                    console.log('Status updated successfully');
                },
                onError: (errors) => {
                    console.error('Failed to update status', errors);
                },
            },
        );
    }

    function onOpen(data: FiscalYear) {
        router.get(`/aip/${data.id}/summary`);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="p-4">
                <FiscalYearTablePage
                    data={fiscalYears}
                    // onEdit={onEdit}
                    // onDelete={onDelete}
                    onUpdateStatus={onUpdateStatus}
                    onOpen={onOpen}
                >
                    <FiscalYearFormDialog />
                </FiscalYearTablePage>
            </div>
        </AppLayout>
    );
}
