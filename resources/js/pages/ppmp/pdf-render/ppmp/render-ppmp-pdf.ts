// resources\js\pages\ppmp\pdf-render\ppmp\render-ppmp-pdf.ts

import type { DocumentProps } from "@react-pdf/renderer";
import { createElement } from "react";
import type { ReactElement } from "react";
import type { AipEntry, FiscalYear, PpaFundingSource } from "@/types";

export interface PpmpPdfPayload {
    aipEntry?: AipEntry;
    fiscalYear?: FiscalYear;
    groupedData?: any[];
    ppaFundingSource?: PpaFundingSource;
    signatories: {
        deptHead: string;
        deptHeadPosition: string;
    };
}

/**
 * Renders the PPMP document to a PDF Blob.
 *
 * Both heavy dependencies are imported dynamically so this module stays
 * cheap on the main thread (fallback path) and lets the bundler keep
 * @react-pdf/renderer inside the worker chunk.
 */
export const renderPdf = async (payload: PpmpPdfPayload): Promise<Blob> => {
    const [{ pdf }, { PpmpDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./document"),
    ]);

    const element = createElement(PpmpDocument, payload) as unknown as ReactElement<DocumentProps>;

    return pdf(element).toBlob();
};
