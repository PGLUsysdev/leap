import { Link, usePage } from '@inertiajs/react';
import {
    // BookOpen,
    // FolderGit2,
    LayoutGrid,
    Briefcase,
    Building2,
    Calculator,
    ClipboardList,
    FolderTree,
    Landmark,
    Layers,
    PieChart,
    Receipt,
    ShieldCheck,
    Tags,
    Users,
    ChartNetwork,
    Waypoints,
    Network,
    Scale,
    AppWindow,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
// import { NavFooter } from "@/components/nav-footer";
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
import { index as aipIndex } from '@/routes/aip';
import { index as ccStrategicPriorityIndex } from '@/routes/cc-strategic-priority';
import { index as ccSubSectorIndex } from '@/routes/cc-sub-sector';
import { index as ccTypologyIndex } from '@/routes/cc-typology';
import { manage as chartOfAccountsManage } from '@/routes/chart-of-accounts';
import { index as fundingSourcesIndex } from '@/routes/funding-sources';
import { index as iosIndex } from '@/routes/ios';
import { index as lguLevelsIndex } from '@/routes/lgu-levels';
import { index as officeTypesIndex } from '@/routes/office-types';
import { index as officesIndex } from '@/routes/offices';
import { index as positionIndex } from '@/routes/position';
import { index as ppaIndex } from '@/routes/ppa';
import { index as ppmpCategoriesIndex } from '@/routes/ppmp-categories';
import { index as priceListsIndex } from '@/routes/price-lists';
import { index as rolesIndex } from '@/routes/roles';
import { index as salaryStandardIndex } from '@/routes/salary-standard';
import { index as sectorsIndex } from '@/routes/sectors';
import { index as usersIndex } from '@/routes/users';
import type { NavItem, SharedData } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: '',
        href: '',
        type: 'separator',
    },
    {
        title: 'Annual Investment Programs',
        href: aipIndex(),
        icon: FolderTree,
        permission: 'fiscal-year.view',
    },
    {
        title: 'PPA Masterlist',
        href: ppaIndex(),
        icon: ClipboardList,
        permission: 'ppa.view',
    },
    {
        title: 'Offices',
        href: officesIndex(),
        icon: Building2,
        permission: 'office.view',
    },
    {
        title: 'Sectors',
        href: sectorsIndex(),
        icon: PieChart,
        permission: 'sector.view',
    },
    {
        title: 'LGU Levels',
        href: lguLevelsIndex(),
        icon: Layers,
        permission: 'lgu-level.view',
    },
    {
        title: 'Office Types',
        href: officeTypesIndex(),
        icon: Briefcase,
        permission: 'office-type.view',
    },
    {
        title: '',
        href: '',
        type: 'separator',
    },
    {
        title: 'Price Lists',
        href: priceListsIndex(),
        icon: Receipt,
        permission: 'price-list.view',
    },
    {
        title: 'PPMP Categories',
        href: ppmpCategoriesIndex(),
        icon: Tags,
        permission: 'ppmp-category.view',
    },
    {
        title: 'Chart of Accounts',
        href: chartOfAccountsManage(),
        icon: Calculator,
        permission: 'chart-of-account.view',
    },
    {
        title: 'Funding Sources',
        href: fundingSourcesIndex(),
        icon: Landmark,
        permission: 'funding-source.view',
    },
    {
        title: '',
        href: '',
        type: 'separator',
    },
    {
        title: 'CC Typology',
        href: ccTypologyIndex(),
        icon: ChartNetwork,
        permission: 'cc-typology.view',
    },
    {
        title: 'CC Strategic Priorities',
        href: ccStrategicPriorityIndex(),
        icon: Waypoints,
        permission: 'cc-strategic-priority.view',
    },
    {
        title: 'CC Sub Sectors',
        href: ccSubSectorIndex(),
        icon: Network,
        permission: 'cc-sub-sector.view',
    },
    {
        title: '',
        href: '',
        type: 'separator',
    },
    {
        title: 'Salary Standards',
        href: salaryStandardIndex(),
        icon: Scale,
        permission: 'salary-standard.view',
    },
    {
        title: 'IOS',
        href: iosIndex(),
        icon: AppWindow,
        permission: 'ios.view',
    },
    {
        title: 'Positions',
        href: positionIndex(),
        icon: Briefcase,
        permission: 'position.view',
    },
    {
        title: '',
        href: '',
        type: 'separator',
    },
    {
        title: 'Roles',
        href: rolesIndex(),
        icon: ShieldCheck,
        permission: 'role.view',
    },
    {
        title: 'Users',
        href: usersIndex(),
        icon: Users,
        permission: 'user.view',
    },
];

// const footerNavItems: NavItem[] = [
//     {
//         title: "Repository",
//         href: "https://github.com/laravel/react-starter-kit",
//         icon: FolderGit2,
//     },
//     {
//         title: "Documentation",
//         href: "https://laravel.com/docs/starter-kits#react",
//         icon: BookOpen,
//     },
// ];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const permissions = new Set(auth.permissions ?? []);

    const allowedItems = mainNavItems.filter(
        (item) => !item.permission || permissions.has(item.permission),
    );

    const filteredNavItems = allowedItems.filter((item, index) => {
        if (item.type === 'separator') {
            const nextItem = allowedItems[index + 1];

            if (!nextItem || nextItem.type === 'separator') {
                return false;
            }
        }

        return true;
    });

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
                {/*<NavMain items={mainNavItems} />*/}
                <NavMain items={filteredNavItems} />
            </SidebarContent>

            <SidebarFooter>
                {/*<NavFooter items={footerNavItems} className="mt-auto" />*/}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
