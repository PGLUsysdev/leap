import { Link } from '@inertiajs/react';
import {
    ScrollArea,
    ScrollBar,
} from '@/components/base-ui-components/ui/scroll-area';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/base-ui-components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        // 1. Allow this group to grow and shrink properly
        <SidebarGroup className="min-h-0 flex-1 px-0 py-0 pl-2">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>

            {/* 2. The menu is already a flex column; add flex-1 & min-h-0 */}
            <SidebarMenu className="min-h-0 flex-1">
                {/* 3. ScrollArea must also have min-h-0 to allow shrinking */}
                <ScrollArea className="min-h-0 flex-1">
                    {items.map((item, index) => {
                        if (item.type === 'separator') {
                            return (
                                <span key={`sep-${index}`} className="px-4">
                                    -
                                </span>
                            );
                        }

                        return (
                            <SidebarMenuItem
                                key={item.title}
                                className="mr-4 py-[0.1rem]"
                            >
                                <SidebarMenuButton
                                    asChild
                                    isActive={isCurrentUrl(item.href)}
                                    tooltip={{ children: item.title }}
                                >
                                    <Link href={item.href} prefetch>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}

                    {/*<ScrollBar orientation="vertical" />*/}
                </ScrollArea>
            </SidebarMenu>
        </SidebarGroup>
    );
}

// Glad it’s working perfectly! The combination of flex-1 and min-h-0 on all the flex items in the chain (SidebarGroup → SidebarMenu → ScrollArea) is what makes it possible for the scroll area to collapse to the remaining space and actually scroll. If you run into any other layout quirks down the line, just let me know.
