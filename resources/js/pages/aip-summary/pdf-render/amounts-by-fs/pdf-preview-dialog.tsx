// resources\js\pages\aip-summary\pdf-render\amounts-by-fs\pdf-preview-dialog.tsx

import { useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { PdfPreviewPane } from "@/lib/pdf/pdf-preview-pane";
import { usePdfPreview } from "@/lib/pdf/use-pdf-preview";
import type { AipEntry, FiscalYear } from "@/types";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    aipEntries: AipEntry[];
    fiscalYear: FiscalYear;
    officeName: string;
    currentScope?: { scope: string; supplemental_aip_id: number | null };
}

export default function ExportSummaryToPdfDialog({
    open,
    onOpenChange,
    aipEntries,
    fiscalYear,
    officeName,
    currentScope,
}: Props) {
    const scopeKey = currentScope?.scope;
    const scopeSupplementalId = currentScope?.supplemental_aip_id;

    // Built from primitive-stable dependencies so an unstable parent-side
    // object identity cannot trigger needless worker regenerations.
    const payload = useMemo(
        () =>
            open
                ? {
                      aipEntries,
                      fiscalYear,
                      officeName,
                      currentScope:
                          scopeKey === undefined
                              ? undefined
                              : {
                                    scope: scopeKey,
                                    supplemental_aip_id: scopeSupplementalId ?? null,
                                },
                  }
                : null,
        [open, aipEntries, fiscalYear, officeName, scopeKey, scopeSupplementalId],
    );
    const { url, status } = usePdfPreview("fs-summary", payload);

    if (!open) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="m-0 flex h-full flex-col gap-0 rounded-none bg-[#3c3c3c] p-0 text-white sm:max-w-full">
                <div className="p-4 pb-0">
                    <DialogTitle>Summary by Funding Source – PDF Preview</DialogTitle>

                    <DialogDescription className="sr-only">
                        AIP Summary by Funding Source
                    </DialogDescription>
                </div>

                <div className="relative h-full">
                    <PdfPreviewPane
                        url={url}
                        status={status}
                        busy={status === "generating"}
                        title="Summary by Funding Source"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
