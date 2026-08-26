// resources\js\lib\pdf\spawn-pdf-worker.ts

import PdfWorker from "./pdf-render.worker?worker";

/**
 * Spawns the shared PDF renderer worker.
 *
 * During development the page is served by Laravel (e.g.
 * http://localhost:8000) while Vite serves the module graph from another
 * origin (e.g. http://[::1]:5173). The Worker constructor rejects cross-origin
 * URLs regardless of CORS, so as a dev-only fallback we create a same-origin
 * blob that statically imports the Vite-served worker module: the blob worker
 * inherits the page's origin while its code and dependencies keep loading from
 * Vite. In production builds the emitted worker asset is same-origin, so the
 * direct construction path always succeeds and this branch never runs.
 *
 * Callers must revoke a returned bootstrapUrl once the worker terminates.
 */
export function spawnPdfWorker(): {
    instance: Worker;
    bootstrapUrl: string | null;
} {
    try {
        return { instance: new PdfWorker(), bootstrapUrl: null };
    } catch {
        const workerModule = new URL(
            "./pdf-render.worker.ts?worker_file&type=module",
            import.meta.url,
        ).href;

        const bootstrapUrl = URL.createObjectURL(
            new Blob([`import ${JSON.stringify(workerModule)};`], {
                type: "text/javascript",
            }),
        );

        return {
            instance: new Worker(bootstrapUrl, { type: "module" }),
            bootstrapUrl,
        };
    }
}
