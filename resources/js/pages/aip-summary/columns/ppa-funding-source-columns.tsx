import { createColumnHelper } from '@tanstack/react-table';
import { Trash } from 'lucide-react';
import { Button } from '@/components/base-ui-components/ui/button';
import type { PpaFundingSource } from '@/types';

const columnHelper = createColumnHelper<PpaFundingSource>();

const columns = [
    columnHelper.accessor('funding_source.code', {
        size: 100,
        header: () => <div className="text-center text-wrap">Code</div>,
        cell: (info) => (
            <div className="text-center text-wrap">{info.getValue()}</div>
        ),
    }),
    columnHelper.accessor('ps_amount', {
        size: 100,
        header: () => <div className="text-center text-wrap">Code</div>,
        cell: (info) => (
            <div className="text-center text-wrap">{info.getValue()}</div>
        ),
    }),
    columnHelper.accessor('mooe_amount', {
        size: 100,
        header: () => <div className="text-center text-wrap">Code</div>,
        cell: (info) => (
            <div className="text-center text-wrap">{info.getValue()}</div>
        ),
    }),
    columnHelper.accessor('fe_amount', {
        size: 100,
        header: () => <div className="text-center text-wrap">Code</div>,
        cell: (info) => (
            <div className="text-center text-wrap">{info.getValue()}</div>
        ),
    }),
    columnHelper.accessor('co_amount', {
        size: 100,
        header: () => <div className="text-center text-wrap">Code</div>,
        cell: (info) => (
            <div className="text-center text-wrap">{info.getValue()}</div>
        ),
    }),
    columnHelper.accessor('ccet_adaptation', {
        size: 100,
        header: () => <div className="text-center text-wrap">Code</div>,
        cell: (info) => (
            <div className="text-center text-wrap">{info.getValue()}</div>
        ),
    }),
    columnHelper.accessor('ccet_mitigation', {
        size: 100,
        header: () => <div className="text-center text-wrap">Code</div>,
        cell: (info) => (
            <div className="text-center text-wrap">{info.getValue()}</div>
        ),
    }),
    columnHelper.accessor('cc_typology.code', {
        size: 100,
        header: () => <div className="text-center text-wrap">Code</div>,
        cell: (info) => (
            <div className="text-center text-wrap">{info.getValue()}</div>
        ),
    }),
    columnHelper.display({
        id: 'actions',
        size: 100,
        cell: (info) => (
            <div>
                <Button size="icon" variant="destructive">
                    <Trash />
                </Button>
            </div>
        ),
    }),
];

export default columns;
