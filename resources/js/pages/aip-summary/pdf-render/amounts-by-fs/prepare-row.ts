import type { TableRow } from "@/pages/ppmp/pdf-render/types";
import type { AipEntry } from "@/types";

// Collect all funding sources from a list of AipEntries
// Skips sources without a valid funding_source_id or funding_source object
function collectAllFundingSources(entries: AipEntry[]) {
    const sources: any[] = [];

    for (const entry of entries) {
        const outputs = entry.outputs || [];
        for (const output of outputs) {
            const fundingSources = output.funding_sources || [];
            for (const fs of fundingSources) {
                // Only include if we have a valid funding_source_id and a funding_source object
                if (fs.funding_source_id && fs.funding_source) {
                    sources.push(fs);
                }
            }
        }
    }

    return sources;
}

// Compute totals per funding source and overall
function computeTotals(fundingSources: any[]) {
    const map = new Map<number, any>();

    for (const fs of fundingSources) {
        const id = fs.funding_source_id;

        if (!map.has(id)) {
            map.set(id, {
                funding_source: fs.funding_source,
                ps: 0,
                mooe: 0,
                fe: 0,
                co: 0,
                ccet_adapt: 0,
                ccet_miti: 0,
            });
        }

        const entry = map.get(id);
        entry.ps += Number(fs.ps_amount || 0);
        entry.mooe += Number(fs.mooe_amount || 0);
        entry.fe += Number(fs.fe_amount || 0);
        entry.co += Number(fs.co_amount || 0);
        entry.ccet_adapt += Number(fs.ccet_adaptation || 0);
        entry.ccet_miti += Number(fs.ccet_mitigation || 0);
    }

    const rows = Array.from(map.values());
    const grandTotal = rows.reduce(
        (acc, row) => {
            acc.ps += row.ps;
            acc.mooe += row.mooe;
            acc.fe += row.fe;
            acc.co += row.co;
            acc.ccet_adapt += row.ccet_adapt;
            acc.ccet_miti += row.ccet_miti;
            return acc;
        },
        { ps: 0, mooe: 0, fe: 0, co: 0, ccet_adapt: 0, ccet_miti: 0 },
    );

    return { rows, grandTotal };
}

export function prepareFsSummaryRows(aipEntries: AipEntry[]): TableRow[] {
    const allSources = collectAllFundingSources(aipEntries);
    const { rows, grandTotal } = computeTotals(allSources);

    const result: TableRow[] = [];

    // Create an item row for each funding source
    rows.forEach((row, index) => {
        const total = row.ps + row.mooe + row.fe + row.co;
        result.push({
            id: `fs-item-${index}`,
            type: "item",
            item: {
                funding_source: row.funding_source,
                ps: row.ps,
                mooe: row.mooe,
                fe: row.fe,
                co: row.co,
                ccet_adapt: row.ccet_adapt,
                ccet_miti: row.ccet_miti,
                total: total,
            },
        });
    });

    // Add grand total row only if there are rows
    if (rows.length > 0) {
        const grandTotalValue = grandTotal.ps + grandTotal.mooe + grandTotal.fe + grandTotal.co;
        result.push({
            id: "fs-grand-total",
            type: "grand-total",
            label: "GRAND TOTAL",
            totals: {
                ps: grandTotal.ps,
                mooe: grandTotal.mooe,
                fe: grandTotal.fe,
                co: grandTotal.co,
                ccet_adapt: grandTotal.ccet_adapt,
                ccet_miti: grandTotal.ccet_miti,
                total: grandTotalValue,
            },
        });
    }

    return result;
}
