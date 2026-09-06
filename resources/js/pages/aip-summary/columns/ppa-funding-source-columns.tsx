import { createColumnHelper } from '@tanstack/react-table';
import type { Row, Table } from '@tanstack/react-table';
import {
    Trash,
    List,
    UserRound,
    // Landmark,
    // Construction,
    ShoppingBasket,
} from 'lucide-react';
import { useState } from 'react';
import {
    TableSelectButton,
    useTableSelect,
} from '@/components/base-ui-components/table-select';
import { Button } from '@/components/base-ui-components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    // DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/base-ui-components/ui/dropdown-menu';
import { Input } from '@/components/base-ui-components/ui/input';
import type { CcTypology, PpaFundingSource } from '@/types';

type AmountField =
    | 'ps_amount'
    | 'fe_amount'
    | 'ccet_adaptation'
    | 'ccet_mitigation';

function formatAmount(value: string | number | null | undefined): string {
    const num = Number(value);

    if (
        value === null ||
        value === undefined ||
        value === '' ||
        Number.isNaN(num)
    ) {
        return '';
    }

    return num.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

// Standalone input cell using local draft state while typing
function EditableAmountCell({
    value,
    onSave,
    disabled,
    tooltip,
}: {
    value: string | number | null | undefined;
    onSave: (val: number) => void;
    disabled: boolean;
    tooltip: string;
}) {
    const [localValue, setLocalValue] = useState(
        value == null ? '' : formatAmount(value),
    );

    const handleSave = () => {
        const raw = localValue.replace(/,/g, '').trim();
        const numericVal = raw === '' ? 0 : parseFloat(raw);

        if (isNaN(numericVal)) {
            setLocalValue(value == null ? '' : formatAmount(value));

            return;
        }

        setLocalValue(raw === '' ? '' : formatAmount(numericVal));

        if (numericVal !== Number(value)) {
            onSave(numericVal);
        }
    };

    return (
        <Input
            type="text"
            inputMode="decimal"
            className="text-right"
            value={localValue}
            onChange={(e) => {
                const cleaned = e.target.value.replace(/[^0-9.,\- ]/g, '');

                setLocalValue(cleaned);
            }}
            onFocus={(e) => {
                const el = e.currentTarget;
                el.value = el.value.replace(/,/g, '');
                setLocalValue(el.value);
                el.select();
            }}
            onBlur={handleSave}
            onDragStart={(e) => e.preventDefault()}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.currentTarget.blur();
                }
            }}
            disabled={disabled}
            title={tooltip}
            autoComplete="off"
        />
    );
}

// Cell for CC Typology: only a button, the actual TableSelect is a sibling of the main dialog
function EditableCcTypologyCell({
    value,
    ccTypologies,
    onOpen,
    onClear,
    disabled,
}: {
    value: number | null | undefined;
    ccTypologies: CcTypology[];
    onOpen: () => void;
    onClear: () => void;
    disabled: boolean;
}) {
    const hook = useTableSelect({
        data: ccTypologies,
        value: value != null ? String(value) : undefined,
        valueKey: 'id',
    });

    // Override openDialog to call parent's onOpen
    const customHook = {
        ...hook,
        openDialog: onOpen,
    };

    return (
        <TableSelectButton
            hook={customHook}
            displayValue={(item) => item?.code}
            placeholder="Select"
            valueKey="id"
            disabled={disabled}
            onClear={onClear}
        />
    );
}

function AmountCell({
    row,
    table,
    field,
}: {
    row: Row<PpaFundingSource>;
    table: Table<PpaFundingSource>;
    field: AmountField;
}) {
    const meta = table.options.meta;
    const isPs = field === 'ps_amount';
    const isPool = Boolean(meta?.isPsPool);
    // A PS pool holds only PS — every other amount is locked on it,
    // and PS is locked everywhere else.
    const isDisabled = isPs ? !isPool : isPool;
    const tooltip = isDisabled
        ? isPs
            ? 'PS can only be edited for PS Pool PPAs'
            : 'A PS Pool can only contain PS amounts'
        : '';

    return (
        <EditableAmountCell
            value={row.original[field]}
            disabled={isDisabled}
            tooltip={tooltip}
            onSave={(val) => meta?.onSaveAmount?.(row.original.id, field, val)}
        />
    );
}

const columnHelper = createColumnHelper<PpaFundingSource>();

