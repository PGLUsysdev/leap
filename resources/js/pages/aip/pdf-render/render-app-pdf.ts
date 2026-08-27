// resources\js\pages\aip\pdf-render\render-app-pdf.ts

import type { DocumentProps } from "@react-pdf/renderer";
import { createElement } from "react";
import type { ReactElement } from "react";
import type { App, FiscalYear } from "@/types";

export interface AppPdfPayload {
    data: App;
    fiscalYear: FiscalYear;
    officeLabel: string;
    signatories: {
        deptHead: string;
        deptHeadPosition: string;
        gov: string;
        govPosition: string;
    };
}

/**
 * Renders the APP document to a PDF Blob.
 *
 * Both heavy dependencies are imported dynamically so this module stays
 * cheap on the main thread (fallback path) and lets the bundler keep
 * @react-pdf/renderer inside the worker chunk.
 */
export const renderPdf = async (payload: AppPdfPayload): Promise<Blob> => {
    const [{ pdf }, { AppDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./document"),
    ]);

    const element = createElement(AppDocument, payload) as unknown as ReactElement<DocumentProps>;

    return pdf(element).toBlob();
};
