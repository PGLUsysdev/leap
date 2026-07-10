import { AppSidebar } from '@/components/base-ui-components/app-sidebar';
import { SidebarTrigger } from '@/components/base-ui-components/ui/sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <AppSidebar />
            <main>
                <SidebarTrigger />
                {children}
            </main>
        </>
    );
}
