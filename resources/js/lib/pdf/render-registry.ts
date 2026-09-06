// resources\js\lib\pdf\render-registry.ts

import type { AppPdfPayload } from '@/pages/aip/pdf-render/render-app-pdf';
import type { FsSummaryPdfPayload } from '@/pages/aip-summary/pdf-render/amounts-by-fs/render-fs-summary-pdf';
import type { AipSummaryPdfPayload } from '@/pages/aip-summary/pdf-render/render-aip-summary-pdf';
import type { PpmpCoaSummaryPdfPayload } from '@/pages/ppmp/pdf-render/coa-summary/render-ppmp-coa-summary-pdf';
import type { PpmpPdfPayload } from '@/pages/ppmp/pdf-render/ppmp/render-ppmp-pdf';

/**
 * Maps every supported report kind to its payload shape. Renderer modules are
 * loaded lazily per kind, so adding an entry here never bloats the initial
 * bundle; each document and @react-pdf/renderer itself only load on demand.
 */
export interface PdfPayloadMap {
    app: AppPdfPayload;
    'aip-summary': AipSummaryPdfPayload;
    'fs-summary': FsSummaryPdfPayload;
    ppmp: PpmpPdfPayload;
    'ppmp-coa-summary': PpmpCoaSummaryPdfPayload;
}

export type PdfKind = keyof PdfPayloadMap;

interface RendererModule<T> {
    renderPdf: (payload: T) => Promise<Blob>;
}

const rendererLoaders: {
    [K in PdfKind]: () => Promise<RendererModule<PdfPayloadMap[K]>>;
} = {
    app: () => import('@/pages/aip/pdf-render/render-app-pdf'),
    'aip-summary': () =>
        import('@/pages/aip-summary/pdf-render/render-aip-summary-pdf'),
    'fs-summary': () =>
        import('@/pages/aip-summary/pdf-render/amounts-by-fs/render-fs-summary-pdf'),
    ppmp: () => import('@/pages/ppmp/pdf-render/ppmp/render-ppmp-pdf'),
    'ppmp-coa-summary': () =>
        import('@/pages/ppmp/pdf-render/coa-summary/render-ppmp-coa-summary-pdf'),
};

/**
 * Renders the document registered under `kind` to a PDF blob. Payloads cross
 * the Comlink boundary as plain data, hence the `unknown` parameter; the
 * registry's payload map guarantees callers send the matching shape.
 */
export async function renderPdf(
    kind: PdfKind,
    payload: unknown,
): Promise<Blob> {
    switch (kind) {
        case 'app':
            return (await rendererLoaders.app()).renderPdf(
                payload as AppPdfPayload,
            );
        case 'aip-summary':
            return (await rendererLoaders['aip-summary']()).renderPdf(
                payload as AipSummaryPdfPayload,
            );
        case 'fs-summary':
            return (await rendererLoaders['fs-summary']()).renderPdf(
                payload as FsSummaryPdfPayload,
            );
        case 'ppmp':
            return (await rendererLoaders.ppmp()).renderPdf(
                payload as PpmpPdfPayload,
            );
        case 'ppmp-coa-summary':
            return (await rendererLoaders['ppmp-coa-summary']()).renderPdf(
                payload as PpmpCoaSummaryPdfPayload,
            );
        default:
            throw new Error(
                `Unknown PDF renderer kind: ${kind satisfies never}`,
            );
    }
}
