import inertia from "@inertiajs/vite";
import { wayfinder } from "@laravel/vite-plugin-wayfinder";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
// import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import laravel from "laravel-vite-plugin";
import { bunny } from "laravel-vite-plugin/fonts";
import { defineConfig } from "vite";

// import babel from '@rolldown/plugin-babel'
// import { readFileSync } from 'fs';

// const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
// const appVersion = packageJson.version;

export default defineConfig({
    // server: {
    //     host: true,
    //     hmr: {
    //         host: '10.10.26.228',
    //     },
    // },
    // define: {
    //     '__APP_VERSION__': JSON.stringify(appVersion),
    // },
    plugins: [
        laravel({
            input: ["resources/css/app.css", "resources/js/app.tsx"],
            refresh: true,
            fonts: [
                bunny("Instrument Sans", {
                    weights: [400, 500, 600],
                }),
            ],
        }),
        inertia(),
        react({
            babel: {
                plugins: ["babel-plugin-react-compiler"],
            },
        }),
        // react(),
        // babel({
        //     presets: [reactCompilerPreset()],
        //     include: /\.[jt]sx?$/,
        //     exclude: /node_modules/
        // }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
    // resolve: {
    //     tsconfigPaths: true,
    // },
});