const columns = [
    columnHelper.accessor('funding_source.code', {
        size: 100,
        header: () => (
            <div className="text-center text-wrap">Funding Source</div>
        ),
        cell: (info) => (
            <div className="text-center text-wrap">{info.getValue()}</div>
        ),
    }),
    columnHelper.accessor('ps_amount', {
        size: 100,
        header: () => (
            <div className="text-center text-wrap">Personal Services (PS)</div>
        ),
        cell: (info) => (
            <AmountCell row={info.row} table={info.table} field="ps_amount" />
        ),
    }),
    columnHelper.accessor('mooe_amount', {
        size: 100,
        header: () => (
            <div className="text-center text-wrap">
                Maintenance & Other Operating Expenses (MOOE)
            </div>
        ),
        cell: (info) => (
            <div className="text-center text-wrap">{info.getValue()}</div>
        ),
    }),
    columnHelper.accessor('fe_amount', {
        size: 100,
        header: () => (
            <div className="text-center text-wrap">Financial Expenses (FE)</div>
        ),
        cell: (info) => (
            <AmountCell row={info.row} table={info.table} field="fe_amount" />
        ),
    }),
    columnHelper.accessor('co_amount', {
        size: 100,
        header: () => (
            <div className="text-center text-wrap">Capital Outlay (CO)</div>
        ),
        cell: (info) => (
            <div className="text-center text-wrap">{info.getValue()}</div>
        ),
    }),
    columnHelper.display({
        id: 'total',
        size: 100,
        header: () => <div className="text-center text-wrap">Total</div>,
        cell: () => <div className="text-center text-wrap">-</div>,
    }),
    columnHelper.accessor('ccet_adaptation', {
        size: 100,
        header: () => (
            <div className="text-center text-wrap">
                Climate Change Adaptation
            </div>
        ),
        cell: (info) => (
            <AmountCell
                row={info.row}
                table={info.table}
                field="ccet_adaptation"
            />
        ),
    }),
    columnHelper.accessor('ccet_mitigation', {
        size: 100,
        header: () => (
            <div className="text-center text-wrap">
                Climate Change Mitigation
            </div>
        ),
        cell: (info) => (
            <AmountCell
                row={info.row}
                table={info.table}
                field="ccet_mitigation"
            />
        ),
    }),
    columnHelper.accessor('cc_typology.code', {
        size: 100,
        header: () => (
            <div className="text-center text-wrap">CC Typology Code</div>
        ),
        cell: ({ row, table }) => {
            const meta = table.options.meta;
            const poolLocked = Boolean(meta?.isPsPool);

            return (
                <div
                    title={
                        poolLocked
                            ? 'A PS Pool can only contain PS amounts'
                            : undefined
                    }
                >
                    <EditableCcTypologyCell
                        value={row.original.cc_typology_id}
                        ccTypologies={meta?.ccTypologies ?? []}
                        onOpen={() => meta?.onSaveCcTypology?.(row.original.id)}
                        onClear={() =>
                            meta?.onClearCcTypology?.(row.original.id)
                        }
                        disabled={Boolean(meta?.isSaving) || poolLocked}
                    />
                </div>
            );
        },
    }),
    columnHelper.display({
        id: 'actions',
        size: 83,
        cell: ({ row, table }) => {
            const rowData = row.original;
            const meta = table.options.meta;
            const isOptimistic = (rowData as any).isOptimistic === true;
            const poolLocked = Boolean(meta?.isPsPool);

            return (
                <div className="flex gap-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={<Button size="icon" variant="outline" />}
                        >
                            <List />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-36">
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                    disabled={poolLocked}
                                    onClick={() =>
                                        meta?.onOpenPpmp?.(rowData.id)
                                    }
                                    title={
                                        poolLocked
                                            ? 'A PS Pool cannot have PPMP items'
                                            : undefined
                                    }
                                >
                                    <ShoppingBasket />
                                    PPMP
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuItem
                                onClick={() => {
                                    console.log('to ps breakdown');
                                }}
                            >
                                <UserRound /> PS Breakdown
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                        size="icon"
                        variant="destructive"
                        onClick={() =>
                            (
                                meta?.onDelete as
                                    | ((id: number) => void)
                                    | undefined
                            )?.(rowData.id)
                        }
                        disabled={
                            isOptimistic ||
                            poolLocked ||
                            Boolean(meta?.disabled)
                        }
                        title={
                            poolLocked
                                ? 'PS Pool funding sources cannot be deleted'
                                : undefined
                        }
                    >
                        <Trash />
                    </Button>
                </div>
            );
        },
    }),
];

export default columns;
