import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { CommandSelect } from '@/components/command-select';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import FormDialog from '@/pages/aip/form-dialog';
import { index } from '@/routes/ppmp-summaries';
import type {
    FiscalYear,
    FiscalYearStatus,
    App,
    Office,
    SharedData,
} from '@/types';
import columns from './columns/columns';
import PdfPreviewDialog from './pdf-preview-dialog';

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

    function onUpdateStatus(data: FiscalYear, status: FiscalYearStatus) {
        router.patch(
            `/aip/${data.id}/status`,
            { status },
            { preserveScroll: true },
        );
    }

    function handleOfficeChange(officeId: string | number | null) {
        const id = officeId?.toString() ?? '';
        setSelectedOfficeId(id);
        router.visit(window.location.pathname, {
            data: { selected_office_id: id },
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
        router.visit(index({ fiscalYear: data.id }));
    }

    return (
        <>
            <div className="pt-4">
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
                    negativeHeight={7}
                >
                    <div className="flex gap-2">
                        {can?.showSummaryAll && offices.length > 0 && (
                            <div className="w-[220px]">
                                <CommandSelect<Office>
                                    value={selectedOfficeId}
                                    onChange={handleOfficeChange}
                                    options={offices}
                                    getOptionValue={(office) =>
                                        office.id.toString()
                                    }
                                    getOptionSearchText={(office) =>
                                        `${office.acronym ?? ''} ${office.name}`
                                    }
                                    renderTrigger={(office) => (
                                        <span className="truncate">
                                            {office.acronym || office.name}
                                        </span>
                                    )}
                                    renderOption={(office) => (
                                        <div className="grid w-full grid-cols-4 gap-4">
                                            <span className="col-span-1">
                                                {office.acronym ?? '-'}
                                            </span>
                                            <span className="col-span-3 whitespace-normal">
                                                {office.name}
                                            </span>
                                        </div>
                                    )}
                                    placeholder="Select office..."
                                    searchPlaceholder="Search office name..."
                                    heading="Offices"
                                    showClear={false}
                                />
                            </div>
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
        </>
    );
}

AipPage.layout = {
    breadcrumbs: [
        {
            title: 'Annual Investment Programs',
            href: '#',
        },
    ],
};
