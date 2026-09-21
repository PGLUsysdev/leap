import { Head, router } from '@inertiajs/react';
import { createColumnHelper } from '@tanstack/react-table';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    XAxis,
    YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyTitle,
} from '@/components/ui/empty';
import {
    TableSelect,
    TableSelectButton,
    useTableSelect,
} from '@/components/table-select';
import type { Office } from '@/types';
import { dashboard } from '@/routes';

const PALETTE = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
];

type DashboardProps = {
    draftYear: { id: number; year: number; status: string } | null;
    canScopeOffices?: boolean;
    selectedOfficeId?: number | null;
    offices?: Office[];
    stats: {
        totalBudget: number;
        totalPpas: number;
        totalPriceListItems: number;
        totalProcurement: number;
        totalOffices: number;
        totalUsers: number;
    };
    expenseClassBudget: {
        ps: number;
        mooe: number;
        fe: number;
        co: number;
    } | null;
    fundingSourceBudget: { label: string; value: number }[];
    ppaTypeDistribution: { type: string; count: number }[];
    ccExpenditure: { adaptation: number; mitigation: number } | null;
    coaBudget: {
        id: number;
        account_number: string;
        account_title: string;
        expense_class: string;
        value: number;
    }[];
};

function compact(value: number): string {
    const abs = Math.abs(value);

    if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;

    if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;

    if (abs >= 1_000) return `${(value / 1_000).toFixed(0)}K`;

    return String(value);
}

function peso(value: number): string {
    return `₱${compact(value)}`;
}

