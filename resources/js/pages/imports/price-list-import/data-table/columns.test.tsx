import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
    getCoreRowModel,
    getFilteredRowModel,
    useReactTable,
} from '@tanstack/react-table';
import type { Table } from '@tanstack/react-table';
import columns, {
    buildCoaItems,
    formatCoaLabel,
    isSelectable,
    rowClassName,
    stripCoaPrefix,
} from './columns';
import type { PriceListReviewTableMeta } from '../types';
import type { VerifiedItem } from '../types';

function coa(id: number, path: string, title: string) {
    return { id, account_number: path, path, account_title: title };
}

const COA_A = coa(11, '5-02-03-990', 'Other Supplies and Materials Expenses');
const COA_B = coa(12, '5-02-03-050', 'Office Supplies Expenses');

function item(overrides: Partial<VerifiedItem> = {}): VerifiedItem {
    return {
        key: 'Sheet1|1',
        category: 'Office Supplies',
        coa: '5-02-03-990',
        description: 'Ballpens, various',
        unit: 'pcs',
        price: 1250,
        sheets: ['Sheet1'],
        rows: [4],
        count: 1,
        catNorm: 'office supplies',
        coaNorm: '5-02-03-990',
        categoryId: 7,
        coaId: 11,
        mappingId: 3,
        catExists: true,
        coaExists: true,
        mappingExists: true,
        priceListExists: false,
        junctionId: 5,
        catMatchType: 'strict',
        coaMatchType: 'strict',
        catTopMatches: [],
        coaTopMatches: [],
        catMatch: null,
        coaMatch: COA_A,
        effectiveCoa: COA_A,
        effectiveCoaId: 11,
        effectiveCoaExists: true,
        effectiveCoaMatchType: 'strict',
        effectiveJunctionId: 5,
        effectiveMappingExists: true,
        effectivePriceListExists: false,
        overrideId: null,
        priceValid: true,
        unitValid: true,
        descriptionValid: true,
        status: 'ready',
        message: 'New item',
        ...overrides,
    };
}

function buildTable(
    data: VerifiedItem[] = [item()],
    meta: Partial<PriceListReviewTableMeta> = {},
): Table<VerifiedItem> {
    let captured!: Table<VerifiedItem>;

    function Probe() {
        captured = useReactTable({
            data,
            columns,
            getCoreRowModel: getCoreRowModel(),
            getFilteredRowModel: getFilteredRowModel(),
            meta: {
                selected: new Set<string>(),
                setSelected: () => {},
                existingCoas: [COA_A, COA_B],
                onCoaOverrideChange: () => {},
                onClearOverride: () => {},
                onTruncateDescription: () => {},
                ...meta,
            } as PriceListReviewTableMeta,
        });

        return null;
    }

    renderToString(<Probe />);

    return captured;
}

/** Renders every body cell of the first row to a string. */
function firstRowCells(table: Table<VerifiedItem>): string[] {
    const [row] = table.getRowModel().rows;

    return row.getVisibleCells().map((cell) => {
        const render = cell.column.columnDef.cell as (
            props: unknown,
        ) => unknown;

        return JSON.stringify(render(cell.getContext()));
    });
}

type SelectHeaderProps = {
    checked?: boolean;
    indeterminate?: boolean;
    onCheckedChange?: (checked: boolean) => void;
};

/** Renders the `select` column's header and returns its Checkbox props. */
function selectHeaderProps(table: Table<VerifiedItem>): SelectHeaderProps {
    const header = table.getAllLeafColumns().find((c) => c.id === 'select');
    const render = header?.columnDef.header as (props: unknown) => unknown;

    return (render({ table }) as { props: SelectHeaderProps }).props;
}

describe('price list row selectability', () => {
    it('should_AllowSelection_When_StatusIsReadyOrUpdate', () => {
        expect(isSelectable(item({ status: 'ready' }))).toBe(true);
        expect(isSelectable(item({ status: 'update' }))).toBe(true);
    });

    it('should_BlockSelection_When_StatusIsErrorOrSkipped', () => {
        expect(isSelectable(item({ status: 'error' }))).toBe(false);
        expect(isSelectable(item({ status: 'skipped' }))).toBe(false);
    });
});

describe('price list row tinting', () => {
    it('should_MarkUnselectableRows_When_StatusIsError', () => {
        expect(rowClassName(item({ status: 'error' }))).toContain(
            'bg-destructive/5',
        );
    });

    it('should_MarkUpdateRows_When_StatusIsUpdate', () => {
        expect(rowClassName(item({ status: 'update' }))).toContain(
            'bg-amber-50/30',
        );
    });

    it('should_AddTheLeftAccent_When_CoaIsOverridden', () => {
        expect(rowClassName(item({ overrideId: 12 }))).toContain(
            'inset_3px_0_0_0_var(--color-amber-500)',
        );
    });

    it('should_LeavePlainReadyRowsUntinted', () => {
        expect(rowClassName(item()).trim()).toBe('');
    });
});

describe('price list coa labels', () => {
    it('should_DropTheMachinePrefix_When_StrippingCoaOption', () => {
        expect(stripCoaPrefix('coa:11:5-02-03-990 — Supplies')).toBe(
            '5-02-03-990 — Supplies',
        );
    });

    it('should_RenderPathAndTitle_When_FormattingALabel', () => {
        expect(formatCoaLabel(COA_A)).toBe(
            '5-02-03-990 — Other Supplies and Materials Expenses',
        );
    });

    it('should_FloatSuggestionsFirst_When_BuildingCoaItems', () => {
        expect(buildCoaItems([COA_B], [COA_A, COA_B])).toEqual([
            '5-02-03-050 — Office Supplies Expenses',
            '5-02-03-990 — Other Supplies and Materials Expenses',
        ]);
    });

    it('should_NotDuplicateASuggestion_When_ItIsAlsoInTheFullList', () => {
        expect(buildCoaItems([COA_A], [COA_A, COA_B])).toHaveLength(2);
    });
});

