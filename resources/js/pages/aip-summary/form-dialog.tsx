import { router } from "@inertiajs/react";
import { Plus } from "lucide-react";
import { useState } from "react";
import DataTable from "@/components/base-ui-components/data-table";
import { Button } from "@/components/base-ui-components/ui/button";
import { Card, CardContent } from "@/components/base-ui-components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/base-ui-components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/base-ui-components/ui/scroll-area";
import { Separator } from "@/components/base-ui-components/ui/separator";
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
import { destroy, store, update } from "@/routes/aip-outputs";
import type { AipEntry, AipOutput, FundingSource, Office } from "@/types";
import outputColumns from "./columns/output-columns";
import OutputFormDialog from "./output-form-dialog";
import OutputFundingSourcesDialog from "./output-funding-sources-dialog";

interface FormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data?: AipEntry;
    offices?: Office[];
    fundingSources?: FundingSource[];
    fiscalYearId: number;
}

export default function FormDialog({
    open,
    onOpenChange,
    data,
    offices,
    fundingSources,
    fiscalYearId,
}: FormDialogProps) {
    const [loadingState, setLoadingState] = useState<"idle" | "saving" | "saved">("idle");

    // Output form dialog state
    const [outputFormOpen, setOutputFormOpen] = useState(false);
    const [editingOutput, setEditingOutput] = useState<AipOutput | null>(null);

    // Delete confirmation
    const [deleteOutputId, setDeleteOutputId] = useState<number | null>(null);
    const [openDeleteAlert, setOpenDeleteAlert] = useState(false);

    // Funding sources dialog
    const [selectedOutput, setSelectedOutput] = useState<AipOutput | null>(null);
    const [openFundingDialog, setOpenFundingDialog] = useState(false);

    const outputs = data?.outputs ?? [];

    function handleAddOutput() {
        setEditingOutput(null);
        setOutputFormOpen(true);
    }

    function handleEditOutput(output: AipOutput) {
        setEditingOutput(output);
        setOutputFormOpen(true);
    }

    function handleDeleteOutput(output: AipOutput) {
        setDeleteOutputId(output.id);
        setOpenDeleteAlert(true);
    }

    function confirmDeleteOutput() {
        if (deleteOutputId === null) return;

        setLoadingState("saving");
        router.delete(destroy({ aipOutput: deleteOutputId }).url, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setLoadingState("saved");
                setOpenDeleteAlert(false);
                setDeleteOutputId(null);
            },
            onError: (errors) => {
                setLoadingState("idle");
                console.error(errors);
            },
        });
    }

    function handleEditFundingSources(output: AipOutput) {
        setSelectedOutput(output);
        setOpenFundingDialog(true);
    }

    // Derive live output for funding dialog
    const liveSelectedOutput =
        selectedOutput != null ? (outputs.find((o) => o.id === selectedOutput.id) ?? null) : null;

    // Meta for output columns
    const outputMeta = {
        onEditFundingSources: handleEditFundingSources,
        onEditOutput: handleEditOutput,
        onDeleteOutput: handleDeleteOutput,
        disabled: loadingState === "saving",
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden px-0 sm:max-w-[80rem]">
                    <DialogHeader className="flex-none px-4 pb-2">
                        <DialogTitle>Manage Expected Outputs</DialogTitle>
                        <DialogDescription>
                            Add, edit, or remove expected outputs for this entry. Each output has
                            its own office, schedule, and funding sources.
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="h-[calc(100vh-240px)]">
                        <div className="px-4">
                            {/* PPA Info */}
                            <div className="pt-2">
                                <Card>
                                    <CardContent>
                                        <div className="text-muted-foreground slashed-zero tabular-nums">
                                            {data?.ppa?.full_code}
                                        </div>
                                        <div className="text-base font-bold">{data?.ppa?.name}</div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Separator className="my-4" />

                            {/* Outputs Table */}
                            <DataTable
                                columns={outputColumns}
                                data={outputs}
                                className="pr-2"
                                showFooter={false}
                                withRowSpan={false}
                                meta={outputMeta}
                            >
                                <Button
                                    onClick={handleAddOutput}
                                    disabled={loadingState === "saving"}
                                >
                                    <Plus className="mr-1 h-4 w-4" /> Add Output
                                </Button>
                            </DataTable>

                            <ScrollBar orientation="vertical" />
                        </div>
                    </ScrollArea>

                    <DialogFooter className="mx-0 items-center sm:justify-end">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Nested output form dialog */}
            {data && (
                <OutputFormDialog
                    open={outputFormOpen}
                    onOpenChange={setOutputFormOpen}
                    entry={data}
                    output={editingOutput}
                    offices={offices}
                />
            )}

            {/* Delete confirmation */}
            <AlertDialog open={openDeleteAlert} onOpenChange={setOpenDeleteAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete output?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this output and all its funding sources and
                            PPMP items. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={confirmDeleteOutput}>
                            Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Funding sources dialog */}
            <OutputFundingSourcesDialog
                open={openFundingDialog}
                onOpenChange={setOpenFundingDialog}
                output={liveSelectedOutput}
                fundingSources={fundingSources}
                fiscalYearId={fiscalYearId}
            />
        </>
    );
}