function pesoFull(value: number): string {
    return `₱${value.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function StatCard({ title, value }: { title: string; value: string }) {
    return (
        <Card>
            <CardHeader className="pb-1">
                <CardDescription>{title}</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums">
                    {value}
                </CardTitle>
            </CardHeader>
        </Card>
    );
}

type LegendPayloadItem = {
    value?: string | number;
    color?: string;
    type?: string;
};

function FundingSourceLegend({ payload }: { payload?: LegendPayloadItem[] }) {
    if (!payload?.length) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-3">
            {payload
                .filter((item) => item.type !== 'none')
                .map((item, index) => (
                    <div
                        key={index}
                        className="flex max-w-[220px] items-center gap-1.5"
                        title={
                            item.value != null ? String(item.value) : undefined
                        }
                    >
                        <div
                            className="h-2 w-2 shrink-0 rounded-[2px]"
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="truncate">{item.value}</span>
                    </div>
                ))}
        </div>
    );
}

const officeColumnHelper = createColumnHelper<Office>();

const officeColumns = [
    officeColumnHelper.accessor('acronym', {
        size: 80,
        header: () => <div className="px-1">Acronym</div>,
        cell: (info) => (
            <div className="px-1 font-medium">{info.getValue() ?? '—'}</div>
        ),
    }),
    officeColumnHelper.accessor('name', {
        header: () => <div className="px-1">Office Name</div>,
        cell: (info) => <div className="px-1 text-wrap">{info.getValue()}</div>,
    }),
];

export default function Dashboard({
    draftYear,
    canScopeOffices = false,
    selectedOfficeId = null,
    offices = [],
    stats,
    expenseClassBudget,
    fundingSourceBudget,
    ppaTypeDistribution,
    ccExpenditure,
    coaBudget,
}: DashboardProps) {
    const officeSelect = useTableSelect<Office>({
        data: offices,
        value: selectedOfficeId?.toString() ?? '',
    });

    function handleOfficeChange(officeId: string | number | null) {
        router.visit(
            dashboard({
                query: {
                    selected_office_id: officeId?.toString() ?? '',
                },
            }).url,
            {},
        );
    }

    const expenseData = expenseClassBudget
        ? (
              [
                  ['ps', 'PS'],
                  ['mooe', 'MOOE'],
                  ['fe', 'FE'],
                  ['co', 'CO'],
              ] as const
          )
              .map(([key], i) => ({
                  key,
                  value: expenseClassBudget[key],
                  fill: PALETTE[i],
              }))
              .filter((d) => d.value > 0)
        : [];

    const expenseConfig = {
        ps: { label: 'PS', color: PALETTE[0] },
        mooe: { label: 'MOOE', color: PALETTE[1] },
        fe: { label: 'FE', color: PALETTE[2] },
        co: { label: 'CO', color: PALETTE[3] },
    } satisfies ChartConfig;

    const fundingData = fundingSourceBudget
        .filter((item) => item.value > 0)
        .map((item, i) => ({
            ...item,
            fill: PALETTE[i % PALETTE.length],
        }));

    const fundingConfig = Object.fromEntries(
        fundingData.map((item) => [item.label, { label: item.label }]),
    ) satisfies ChartConfig;

    const coaTop = [...coaBudget]
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
    const classColor: Record<string, string> = {
        ps: PALETTE[0],
        mooe: PALETTE[1],
        fe: PALETTE[2],
        co: PALETTE[3],
    };

    return (
        <>
            <Head title="Dashboard" />
            <ScrollArea className="h-[calc(100vh-3rem)] w-full rounded-xl">
                <div className="flex flex-1 flex-col gap-4 p-4">
                    {!draftYear ? (
                        <Card>
                            <CardContent className="text-muted-foreground flex h-64 items-center justify-center">
                                No draft fiscal year found. Set a fiscal year
                                status to “draft” to see budget data.
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-lg font-semibold">
                                    FY {draftYear.year} Budget Overview
                                </h1>
                                <Badge variant="outline" className="capitalize">
                                    {draftYear.status}
                                </Badge>
                                {canScopeOffices ? (
                                    officeSelect.selectedItem ? (
                                        <Badge variant="secondary">
                                            {officeSelect.selectedItem
                                                .acronym ||
                                                officeSelect.selectedItem
                                                    .name}
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary">
                                            Whole PGLU · Consolidated
                                        </Badge>
                                    )
                                ) : null}
                                {canScopeOffices && offices.length > 0 && (
                                    <div className="ms-auto w-[220px]">
                                        <TableSelectButton<Office>
                                            hook={officeSelect}
                                            valueKey="id"
                                            placeholder="Whole PGLU (Consolidated)"
                                            displayValue={(office) =>
                                                office
                                                    ? `${office.acronym || office.name}`
                                                    : undefined
                                            }
                                            onClear={() =>
                                                handleOfficeChange(null)
                                            }
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                                <StatCard
                                    title="Total Budget"
                                    value={pesoFull(stats.totalBudget)}
                                />
                                <StatCard
                                    title="Total PPAs"
                                    value={String(stats.totalPpas)}
                                />
                                <StatCard
                                    title="Total Procurement"
                                    value={pesoFull(stats.totalProcurement)}
                                />
                                <StatCard
                                    title="Price List Items"
                                    value={String(stats.totalPriceListItems)}
                                />
                                <StatCard
                                    title="Offices"
                                    value={String(stats.totalOffices)}
                                />
                                <StatCard
                                    title="Users"
                                    value={String(stats.totalUsers)}
                                />
                            </div>

                            {/* Expense classes + funding sources */}
                            <div className="grid gap-4 lg:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            Budget by Expense Class
                                        </CardTitle>
                                        <CardDescription>
                                            FY {draftYear.year}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {expenseData.length > 0 ? (
                                        <ChartContainer
                                            config={expenseConfig}
                                            className="min-h-[240px] w-full"
                                        >
                                            <PieChart>
                                                <ChartTooltip
                                                    content={
                                                        <ChartTooltipContent
                                                            hideLabel
                                                            formatter={(
                                                                value,
                                                            ) =>
                                                                pesoFull(
                                                                    Number(
                                                                        value,
                                                                    ),
                                                                )
                                                            }
                                                        />
                                                    }
                                                />
                                                <ChartLegend
                                                    content={
                                                        <ChartLegendContent nameKey="key" />
                                                    }
                                                />
                                                <Pie
                                                    data={expenseData}
                                                    dataKey="value"
                                                    nameKey="key"
                                                    innerRadius={55}
                                                    minAngle={3}
                                                    stroke="var(--background)"
                                                    strokeWidth={1}
                                                >
                                                    {expenseData.map(
                                                        (entry) => (
                                                            <Cell
                                                                key={entry.key}
                                                                fill={
                                                                    entry.fill
                                                                }
                                                            />
                                                        ),
                                                    )}
                                                </Pie>
                                            </PieChart>
                                        </ChartContainer>
                                        ) : (
                                            <Empty>
                                                <EmptyHeader>
                                                    <EmptyTitle>
                                                        No data to display
                                                    </EmptyTitle>
                                                    <EmptyDescription>
                                                        No budget recorded for
                                                        FY {draftYear.year} in
                                                        this scope yet.
                                                    </EmptyDescription>
                                                </EmptyHeader>
                                            </Empty>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            Budget by Funding Source
                                        </CardTitle>
                                        <CardDescription>
                                            FY {draftYear.year}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {fundingData.length > 0 ? (
                                        <ChartContainer
                                            config={fundingConfig}
                                            className="min-h-[240px] w-full"
                                        >
                                                <PieChart>
                                                    <ChartTooltip
                                                        content={
                                                            <ChartTooltipContent
                                                                hideLabel
                                                                nameKey="label"
                                                                formatter={(
                                                                    value,
                                                                ) =>
                                                                    pesoFull(
                                                                        Number(
                                                                            value,
                                                                        ),
                                                                    )
                                                                }
                                                            />
                                                        }
                                                    />
                                                    <ChartLegend
                                                        content={
                                                            <FundingSourceLegend />
                                                        }
                                                    />
                                                    <Pie
                                                        data={fundingData}
                                                        dataKey="value"
                                                        nameKey="label"
                                                        innerRadius={55}
                                                        minAngle={3}
                                                        stroke="var(--background)"
                                                        strokeWidth={1}
                                                    >
                                                        {fundingData.map(
                                                            (entry) => (
                                                                <Cell
                                                                    key={
                                                                        entry.label
                                                                    }
                                                                    fill={
                                                                        entry.fill
                                                                    }
                                                                />
                                                            ),
                                                        )}
                                                    </Pie>
                                            </PieChart>
                                        </ChartContainer>
                                        ) : (
                                            <Empty>
                                                <EmptyHeader>
                                                    <EmptyTitle>
                                                        No data to display
                                                    </EmptyTitle>
                                                    <EmptyDescription>
                                                        No funding source
                                                        budgets for FY{' '}
                                                        {draftYear.year} in
                                                        this scope yet.
                                                    </EmptyDescription>
                                                </EmptyHeader>
                                            </Empty>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* PPA types */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        PPA Type Distribution
                                    </CardTitle>
                                    <CardDescription>
                                        FY {draftYear.year}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {ppaTypeDistribution.length > 0 ? (
                                    <ChartContainer
                                            config={{
                                                count: { label: 'PPAs' },
                                            }}
                                            className="min-h-[240px] w-full"
                                        >
                                            <BarChart
                                                accessibilityLayer
                                                data={ppaTypeDistribution}
                                            >
                                                <CartesianGrid
                                                    vertical={false}
                                                />
                                                <XAxis
                                                    dataKey="type"
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickMargin={8}
                                                />
                                                <ChartTooltip
                                                    content={
                                                        <ChartTooltipContent
                                                            hideLabel
                                                        />
                                                    }
                                                />
                                                <Bar
                                                    dataKey="count"
                                                    fill="var(--chart-2)"
                                                    radius={4}
                                                />
                                            </BarChart>
                                        </ChartContainer>
                                    ) : (
                                        <Empty>
                                            <EmptyHeader>
                                                <EmptyTitle>
                                                    No data to display
                                                </EmptyTitle>
                                                <EmptyDescription>
                                                    No PPAs recorded for FY{' '}
                                                    {draftYear.year} in this
                                                    scope yet.
                                                </EmptyDescription>
                                            </EmptyHeader>
                                        </Empty>
                                    )}
                                    </CardContent>
                                </Card>

                            {/* Climate change expenditure */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <StatCard
                                    title="CC Expenditure — Adaptation"
                                    value={pesoFull(
                                        ccExpenditure?.adaptation ?? 0,
                                    )}
                                />
                                <StatCard
                                    title="CC Expenditure — Mitigation"
                                    value={pesoFull(
                                        ccExpenditure?.mitigation ?? 0,
                                    )}
                                />
                            </div>

                            {/* COA budget */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        Budget by Account (Top 10)
                                    </CardTitle>
                                    <CardDescription>
                                        PS from funding sources; MOOE/FE/CO
                                        from procurement
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {coaTop.length > 0 ? (
                                    <ChartContainer
                                            config={{
                                                value: { label: 'Amount' },
                                            }}
                                            className="min-h-[300px] w-full"
                                        >
                                            <BarChart
                                                accessibilityLayer
                                                layout="vertical"
                                                data={coaTop.map((c) => ({
                                                    ...c,
                                                    name: `${c.account_number} ${c.account_title}`,
                                                }))}
                                                margin={{ left: 12, right: 16 }}
                                            >
                                                <CartesianGrid
                                                    horizontal={false}
                                                />
                                                <XAxis
                                                    type="number"
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickFormatter={(v) =>
                                                        peso(Number(v))
                                                    }
                                                />
                                                <YAxis
                                                    type="category"
                                                    dataKey="name"
                                                    tickLine={false}
                                                    axisLine={false}
                                                    width={260}
                                                />
                                                <ChartTooltip
                                                    content={
                                                        <ChartTooltipContent
                                                            hideLabel
                                                            formatter={(
                                                                value,
                                                            ) =>
                                                                pesoFull(
                                                                    Number(
                                                                        value,
                                                                    ),
                                                                )
                                                            }
                                                        />
                                                    }
                                                />
                                                <Bar
                                                    dataKey="value"
                                                    radius={[0, 4, 4, 0]}
                                                >
                                                    {coaTop.map((entry) => (
                                                        <Cell
                                                            key={entry.id}
                                                            fill={
                                                                classColor[
                                                                    entry
                                                                        .expense_class
                                                                ] ?? PALETTE[4]
                                                            }
                                                        />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ChartContainer>
                                    ) : (
                                        <Empty>
                                            <EmptyHeader>
                                                <EmptyTitle>
                                                    No data to display
                                                </EmptyTitle>
                                                <EmptyDescription>
                                                    No account-level budgets
                                                    for FY {draftYear.year} in
                                                    this scope yet.
                                                </EmptyDescription>
                                            </EmptyHeader>
                                        </Empty>
                                    )}
                                    </CardContent>
                                </Card>
                        </>
                    )}
                </div>
                <ScrollBar orientation="vertical" />
            </ScrollArea>

            {canScopeOffices && (
                <TableSelect<Office>
                    data={offices}
                    columns={officeColumns}
                    open={officeSelect.open}
                    onOpenChange={officeSelect.setOpen}
                    onRowSelect={(office) => handleOfficeChange(office.id)}
                    value={selectedOfficeId?.toString() ?? ''}
                    valueKey="id"
                    title="Select Office"
                    description="View consolidated figures or narrow to one office."
                />
            )}
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
