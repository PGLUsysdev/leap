import { normalize } from '@/lib/ppmp/normalize';
import type { UniqueQuantityItem } from '@/lib/ppmp/quantities-extract';

export type ExistingPriceList = {
    id: number;
    description: string;
    unit_of_measurement: string;
    price: string | number;
    chart_of_account_ppmp_category_id: number;
    expense_class?: string | null;
};

export type ExistingMapping = {
    id: number;
    chart_of_account_id: number;
    ppmp_category_id: number;
};

export type MappedQuantityItem = UniqueQuantityItem & {
    priceListId: number | null;
    priceListPrice: number | null;
    status: 'matched' | 'error';
    message: string;
};

/**
 * Maps extracted quantity items 1:1 to price-list rows by normalized
 * description + unit of measurement only. Category/COA are ignored.
 */
export function matchQuantityItems(
    items: UniqueQuantityItem[],
    priceLists: ExistingPriceList[],
): MappedQuantityItem[] {
    return items.map((u) => {
        const fail = (message: string): MappedQuantityItem => ({
            ...u,
            priceListId: null,
            priceListPrice: null,
            status: 'error',
            message,
        });

        const descNorm = normalize(u.description);
        const uomNorm = normalize(u.unit);

        if (!descNorm) {
            return fail('Description is empty');
        }

        if (!uomNorm) {
            return fail('Unit is empty');
        }

        const matches = priceLists.filter(
            (p) =>
                normalize(p.description) === descNorm &&
                normalize(p.unit_of_measurement) === uomNorm,
        );

        if (matches.length === 0) {
            return fail(
                'Item not in price list — create via Price List Import',
            );
        }

        if (matches.length > 1) {
            return fail(
                `Multiple price list matches (${matches.length}) — ambiguous`,
            );
        }

        const [priceList] = matches;

        return {
            ...u,
            priceListId: priceList.id,
            priceListPrice: Number(priceList.price),
            status: 'matched',
            message: 'Mapped to price list',
        };
    });
}
