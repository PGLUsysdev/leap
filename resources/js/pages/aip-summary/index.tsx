import { router, usePage } from '@inertiajs/react';
import { FileUp, Library, Sheet, ShieldCheck } from 'lucide-react';
import { useState, useCallback, useMemo } from 'react';
import DataTable from '@/components/data-table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { DeleteDialog } from '@/components/delete-dialog';
import FormDialog from '@/pages/aip-summary/form-dialog';
import PpaSelectorDialog from '@/pages/aip-summary/ppa-selector-dialog';
import type {
    FiscalYear,
    Ppa,
    FundingSource,
    Office,
    SharedData,
    Filter,
    PaginatedResponse,
    ChartOfAccount,
    PriceList,
    PpmpCategory,
    AipEntry,
    AipOutput,
    PpaFundingSource,
} from '@/types';
import type { NumberedAipEntry } from '@/lib/aip-summary/sort-tree';
import { sortFlatLikeTree } from '@/lib/aip-summary/sort-tree';
import newColumns from './columns/new-columns';
import ExportToPdfDialog from './export-to-pdf-dialog';
import ExportSummaryToPdfDialog from './pdf-render/amounts-by-fs/pdf-preview-dialog';

interface AipSummaryProps {
    fiscalYear: FiscalYear;
    aipEntries: Ppa[];
    can: {
        export: boolean;
        import: boolean;
        createSaip: boolean;
        setPsPool: boolean;
        delete: boolean;
        showSummaryAll?: boolean;
    };
    fundingSources?: FundingSource[];
    ccTypologies?: {
        id: number;
        code: string;
        description: string;
        strategic_priority_id: number;
        sub_sector_id: number | null;
        strategic_priority?: { id: number; code: number; name: string };
        sub_sector?: { id: number; code: number; name: string } | null;
    }[];
    offices?: Office[];
    filters: Filter;
    dialogPpaTree?: PaginatedResponse<Ppa>;
    dialogCurrent?: Ppa[];
    supplementalAips?: any[];
    currentScope?: {
        scope: string;
        supplemental_aip_id: number | null;
    };
    chartOfAccounts?: ChartOfAccount[];
    priceLists?: PriceList[];
    ppmpCategories?: PpmpCategory[];
    ppmpCoaTotals: Record<number, Record<number, number>>;
    psCoaAutoTotals: Record<string, number>;
    psPoolPpaId?: number | null;
    newAipEntries: AipEntry[];
    ppaTypes: string[];
    ppaTypePadding: Record<string, number>;
}

type FundingSourceRow = NumberedAipEntry & {
    current_fs: PpaFundingSource | null;
    output: AipOutput | null;
    // Flat grouping keys used by DataTable column meta.spanKey:
    entryId: number;
    outputId: number | null;
};

function expandByFundingSource(
    entries: NumberedAipEntry[],
): FundingSourceRow[] {
    return entries.flatMap((entry): FundingSourceRow[] => {
        const outputs = entry.outputs ?? [];

        if (outputs.length === 0) {
            return [
                {
                    ...entry,
                    id: entry.id,
                    current_fs: null,
                    output: null,
                    entryId: entry.id,
                    outputId: null,
                },
            ];
        }

        const rows: FundingSourceRow[] = [];

        for (const output of outputs) {
            const sources = output.funding_sources ?? [];

            if (sources.length === 0) {
                rows.push({
                    ...entry,
                    id: entry.id,
                    current_fs: null,
                    output,
                    entryId: entry.id,
                    outputId: output.id,
                });

                continue;
            }

            for (const fs of sources) {
                rows.push({
                    ...entry,
                    id: entry.id,
                    current_fs: fs,
                    output,
                    entryId: entry.id,
                    outputId: output.id,
                });
            }
        }

        return rows;
    });
}

