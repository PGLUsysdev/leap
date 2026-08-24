// resources\js\pages\aip-summary\pdf-render\amounts-by-fs\pdf-preview-dialog.tsx

import { PDFViewer } from "@react-pdf/renderer";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { AipEntry, FiscalYear } from "@/types";
import { FsSummaryDocument } from "./document";

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
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="m-0 flex h-full flex-col gap-0 rounded-none bg-[#3c3c3c] p-0 text-white sm:max-w-full">
                <div className="p-4 pb-0">
                    <DialogTitle>Summary by Funding Source – PDF Preview</DialogTitle>
                    <DialogDescription className="sr-only">
                        AIP Summary by Funding Source
                    </DialogDescription>
                </div>
                <div className="h-full bg-white">
                    <PDFViewer width="100%" height="100%" showToolbar>
                        <FsSummaryDocument
                            aipEntries={aipEntries}
                            fiscalYear={fiscalYear}
                            officeName={officeName}
                            currentScope={currentScope}
                        />
                    </PDFViewer>
                </div>
            </DialogContent>
        </Dialog>
    );
}
