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
import columns from './columns/columns';
import PdfPreviewDialog from './pdf-preview-dialog';
import { index } from '@/routes/ppmp-summaries';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

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
    can?: {
        add: boolean;
        updateStatus: boolean;
        showSummaryAll: boolean;
        showSummaryOwn: boolean;
        generateAppAll: boolean;
        generateAppOwn: boolean;
        openPpmpSummary: boolean;
    };
}

export default function AipPage({
    fiscalYears,
    app,
    offices = [],
    can,
}: AipProps) {
    console.log(can);

    const { auth } = usePage<SharedData>().props;

    const [openFormDialog, setOpenFormDialog] = useState(false);
    const [openPdfPreviewDialog, setOpenPdfPreviewDialog] = useState(false);
    const [selectedYear, setSelectedYear] = useState<FiscalYear | null>(null);

    const params = new URLSearchParams(window.location.search);
    const [selectedOfficeId, setSelectedOfficeId] = useState<string>(
        params.get('selected_office_id') ?? '',
    );

    const canOpenAip = can?.showSummaryOwn || can?.showSummaryAll;
    const isOpenAipDisabled = can?.showSummaryAll && !selectedOfficeId;

    // Standard Handlers (Ensure these exist if DataTable uses them)
    function onUpdateStatus(data: FiscalYear, status: FiscalYearStatus) {
        router.patch(
            `/aip/${data.id}/status`,
            { status },
            { preserveScroll: true },
        );
    }

    function handleOfficeChange(officeId: string) {
        setSelectedOfficeId(officeId);
        router.visit(window.location.pathname, {
            data: { selected_office_id: officeId },
            preserveState: true,
        });
    }

    function handleOpenAipSummary(data: FiscalYear) {
        const query: Record<string, string> = {};
        if (selectedOfficeId) {
            query.selected_office_id = selectedOfficeId;
        }
        const qs = new URLSearchParams(query).toString();
        router.get(`/aip/${data.id}/summary?${qs}`);
    }

    function handleOpenFormDialog() {
        setOpenFormDialog(true);
    }

    // Trigger PDF generation
    // This loads the initial data (Consolidated for BACSU, Office-only for others)
    function handleGeneratePdf(selectedYearId: FiscalYear) {
        setSelectedYear(selectedYearId);

        const data: Record<string, any> = { fiscal_year_id: selectedYearId.id };
        if (!can?.generateAppAll && can?.generateAppOwn) {
            data.office_id = auth.user.office_id;
        }

        router.reload({
            only: ['app'],
            data,
            onSuccess: () => setOpenPdfPreviewDialog(true),
        });
    }

    function handleOpenPpmpSummary(data: FiscalYear) {
        // finalized redirecting route
        router.visit(index({ fiscalYear: data.id }));
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="py-4">
                <DataTable
                    columns={columns(
                        can?.updateStatus ?? false,
                        canOpenAip ?? false,
                        isOpenAipDisabled,
                        (can?.generateAppAll ?? false) ||
                            (can?.generateAppOwn ?? false),
                        can?.openPpmpSummary ?? false,
                    )}
                    data={fiscalYears}
                    onUpdateStatus={onUpdateStatus}
                    onOpen={handleOpenAipSummary}
                    onGeneratePdf={handleGeneratePdf}
                    onOpenPpmpSummary={handleOpenPpmpSummary}
                    withSearch={true}
                >
                    <div className="flex gap-2">
                        {can?.showSummaryAll && offices.length > 0 && (
                            <Select
                                value={selectedOfficeId}
                                onValueChange={handleOfficeChange}
                            >
                                <SelectTrigger className="w-[220px]">
                                    <SelectValue placeholder="Select office..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Offices</SelectLabel>
                                        {offices.map((office) => (
                                            <SelectItem
                                                key={office.id}
                                                value={office.id.toString()}
                                            >
                                                {office.name}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        )}

                        {can?.add && (
                            <Button onClick={handleOpenFormDialog}>
                                Initialize AIP
                            </Button>
                        )}
                    </div>
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
                canGenerateAppAll={can?.generateAppAll}
            />
        </AppLayout>
    );
}
