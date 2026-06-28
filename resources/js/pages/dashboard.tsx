import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
} from '@/components/ui/chart';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { DollarSign, FolderTree, Package, Building2 } from 'lucide-react';
import type {
    DashboardStats,
    DashboardExpenseClass,
    DashboardLabelValue,
    DashboardTypeCount,
    DashboardNameCount,
    DashboardCcExpenditure,
    FiscalYear,
} from '@/types/global';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

const EXPENSE_CLASS_COLORS: Record<string, string> = {
    ps: '#3b82f6',
    mooe: '#10b981',
    fe: '#f59e0b',
    co: '#ef4444',
};

const PPA_TYPE_COLORS: Record<string, string> = {
    Program: '#3b82f6',
    Project: '#10b981',
    Activity: '#f59e0b',
    'Sub-Activity': '#8b5cf6',
};

const CHART_COLORS = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#84cc16',
    '#f97316',
    '#6366f1',
];

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

function formatNumber(value: number): string {
    return new Intl.NumberFormat('en-PH').format(value);
}

interface DashboardPageProps {
    draftYear: FiscalYear | null;
    stats: DashboardStats;
    expenseClassBudget: DashboardExpenseClass | null;
    fundingSourceBudget: DashboardLabelValue[];
    ppaTypeDistribution: DashboardTypeCount[];
    topOfficesByBudget: DashboardLabelValue[];
    ppaCountPerOffice: DashboardNameCount[];
    ccExpenditure: DashboardCcExpenditure | null;
}

export default function Dashboard() {
    const props = usePage().props as unknown as DashboardPageProps;

    if (!props.draftYear) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Dashboard" />
                <div className="flex h-full flex-1 items-center justify-center">
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <p className="text-lg text-muted-foreground">
                                No active fiscal year found.
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Please set an active fiscal year in AIP
                                management to view dashboard data.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Home" />
            <ScrollArea className="h-[calc(100vh-3rem)]">
                <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">
                            FY {props.draftYear.year} Dashboard
                        </h2>
                        <span className="text-sm text-muted-foreground">
                            {props.draftYear.status === 'draft'
                                ? 'Active'
                                : props.draftYear.status}
                        </span>
                    </div>

                    <SummaryCards stats={props.stats} />

                    <div className="grid gap-4 lg:grid-cols-2">
                        <ExpenseClassChart data={props.expenseClassBudget} />
                        <FundingSourceChart data={props.fundingSourceBudget} />
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <PpaTypeChart data={props.ppaTypeDistribution} />
                        <CcExpenditureChart data={props.ccExpenditure} />
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <TopOfficesChart data={props.topOfficesByBudget} />
                        <PpaPerOfficeChart data={props.ppaCountPerOffice} />
                    </div>
                </div>

                <ScrollBar orientation="vertical" />
            </ScrollArea>
        </AppLayout>
    );
}

