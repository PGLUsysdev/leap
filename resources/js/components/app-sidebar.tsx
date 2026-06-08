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
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    Briefcase,
    Building2,
    Calculator,
    ClipboardList,
    FolderTree,
    Landmark,
    Layers,
    LayoutGrid,
    PieChart,
    Receipt,
    ShieldCheck,
    Tags,
    Users,
} from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    { title: '', href: '', type: 'separator' },
    {
        title: 'Annual Investment Programs',
        href: index(),
        icon: FolderTree,
        permission: 'fiscal-year.view',
    },
    {
        title: 'PPA Masterlist',
        href: '/ppa',
        icon: ClipboardList,
        permission: 'ppa.view',
    },
    {
        title: 'Offices',
        href: '/offices',
        icon: Building2,
        permission: 'office.view',
    },
    {
        title: 'Sectors',
        href: '/sectors',
        icon: PieChart,
        permission: 'sector.view',
    },
    {
        title: 'Lgu Levels',
        href: '/lgu-levels',
        icon: Layers,
        permission: 'lgu-level.view',
    },
    {
        title: 'Office Types',
        href: '/office-types',
        icon: Briefcase,
        permission: 'office-type.view',
    },
    { title: '', href: '', type: 'separator' },
    {
        title: 'Price Lists',
        href: '/price-lists',
        icon: Receipt,
        permission: 'price-list.view',
    },
    {
        title: 'PPMP Categories',
        href: '/ppmp-categories',
        icon: Tags,
        permission: 'ppmp-category.view',
    },
    {
        title: 'Chart of Accounts',
        href: '/chart-of-accounts',
        icon: Calculator,
        permission: 'chart-of-account.view',
    },
    {
        title: 'Funding Sources',
        href: '/funding-sources',
        icon: Landmark,
        permission: 'funding-source.view',
    },
    { title: '', href: '', type: 'separator' },
    {
        title: 'Roles',
        href: '/roles',
        icon: ShieldCheck,
        permission: 'role.view',
    },
    {
        title: 'Users',
        href: '/users',
        icon: Users,
        permission: 'user.view',
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
    const { auth } = usePage<SharedData>().props;
    const permissions = new Set(auth.permissions ?? []);
    const filteredNavItems = mainNavItems.filter(
        (item) => !item.permission || permissions.has(item.permission),
    );

    return (
        <Sidebar collapsible="icon" variant="inset" className="border-r">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            className="h-12 p-2 group-data-[collapsible=icon]:h-12! group-data-[collapsible=icon]:px-2"
                        >
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={filteredNavItems} />
            </SidebarContent>

            <SidebarFooter>
                {/*<NavFooter items={footerNavItems} className="mt-auto" />*/}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
