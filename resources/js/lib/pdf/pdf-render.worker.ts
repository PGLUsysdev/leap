// resources\js\lib\pdf\pdf-render.worker.ts

import { expose } from "comlink";
import { renderPdf } from "./render-registry";
import "./worker-shim";

const api = {
    render: renderPdf,
};

export type PdfWorkerApi = typeof api;

expose(api);
