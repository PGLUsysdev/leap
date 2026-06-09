import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

function AppProviders({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState<boolean | undefined>(
        undefined,
    );

    useEffect(() => {
        const match = document.cookie.match(/(?:^|;\s*)sidebar_state=([^;]*)/);
        setSidebarOpen(match ? match[1] === 'true' : true);
    }, []);

    // Use a deterministic default to avoid SSR hydration mismatch.
    // The cookie will be read on the client and the state will update after hydration.
    const open = sidebarOpen ?? true;

    return (
        <TooltipProvider>
            <SidebarProvider defaultOpen={open}>{children}</SidebarProvider>
        </TooltipProvider>
    );
}

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <AppProviders>
                    <App {...props} />
                </AppProviders>
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
