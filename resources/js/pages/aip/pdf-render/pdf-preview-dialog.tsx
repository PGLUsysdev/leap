// resources\js\pages\aip\pdf-render\pdf-preview-dialog.tsx

import { useMemo } from "react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { PdfPreviewPane } from "@/lib/pdf/pdf-preview-pane";
import { usePdfPreview } from "@/lib/pdf/use-pdf-preview";
import type { App, Auth, FiscalYear, Office } from "@/types";

interface PdfPreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: App | null;
    fiscalYear: FiscalYear | null;
    offices: Office[];
    auth: Auth;
    canGenerateAppAll?: boolean;
    /** Currently selected office scope for the APP report. */
    selectedOfficeId: string;
    /** Called when the user picks an office; the parent triggers the reload. */
    onOfficeChange: (officeId: string) => void;
    isReloading?: boolean;
}

function getOfficeLabel(
    auth: Auth,
    offices: Office[],
    canGenerateAppAll: boolean | undefined,
    selectedOfficeId: string,
) {
    if (!canGenerateAppAll) {
        return `${auth.user.office?.name || "My Office"}`;
    }

    if (selectedOfficeId === "all") {
        const mainOffice = offices.find((o) => o.id === 1);

        return mainOffice?.name ?? "All Offices";
    }

    return offices.find((o) => o.id.toString() === selectedOfficeId)?.acronym ?? "";
}

export default function PdfPreviewDialog({
    open,
    onOpenChange,
    data,
    fiscalYear,
    offices,
    auth,
    canGenerateAppAll,
    selectedOfficeId,
    onOfficeChange,
    isReloading = false,
}: PdfPreviewDialogProps) {
    const officeLabel = useMemo(
        () => getOfficeLabel(auth, offices, canGenerateAppAll, selectedOfficeId),
        [auth, offices, canGenerateAppAll, selectedOfficeId],
    );

    const payload = useMemo(
        () => (data && fiscalYear ? { data, fiscalYear, officeLabel } : null),
        [data, fiscalYear, officeLabel],
    );

    const { url, status } = usePdfPreview("app", payload);

    if (!open || !fiscalYear || !data) {
        return null;
    }

    const busy = isReloading || status === "generating";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[100vh] flex-col gap-0 rounded-none p-0 sm:max-w-[100vw]">
                <DialogHeader className="flex flex-row items-center justify-between space-y-0 border-b p-4">
                    <DialogTitle>APP Preview - {fiscalYear.year}</DialogTitle>

                    <DialogDescription className="sr-only" />
                </DialogHeader>

                <div className="flex flex-1 overflow-hidden">
                    {canGenerateAppAll && (
                        <div className="p-4">
                            <Command className="max-w-md rounded-lg border">
                                <CommandInput placeholder="Type a command or search..." />

                                <CommandList className="max-h-none">
                                    <CommandEmpty>No results found.</CommandEmpty>

                                    <CommandGroup heading="Offices">
                                        <CommandItem
                                            value="all"
                                            className="flex"
                                            onSelect={() => onOfficeChange("all")}
                                            data-checked={selectedOfficeId === "all"}
                                        >
                                            Consolidated (Whole PGLU)
                                        </CommandItem>

                                        <CommandSeparator />

                                        {offices.map((office) => (
                                            <CommandItem
                                                key={office.id}
                                                value={`${office.acronym} ${office.name}`}
                                                className="flex items-start"
                                                onSelect={() =>
                                                    onOfficeChange(office.id.toString())
                                                }
                                                data-checked={
                                                    selectedOfficeId === office.id.toString()
                                                }
                                            >
                                                <div className="grid w-full grid-cols-3">
                                                    <span className="col-span-1">
                                                        {office.acronym}
                                                    </span>

                                                    <span className="col-span-2">
                                                        {office.name}
                                                    </span>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </div>
                    )}

                    <div className="relative flex-1">
                        <PdfPreviewPane
                            url={url}
                            status={status}
                            busy={busy}
                            title={`APP Preview ${fiscalYear.year}`}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
