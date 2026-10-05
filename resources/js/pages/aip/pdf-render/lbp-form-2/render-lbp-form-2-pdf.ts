// resources\js\pages\aip\pdf-render\lbp-form-2\render-lbp-form-2-pdf.ts

import type { DocumentProps } from '@react-pdf/renderer';
import { createElement } from 'react';
import type { ReactElement } from 'react';
import type { LbpForm2DocumentProps } from './document';

export type LbpForm2PdfPayload = LbpForm2DocumentProps;

/**
 * Renders the LBP Form No. 2 template document to a PDF Blob.
 *
 * Both heavy dependencies are imported dynamically so this module stays
 * cheap on the main thread (fallback path) and lets the bundler keep
 * @react-pdf/renderer inside the worker chunk.
 */
export const renderPdf = async (payload: LbpForm2PdfPayload): Promise<Blob> => {
    const [{ pdf }, { LbpForm2Document }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./document'),
    ]);

    const element = createElement(
        LbpForm2Document,
        payload,
    ) as unknown as ReactElement<DocumentProps>;

    return pdf(element).toBlob();
};
