import { router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import {
    Building2,
    ChevronsUpDown,
    ExternalLink,
    FileText,
    List,
} from 'lucide-react';
import DataTable from '@/components/data-table';
import { TableSelect, useTableSelect } from '@/components/table-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
    AipDocument,
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
        initializeAip: boolean;
        updateStatus: boolean;
        showSummaryAll: boolean;
        showSummaryOwn: boolean;
        generateAppAll: boolean;
        generateAppOwn: boolean;
        openPpmpSummary: boolean;
    };
}

// ─── DEBUG TOGGLE ────────────────────────────────────────────────────
// Enabled in dev builds, or by adding ?debug=1 to the URL in any build.
const DEBUG =
    import.meta.env.DEV ||
    new URLSearchParams(window.location.search).has('debug');

const log = (...args: unknown[]) => {
    if (DEBUG) console.log(...args);
};
// ─────────────────────────────────────────────────────────────────────

export default function AipPage({
    fiscalYears,
    app,
    offices = [],
    can,
}: AipProps) {
    const { auth } = usePage<SharedData>().props;

    // ─── DEBUG: incoming props ───────────────────────────────────────
    log('[aip] props', {
        fiscalYears,
        app,
        offices,
        can,
        auth,
    });
    // ─────────────────────────────────────────────────────────────────

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

    // ─── DEBUG: derived context ──────────────────────────────────────
    log('[aip] context', {
        selectedOfficeId,
        appOfficeId,
        canOpenAip,
        isOpenAipDisabled,
        needsOfficeSelection,
        userOfficeId: auth.user.office_id,
        queryString: window.location.search,
    });
    // ─────────────────────────────────────────────────────────────────

    // ─── DEBUG: fiscalYear → aip_documents map ────────────────────────
    log(
        '[aip] fiscalYears with docs',
        fiscalYears.map((fy) => ({
            id: fy.id,
            year: fy.year,
            docCount: fy.aip_documents?.length ?? 0,
            docs: fy.aip_documents?.map((d) => ({
                id: d.id,
                kind: d.kind,
                name: d.name,
                office_id: (d as any).office_id,
            })),
        })),
    );
    // ─────────────────────────────────────────────────────────────────

    // ─── DEBUG: raw Inertia page object on prop change ───────────────
    useEffect(() => {
        log('[aip] inertia visit', {
            url: window.location.href,
            propsKeys: Object.keys({
                fiscalYears,
                app,
                offices,
                can,
            }),
        });
    }, [fiscalYears, offices, app, can]);
    // ─────────────────────────────────────────────────────────────────

    const officeSelect = useTableSelect<Office>({
        data: offices,
        value: selectedOfficeId,
    });

    function onUpdateStatus(data: FiscalYear, status: FiscalYearStatus) {
        // ─── DEBUG: status update ────────────────────────────────────
        log('[aip] update status', { fiscalYearId: data.id, status });
        // ─────────────────────────────────────────────────────────────

        router.patch(
            `/aip/${data.id}/status`,
            { status },
            { preserveScroll: true },
        );
    }

    function handleOfficeChange(officeId: string | number | null) {
        const id = officeId?.toString() ?? '';

        // ─── DEBUG: office change ────────────────────────────────────
        log('[aip] office changed', {
            from: selectedOfficeId,
            to: id,
            willVisit: `${window.location.pathname}?selected_office_id=${id}`,
        });
        // ─────────────────────────────────────────────────────────────

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

        // ─── DEBUG: open summary ─────────────────────────────────────
        log('[aip] open summary', {
            fiscalYearId: data.id,
            year: data.year,
            url: `/aip/${data.id}/summary?${qs}`,
        });
        // ─────────────────────────────────────────────────────────────

        router.get(`/aip/${data.id}/summary?${qs}`);
    }

    function handleOpenDocument(fiscalYear: FiscalYear, doc: AipDocument) {
        const query: Record<string, string> = {
            aip_document_id: String(doc.id),
        };

        if (selectedOfficeId) {
            query.selected_office_id = selectedOfficeId;
        }

        const qs = new URLSearchParams(query).toString();

        // ─── DEBUG: open document ────────────────────────────────────
        log('[aip] open document', {
            fiscalYearId: fiscalYear.id,
            fiscalYearYear: fiscalYear.year,
            doc,
            selectedOfficeId,
            url: `/aip/${fiscalYear.id}/summary?${qs}`,
        });
        // ─────────────────────────────────────────────────────────────

        router.get(`/aip/${fiscalYear.id}/summary?${qs}`);
    }

    function handleOpenFormDialog() {
        // ─── DEBUG: open form dialog ─────────────────────────────────
        log('[aip] open form dialog');
        // ─────────────────────────────────────────────────────────────

        setOpenFormDialog(true);
    }

    function handleInitializeAip(data: FiscalYear) {
        // ─── DEBUG: initialize AIP ───────────────────────────────────
        log('[aip] initialize AIP', { fiscalYearId: data.id, year: data.year });
        // ─────────────────────────────────────────────────────────────

        router.post(
            `/aip/${data.id}/initialize-aip`,
            {},
            { preserveScroll: true },
        );
    }

    function handleGenerateDocumentApp(
        fiscalYear: FiscalYear,
        doc: AipDocument,
    ) {
        setSelectedYear(fiscalYear);

        // Document scope implies its own office; fall back to FY scope rules.
        const officeId =
            doc.office_id != null
                ? String(doc.office_id)
                : can?.generateAppAll
                  ? 'all'
                  : String(auth.user.office_id ?? '');
        setAppOfficeId(officeId);

        setIsAppReloading(true);

        router.reload({
            only: ['app'],
            data: {
                fiscal_year_id: fiscalYear.id,
                office_id: officeId,
                aip_document_id: doc.id,
            },
            onSuccess: () => setOpenPdfPreviewDialog(true),
            onFinish: () => setIsAppReloading(false),
        });
    }

    function handleAppOfficeChange(officeId: string) {
        if (!selectedYear) {
            return;
        }

        // ─── DEBUG: app office change ────────────────────────────────
        log('[aip] app office change', {
            fiscalYearId: selectedYear.id,
            officeId,
        });
        // ─────────────────────────────────────────────────────────────

        setAppOfficeId(officeId);
        setIsAppReloading(true);

        router.reload({
            only: ['app'],
            data: { fiscal_year_id: selectedYear.id, office_id: officeId },
            onFinish: () => setIsAppReloading(false),
        });
    }

    function handleOpenDocumentPpmpSummary(
        fiscalYear: FiscalYear,
        doc: AipDocument,
    ) {
        router.visit(
            `${index({ fiscalYear: fiscalYear.id }).url}?aip_document_id=${doc.id}`,
        );
    }

    return (
        <>
            <ScrollArea className="h-[calc(100vh-3rem)] w-full">
                <DataTable
                    columns={columns}
                    data={needsOfficeSelection ? [] : fiscalYears}
                    getRowCanExpand={(row) =>
                        (row.original.aip_documents?.length ?? 0) > 0
                    }
                    renderSubComponent={({ row }) => {
                        const docs = row.original.aip_documents ?? [];

                        // ─── DEBUG: subrow expansion ─────────────────
                        log('[aip] expand row', {
                            fiscalYearId: row.original.id,
                            year: row.original.year,
                            docCount: docs.length,
                            docs: docs.map((d) => ({
                                id: d.id,
                                kind: d.kind,
                                name: d.name,
                            })),
                        });
                        // ─────────────────────────────────────────────

                        if (docs.length === 0) {
                            return null;
                        }

                        return (
                            <ul className="flex flex-col gap-1 px-12 py-2">
                                {docs.map((doc) => (
                                    <li
                                        key={doc.id}
                                        className="flex items-center justify-between gap-2 rounded-md border px-3 py-1.5"
                                    >
                                        <div className="flex min-w-0 items-center gap-2">
                                            <Badge
                                                variant={
                                                    doc.kind === 'regular'
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                                className="capitalize"
                                            >
                                                {doc.kind}
                                            </Badge>
                                            <span className="truncate text-sm font-medium">
                                                {doc.name}
                                            </span>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-1">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger
                                                    render={
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            title="Document reports"
                                                        >
                                                            <List className="h-3.5 w-3.5" />
                                                        </Button>
                                                    }
                                                ></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuGroup>
                                                        <DropdownMenuLabel>
                                                            Reports &amp;
                                                            Summaries
                                                        </DropdownMenuLabel>
                                                        <DropdownMenuItem
                                                            disabled={
                                                                !(
                                                                    can?.generateAppAll ??
                                                                    false
                                                                ) &&
                                                                !(
                                                                    can?.generateAppOwn ??
                                                                    false
                                                                )
                                                            }
                                                            onClick={() =>
                                                                handleGenerateDocumentApp(
                                                                    row.original,
                                                                    doc,
                                                                )
                                                            }
                                                        >
                                                            <FileText />
                                                            Generate APP
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            disabled={
                                                                !can?.openPpmpSummary
                                                            }
                                                            onClick={() =>
                                                                handleOpenDocumentPpmpSummary(
                                                                    row.original,
                                                                    doc,
                                                                )
                                                            }
                                                        >
                                                            <ExternalLink />
                                                            Open PPMP Summary
                                                        </DropdownMenuItem>
                                                    </DropdownMenuGroup>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                disabled={
                                                    !canOpenAip ||
                                                    isOpenAipDisabled
                                                }
                                                title="Open document summary"
                                                onClick={() =>
                                                    handleOpenDocument(
                                                        row.original,
                                                        doc,
                                                    )
                                                }
                                            >
                                                <ExternalLink />
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        );
                    }}
                    meta={{
                        canUpdateStatus: can?.updateStatus ?? false,
                        canInitializeAip: can?.initializeAip ?? false,
                        onInitializeAip: handleInitializeAip,
                        canOpenAip: canOpenAip ?? false,
                        disableOpenAip: isOpenAipDisabled,
                        onUpdateStatus,
                        onOpen: handleOpenAipSummary,
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
                                Initialize Fiscal Year
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
                                    Select an office above to view its annual
                                    investment programs.
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