function SummaryCards({ stats }: { stats: DashboardStats }) {
    const cards = [
        {
            title: 'Total AIP Budget',
            value: formatCurrency(stats.totalBudget),
            icon: DollarSign,
            color: 'text-blue-500',
            bg: 'bg-blue-50 dark:bg-blue-950/30',
        },
        {
            title: 'Total PPAs',
            value: formatNumber(stats.totalPpas),
            icon: FolderTree,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        },
        {
            title: 'Price List Items',
            subtitle: `${formatCurrency(stats.totalProcurement)} total procurement`,
            value: formatNumber(stats.totalPriceListItems),
            icon: Package,
            color: 'text-amber-500',
            bg: 'bg-amber-50 dark:bg-amber-950/30',
        },
        {
            title: 'Offices / Users',
            value: `${formatNumber(stats.totalOffices)} / ${formatNumber(stats.totalUsers)}`,
            icon: Building2,
            color: 'text-purple-500',
            bg: 'bg-purple-50 dark:bg-purple-950/30',
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
                <Card key={card.title} size="sm">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {card.title}
                            </CardTitle>
                            <div
                                className={`${card.bg} ${card.color} rounded-lg p-2`}
                            >
                                <card.icon className="h-5 w-5" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{card.value}</div>
                        {card.subtitle && (
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                                {card.subtitle}
                            </p>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function ExpenseClassChart({ data }: { data: DashboardExpenseClass | null }) {
    if (!data) return null;

    const chartData = [
        { name: 'PS', value: data.ps, fill: EXPENSE_CLASS_COLORS.ps },
        { name: 'MOOE', value: data.mooe, fill: EXPENSE_CLASS_COLORS.mooe },
        { name: 'FE', value: data.fe, fill: EXPENSE_CLASS_COLORS.fe },
        { name: 'CO', value: data.co, fill: EXPENSE_CLASS_COLORS.co },
    ];

    const config = {
        ps: { label: 'PS', color: EXPENSE_CLASS_COLORS.ps },
        mooe: { label: 'MOOE', color: EXPENSE_CLASS_COLORS.mooe },
        fe: { label: 'FE', color: EXPENSE_CLASS_COLORS.fe },
        co: { label: 'CO', color: EXPENSE_CLASS_COLORS.co },
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Budget by Expense Class</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={config} className="aspect-[2/1]">
                    <BarChart data={chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="name"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) =>
                                `₱${(v / 1000000).toFixed(1)}M`
                            }
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    formatter={(value: unknown) =>
                                        formatCurrency(Number(value))
                                    }
                                />
                            }
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

function FundingSourceChart({ data }: { data: DashboardLabelValue[] }) {
    if (!data.length) return null;

    const total = data.reduce((sum, d) => sum + d.value, 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Budget by Funding Source</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={{}} className="aspect-[2/1]">
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="label"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            innerRadius={50}
                        >
                            {data.map((entry, i) => (
                                <Cell
                                    key={entry.label}
                                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                                />
                            ))}
                        </Pie>
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    formatter={(...args: unknown[]) =>
                                        `${String(args[1])}: ${formatCurrency(Number(args[0]))}`
                                    }
                                />
                            }
                        />
                        <ChartLegend
                            content={<ChartLegendContent payload={[] as any} />}
                        />
                    </PieChart>
                </ChartContainer>
                <div className="mt-2 text-center text-xs text-muted-foreground">
                    Total: {formatCurrency(total)}
                </div>
            </CardContent>
        </Card>
    );
}

function PpaTypeChart({ data }: { data: DashboardTypeCount[] }) {
    if (!data.length) return null;

    const chartData = data.map((d) => ({
        type: d.type,
        count: d.count,
        fill: PPA_TYPE_COLORS[d.type] || '#6b7280',
    }));

    return (
        <Card>
            <CardHeader>
                <CardTitle>PPA Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={{}} className="aspect-[2/1]">
                    <PieChart>
                        <Pie
                            data={chartData}
                            dataKey="count"
                            nameKey="type"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={(props: unknown) =>
                                `${String((props as Record<string, unknown>).name)}: ${String((props as Record<string, unknown>).value)}`
                            }
                        >
                            {chartData.map((entry) => (
                                <Cell key={entry.type} fill={entry.fill} />
                            ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

function CcExpenditureChart({ data }: { data: DashboardCcExpenditure | null }) {
    if (!data) return null;

    const chartData = [
        {
            name: 'Adaptation',
            value: data.adaptation,
            fill: '#3b82f6',
        },
        {
            name: 'Mitigation',
            value: data.mitigation,
            fill: '#10b981',
        },
    ];

    const config = {
        adaptation: { label: 'Adaptation', color: '#3b82f6' },
        mitigation: { label: 'Mitigation', color: '#10b981' },
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Climate Change Expenditure</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={config} className="aspect-[2/1]">
                    <BarChart data={chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="name"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) =>
                                `₱${(v / 1000000).toFixed(1)}M`
                            }
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    formatter={(value: unknown) =>
                                        formatCurrency(Number(value))
                                    }
                                />
                            }
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

function TopOfficesChart({ data }: { data: DashboardLabelValue[] }) {
    if (!data.length) return null;

    const sorted = [...data].sort((a, b) => b.value - a.value);

    const config = { value: { label: 'Budget' } };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Top Offices by Budget</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={config} className="aspect-[2/1]">
                    <BarChart
                        data={sorted}
                        layout="vertical"
                        margin={{ left: 100, right: 20 }}
                    >
                        <CartesianGrid horizontal={false} />
                        <XAxis
                            type="number"
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) =>
                                `₱${(v / 1000000).toFixed(0)}M`
                            }
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            width={90}
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    formatter={(value: unknown) =>
                                        formatCurrency(Number(value))
                                    }
                                />
                            }
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {sorted.map((entry, i) => (
                                <Cell
                                    key={entry.label}
                                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

function PpaPerOfficeChart({ data }: { data: DashboardNameCount[] }) {
    if (!data.length) return null;

    const config = {
        count: { label: 'PPAs', color: '#3b82f6' },
    };

    const sorted = [...data].sort((a, b) => b.count - a.count);

    return (
        <Card>
            <CardHeader>
                <CardTitle>PPA Count per Office</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={config} className="aspect-[2/1]">
                    <BarChart
                        data={sorted}
                        layout="vertical"
                        margin={{ left: 100, right: 20 }}
                    >
                        <CartesianGrid horizontal={false} />
                        <XAxis
                            type="number"
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={formatNumber}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            width={90}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar
                            dataKey="count"
                            radius={[0, 4, 4, 0]}
                            fill="#3b82f6"
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
