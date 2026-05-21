import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    return (
        <AppShell variant="sidebar">
            <div className="relative flex min-h-screen w-full overflow-hidden">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div
                        className="absolute h-300 w-100 rounded-full opacity-50"
                        style={{
                            top: '60%',
                            left: '-5%',
                            background:
                                'radial-gradient(circle, rgba(59, 130, 246, 1) 0%, rgba(59, 130, 246, 0) 70%)',
                            filter: 'blur(200px)',
                        }}
                    />

                    <div
                        className="absolute h-100 w-400 rounded-full opacity-50"
                        style={{
                            top: '110%',
                            left: '10%',
                            background:
                                'radial-gradient(circle, rgba(234, 179, 8, 1) 0%, rgba(234, 179, 8, 0) 70%)',
                            filter: 'blur(300px)',
                        }}
                    />

                    <div
                        className="absolute h-150 w-100 rounded-full opacity-60"
                        style={{
                            top: '50%',
                            left: '95%',
                            background:
                                'radial-gradient(circle, rgba(239, 68, 68, 1) 0%, rgba(239, 68, 68, 0) 70%)',
                            filter: 'blur(200px)',
                        }}
                    />
                </div>

                <AppSidebar />

                <AppContent
                    variant="sidebar"
                    className="relative flex-1 overflow-x-hidden bg-transparent"
                >
                    <AppSidebarHeader breadcrumbs={breadcrumbs} />
                    {/* <div className="m-4 rounded bg-sidebar-foreground"> */}
                    {children}
                    {/* </div> */}
                </AppContent>
            </div>
        </AppShell>
    );
}
