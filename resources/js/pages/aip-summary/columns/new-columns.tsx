import { createColumnHelper } from '@tanstack/react-table';
import { Decimal } from 'decimal.js';
import type { AipEntry } from '@/types';

const columnHelper = createColumnHelper<AipEntry>();

function formatText(value: string | null | undefined) {
    return value?.trim() ? (
        value
    ) : (
        <div className="text-muted-foreground">-</div>
    );
}

function formatNumeric(value: string | null | undefined) {
    if (!value || Number(value) === 0) {
        return <div className="text-muted-foreground">-</div>;
    }

    return Number(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);

    const month = new Intl.DateTimeFormat('en-US', {
        month: 'short',
    }).format(date);

    const year = new Intl.DateTimeFormat('en-US', {
        year: '2-digit',
    }).format(date);

    return `${month}-${year}`;
}

function formatDateCell(value: string | null | undefined) {
    return value ? (
        formatDate(value)
    ) : (
        <div className="text-muted-foreground">-</div>
    );
}

const columns = [
    columnHelper.accessor('ppa.full_code', {
        size: 400,
        header: () => (
            <div className="text-center text-wrap">AIP Ref. Code</div>
        ),
        cell: (info) => (
            <div className="text-wrap">{formatText(info.getValue())}</div>
        ),
    }),
    columnHelper.accessor('ppa.name', {
        size: 600,
        header: () => (
            <div className="text-center text-wrap">
                Program / Project / Activity Description
            </div>
        ),
        cell: (info) => (
            <div className="text-wrap">{formatText(info.getValue())}</div>
        ),
    }),
    columnHelper.accessor('ppa.office.acronym', {
        size: 400,
        header: () => (
            <div className="text-center text-wrap">
                Implementing Office / Department / Location
            </div>
        ),
        cell: (info) => (
            <div className="text-wrap">{formatText(info.getValue())}</div>
        ),
    }),
    columnHelper.group({
        id: 'schedule',
        size: 500,
        header: () => (
            <div className="text-center text-wrap">
                Schedule of Implementation
            </div>
        ),
        columns: [
            columnHelper.accessor('start_date', {
                size: 100,
                header: () => (
                    <div className="text-center text-wrap">Starting Date</div>
                ),
                cell: (info) => (
                    <div className="text-wrap">
                        {formatDateCell(info.getValue())}
                    </div>
                ),
            }),
            columnHelper.accessor('end_date', {
                size: 100,
                header: () => (
                    <div className="text-center text-wrap">Completion Date</div>
                ),
                cell: (info) => (
                    <div className="text-wrap">
                        {formatDateCell(info.getValue())}
                    </div>
                ),
            }),
        ],
    }),
    columnHelper.accessor('expected_output', {
        size: 600,
        header: () => (
            <div className="text-center text-wrap">Expected Outputs</div>
        ),
        cell: (info) => (
            <div className="text-wrap">{formatText(info.getValue())}</div>
        ),
    }),
    columnHelper.accessor('ppa_funding_sources', {
        id: 'fs',
        size: 400,
        header: () => (
            <div className="text-center text-wrap">Funding Source</div>
        ),
        cell: (info) => {
            const fs = info.row.original.ppa_funding_sources?.[0];

            return (
                <div className="text-wrap">
                    {formatText(fs?.funding_source?.title)}
                </div>
            );
        },
    }),
    columnHelper.group({
        id: 'amount',
        size: 2000,
        header: () => (
            <div className="text-center text-wrap">
                Amount (in Thousand Pesos)
            </div>
        ),
        columns: [
            columnHelper.accessor('ppa_funding_sources', {
                id: 'ps',
                size: 100,
                header: () => (
                    <div className="text-center text-wrap">
                        Personal Services (PS)
                    </div>
                ),
                cell: (info) => {
                    const fs = info.row.original.ppa_funding_sources?.[0];

                    return (
                        <div className="text-right text-wrap slashed-zero tabular-nums">
                            {formatNumeric(fs?.ps_amount)}
                        </div>
                    );
                },
            }),
            columnHelper.accessor('ppa_funding_sources', {
                id: 'mooe',
                size: 100,
                header: () => (
                    <div className="text-center text-wrap">
                        Maintenance & Other Operating Expenses (MOOE)
                    </div>
                ),
                cell: (info) => {
                    const fs = info.row.original.ppa_funding_sources?.[0];

                    return (
                        <div className="text-right text-wrap slashed-zero tabular-nums">
                            {formatNumeric(fs?.mooe_amount)}
                        </div>
                    );
                },
            }),
            columnHelper.accessor('ppa_funding_sources', {
                id: 'fe',
                size: 100,
                header: () => (
                    <div className="text-center text-wrap">
                        Financial Expenses (FE)
                    </div>
                ),
                cell: (info) => {
                    const fs = info.row.original.ppa_funding_sources?.[0];

                    return (
                        <div className="text-right text-wrap slashed-zero tabular-nums">
                            {formatNumeric(fs?.fe_amount)}
                        </div>
                    );
                },
            }),
            columnHelper.accessor('ppa_funding_sources', {
                id: 'co',
                size: 100,
                header: () => (
                    <div className="text-center text-wrap">
                        Capital Outlay (CO)
                    </div>
                ),
                cell: (info) => {
                    const fs = info.row.original.ppa_funding_sources?.[0];

                    return (
                        <div className="text-right text-wrap slashed-zero tabular-nums">
                            {formatNumeric(fs?.co_amount)}
                        </div>
                    );
                },
            }),
            columnHelper.display({
                id: 'total',
                size: 100,
                header: () => (
                    <div className="text-center text-wrap">Total</div>
                ),
                cell: (info) => {
                    const fs = info.row.original.ppa_funding_sources?.[0];

                    if (!fs) {
                        return (
                            <div className="text-right text-wrap slashed-zero tabular-nums">
                                -
                            </div>
                        );
                    }

                    const total = new Decimal(fs.ps_amount || 0)
                        .plus(fs.mooe_amount || 0)
                        .plus(fs.fe_amount || 0)
                        .plus(fs.co_amount || 0);

                    return (
                        <div className="text-right text-wrap slashed-zero tabular-nums">
                            {formatNumeric(total.toString())}
                        </div>
                    );
                },
            }),
        ],
    }),
    columnHelper.group({
        id: 'amount',
        size: 800,
        header: () => (
            <div className="text-center text-wrap">
                Amount of Climate Change Expenditure (in Thousand Pesos)
            </div>
        ),
        columns: [
            columnHelper.accessor('ppa_funding_sources', {
                id: 'cc-adapt',
                size: 100,
                header: () => (
                    <div className="text-center text-wrap">
                        Climate Change Adaptation
                    </div>
                ),
                cell: (info) => {
                    const fs = info.row.original.ppa_funding_sources?.[0];

                    return (
                        <div className="text-right text-wrap slashed-zero tabular-nums">
                            {formatNumeric(fs?.ccet_adaptation)}
                        </div>
                    );
                },
            }),
            columnHelper.accessor('ppa_funding_sources', {
                id: 'cc-mitig',
                size: 100,
                header: () => (
                    <div className="text-center text-wrap">
                        Climate Change Mitigation
                    </div>
                ),
                cell: (info) => {
                    const fs = info.row.original.ppa_funding_sources?.[0];

                    return (
                        <div className="text-right text-wrap slashed-zero tabular-nums">
                            {formatNumeric(fs?.ccet_mitigation)}
                        </div>
                    );
                },
            }),
        ],
    }),
    columnHelper.accessor('ppa_funding_sources', {
        id: 'cc-typo',
        size: 200,
        header: () => (
            <div className="text-center text-wrap">CC Typology Code</div>
        ),
        cell: (info) => {
            const fs = info.row.original.ppa_funding_sources?.[0];

            return (
                <div className="text-wrap">
                    {formatText(fs?.cc_typology?.code)}
                </div>
            );
        },
    }),
];

export default columns;
