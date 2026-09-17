import {
    getCategoryMatch,
    getCoaMatch,
    normalize,
} from '@/lib/ppmp/normalize';
import type { ExistingCategory, ExistingCoa } from '@/lib/ppmp/normalize';
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
 * Optional COA context for breaking description+unit ties. The same
 * description + unit may exist under several COAs (one price-list row per
 * Category–COA junction) — the item's own COA picks the matching row.
 * NOTE: the extractor carries no category-header tracking (the standard
 * template's category column holds the description), so the category is
 * only a last-resort tiebreak — the COA does the real work.
 */
export type QuantityMatchContext = {
    categories: ExistingCategory[];
    coas: ExistingCoa[];
    mappings: ExistingMapping[];
};

/**
 * Narrow description+unit matches via the item's COA (column D titles).
 * Returns the single price list on a junction with that COA, or a message
 * naming why it stayed ambiguous.
 */
function disambiguateByJunction(
    item: UniqueQuantityItem,
    matches: ExistingPriceList[],
    context: QuantityMatchContext,
): { priceList: ExistingPriceList } | { message: string } {
    const coaRes = getCoaMatch(
        normalize(item.coa),
        context.coas,
        'account_title',
    );
    const coaId = coaRes.type === 'strict' ? (coaRes.match?.id ?? null) : null;

    if (coaId === null) {
        return {
            message: `Multiple price list matches (${matches.length}) — COA "${item.coa}" not found`,
        };
    }

    const junctionIds = new Set(
        context.mappings
            .filter((m) => m.chart_of_account_id === coaId)
            .map((m) => m.id),
    );
    const onCoa = matches.filter((p) =>
        junctionIds.has(p.chart_of_account_ppmp_category_id),
    );

    if (onCoa.length === 1) {
        return { priceList: onCoa[0] };
    }

    if (onCoa.length === 0) {
        return {
            message:
                'Item not in price list for this COA — create via Price List Import',
        };
    }

    // Same COA under several categories — try the category as tiebreak.
    const catRes = getCategoryMatch(
        normalize(item.category),
        context.categories,
    );
    const catId = catRes.type === 'strict' ? (catRes.match?.id ?? null) : null;
    const junction =
        catId === null
            ? undefined
            : context.mappings.find(
                  (m) =>
                      m.ppmp_category_id === catId &&
                      m.chart_of_account_id === coaId,
              );

    if (junction) {
        const onJunction = onCoa.filter(
            (p) => p.chart_of_account_ppmp_category_id === junction.id,
        );

        if (onJunction.length === 1) {
            return { priceList: onJunction[0] };
        }

        if (onJunction.length === 0) {
            return {
                message:
                    'Item not in price list for this category + COA — create via Price List Import',
            };
        }

        return {
            message: `Multiple price list matches (${onJunction.length}) on the same Category–COA mapping — ambiguous`,
        };
    }

    return {
        message: `Multiple price list matches (${onCoa.length}) share this COA — ambiguous`,
    };
}

/**
 * Maps extracted quantity items 1:1 to price-list rows by normalized
 * description + unit of measurement only. Category/COA are ignored, except
 * to break ties: when `context` is given and several rows share the
 * description + unit, the item's own COA (column D titles) picks the row
 * on a junction with that COA, with the category as a last-resort
 * tiebreak.
 */
export function matchQuantityItems(
    items: UniqueQuantityItem[],
    priceLists: ExistingPriceList[],
    context?: QuantityMatchContext,
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
            if (context) {
                const resolved = disambiguateByJunction(u, matches, context);

                if ('priceList' in resolved) {
                    return {
                        ...u,
                        priceListId: resolved.priceList.id,
                        priceListPrice: Number(resolved.priceList.price),
                        status: 'matched',
                        message: 'Mapped to price list (COA)',
                    };
                }

                return fail(resolved.message);
            }

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
