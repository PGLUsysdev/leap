import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { Building2, ChevronsUpDown } from 'lucide-react';
import DataTable from '@/components/data-table';
import { TableSelect, useTableSelect } from '@/components/table-select';
import { Button } from '@/components/ui/button';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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
import PdfPreviewDialog from './pdf-render/pdf-preview-dialog';

const officeColumnHelper = createColumnHelper<Office>();

const officeColumns = [
    officeColumnHelper.accessor('acronym', {
        size: 80,
        header: () => <div className="px-1">Acronym</div>,
        cell: (info) => (
            <div className="px-1 font-medium">{info.getValue() ?? '—'}</div>
        ),
    }),
    officeColumnHelper.accessor('name', {
        header: () => <div className="px-1">Office Name</div>,
        cell: (info) => <div className="px-1 text-wrap">{info.getValue()}</div>,
    }),
];

interface AipProps {
    fiscalYears: FiscalYear[];
    app: App | null;
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
    const [isAppReloading, setIsAppReloading] = useState(false);

    const params = new URLSearchParams(window.location.search);
    const [selectedOfficeId, setSelectedOfficeId] = useState<string>(
        params.get('selected_office_id') ?? '',
    );
    const [appOfficeId, setAppOfficeId] = useState<string>('');

    const canOpenAip = can?.showSummaryOwn || can?.showSummaryAll;
    const isOpenAipDisabled = can?.showSummaryAll && !selectedOfficeId;
    const needsOfficeSelection = can?.showSummaryAll && !selectedOfficeId;

    const officeSelect = useTableSelect<Office>({
        data: offices,
        value: selectedOfficeId,
    });

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

    function handleGeneratePdf(year: FiscalYear) {
        setSelectedYear(year);

        // Default office scope: consolidated for all-scope users, own office otherwise.
        const defaultOfficeId = can?.generateAppAll
            ? 'all'
            : String(auth.user.office_id ?? '');
        setAppOfficeId(defaultOfficeId);

        const data: Record<string, any> = { fiscal_year_id: year.id };

        if (!can?.generateAppAll && can?.generateAppOwn) {
            data.office_id = auth.user.office_id;
        }

        setIsAppReloading(true);

        router.reload({
            only: ['app'],
            data,
            onSuccess: () => setOpenPdfPreviewDialog(true),
            onFinish: () => setIsAppReloading(false),
        });
    }

    function handleAppOfficeChange(officeId: string) {
        if (!selectedYear) {
            return;
        }

        setAppOfficeId(officeId);
        setIsAppReloading(true);

        router.reload({
            only: ['app'],
            data: { fiscal_year_id: selectedYear.id, office_id: officeId },
            onFinish: () => setIsAppReloading(false),
        });
    }

    function handleOpenPpmpSummary(data: FiscalYear) {
        router.visit(index({ fiscalYear: data.id }));
    }

    return (
        <>
            <ScrollArea className="h-[calc(100vh-3rem)] w-full">
                <DataTable
                    columns={columns}
                    data={needsOfficeSelection ? [] : fiscalYears}
                    meta={{
                        canUpdateStatus: can?.updateStatus ?? false,
                        canOpenAip: canOpenAip ?? false,
                        disableOpenAip: isOpenAipDisabled,
                        canGenerateApp:
                            (can?.generateAppAll ?? false) ||
                            (can?.generateAppOwn ?? false),
                        canOpenPpmpSummary: can?.openPpmpSummary ?? false,
                        onUpdateStatus,
                        onOpen: handleOpenAipSummary,
                        onGeneratePdf: handleGeneratePdf,
                        onOpenPpmpSummary: handleOpenPpmpSummary,
                    }}
                >
                    <div className="flex gap-2">
                        {can?.showSummaryAll && offices.length > 0 && (
                            <div className="w-[220px]">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex h-8 w-full items-center justify-between font-normal"
                                    onClick={officeSelect.openDialog}
                                >
                                    <span className="min-w-0 flex-1 truncate pr-2 text-left">
                                        {officeSelect.selectedItem
                                            ? officeSelect.selectedItem
                                                  .acronym ||
                                              officeSelect.selectedItem.name
                                            : 'Select office...'}
                                    </span>
                                    <ChevronsUpDown className="shrink-0" />
                                </Button>
                            </div>
                        )}

                        {can?.add && !needsOfficeSelection && (
                            <Button onClick={handleOpenFormDialog}>
                                Initialize AIP
                            </Button>
                        )}
                    </div>
                </DataTable>

                {needsOfficeSelection && (
                    <div className="p-4">
                        <Empty>
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <Building2 />
                                </EmptyMedia>
                                <EmptyTitle>No office selected</EmptyTitle>
                                <EmptyDescription>
                                    Select an office above to view its
                                    annual investment programs.
                                </EmptyDescription>
                            </EmptyHeader>
                            <EmptyContent>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={officeSelect.openDialog}
                                >
                                    Select office
                                </Button>
                            </EmptyContent>
                        </Empty>
                    </div>
                )}

                <ScrollBar orientation="vertical" />
            </ScrollArea>

            <FormDialog
                open={openFormDialog}
                onOpenChange={setOpenFormDialog}
            />

            <TableSelect<Office>
                data={offices}
                columns={officeColumns}
                open={officeSelect.open}
                onOpenChange={officeSelect.setOpen}
                onRowSelect={(office) => handleOfficeChange(office.id)}
                value={selectedOfficeId}
                valueKey="id"
                title="Select Office"
                description="Choose an office to open its AIP summary."
            />

            <PdfPreviewDialog
                open={openPdfPreviewDialog}
                onOpenChange={setOpenPdfPreviewDialog}
                data={app}
                fiscalYear={selectedYear}
                offices={offices}
                auth={auth}
                canGenerateAppAll={can?.generateAppAll}
                selectedOfficeId={appOfficeId}
                onOfficeChange={handleAppOfficeChange}
                isReloading={isAppReloading}
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
