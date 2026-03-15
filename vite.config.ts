import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
// import react, { reactCompilerPreset } from '@vitejs/plugin-react';
// import babel from '@rolldown/plugin-babel';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';
// import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        // babel({
        //     presets: [reactCompilerPreset()],
        //     include: /\.[jt]sx?$/,
        //     exclude: /node_modules/,
        //     // } as any),
        // }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
    // resolve: {
    //     alias: {
    //         '@': path.resolve(__dirname, './resources/js'),
    //     },
    // },
    esbuild: {
        jsx: 'automatic',
    },
});
