import { createColumnHelper } from '@tanstack/react-table';

export interface PersonnelScheduleItem {
    id: number;
    item_number: string | null;
    old: string | null;
    new: string | null;
    position_title: string | null;
    incumbent_name: string | null;
    current_year_sg_step: string | null;
    current_year_amount: string | null;
    proposed_sg_step: string | null;
    proposed_amount: string | null;
    increase_decrease: string | null;
    step_increment_effectivity: string | null;
}

const columnHelper = createColumnHelper<PersonnelScheduleItem>();

function formatText(value: string | null | undefined) {
    return value?.trim() ? (
        value
    ) : (
        <div className="text-muted-foreground">-</div>
    );
}

function formatAmount(value: string | null | undefined) {
    if (!value || Number(value) === 0) {
        return <div className="text-muted-foreground text-right">-</div>;
    }

    return (
        <div className="text-right slashed-zero tabular-nums">
            {Number(value).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })}
        </div>
    );
}

const columns = [
    columnHelper.group({
        id: 'item_number',
        size: 200,
        header: () => <div className="text-center text-wrap">Item Number</div>,
        columns: [
            columnHelper.accessor('old', {
                id: 'old',
                size: 100,
                header: () => <div className="text-center text-wrap">Old</div>,
                cell: (info) => (
                    <div className="text-center text-wrap">
                        {formatText(info.getValue())}
                    </div>
                ),
            }),
            columnHelper.accessor('new', {
                id: 'new',
                size: 100,
                header: () => <div className="text-center text-wrap">New</div>,
                cell: (info) => (
                    <div className="text-center text-wrap">
                        {formatText(info.getValue())}
                    </div>
                ),
            }),
        ],
    }),
    columnHelper.accessor('position_title', {
        id: 'position_title',
        size: 300,
        header: () => (
            <div className="text-center text-wrap">Position Title</div>
        ),
        cell: (info) => (
            <div className="text-wrap">{formatText(info.getValue())}</div>
        ),
    }),
    columnHelper.accessor('incumbent_name', {
        id: 'incumbent_name',
        size: 200,
        header: () => (
            <div className="text-center text-wrap">Name of Incumbent</div>
        ),
        cell: (info) => (
            <div className="text-wrap">{formatText(info.getValue())}</div>
        ),
    }),
    columnHelper.group({
        id: 'current-year',
        size: 240,
        header: () => (
            <div className="text-center text-wrap">
                Current Year Authorized Rate/Annum
            </div>
        ),
        columns: [
            columnHelper.accessor('current_year_sg_step', {
                id: 'current_year_sg_step',
                size: 120,
                header: () => (
                    <div className="text-center text-wrap">
                        Salary Grade (SG)/Step
                    </div>
                ),
                cell: (info) => (
                    <div className="text-center text-wrap">
                        {formatText(info.getValue())}
                    </div>
                ),
            }),
            columnHelper.accessor('current_year_amount', {
                id: 'current_year_amount',
                size: 120,
                header: () => (
                    <div className="text-center text-wrap">Amount</div>
                ),
                cell: (info) => formatAmount(info.getValue()),
            }),
        ],
    }),
    columnHelper.group({
        id: 'budget-year',
        size: 240,
        header: () => (
            <div className="text-center text-wrap">
                Budget Year Proposed Rate/Annum
            </div>
        ),
        columns: [
            columnHelper.accessor('proposed_sg_step', {
                id: 'proposed_sg_step',
                size: 120,
                header: () => (
                    <div className="text-center text-wrap">
                        Salary Grade (SG)/Step
                    </div>
                ),
                cell: (info) => (
                    <div className="text-center text-wrap">
                        {formatText(info.getValue())}
                    </div>
                ),
            }),
            columnHelper.accessor('proposed_amount', {
                id: 'proposed_amount',
                size: 120,
                header: () => (
                    <div className="text-center text-wrap">Amount</div>
                ),
                cell: (info) => formatAmount(info.getValue()),
            }),
        ],
    }),
    columnHelper.accessor('increase_decrease', {
        id: 'increase_decrease',
        size: 140,
        header: () => (
            <div className="text-center text-wrap">Increase/Decrease</div>
        ),
        cell: (info) => formatAmount(info.getValue()),
    }),
    columnHelper.accessor('step_increment_effectivity', {
        id: 'step_increment_effectivity',
        size: 200,
        header: () => (
            <div className="text-center text-wrap">
                Effectivity of Step Increment
            </div>
        ),
        cell: (info) => (
            <div className="text-center text-wrap">
                {formatText(info.getValue())}
            </div>
        ),
    }),
];

export default columns;
