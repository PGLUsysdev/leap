import { defineConfig } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel'
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';

export default defineConfig({
    server: {
        host: '0.0.0.0',
        hmr: {
            host: '10.10.26.215', // Replace this with your actual Local IP from Step 1
        },
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        babel({
            presets: [reactCompilerPreset()],
            include: /\.[jt]sx?$/, 
            exclude: /node_modules/
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
    resolve: {
        tsconfigPaths: true,
    },
});