describe('price list table columns', () => {
    it('should_DeclareAllSevenColumns_When_TableIsBuilt', () => {
        expect(
            buildTable()
                .getAllLeafColumns()
                .map((c) => c.id),
        ).toEqual([
            'select',
            'description',
            'category',
            'coa',
            'unit',
            'price',
            'status',
        ]);
    });

    it('should_RenderEveryCell_When_ARowIsPresent', () => {
        expect(firstRowCells(buildTable())).toHaveLength(7);
    });
});

describe('price list select-all header', () => {
    it('should_ReadAsFullySelected_When_EverySelectableRowIsTicked', () => {
        const props = selectHeaderProps(
            buildTable([item({ key: 'a' }), item({ key: 'b' })], {
                selected: new Set(['a', 'b']),
            }),
        );

        expect(props.checked).toBe(true);
        expect(props.indeterminate).toBe(false);
    });

    it('should_ReadAsIndeterminate_When_OnlySomeRowsAreTicked', () => {
        const props = selectHeaderProps(
            buildTable([item({ key: 'a' }), item({ key: 'b' })], {
                selected: new Set(['a']),
            }),
        );

        expect(props.checked).toBe(false);
        expect(props.indeterminate).toBe(true);
    });

    it('should_IgnoreUnselectableRows_When_ComputingSelectionState', () => {
        // The error row is ticked but not selectable, so the header reads as
        // fully selected on the strength of the one selectable row.
        const props = selectHeaderProps(
            buildTable(
                [item({ key: 'a' }), item({ key: 'b', status: 'error' })],
                { selected: new Set(['a', 'b']) },
            ),
        );

        expect(props.checked).toBe(true);
        expect(props.indeterminate).toBe(false);
    });

    it('should_ReadAsUnticked_When_NothingIsSelected', () => {
        const props = selectHeaderProps(buildTable());

        expect(props.checked).toBe(false);
        expect(props.indeterminate).toBe(false);
    });

    it('should_TickEverySelectableRow_When_SelectAllFires', () => {
        const setSelected = vi.fn();
        const props = selectHeaderProps(
            buildTable(
                [
                    item({ key: 'a' }),
                    item({ key: 'b' }),
                    item({ key: 'c', status: 'error' }),
                ],
                { setSelected },
            ),
        );

        props.onCheckedChange?.(true);

        expect(setSelected).toHaveBeenCalledTimes(1);
        const next = setSelected.mock.calls[0]?.[0] as Set<string>;
        expect(next.has('a')).toBe(true);
        expect(next.has('b')).toBe(true);
        expect(next.has('c')).toBe(false);
    });

    it('should_PreserveUnrelatedTicks_When_SelectAllFires', () => {
        const setSelected = vi.fn();
        const props = selectHeaderProps(
            buildTable([item({ key: 'a' })], {
                setSelected,
                selected: new Set(['a', 'unrelated']),
            }),
        );

        props.onCheckedChange?.(true);

        const next = setSelected.mock.calls[0]?.[0] as Set<string>;
        expect(next.has('unrelated')).toBe(true);
    });

    it('should_ClearEverySelectableRow_When_SelectAllIsUntickled', () => {
        const setSelected = vi.fn();
        const props = selectHeaderProps(
            buildTable([item({ key: 'a' }), item({ key: 'b' })], {
                setSelected,
                selected: new Set(['a', 'b']),
            }),
        );

        props.onCheckedChange?.(false);

        const next = setSelected.mock.calls[0]?.[0] as Set<string>;
        expect(next.has('a')).toBe(false);
        expect(next.has('b')).toBe(false);
    });
});

describe('price list description column', () => {
    it('should_OfferTruncation_When_DescriptionIsTooLong', () => {
        const cells = firstRowCells(
            buildTable([
                item({
                    description: 'x'.repeat(1200),
                    descriptionValid: false,
                }),
            ]),
        );

        expect(cells[1]).toContain('Truncate to 1000');
    });

    it('should_OmitTruncation_When_DescriptionIsValid', () => {
        expect(firstRowCells(buildTable())[1]).not.toContain(
            'Truncate to 1000',
        );
    });

    it('should_ShowTheCollapsedCount_When_DuplicatesWereMerged', () => {
        const cells = firstRowCells(buildTable([item({ count: 4 })]));

        expect(cells[1]).toContain('4 raw rows collapsed');
    });
});

describe('price list status column', () => {
    it('should_RenderTheRowMessage_When_StatusIsReady', () => {
        expect(firstRowCells(buildTable())[6]).toContain('New item');
    });

    it('should_RenderTheSheetAndRows_When_ReportingProvenance', () => {
        const cells = firstRowCells(buildTable());

        expect(cells[6]).toContain('Sheet1');
        expect(cells[6]).toContain(' · row ');
    });

    it('should_ShowTheOverrideMarker_When_CoaIsOverridden', () => {
        expect(
            firstRowCells(buildTable([item({ overrideId: 12 })]))[3],
        ).toContain('(override)');
    });
});
