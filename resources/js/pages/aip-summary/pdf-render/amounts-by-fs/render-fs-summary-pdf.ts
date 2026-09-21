// resources\js\pages\aip-summary\pdf-render\amounts-by-fs\render-fs-summary-pdf.ts

import type { DocumentProps } from '@react-pdf/renderer';
import { createElement } from 'react';
import type { ReactElement } from 'react';
import type { AipEntry, FiscalYear } from '@/types';

export interface FsSummaryPdfPayload {
    aipEntries: AipEntry[];
    fiscalYear: FiscalYear;
    officeName: string;
    currentScope?: { scope: string; supplemental_aip_id: number | null };
}

/**
 * Renders the AIP summary-by-funding-source document to a PDF Blob.
 *
 * Both heavy dependencies are imported dynamically so this module stays
 * cheap on the main thread (fallback path) and lets the bundler keep
 * @react-pdf/renderer inside the worker chunk.
 */
export const renderPdf = async (
    payload: FsSummaryPdfPayload,
): Promise<Blob> => {
    const [{ pdf }, { FsSummaryDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./document'),
    ]);

    const element = createElement(
        FsSummaryDocument,
        payload,
    ) as unknown as ReactElement<DocumentProps>;

    return pdf(element).toBlob();
};
