import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
    getCoreRowModel,
    getFilteredRowModel,
    useReactTable,
} from '@tanstack/react-table';
import type { Table } from '@tanstack/react-table';
import columns, { ROW_TINT, rowStatus, stripCoaPrefix } from './columns';
import type { CategoryCoaReviewTableMeta } from '../types';
import type { EffectiveVerifiedPair } from '../types';

function coa(id: number, path: string, title: string) {
    return { id, account_number: path, path, account_title: title };
}

const COA_A = coa(11, '5-02-03-990', 'Other Supplies and Materials Expenses');

function pair(
    overrides: Partial<EffectiveVerifiedPair> = {},
): EffectiveVerifiedPair {
    return {
        key: 'Sheet1|3|3',
        category: 'Office Supplies',
        coa: '5-02-03-990',
        section: 'Supplies',
        sheet: 'Sheet1',
        catRow: 3,
        coaRow: 3,
        items: 1,
        catNorm: 'office supplies',
        coaNorm: '5-02-03-990',
        catExists: true,
        coaExists: true,
        mappingExists: true,
        catId: 7,
        coaId: 11,
        catMatchType: 'strict',
        coaMatchType: 'strict',
        catMatch: null,
        coaMatch: COA_A,
        catTopMatches: [],
        coaTopMatches: [],
        overrideId: null,
        effectiveCoa: COA_A,
        effectiveCoaExists: true,
        effectiveCoaId: 11,
        effectiveCoaMatchType: 'strict',
        effectiveMappingExists: true,
        ...overrides,
    };
}

function buildTable(
    data: EffectiveVerifiedPair[] = [pair()],
    meta: Partial<CategoryCoaReviewTableMeta> = {},
): Table<EffectiveVerifiedPair> {
    let captured!: Table<EffectiveVerifiedPair>;

    function Probe() {
        captured = useReactTable({
            data,
            columns,
            getCoreRowModel: getCoreRowModel(),
            getFilteredRowModel: getFilteredRowModel(),
            meta: {
                allCoaLabels: [
                    stripCoaPrefix(
                        `coa:11:${COA_A.path} — ${COA_A.account_title}`,
                    ),
                ],
                onCoaPick: () => {},
                onClearOverride: () => {},
                ...meta,
            } as CategoryCoaReviewTableMeta,
        });

        return null;
    }

    renderToString(<Probe />);

    return captured;
}

/** Renders every body cell of the first row to a string. */
function firstRowCells(table: Table<EffectiveVerifiedPair>): string[] {
    const [row] = table.getRowModel().rows;

    return row.getVisibleCells().map((cell) => {
        // Every column here is a `display` column, so `cell` is always the
        // render callback rather than an accessor key/function.
        const render = cell.column.columnDef.cell as (
            props: unknown,
        ) => unknown;

        return JSON.stringify(render(cell.getContext()));
    });
}

describe('category ↔ COA review row status', () => {
    it('should_ReportMissingCategory_When_CategoryNotInDb', () => {
        expect(rowStatus(pair({ catExists: false, catId: null }))).toBe(
            'missingCat',
        );
    });

    it('should_ReportMissingCoa_When_EffectiveCoaNotInDb', () => {
        expect(
            rowStatus(
                pair({
                    coaExists: false,
                    effectiveCoaExists: false,
                    effectiveCoa: null,
                    effectiveCoaId: null,
                    effectiveMappingExists: false,
                }),
            ),
        ).toBe('missingCoa');
    });

    it('should_ReportMapped_When_EffectiveMappingExists', () => {
        expect(rowStatus(pair())).toBe('exists');
    });

    it('should_ReportCreatable_When_CoaResolvedButUnmapped', () => {
        expect(rowStatus(pair({ effectiveMappingExists: false }))).toBe(
            'creatable',
        );
    });

    it('should_PreferMissingCategory_When_BothCategoryAndCoaAreMissing', () => {
        expect(
            rowStatus(
                pair({
                    catExists: false,
                    catId: null,
                    coaExists: false,
                    effectiveCoaExists: false,
                    effectiveCoa: null,
                }),
            ),
        ).toBe('missingCat');
    });

    it('should_ProvideATintForEveryStatus', () => {
        for (const status of [
            'creatable',
            'missingCat',
            'missingCoa',
            'exists',
        ] as const) {
            expect(ROW_TINT[status]).toBeTruthy();
        }
    });
});

describe('category ↔ COA review coa labels', () => {
    it('should_DropTheMachinePrefix_When_StrippingCoaOption', () => {
        expect(stripCoaPrefix('coa:11:5-02-03-990 — Supplies')).toBe(
            '5-02-03-990 — Supplies',
        );
    });

    it('should_LeaveUnprefixedLabelsAlone_When_StrippingCoaOption', () => {
        expect(stripCoaPrefix('5-02-03-050 — Office Supplies')).toBe(
            '5-02-03-050 — Office Supplies',
        );
    });
});

describe('category ↔ COA review table columns', () => {
    it('should_DeclareAllFiveColumns_When_TableIsBuilt', () => {
        expect(
            buildTable()
                .getAllLeafColumns()
                .map((c) => c.id),
        ).toEqual(['category', 'coa', 'section', 'items', 'status']);
    });

    it('should_RenderEveryCell_When_ARowIsPresent', () => {
        expect(firstRowCells(buildTable())).toHaveLength(5);
    });

    it('should_ShowTheMappedBadge_When_MappingExists', () => {
        expect(firstRowCells(buildTable())[4]).toContain('Mapped');
    });

    it('should_ShowNotMapped_When_CoaResolvedButUnmapped', () => {
        expect(
            firstRowCells(
                buildTable([pair({ effectiveMappingExists: false })]),
            )[4],
        ).toContain('Not mapped');
    });

    it('should_ShowPickACoa_When_CoaCannotBeResolved', () => {
        expect(
            firstRowCells(
                buildTable([
                    pair({
                        coaExists: false,
                        effectiveCoaExists: false,
                        effectiveCoa: null,
                        effectiveMappingExists: false,
                    }),
                ]),
            )[4],
        ).toContain('Pick a COA');
    });

    it('should_ExposeTheClearOverrideControl_When_ARowHasAnOverride', () => {
        expect(
            firstRowCells(buildTable([pair({ overrideId: 12 })]))[1],
        ).toContain('Clear override');
    });

    it('should_NotExposeTheClearOverrideControl_When_NoOverride', () => {
        expect(firstRowCells(buildTable())[1]).not.toContain('Clear override');
    });

    it('should_RenderTheDbId_When_CategoryExists', () => {
        expect(firstRowCells(buildTable())[0]).toContain('id 7');
    });

    it('should_ReportTheSourceRow_When_CategoryIsMissing', () => {
        expect(
            firstRowCells(
                buildTable([pair({ catExists: false, catId: null })]),
            )[0],
        ).toContain('row 3 · not in DB');
    });
});
