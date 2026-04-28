import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import FormDialog from '@/pages/aip/form-dialog';
import { type BreadcrumbItem } from '@/types';
import type {
    FiscalYear,
    FiscalYearStatus,
    App,
    Office,
    SharedData,
} from '@/types/global';
import { router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table';
import columns from './table/columns';
import PdfPreviewDialog from './pdf-preview-dialog';
import { index } from '@/routes/ppmp-summaries';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Annual Investment Programs',
        href: '#',
    },
];

interface AipProps {
    fiscalYears: FiscalYear[];
    app: App[];
    offices: Office[];
}

export default function AipPage({ fiscalYears, app, offices = [] }: AipProps) {
    const { auth } = usePage<SharedData>().props;

    const [openFormDialog, setOpenFormDialog] = useState(false);
    const [openPdfPreviewDialog, setOpenPdfPreviewDialog] = useState(false);
    const [selectedYear, setSelectedYear] = useState<FiscalYear | null>(null);

    // Standard Handlers (Ensure these exist if DataTable uses them)
    function onUpdateStatus(data: FiscalYear, status: FiscalYearStatus) {
        router.patch(
            `/aip/${data.id}/status`,
            { status },
            { preserveScroll: true },
        );
    }

    function handleOpenAipSummary(data: FiscalYear) {
        router.get(`/aip/${data.id}/summary`);
    }

    function handleOpenFormDialog() {
        setOpenFormDialog(true);
    }

    // Trigger PDF generation
    // This loads the initial data (Consolidated for BACSU, Office-only for others)
    function handleGeneratePdf(selectedYearId: FiscalYear) {
        setSelectedYear(selectedYearId);

        router.reload({
            only: ['app'],
            data: { fiscal_year_id: selectedYearId.id },
            onSuccess: () => setOpenPdfPreviewDialog(true),
        });
    }

    function handleOpenPpmpSummary(data: FiscalYear) {
        // finalized redirecting route
        router.visit(index({ fiscalYear: data.id }));
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="p-4">
                <DataTable
                    columns={columns}
                    data={fiscalYears}
                    onUpdateStatus={onUpdateStatus}
                    onOpen={handleOpenAipSummary}
                    onGeneratePdf={handleGeneratePdf}
                    onOpenPpmpSummary={handleOpenPpmpSummary}
                    withSearch={true}
                >
                    <Button onClick={handleOpenFormDialog}>
                        Initialize AIP
                    </Button>
                </DataTable>
            </div>

            <FormDialog open={openFormDialog} setOpen={setOpenFormDialog} />

            <PdfPreviewDialog
                open={openPdfPreviewDialog}
                onOpenChange={setOpenPdfPreviewDialog}
                data={app}
                fiscalYear={selectedYear}
                offices={offices}
                auth={auth}
            />
        </AppLayout>
    );
}
