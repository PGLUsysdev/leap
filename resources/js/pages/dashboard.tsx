import { Head } from '@inertiajs/react';
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
import { Badge } from '@/components/base-ui-components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/base-ui-components/ui/card';
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/base-ui-components/ui/chart';
import type { ChartConfig } from '@/components/base-ui-components/ui/chart';
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

export default function Dashboard({
    draftYear,
    stats,
    expenseClassBudget,
    fundingSourceBudget,
    ppaTypeDistribution,
    ccExpenditure,
    coaBudget,
}: DashboardProps) {
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
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {!draftYear ? (
                    <Card>
                        <CardContent className="text-muted-foreground flex h-64 items-center justify-center">
                            No draft fiscal year found. Set a fiscal year status
                            to “draft” to see budget data.
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-semibold">
                                FY {draftYear.year} Budget Overview
                            </h1>
                            <Badge variant="outline" className="capitalize">
                                {draftYear.status}
                            </Badge>
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
                                    <ChartContainer
                                        config={expenseConfig}
                                        className="min-h-[240px] w-full"
                                    >
                                        <PieChart>
                                            <ChartTooltip
                                                content={
                                                    <ChartTooltipContent
                                                        hideLabel
                                                        formatter={(value) =>
                                                            pesoFull(
                                                                Number(value),
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
                                                {expenseData.map((entry) => (
                                                    <Cell
                                                        key={entry.key}
                                                        fill={entry.fill}
                                                    />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>

                            {fundingData.length > 0 && (
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
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* PPA types */}
                        {ppaTypeDistribution.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>PPA Type Distribution</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer
                                        config={{ count: { label: 'PPAs' } }}
                                        className="min-h-[240px] w-full"
                                    >
                                        <BarChart
                                            accessibilityLayer
                                            data={ppaTypeDistribution}
                                        >
                                            <CartesianGrid vertical={false} />
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
                                </CardContent>
                            </Card>
                        )}

                        {/* Climate change expenditure */}
                        {ccExpenditure && (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <StatCard
                                    title="CC Expenditure — Adaptation"
                                    value={pesoFull(ccExpenditure.adaptation)}
                                />
                                <StatCard
                                    title="CC Expenditure — Mitigation"
                                    value={pesoFull(ccExpenditure.mitigation)}
                                />
                            </div>
                        )}

                        {/* COA budget */}
                        {coaTop.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        Budget by Account (Top 10)
                                    </CardTitle>
                                    <CardDescription>
                                        PS from funding sources; MOOE/FE/CO from
                                        procurement
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer
                                        config={{ value: { label: 'Amount' } }}
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
                                            <CartesianGrid horizontal={false} />
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
                                                        formatter={(value) =>
                                                            pesoFull(
                                                                Number(value),
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
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </div>
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
