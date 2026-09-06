// resources\js\lib\pdf\use-pdf-preview.ts

import { wrap } from 'comlink';
import type { Remote } from 'comlink';
import { useEffect, useRef, useState } from 'react';
import type { PdfWorkerApi } from './pdf-render.worker';
import type { PdfKind, PdfPayloadMap } from './render-registry';
import { renderPdf } from './render-registry';
import { spawnPdfWorker } from './spawn-pdf-worker';

export type PdfPreviewStatus = 'idle' | 'generating' | 'ready' | 'error';

interface PdfResult {
    kind: PdfKind;
    payload: unknown;
    url: string;
}

/**
 * Renders a registered PDF document (see render-registry.ts) inside the
 * shared web worker and returns a blob URL for previewing it.
 *
 * - Regenerates whenever the kind/payload pair changes identity.
 * - Keeps the previously rendered URL while a new one is being generated so
 *   the preview never flashes blank between renders.
 * - Falls back to main-thread rendering when the worker cannot be used.
 * - Terminates the worker (and revokes all URLs) when the component unmounts.
 */
export function usePdfPreview<K extends PdfKind>(
    kind: K,
    payload: PdfPayloadMap[K] | null,
): {
    url: string | null;
    status: PdfPreviewStatus;
} {
    const [result, setResult] = useState<PdfResult | null>(null);
    const [failed, setFailed] = useState<{
        kind: PdfKind;
        payload: unknown;
    } | null>(null);

    const lastUrlRef = useRef<string | null>(null);
    const workerRef = useRef<Remote<PdfWorkerApi> | null>(null);
    const workerInstanceRef = useRef<Worker | null>(null);
    const workerBootstrapUrlRef = useRef<string | null>(null);

    const getWorkerApi = (): Remote<PdfWorkerApi> => {
        if (!workerRef.current || !workerInstanceRef.current) {
            const { instance, bootstrapUrl } = spawnPdfWorker();
            workerInstanceRef.current = instance;
            workerBootstrapUrlRef.current = bootstrapUrl;
            workerRef.current = wrap<PdfWorkerApi>(instance);
        }

        return workerRef.current;
    };

    // Derived status: every state update happens asynchronously, keeping the
    // render/effect flow free of cascading synchronous updates.
    const status: PdfPreviewStatus = !payload
        ? 'idle'
        : failed?.kind === kind && failed.payload === payload
          ? 'error'
          : result?.kind === kind && result.payload === payload
            ? 'ready'
            : 'generating';

    useEffect(() => {
        if (!payload) {
            return;
        }

        let cancelled = false;

        getWorkerApi()
            .render(kind, payload)
            .catch(() => renderPdf(kind, payload))
            .then(async (blob) => {
                if (cancelled) {
                    return;
                }

                if (!blob) {
                    throw new Error('PDF rendering returned no blob.');
                }

                const nextUrl = URL.createObjectURL(blob);
                const previousUrl = lastUrlRef.current;
                lastUrlRef.current = nextUrl;

                if (previousUrl) {
                    URL.revokeObjectURL(previousUrl);
                }

                setFailed(null);
                setResult({ kind, payload, url: nextUrl });
            })
            .catch(() => {
                if (!cancelled) {
                    setFailed({ kind, payload });
                }
            });

        return () => {
            cancelled = true;
        };
    }, [kind, payload]);

    useEffect(
        () => () => {
            workerInstanceRef.current?.terminate();
            workerRef.current = null;
            workerInstanceRef.current = null;

            if (workerBootstrapUrlRef.current) {
                URL.revokeObjectURL(workerBootstrapUrlRef.current);
                workerBootstrapUrlRef.current = null;
            }

            if (lastUrlRef.current) {
                URL.revokeObjectURL(lastUrlRef.current);
                lastUrlRef.current = null;
            }
        },
        [],
    );

    return {
        url:
            status === 'ready' || status === 'generating'
                ? (result?.url ?? null)
                : null,
        status,
    };
}
