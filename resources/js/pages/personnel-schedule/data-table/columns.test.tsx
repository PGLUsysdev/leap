import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
    getCoreRowModel,
    getFilteredRowModel,
    useReactTable,
} from '@tanstack/react-table';
import type { Table } from '@tanstack/react-table';
import columns from './columns';
import type { PersonnelScheduleItem } from './columns';

const ITEMS: PersonnelScheduleItem[] = [
    {
        id: 1,
        appointment_status: 'PERMANENT',
        item_number: '1',
        old: '1',
        new: '1',
        position_title: 'ADMINISTRATIVE AIDE III (VACANT)',
        incumbent_name: '-',
        current_year_sg_step: 'SG-2 / 3',
        current_year_amount: '29187.00',
        proposed_sg_step: 'SG-3 / 1',
        proposed_amount: '31339.00',
        increase_decrease: '2152.00',
        step_increment_effectivity: '01/01/2026',
    },
    {
        id: 2,
        appointment_status: 'PERMANENT',
        item_number: '2',
        old: '2',
        new: '2',
        position_title: 'ADMINISTRATIVE OFFICER I',
        incumbent_name: 'Dela Cruz, Juan A.',
        current_year_sg_step: 'SG-14 / 1',
        current_year_amount: '33461.00',
        proposed_sg_step: 'SG-14 / 2',
        proposed_amount: '35253.00',
        increase_decrease: '1792.00',
        step_increment_effectivity: '01/01/2026',
    },
    {
        id: 3,
        appointment_status: 'PERMANENT',
        item_number: '3',
        old: '3',
        new: '3',
        position_title: 'LOCAL DEVELOPMENT OFFICER I',
        incumbent_name: 'Santos, Maria L.',
        current_year_sg_step: 'SG-18 / 1',
        current_year_amount: '51219.00',
        proposed_sg_step: 'SG-18 / 2',
        proposed_amount: '53967.00',
        increase_decrease: '2748.00',
        step_increment_effectivity: '01/01/2026',
    },
];

function buildTable(
    data: PersonnelScheduleItem[] = ITEMS,
    globalFilter = '',
): Table<PersonnelScheduleItem> {
    let captured!: Table<PersonnelScheduleItem>;

    function Probe() {
        captured = useReactTable({
            data,
            columns,
            getCoreRowModel: getCoreRowModel(),
            getFilteredRowModel: getFilteredRowModel(),
            state: { globalFilter },
        });

        return null;
    }

    renderToString(<Probe />);

    return captured;
}

// Same visibility rule as the shared DataTable's footer.
function renderedFooterGroups(table: Table<PersonnelScheduleItem>) {
    return table
        .getFooterGroups()
        .filter((group) =>
            group.headers.some(
                (header) =>
                    !header.isPlaceholder && header.column.columnDef.footer,
            ),
        );
}

function footerTexts(table: Table<PersonnelScheduleItem>): string[] {
    const [group] = renderedFooterGroups(table);

    return group.headers
        .filter(
            (header) => !header.isPlaceholder && header.column.columnDef.footer,
        )
        .map((header) => {
            const footer = header.column.columnDef.footer as (props: {
                table: Table<PersonnelScheduleItem>;
            }) => unknown;

            return JSON.stringify(footer({ table }));
        });
}

describe('personnel schedule table footer', () => {
    it('should_RenderASingleFooterRow_When_FootersAreDefined', () => {
        expect(renderedFooterGroups(buildTable())).toHaveLength(1);
    });

    it('should_PlaceAmountTotalsAtTheTopLevel_When_FooterRendered', () => {
        const [group] = renderedFooterGroups(buildTable());
        const footered = group.headers.filter(
            (header) => !header.isPlaceholder && header.column.columnDef.footer,
        );

        expect(
            footered.map((header) => [header.column.id, header.colSpan]),
        ).toEqual([
            ['current_year_amount', 1],
            ['proposed_amount', 1],
            ['increase_decrease', 1],
        ]);
    });

    it('should_SumVisibleRows_When_AmountFootersRender', () => {
        expect(footerTexts(buildTable())).toEqual([
            expect.stringContaining('113,867.00'),
            expect.stringContaining('120,559.00'),
            expect.stringContaining('6,692.00'),
        ]);
    });

    it('should_ExcludeFilteredOutRows_When_SearchNarrowsTheTable', () => {
        expect(footerTexts(buildTable(ITEMS, 'Santos'))).toEqual([
            expect.stringContaining('51,219.00'),
            expect.stringContaining('53,967.00'),
            expect.stringContaining('2,748.00'),
        ]);
    });

    it('should_TreatBlankAmountsAsZero_When_Summing', () => {
        const rows: PersonnelScheduleItem[] = [
            { ...ITEMS[0], current_year_amount: null },
            { ...ITEMS[1], current_year_amount: '' },
            { ...ITEMS[2], current_year_amount: '10.005' },
        ];

        expect(footerTexts(buildTable(rows))[0]).toContain('10.01');
    });
});
