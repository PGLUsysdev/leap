// resources/js/pages/aip-summary/output-funding-sources-dialog.tsx

import { router } from "@inertiajs/react";
import { Check } from "lucide-react";
import { useCallback, useState } from "react";
import DataTable from "@/components/base-ui-components/data-table";
import { TableSelect, useTableSelect } from "@/components/base-ui-components/table-select";
import { Badge } from "@/components/base-ui-components/ui/badge";
import { Button } from "@/components/base-ui-components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/base-ui-components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/base-ui-components/ui/scroll-area";
import { Spinner } from "@/components/base-ui-components/ui/spinner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { index as ppmpIndex } from "@/routes/aip/summary/ppmp";
import { destroy, store } from "@/routes/aip-outputs/ppa-funding-sources";
import { update } from "@/routes/ppa-funding-sources";
import type { AipOutput, FundingSource, CcTypology } from "@/types";
import ccTypologyColumns from "./columns/cc-typology-code-columns";
import fundingSourceColumns from "./columns/funding-source-columns";
import ppaFundingSourceColumns from "./columns/ppa-funding-source-columns";

interface OutputFundingSourcesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    output: AipOutput | null;
    fundingSources?: FundingSource[];
    ccTypologies?: CcTypology[];
    fiscalYearId: number;
    isPsPool?: boolean;
}

