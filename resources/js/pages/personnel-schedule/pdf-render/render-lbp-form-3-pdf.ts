// resources\js\pages\personnel-schedule\pdf-render\render-lbp-form-3-pdf.ts

import type { DocumentProps } from '@react-pdf/renderer';
import { createElement } from 'react';
import type { ReactElement } from 'react';
import type { PersonnelScheduleItem } from '../data-table/columns';

export interface LbpForm3PdfPayload {
    items: PersonnelScheduleItem[];
    fiscalYear: string;
    formLabel: string;
    signatories: {
        preparedName: string;
        preparedPosition: string;
        reviewedName: string;
        reviewedPosition: string;
        approvedName: string;
        approvedPosition: string;
    };
}

/**
 * Renders the LBP Form 3 personnel schedule document to a PDF Blob.
 *
 * Both heavy dependencies are imported dynamically so this module stays
 * cheap on the main thread (fallback path) and lets the bundler keep
 * @react-pdf/renderer inside the worker chunk.
 */
export const renderPdf = async (payload: LbpForm3PdfPayload): Promise<Blob> => {
    const [{ pdf }, { LbpForm3Document }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./document'),
    ]);

    const element = createElement(
        LbpForm3Document,
        payload,
    ) as unknown as ReactElement<DocumentProps>;

    return pdf(element).toBlob();
};
