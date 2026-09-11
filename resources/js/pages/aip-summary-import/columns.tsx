// resources/js/pages/aip-summary-import/columns.tsx

import { createColumnHelper } from '@tanstack/react-table';
import type { ImportFund, ImportOffice } from './types';

const office = createColumnHelper<ImportOffice>();
const fund = createColumnHelper<ImportFund>();

export const importOfficeColumns = [
    office.accessor('acronym', {
        size: 100,
        header: () => <div className="text-center text-wrap">Acronym</div>,
        cell: (info) => (
            <div className="text-center text-wrap">
                {info.getValue() || '—'}
            </div>
        ),
    }),
    office.accessor('name', {
        size: 200,
        header: () => <div className="text-center text-wrap">Name</div>,
        cell: (info) => <div className="text-wrap">{info.getValue()}</div>,
    }),
];

export const importFundColumns = [
    fund.accessor('code', {
        size: 140,
        header: () => <div className="text-center text-wrap">Code</div>,
        cell: (info) => (
            <div className="text-center font-mono text-wrap">
                {info.getValue()}
            </div>
        ),
    }),
    fund.accessor('title', {
        size: 220,
        header: () => <div className="text-center text-wrap">Title</div>,
        cell: (info) => <div className="text-wrap">{info.getValue()}</div>,
    }),
];
