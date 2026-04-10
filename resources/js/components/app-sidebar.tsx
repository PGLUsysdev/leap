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
import {
    BanknoteArrowUp,
    Briefcase,
    Building2,
    Calculator,
    ClipboardList,
    FileText,
    FolderTree,
    Gem,
    Landmark,
    Layers,
    LayoutGrid,
    PieChart,
    Receipt,
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
    },
    {
        title: 'PPA Masterlist',
        href: '/ppa',
        icon: ClipboardList, // More specific to a "Masterlist" than FileText
    },
    {
        title: 'Offices',
        href: '/offices',
        icon: Building2, // Represents physical/organizational entities
    },
    {
        title: 'Sectors',
        href: '/sectors',
        icon: PieChart, // Represents segments or divisions
    },
    {
        title: 'Lgu Levels',
        href: '/lgu-levels',
        icon: Layers, // Represents hierarchical levels
    },
    {
        title: 'Office Types',
        href: '/office-types',
        icon: Briefcase, // Differentiates categories of work/offices
    },
    { title: '', href: '', type: 'separator' },
    {
        title: 'Price Lists',
        href: '/price-lists',
        icon: Receipt, // Better suited for pricing/billing than Gem
    },
    {
        title: 'PPMP Categories',
        href: '/ppmp-categories',
        icon: Tags,
    },
    {
        title: 'Chart of Accounts',
        href: '/chart-of-accounts',
        icon: Calculator,
    },
    {
        title: 'Funding Sources',
        href: '/funding-sources',
        icon: Landmark, // Represents the institutional source of funds
    },
    { title: '', href: '', type: 'separator' },
    {
        title: 'Users',
        href: '/users',
        icon: Users, // Standardized for people management
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
