import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { resolveUrl } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();
    return (
        <SidebarGroup className="px-0 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>

            <SidebarMenu className="gap-0">
                {items.map((item, index) => {
                    if (item.type === 'separator') {
                        return (
                            // <div key={`sep-${index}`} className="py-0">
                            //     <Separator />
                            // </div>
                            <span key={`sep-${index}`} className="px-4">
                                --
                            </span>
                        );
                    }

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={page.url.startsWith(
                                    resolveUrl(item.href),
                                )}
                                tooltip={{ children: item.title }}
                                className="h-12 p-4 group-data-[collapsible=icon]:h-12! group-data-[collapsible=icon]:px-4"
                            >
                                <Link href={item.href} prefetch>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
