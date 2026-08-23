import { AppContent } from "@/components/app-content";
import { AppShell } from "@/components/app-shell";
import { AppSidebar } from "@/components/app-sidebar";
import { AppSidebarHeader } from "@/components/app-sidebar-header";
import type { AppLayoutProps } from "@/types";

export default function AppSidebarLayout({ children, breadcrumbs = [] }: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <div className="relative flex min-h-screen w-full overflow-hidden">
                <div
                    className="pointer-events-none absolute right-0 bottom-0 left-0 opacity-50"
                    style={{
                        height: "20vh",
                        backgroundImage: `
                            radial-gradient(circle at 0% 130%, rgba(59, 130, 246, 0.6) 0%, transparent 50%),
                            radial-gradient(circle at 50% 90%, rgba(234, 179, 8, 0.5) 0%, transparent 40%),
                            radial-gradient(circle at 90% 90%, rgba(239, 68, 68, 0.6) 0%, transparent 30%)
                        `,
                        filter: "blur(200px)",
                    }}
                />
                <AppSidebar />
                <AppContent
                    variant="sidebar"
                    className="relative flex-1 overflow-x-hidden bg-transparent"
                >
                    <AppSidebarHeader breadcrumbs={breadcrumbs} />
                    {children}
                </AppContent>
            </div>
        </AppShell>
    );
}
