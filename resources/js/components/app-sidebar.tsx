import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index } from '@/routes/aip';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { LayoutGrid, FileText, Users, FolderTree } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Annual Investment Programs',
        href: index(),
        icon: FolderTree,
    },
    {
        title: 'PPA Masterlist',
        href: '/ppa',
        icon: FileText,
    },
    {
        title: 'Funding Sources',
        href: '/funding-sources',
        icon: FileText,
    },
    // {
    //     title: 'PPMP Management',
    //     href: '/ppmp-headers',
    //     icon: ShoppingCart,
    // },
    // {
    //     title: 'PPMP Price List',
    //     href: '/ppmp-price-list',
    //     icon: DollarSign,
    // },
    // {
    //     title: 'Chart of Accounts',
    //     href: '/chart-of-accounts',
    //     icon: BookOpen,
    // },
    // {
    //     title: 'Sectors',
    //     href: '/sectors',
    //     icon: Building,
    // },
    {
        title: 'Offices',
        href: '/offices',
        icon: Users,
    },
    {
        title: 'Price Lists',
        href: '/price-lists',
        icon: Users,
    },
];

// const footerNavItems: NavItem[] = [
//     {
//         title: 'Repository',
//         href: 'https://github.com/laravel/react-starter-kit',
//         icon: Folder,
//     },
//     {
//         title: 'Documentation',
//         href: 'https://laravel.com/docs/starter-kits#react',
//         icon: BookOpen,
//     },
// ];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                {/*<NavFooter items={footerNavItems} className="mt-auto" />*/}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
