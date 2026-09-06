// resources\js\pages\ppmp\pdf-render\coa-summary\render-ppmp-coa-summary-pdf.ts

import type { DocumentProps } from '@react-pdf/renderer';
import { createElement } from 'react';
import type { ReactElement } from 'react';
import type { AipEntry, FiscalYear, PpaFundingSource } from '@/types';

export interface PpmpCoaSummaryPdfPayload {
    aipEntry?: AipEntry;
    fiscalYear?: FiscalYear;
    groupedData?: any[];
    ppaFundingSource?: PpaFundingSource;
    sheetNumber?: number;
}

/**
 * Renders the PPMP-by-chart-of-accounts summary document to a PDF Blob.
 *
 * Both heavy dependencies are imported dynamically so this module stays
 * cheap on the main thread (fallback path) and lets the bundler keep
 * @react-pdf/renderer inside the worker chunk.
 */
export const renderPdf = async (
    payload: PpmpCoaSummaryPdfPayload,
): Promise<Blob> => {
    const [{ pdf }, { PpmpSummaryDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./document'),
    ]);

    const element = createElement(
        PpmpSummaryDocument,
        payload,
    ) as unknown as ReactElement<DocumentProps>;

    return pdf(element).toBlob();
};
