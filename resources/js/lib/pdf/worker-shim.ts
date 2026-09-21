// resources\js\lib\pdf\worker-shim.ts

// Makes @react-pdf/renderer usable inside a Vite module worker:
// polyfills window/global expected by its browser build and stubs the
// react-refresh preamble injected by @vitejs/plugin-react during HMR.
// See https://github.com/shkreios/vite-react-pdf-renderer-web-worker

interface HotWorkerSelf {
    global?: unknown;
    window?: unknown;
    $RefreshReg$?: () => void;
    $RefreshSig$?: () => (type: unknown) => unknown;
    __vite_plugin_react_preamble_installed__?: boolean;
}

const shimmedSelf = self as typeof self & HotWorkerSelf;

// Workers have no window/global until we alias them to the worker scope.
if (typeof window === 'undefined') {
    shimmedSelf.global = self;
    shimmedSelf.window = self;
}

if (import.meta.hot) {
    shimmedSelf.$RefreshReg$ = () => {};
    shimmedSelf.$RefreshSig$ = () => (type) => type;
    shimmedSelf.__vite_plugin_react_preamble_installed__ = true;
}
