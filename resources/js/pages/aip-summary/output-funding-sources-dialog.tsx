// resources\js\pages\aip-summary\output-funding-sources-dialog.tsx

import { router } from "@inertiajs/react";
import { Check } from "lucide-react";
import { useState } from "react";
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
import type { AipOutput, FundingSource } from "@/types";
import fundingSourceColumns from "./columns/funding-source-columns";
import ppaFundingSourceColumns from "./columns/ppa-funding-source-columns";

interface OutputFundingSourcesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    output: AipOutput | null;
    fundingSources?: FundingSource[];
    fiscalYearId: number;
}

export default function OutputFundingSourcesDialog({
    open,
    onOpenChange,
    output,
    fundingSources,
    fiscalYearId,
}: OutputFundingSourcesDialogProps) {
    const [loadingState, setLoadingState] = useState<"idle" | "saving" | "saved">("idle");
    const [selectedFsId, setSelectedFsId] = useState<number | null>(null);
    const [openAlertDelete, setOpenAlertDelete] = useState(false);

    const fundingSourceHook = useTableSelect({
        data: fundingSources ?? [],
        value: undefined,
    });

    if (!output) {
        return null;
    }

    function availableFundingSources() {
        const existingIds = new Set(
            output?.funding_sources?.map((fs) => fs.funding_source_id) ?? [],
        );

        return (fundingSources ?? []).filter((fs) => !existingIds.has(fs.id));
    }

    function handleAddFundingSource(fs: FundingSource) {
        if (!output) {
            return;
        }

        setLoadingState("saving");

        router.post(
            store({ aipOutput: output.id }).url,
            {
                funding_source_id: fs.id,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setLoadingState("saved");
                },
                onError: (errors) => {
                    setLoadingState("idle");
                    console.error(errors);
                },
            },
        );
    }

    function onDeleteFundingSource(sourceId: number) {
        setSelectedFsId(sourceId);
        setOpenAlertDelete(true);
    }

    function handleDeleteFundingSource(sourceId: number | null) {
        if (!output || sourceId === null) {
            return;
        }

        setLoadingState("saving");

        router.delete(
            destroy({
                aipOutput: output.id,
                ppaFundingSource: sourceId,
            }).url,
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setLoadingState("saved");
                    setOpenAlertDelete(false);
                    setSelectedFsId(null);
                },
                onError: (errors) => {
                    setLoadingState("idle");
                    setOpenAlertDelete(false);
                    console.error(errors);
                },
            },
        );
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden px-0 sm:max-w-[70rem]">
                    <DialogHeader className="flex-none px-4 pb-2">
                        <DialogTitle>Manage Funding Sources</DialogTitle>
                        <DialogDescription>
                            Add or remove funding sources for this expected output. Amounts are
                            managed via PPMP and PS breakdown.
                        </DialogDescription>
                    </DialogHeader>

                    <DataTable
                        columns={ppaFundingSourceColumns}
                        data={output.funding_sources ?? []}
                        className="pr-2"
                        meta={{
                            onDelete: onDeleteFundingSource,
                            disabled: loadingState === "saving",
                            onOpenPpmp: (fsId: number) => {
                                router.visit(
                                    ppmpIndex({
                                        fiscalYear: fiscalYearId,
                                        aipEntry: output.aip_entry_id,
                                        ppaFundingSource: fsId,
                                    }).url,
                                    {
                                        method: "get",
                                    },
                                );
                            },
                        }}
                    >
                        <div className="flex gap-1">
                            <Button
                                onClick={() => fundingSourceHook.setOpen(true)}
                                disabled={loadingState === "saving"}
                            >
                                Add Funding Source
                            </Button>
                            <Button>LBP Form 2</Button>
                        </div>
                    </DataTable>

                    <DialogFooter className="mx-0 items-center sm:justify-between">
                        <Badge variant={loadingState === "saving" ? "secondary" : "ghost"}>
                            {loadingState === "saving" && (
                                <>
                                    <Spinner /> Saving…
                                </>
                            )}
                            {loadingState === "idle" && (
                                <>
                                    <Check /> Saved
                                </>
                            )}
                        </Badge>

                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loadingState === "saving"}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                className="sm:max-w-[40rem]"
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
                        <li>This funding source allocation (PS, MOOE, FE, CO , CCET amounts)</li>
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
