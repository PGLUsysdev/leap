import { describe, expect, it } from 'vitest';
import { matchQuantityItems } from '@/lib/ppmp/quantities-match';
import type {
    ExistingPriceList,
    QuantityMatchContext,
} from '@/lib/ppmp/quantities-match';
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

describe('matchQuantityItems with category/COA context', () => {
    const item: UniqueQuantityItem = {
        ...baseItem,
        key: 'k2',
        category: 'ICT Equipment',
        coa: 'Office Supplies Expenses',
        description: 'Maintenance Box for Epson L6290',
        unit: 'pc',
    };

    const twoCoaLists: ExistingPriceList[] = [
        {
            id: 1018,
            description: 'MAINTENANCE BOX FOR EPSON L6290',
            unit_of_measurement: 'pc',
            price: '700.00',
            chart_of_account_ppmp_category_id: 50,
        },
        {
            id: 1076,
            description: 'MAINTENANCE BOX FOR EPSON L6290',
            unit_of_measurement: 'pc',
            price: '700.00',
            chart_of_account_ppmp_category_id: 51,
        },
    ];

    const context: QuantityMatchContext = {
        categories: [{ id: 7, name: 'ICT Equipment' } as never],
        coas: [
            {
                id: 20,
                account_number: '5-02-03-010',
                path: '5-02-03-010',
                account_title: 'Office Supplies Expenses',
            },
            {
                id: 21,
                account_number: '5-02-03-990',
                path: '5-02-03-990',
                account_title: 'Other Supplies and Materials Expenses',
            },
        ],
        mappings: [
            { id: 50, chart_of_account_id: 20, ppmp_category_id: 7 },
            { id: 51, chart_of_account_id: 21, ppmp_category_id: 7 },
        ],
    };

    it('should_MatchJunctionRow_When_SameDescUnitUnderTwoCoas', () => {
        const [mapped] = matchQuantityItems([item], twoCoaLists, context);

        expect(mapped.status).toBe('matched');
        expect(mapped.priceListId).toBe(1018);
    });

    it('should_MatchViaCoa_When_CategoryHoldsDescriptionText', () => {
        // Standard template: the category column holds the description.
        const [mapped] = matchQuantityItems(
            [{ ...item, category: 'MAINTENANCE BOX FOR EPSON L6290' }],
            twoCoaLists,
            context,
        );

        expect(mapped.status).toBe('matched');
        expect(mapped.priceListId).toBe(1018);
    });

    it('should_MatchOtherJunctionRow_When_CoaDiffers', () => {
        const [mapped] = matchQuantityItems(
            [
                {
                    ...item,
                    coa: 'Other Supplies and Materials Expenses',
                },
            ],
            twoCoaLists,
            context,
        );

        expect(mapped.status).toBe('matched');
        expect(mapped.priceListId).toBe(1076);
    });

    it('should_ErrorNamingCoa_When_CoaNotFound', () => {
        const [mapped] = matchQuantityItems(
            [{ ...item, coa: 'No Such COA' }],
            twoCoaLists,
            context,
        );

        expect(mapped.status).toBe('error');
        expect(mapped.message).toContain('COA');
    });

    it('should_UseCategoryTiebreak_When_SameCoaUnderTwoCategories', () => {
        const lists: ExistingPriceList[] = [
            {
                id: 201,
                description: 'MAINTENANCE BOX FOR EPSON L6290',
                unit_of_measurement: 'pc',
                price: '700.00',
                chart_of_account_ppmp_category_id: 50,
            },
            {
                id: 202,
                description: 'MAINTENANCE BOX FOR EPSON L6290',
                unit_of_measurement: 'pc',
                price: '700.00',
                chart_of_account_ppmp_category_id: 52,
            },
        ];
        const ctx: QuantityMatchContext = {
            ...context,
            mappings: [
                ...context.mappings,
                { id: 52, chart_of_account_id: 20, ppmp_category_id: 8 },
            ],
            categories: [
                ...context.categories,
                { id: 8, name: 'Common Supplies' } as never,
            ],
        };
        const [mapped] = matchQuantityItems(
            [{ ...item, category: 'Common Supplies' }],
            lists,
            ctx,
        );

        expect(mapped.status).toBe('matched');
        expect(mapped.priceListId).toBe(202);
    });

    it('should_ErrorAmbiguous_When_SameCoaAndCategoryUnresolved', () => {
        const lists: ExistingPriceList[] = [
            {
                id: 201,
                description: 'MAINTENANCE BOX FOR EPSON L6290',
                unit_of_measurement: 'pc',
                price: '700.00',
                chart_of_account_ppmp_category_id: 50,
            },
            {
                id: 202,
                description: 'MAINTENANCE BOX FOR EPSON L6290',
                unit_of_measurement: 'pc',
                price: '700.00',
                chart_of_account_ppmp_category_id: 52,
            },
        ];
        const ctx: QuantityMatchContext = {
            ...context,
            mappings: [
                ...context.mappings,
                { id: 52, chart_of_account_id: 20, ppmp_category_id: 8 },
            ],
        };
        const [mapped] = matchQuantityItems(
            [{ ...item, category: 'No Such Category' }],
            lists,
            ctx,
        );

        expect(mapped.status).toBe('error');
        expect(mapped.message).toContain('share this COA');
    });

    it('should_ErrorAmbiguous_When_SameJunctionDuplicates', () => {
        const [mapped] = matchQuantityItems(
            [item],
            [
                ...twoCoaLists,
                {
                    id: 1099,
                    description: 'MAINTENANCE BOX FOR EPSON L6290',
                    unit_of_measurement: 'pc',
                    price: '700.00',
                    chart_of_account_ppmp_category_id: 50,
                },
            ],
            context,
        );

        expect(mapped.status).toBe('error');
        expect(mapped.message).toContain('ambiguous');
    });
});
