import { describe, expect, it } from 'vitest';
import { matchQuantityItems } from '@/lib/ppmp/quantities-match';
import type { ExistingPriceList } from '@/lib/ppmp/quantities-match';
import type { UniqueQuantityItem } from '@/lib/ppmp/quantities-extract';

const baseItem: UniqueQuantityItem = {
    key: 'k1',
    category: '1. OFFICE SUPPLIES',
    coa: '',
    description: 'Bond paper A4',
    unit: 'ream',
    price: null,
    qtys: [10, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    monthTotal: 15,
    sheets: ['PPMP'],
    rows: [8],
    count: 1,
};

const priceLists: ExistingPriceList[] = [
    {
        id: 11,
        description: 'BOND PAPER A4',
        unit_of_measurement: 'Ream',
        price: '250.00',
        chart_of_account_ppmp_category_id: 3,
    },
];

describe('matchQuantityItems', () => {
    it('should_MatchPriceList_When_NormalizedDescAndUomEqual', () => {
        const [mapped] = matchQuantityItems([baseItem], priceLists);

        expect(mapped.status).toBe('matched');
        expect(mapped.priceListId).toBe(11);
        expect(mapped.priceListPrice).toBe(250);
    });

    it('should_IgnoreCategoryAndCoa_When_Matching', () => {
        const [mapped] = matchQuantityItems(
            [{ ...baseItem, category: 'Whatever', coa: 'Whatever' }],
            priceLists,
        );

        expect(mapped.status).toBe('matched');
    });

    it('should_Error_When_NoPriceListMatch', () => {
        const [mapped] = matchQuantityItems(
            [{ ...baseItem, description: 'Unknown item' }],
            priceLists,
        );

        expect(mapped.status).toBe('error');
        expect(mapped.message).toContain('Item not in price list');
    });

    it('should_Error_When_MultiplePriceListMatches', () => {
        const [mapped] = matchQuantityItems(
            [baseItem],
            [
                ...priceLists,
                {
                    id: 12,
                    description: 'bond  paper  a4',
                    unit_of_measurement: 'REAM',
                    price: '260.00',
                    chart_of_account_ppmp_category_id: 9,
                },
            ],
        );

        expect(mapped.status).toBe('error');
        expect(mapped.message).toContain('Multiple price list matches');
    });

    it('should_Error_When_DescriptionOrUnitEmpty', () => {
        const [noDesc] = matchQuantityItems(
            [{ ...baseItem, description: '  ' }],
            priceLists,
        );
        const [noUnit] = matchQuantityItems(
            [{ ...baseItem, unit: '' }],
            priceLists,
        );

        expect(noDesc.status).toBe('error');
        expect(noUnit.status).toBe('error');
    });
});
