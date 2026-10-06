import { describe, expect, it } from 'vitest';
import type { ChartOfAccount, Position } from '@/types';
import { getCellNumericValue } from './ps-calculations';

function position(attrs: Partial<Position> = {}): Position {
    return {
        id: 1,
        office_id: 1,
        item_number: 'PS-1',
        ios_id: 1,
        employment_type: 'casual',
        is_funded: true,
        status: 'occupied',
        created_at: null,
        updated_at: null,
        ...attrs,
    } as Position;
}

const casualCoa = {
    path: '5-01-01-020',
    account_number: '020',
    expense_class: 'PS',
} as ChartOfAccount;

const regularCoa = {
    path: '5-01-01-010',
    account_number: '010',
    expense_class: 'PS',
} as ChartOfAccount;

// ₱20,000 monthly → ₱240,000 annual → ₱909.0909... daily (240,000 / 12 / 22).
const rates = {};
const annualRateMap = { 1: { current: 0, budget: 240000 } };

describe('getCellNumericValue — 5-01-01-020 casual/contractual', () => {
    it('pays a full annual salary when service length is unknown', () => {
        expect(
            getCellNumericValue(position(), casualCoa, rates, annualRateMap),
        ).toBeCloseTo(240000, 6);
    });

    it('pays a full annual salary for an explicit 12 months', () => {
        expect(
            getCellNumericValue(position(), casualCoa, rates, annualRateMap, {
                1: 12,
            }),
        ).toBeCloseTo(240000, 6);
    });

    it('prorates on the daily rate for partial-year service', () => {
        // 6 months → 132 days → exactly half of the annual amount.
        expect(
            getCellNumericValue(position(), casualCoa, rates, annualRateMap, {
                1: 6,
            }),
        ).toBeCloseTo(120000, 6);

        // 3 months → 66 days → a quarter of the annual amount.
        expect(
            getCellNumericValue(position(), casualCoa, rates, annualRateMap, {
                1: 3,
            }),
        ).toBeCloseTo(60000, 6);
    });

    it('scales linearly with the monthly rate', () => {
        expect(
            getCellNumericValue(position(), casualCoa, rates, {
                1: { current: 0, budget: 120000 },
            }),
        ).toBeCloseTo(120000, 6);
    });

    it('clamps service length to the 1-12 budget year', () => {
        expect(
            getCellNumericValue(position(), casualCoa, rates, annualRateMap, {
                1: 0,
            }),
        ).toBeCloseTo(20000, 6);

        expect(
            getCellNumericValue(position(), casualCoa, rates, annualRateMap, {
                1: 18,
            }),
        ).toBeCloseTo(240000, 6);
    });

    it('pays contractual positions on the same daily-rate basis', () => {
        expect(
            getCellNumericValue(
                position({ employment_type: 'contractual' }),
                casualCoa,
                rates,
                annualRateMap,
                { 1: 6 },
            ),
        ).toBeCloseTo(120000, 6);
    });

    it('does not prorate permanent positions, which use 5-01-01-010', () => {
        expect(
            getCellNumericValue(
                position({ employment_type: 'permanent' }),
                casualCoa,
                rates,
                annualRateMap,
                { 1: 6 },
            ),
        ).toBeNull();

        expect(
            getCellNumericValue(
                position({ employment_type: 'permanent' }),
                regularCoa,
                rates,
                annualRateMap,
                { 1: 6 },
            ),
        ).toBeCloseTo(240000, 6);
    });

    it('pays nothing for abolished or unfunded posts', () => {
        expect(
            getCellNumericValue(
                position({ status: 'abolished' }),
                casualCoa,
                rates,
                annualRateMap,
            ),
        ).toBeNull();

        expect(
            getCellNumericValue(
                position({ is_funded: false }),
                casualCoa,
                rates,
                annualRateMap,
            ),
        ).toBeNull();
    });
});