export default function OutputFundingSourcesDialog({
    open,
    onOpenChange,
    output,
    fundingSources,
    ccTypologies = [],
    fiscalYearId,
    isPsPool = false,
}: OutputFundingSourcesDialogProps) {
    const [loadingState, setLoadingState] = useState<"idle" | "saving" | "saved">("idle");
    const [selectedFsId, setSelectedFsId] = useState<number | null>(null);
    const [openAlertDelete, setOpenAlertDelete] = useState(false);

    // State for CC Typology select (sibling dialog)
    const [ccSelectOpen, setCcSelectOpen] = useState(false);
    const [ccTargetId, setCcTargetId] = useState<number | null>(null);

    const fundingSourceHook = useTableSelect({
        data: fundingSources ?? [],
        value: undefined,
    });

    const saveField = (
        ppaFundingSourceId: number,
        field: "ps_amount" | "fe_amount" | "ccet_adaptation" | "ccet_mitigation",
        newValue: number,
    ) => {
        setLoadingState("saving");

        router.put(
            update({ ppaFundingSource: ppaFundingSourceId }).url,
            { [field]: newValue },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => setLoadingState("saved"),
                onError: () => setLoadingState("idle"),
            },
        );
    };

    const saveCcTypology = (ppaFundingSourceId: number, ccTypologyId: number | null) => {
        setLoadingState("saving");

        router.put(
            update({ ppaFundingSource: ppaFundingSourceId }).url,
            { cc_typology_id: ccTypologyId },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => setLoadingState("saved"),
                onError: () => setLoadingState("idle"),
            },
        );
    };

    const openCcSelect = useCallback((ppaFundingSourceId: number) => {
        setCcTargetId(ppaFundingSourceId);
        setCcSelectOpen(true);
    }, []);

    const handleCcRowSelect = (row: CcTypology) => {
        if (ccTargetId != null) {
            saveCcTypology(ccTargetId, row.id);
        }

        setCcSelectOpen(false);
    };

    const handleCcClear = useCallback((ppaFundingSourceId: number) => {
        setLoadingState("saving");
        saveCcTypology(ppaFundingSourceId, null);
    }, []);

    function availableFundingSources() {
        const existingIds = new Set(
            output?.funding_sources?.map((fs) => fs.funding_source_id) ?? [],
        );

        return (fundingSources ?? []).filter((fs) => !existingIds.has(fs.id));
    }

    function handleAddFundingSource(fs: FundingSource) {
        if (!output) return;

        setLoadingState("saving");

        router.post(
            store({ aipOutput: output.id }).url,
            { funding_source_id: fs.id },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => setLoadingState("saved"),
                onError: () => setLoadingState("idle"),
                only: ["newAipEntries"],
            },
        );
    }

    function onDeleteFundingSource(sourceId: number) {
        setSelectedFsId(sourceId);
        setOpenAlertDelete(true);
    }

    function handleDeleteFundingSource(sourceId: number | null) {
        if (!output || sourceId === null) return;

        setLoadingState("saving");

        router.delete(destroy({ aipOutput: output.id, ppaFundingSource: sourceId }).url, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setLoadingState("saved");
                setOpenAlertDelete(false);
                setSelectedFsId(null);
            },
            onError: () => {
                setLoadingState("idle");
                setOpenAlertDelete(false);
            },
        });
    }

    if (!output) {
        return null;
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden px-0 sm:max-w-[100rem]">
                    <DialogHeader className="flex-none px-4 pb-2">
                        <DialogTitle>Manage Funding Sources</DialogTitle>
                        <DialogDescription>
                            Add or remove funding sources. PS and FE amounts can be edited directly
                            in the table. PS is only editable if the parent PPA is a PS Pool, and a
                            PS Pool can only contain PS amounts.
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="h-[calc(100vh-11rem)] w-full">
                        <DataTable
                            columns={ppaFundingSourceColumns}
                            data={output.funding_sources ?? []}
                            meta={{
                                isPsPool,
                                ccTypologies,
                                isSaving: loadingState === "saving",
                                onSaveAmount: saveField,
                                onSaveCcTypology: openCcSelect,
                                onClearCcTypology: handleCcClear,
                                onDelete: onDeleteFundingSource,
                                onOpenPpmp: (fsId: number) => {
                                    router.visit(
                                        ppmpIndex({
                                            fiscalYear: fiscalYearId,
                                            aipEntry: output.aip_entry_id,
                                            ppaFundingSource: fsId,
                                        }).url,
                                        { method: "get" },
                                    );
                                },
                            }}
                        >
                            <div className="flex gap-1">
                                <Button
                                    onClick={() => fundingSourceHook.setOpen(true)}
                                    disabled={isPsPool}
                                    title={
                                        isPsPool
                                            ? "A PS Pool can only contain PS amounts"
                                            : undefined
                                    }
                                >
                                    Add Funding Source
                                </Button>
                                <Button>LBP Form 2</Button>
                            </div>
                        </DataTable>

                        <ScrollBar orientation="vertical" />
                    </ScrollArea>

                    <DialogFooter className="mx-0 items-center sm:justify-between">
                        <Badge variant={loadingState === "saving" ? "secondary" : "ghost"}>
                            {loadingState === "saving" ? (
                                <>
                                    <Spinner /> Saving…
                                </>
                            ) : (
                                <>
                                    <Check /> Saved
                                </>
                            )}
                        </Badge>

                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Funding source selector (already a sibling) */}
            <TableSelect<FundingSource>
                data={availableFundingSources() ?? []}
                columns={fundingSourceColumns}
                open={fundingSourceHook.open}
                onOpenChange={fundingSourceHook.setOpen}
                onRowSelect={(row) => {
                    fundingSourceHook.setOpen(false);
                    handleAddFundingSource(row);
                }}
                value={fundingSourceHook.value}
                valueKey="id"
                title="Select Funding Source"
                description="Choose a funding source to add to this output"
                className="sm:max-w-[40rem]"
            />

            {/* CC Typology selector (now a sibling, not nested) */}
            <TableSelect<CcTypology>
                data={ccTypologies}
                columns={ccTypologyColumns}
                open={ccSelectOpen}
                onOpenChange={setCcSelectOpen}
                onRowSelect={handleCcRowSelect}
                value={undefined} // no pre-selected value needed for this picker
                valueKey="id"
                title="Select CC Typology"
                description="Choose a climate change typology"
                className="sm:max-w-lg"
            />

            <AlertDialog open={openAlertDelete} onOpenChange={setOpenAlertDelete}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete funding source{" "}
                            {output.funding_sources?.find((fs) => fs.id === selectedFsId)
                                ?.funding_source?.code ?? ""}
                            ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. The following data will be permanently
                            deleted:
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                        <li>This funding source allocation (PS, MOOE, FE, CO, CCET amounts)</li>
                        <li>All PPMP line items assigned to this funding source</li>
                        <li>All PS breakdown entries for this funding source</li>
                    </ul>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={() => handleDeleteFundingSource(selectedFsId)}
                        >
                            Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