export default function AipSummary({
    fiscalYear,
    can,
    filters,
    dialogPpaTree,
    dialogCurrent,
    psPoolPpaId,
    newAipEntries,
    offices,
    fundingSources,
    ppaTypes,
    currentScope = { scope: 'original', supplemental_aip_id: null },
    ccTypologies,
}: AipSummaryProps) {
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);

    const existingPpaIds = useMemo(
        () => Array.from(new Set(newAipEntries.map((e) => e.ppa_id))),
        [newAipEntries],
    );

    const handleImportLibrary = () => {
        router.get(
            window.location.pathname,
            {
                ...filters,
                dialog_id: null,
                dialog_boundary_id: null,
                dialog_page: 1,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['dialogPpaTree', 'dialogCurrent', 'filters'],
                onSuccess: () => {
                    setIsSelectorOpen(true);
                },
            },
        );
    };

    const handleAddEntry = useCallback(
        (entry: NumberedAipEntry) => {
            router.get(
                window.location.pathname,
                {
                    ...filters,
                    dialog_id: entry.ppa_id,
                    dialog_boundary_id: entry.ppa_id,
                    dialog_page: 1,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    only: ['dialogPpaTree', 'dialogCurrent', 'filters'],
                    onSuccess: () => {
                        setIsSelectorOpen(true);
                    },
                },
            );
        },
        [filters],
    );

    const { auth } = usePage<SharedData>().props;

    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteEntry, setDeleteEntry] = useState<NumberedAipEntry | null>(
        null,
    );
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [isSummaryExportOpen, setIsSummaryExportOpen] = useState(false);

    function handleEdit(id: number) {
        setSelectedItemId(id);
        setIsFormDialogOpen(true);
    }

    const selectedEntry = useMemo<Ppa | null>(() => {
        if (selectedItemId == null) {
            return null;
        }

        const entry = newAipEntries.find((e) => e.id === selectedItemId);

        if (!entry?.ppa) {
            return null;
        }

        return {
            ...entry.ppa,
            aip_entries:
                entry.ppa.aip_entries && entry.ppa.aip_entries.length > 0
                    ? entry.ppa.aip_entries
                    : [entry],
        };
    }, [selectedItemId, newAipEntries]);

    const handleDeleteDialogOpen = useCallback((entry: NumberedAipEntry) => {
        setDeleteEntry(entry);
        setIsDeleteDialogOpen(true);
    }, []);

    function handleDelete() {
        if (!deleteEntry) {
            return;
        }

        router.delete(`/aip-entries/${deleteEntry.id}`, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => setIsLoading(true),
            onSuccess: () => {
                setIsDeleteDialogOpen(false);
                setDeleteEntry(null);
            },
            onFinish: () => setIsLoading(false),
            onError: (error) => console.error('error', error),
        });
    }

    const [isSetPsPoolDialogOpen, setIsSetPsPoolDialogOpen] = useState(false);
    const [psPoolTarget, setPsPoolTarget] = useState<NumberedAipEntry | null>(
        null,
    );

    const handleSetAsPsPool = useCallback((entry: NumberedAipEntry) => {
        setPsPoolTarget(entry);
        setIsSetPsPoolDialogOpen(true);
    }, []);

    const handleSetAsPsPoolConfirm = useCallback(() => {
        if (!psPoolTarget?.ppa) {
            return;
        }

        setIsLoading(true);

        router.post(
            `/ppas/${psPoolTarget.ppa.id}/set-as-ps-pool`,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => {
                    setIsLoading(false);
                    setIsSetPsPoolDialogOpen(false);
                    setPsPoolTarget(null);
                },
            },
        );
    }, [psPoolTarget]);

    return (
        <>
            <ScrollArea className="h-[calc(100vh-3rem)] w-full">
                <DataTable
                    columns={newColumns}
                    data={expandByFundingSource(
                        sortFlatLikeTree(newAipEntries),
                    )}
                    meta={{
                        onEdit: handleEdit,
                        onAdd: handleAddEntry,
                        onDelete: handleDeleteDialogOpen,
                        canDelete: can?.delete ?? false,
                        canSetPsPool: can?.setPsPool ?? false,
                        psPoolPpaId,
                        onSetAsPsPool: handleSetAsPsPool,
                    }}
                    showFooter={true}
                    withRowSpan={true}
                >
                    <div className="flex gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={
                                    <Button variant="outline" size="icon" />
                                }
                            >
                                <FileUp />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-55" align="end">
                                <DropdownMenuGroup>
                                    <DropdownMenuLabel>
                                        Export
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            setIsExportDialogOpen(true)
                                        }
                                    >
                                        <Sheet /> AIP Summary Form
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            setIsSummaryExportOpen(true)
                                        }
                                    >
                                        <Sheet /> Amounts by Funding Source
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {can.import && (
                            <Button onClick={handleImportLibrary}>
                                <Library className="mr-2 h-4 w-4" /> Import from
                                Library
                            </Button>
                        )}
                    </div>
                </DataTable>

                <ScrollBar orientation="vertical" />
            </ScrollArea>

            <PpaSelectorDialog
                open={isSelectorOpen}
                onOpenChange={setIsSelectorOpen}
                dialogPpaTree={dialogPpaTree}
                dialogCurrent={dialogCurrent}
                filters={filters}
                fiscalYearId={fiscalYear.id}
                existingPpaIds={existingPpaIds}
                supplementalAipId={null}
                ppaTypes={ppaTypes}
            />

            <FormDialog
                open={isFormDialogOpen}
                onOpenChange={setIsFormDialogOpen}
                data={newAipEntries.find((item) => item.id === selectedItemId)}
                offices={offices}
                fundingSources={fundingSources}
                fiscalYearId={fiscalYear.id}
                ccTypologies={ccTypologies}
            />

            <DeleteDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Remove from AIP Summary?"
                description={
                    <>
                        Are you sure you want to remove{' '}
                        <span className="text-foreground font-bold">
                            "{deleteEntry?.ppa?.name}"
                        </span>
                        ?
                        <span className="text-destructive mt-2 block font-semibold italic">
                            This will also remove all nested sub-PPAs and
                            activities including all their PPMPs.
                        </span>
                    </>
                }
                onConfirm={handleDelete}
                onCancel={() => {
                    setIsDeleteDialogOpen(false);
                    setDeleteEntry(null);
                }}
                isLoading={isLoading}
            />

            <AlertDialog
                open={isSetPsPoolDialogOpen}
                onOpenChange={(open) => {
                    setIsSetPsPoolDialogOpen(open);

                    if (!open) {
                        setPsPoolTarget(null);
                    }
                }}
            >
                <AlertDialogContent size="default">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                            Set PS Pool?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Designate{' '}
                            <span className="text-foreground font-semibold">
                                "{psPoolTarget?.ppa?.name}"
                            </span>{' '}
                            as the PS Pool for this fiscal year. This will
                            change the Personal Services (PS) allocations as
                            follows:
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <ul className="text-muted-foreground -mt-1 space-y-2 text-sm">
                        <li className="flex gap-2">
                            <span className="text-emerald-600">•</span>
                            <span>
                                <span className="text-foreground font-medium">
                                    PS handover.
                                </span>{' '}
                                The previous PS Pool&apos;s PS amount is
                                transferred to this Program, all of its funding
                                sources are removed, and it loses its PS Pool
                                designation.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-emerald-600">•</span>
                            <span>
                                <span className="text-foreground font-medium">
                                    Single PS-only funding source.
                                </span>{' '}
                                All funding sources currently assigned to this
                                Program will be permanently removed and replaced
                                with exactly one{' '}
                                <span className="font-semibold">
                                    General Fund (GF Proper)
                                </span>{' '}
                                funding source holding only the transferred PS.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-amber-600">•</span>
                            <span>
                                <span className="text-foreground font-medium">
                                    PS-only rule.
                                </span>{' '}
                                A PS Pool can only contain a PS amount — MOOE,
                                FE, CO, and CCET amounts cannot be entered on
                                it.
                            </span>
                        </li>
                    </ul>

                    <AlertDialogFooter>
                        <AlertDialogCancel
                            disabled={isLoading}
                            onClick={() => setPsPoolTarget(null)}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={handleSetAsPsPoolConfirm}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Setting...' : 'Set PS Pool'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <ExportToPdfDialog
                open={isExportDialogOpen}
                onOpenChange={setIsExportDialogOpen}
                aipEntries={newAipEntries}
                fiscalYear={fiscalYear}
                officeName={auth.user.office?.name || ''}
                currentScope={currentScope}
            />

            <ExportSummaryToPdfDialog
                open={isSummaryExportOpen}
                onOpenChange={setIsSummaryExportOpen}
                aipEntries={newAipEntries}
                fiscalYear={fiscalYear}
                officeName={auth.user.office?.name || ''}
                currentScope={currentScope}
            />
        </>
    );
}

AipSummary.layout = {
    breadcrumbs: [
        { title: 'Annual Investment Programs', href: '/aip' },
        { title: 'AIP Summary', href: '#' },
    ],
};
