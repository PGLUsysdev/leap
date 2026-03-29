import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import FormDialog from '@/pages/aip/form-dialog';
import { type BreadcrumbItem } from '@/types';
import type { FiscalYear, FiscalYearStatus } from '@/types/global';
import FiscalYearTablePage from './table/page';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

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
    const [openFormDialog, setOpenFormDialog] = useState(false);

    function onUpdateStatus(data: FiscalYear, status: FiscalYearStatus) {
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

    function handleOpenAipSummary(data: FiscalYear) {
        router.get(`/aip/${data.id}/summary`);
    }

    function handleOpenFormDialog() {
        setOpenFormDialog(true);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="p-4">
                <FiscalYearTablePage
                    data={fiscalYears}
                    // onEdit={onEdit}
                    // onDelete={onDelete}
                    onUpdateStatus={onUpdateStatus}
                    onOpen={handleOpenAipSummary}
                >
                    <Button onClick={handleOpenFormDialog}>
                        Initialize AIP
                    </Button>
                </FiscalYearTablePage>
            </div>

            <FormDialog open={openFormDialog} setOpen={setOpenFormDialog} />
        </AppLayout>
    );
}
