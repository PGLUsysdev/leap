import { describe, expect, it } from 'vitest';
import { prepareLbpForm3Rows } from '@/pages/personnel-schedule/pdf-render/prepare-rows';
import type { PersonnelScheduleItem } from '@/pages/personnel-schedule/data-table/columns';

function makeItem(
    overrides: Partial<PersonnelScheduleItem> = {},
): PersonnelScheduleItem {
    return {
        id: 1,
        appointment_status: 'PERMANENT',
        item_number: '1',
        old: '1',
        new: '1',
        position_title: 'Administrative Aide III',
        incumbent_name: 'Juan Dela Cruz',
        current_year_sg_step: 'SG-2 / 3',
        current_year_amount: '29187.00',
        proposed_sg_step: 'SG-3 / 1',
        proposed_amount: '31339.00',
        increase_decrease: '2152.00',
        step_increment_effectivity: '01/01/2026',
        ...overrides,
    };
}

describe('prepareLbpForm3Rows', () => {
    it('should_ReturnEmptyArray_When_ThereAreNoItems', () => {
        expect(prepareLbpForm3Rows([])).toEqual([]);
    });

    it('should_ReturnOneItemRowPerPerson_When_ItemsAreGiven', () => {
        const rows = prepareLbpForm3Rows([
            makeItem({ id: 1 }),
            makeItem({ id: 2 }),
        ]);

        expect(rows.filter((row) => row.type === 'item')).toHaveLength(2);
    });

    it('should_AppendUnlabelledGrandTotalRow_When_ThereIsAtLeastOneItem', () => {
        const rows = prepareLbpForm3Rows([makeItem()]);

        expect(rows.at(-1)).toMatchObject({ type: 'grand-total' });
        expect(rows.at(-1)?.label).toBeUndefined();
    });

    it('should_NotAppendGrandTotalRow_When_ThereAreNoItems', () => {
        const rows = prepareLbpForm3Rows([]);

        expect(rows.some((row) => row.type === 'grand-total')).toBe(false);
    });

    it('should_SumAmountColumns_When_MultipleItemsAreGiven', () => {
        const rows = prepareLbpForm3Rows([
            makeItem({
                current_year_amount: '100.10',
                proposed_amount: '200.20',
                increase_decrease: '100.10',
            }),
            makeItem({
                current_year_amount: '0.20',
                proposed_amount: '1.80',
                increase_decrease: '1.60',
            }),
        ]);

        expect(rows.at(-1)?.totals).toEqual({
            current_year_amount: 100.3,
            proposed_amount: 202,
            increase_decrease: 101.7,
        });
    });

    it('should_TreatNullAndBlankAmountsAsZero_When_Summing', () => {
        const rows = prepareLbpForm3Rows([
            makeItem({
                current_year_amount: null,
                proposed_amount: null,
                increase_decrease: null,
            }),
        ]);

        expect(rows.at(-1)?.totals).toEqual({
            current_year_amount: 0,
            proposed_amount: 0,
            increase_decrease: 0,
        });
    });

    it('should_GenerateUniqueRowIds_When_ItemsAreGiven', () => {
        const rows = prepareLbpForm3Rows([
            makeItem({ id: 1 }),
            makeItem({ id: 2 }),
        ]);

        const ids = rows.map((row) => row.id);

        expect(new Set(ids).size).toBe(ids.length);
    });
});
