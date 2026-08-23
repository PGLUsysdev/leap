import type { TableRow } from "@/pages/ppmp/pdf-render/types";
import type { AipEntry } from "@/types";

// Helper to calculate totals from an array of items
function calculateTotals(items: any[]): Record<string, number> {
    const totals = { ps: 0, mooe: 0, fe: 0, co: 0, total: 0, ccet_adapt: 0, ccet_miti: 0 };
    items.forEach((item) => {
        totals.ps += Number(item.ps || 0);
        totals.mooe += Number(item.mooe || 0);
        totals.fe += Number(item.fe || 0);
        totals.co += Number(item.co || 0);
        totals.ccet_adapt += Number(item.ccet_adapt || 0);
        totals.ccet_miti += Number(item.ccet_miti || 0);
    });
    totals.total = totals.ps + totals.mooe + totals.fe + totals.co;

    return totals;
}

function toLetters(n: number): string {
    let s = "";

    while (n > 0) {
        n--;
        s = String.fromCharCode(65 + (n % 26)) + s;
        n = Math.floor(n / 26);
    }

    return s;
}

export function prepareAipSummaryRows(aipEntries: AipEntry[]): TableRow[] {
    let rowIdCounter = 0;

    // Build a hierarchical structure of PPAs + outputs + funding sources
    // We'll flatten them into rows.

    // Step 1: Group by PPA (we already have aipEntries, each has ppa)
    // We need to preserve the tree hierarchy. We'll use a recursive function.

    // Since aipEntries is already a flat list from the controller, but we need the tree.
    // We'll build a map of ppa_id -> children ppa_ids, using the parent_id relation.
    // Then we can traverse.

    // For simplicity, we'll assume aipEntries are already ordered by the tree (sortFlatLikeTree did that).
    // We'll iterate and keep track of depth and numbering.

    // But we also need to expand outputs and funding sources.

    // We'll create a function that processes a single PPA entry and returns an array of rows
    // for that PPA and its descendants.

    const processPpa = (entry: AipEntry, depth: number, number: string): TableRow[] => {
        const localRows: TableRow[] = [];
        const ppa = entry.ppa;

        if (!ppa) return localRows;

        const outputs = entry.outputs || [];

        // If no outputs, create one dummy item row
        if (outputs.length === 0) {
            localRows.push({
                id: `item-${rowIdCounter++}`,
                type: "item",
                item: {
                    ppa,
                    ppaNumber: number,
                    ref_code: ppa.full_code,
                    label: "",
                    officeAcronyms: ppa.office?.acronym || "",
                    start_date: null,
                    end_date: null,
                    expected_output: "-",
                    funding_source_code: "-",
                    ps: 0,
                    mooe: 0,
                    fe: 0,
                    co: 0,
                    total: 0,
                    ccet_adapt: 0,
                    ccet_miti: 0,
                    cc_typology_code: "-",
                    depth: depth,
                    isBold: false,
                    outputId: null,
                },
            });
        } else {
            // Process each output
            outputs.forEach((output) => {
                const sources = output.funding_sources || [];

                if (sources.length === 0) {
                    // dummy row for output with no funding sources
                    localRows.push({
                        id: `item-${rowIdCounter++}`,
                        type: "item",
                        item: {
                            ppa,
                            ppaNumber: number,
                            ref_code: ppa.full_code,
                            label: "",
                            officeAcronyms:
                                output.offices?.map((o) => o.acronym).join(" / ") ||
                                ppa.office?.acronym ||
                                "",
                            start_date: output.start_date,
                            end_date: output.end_date,
                            expected_output: output.expected_output,
                            funding_source_code: "-",
                            ps: 0,
                            mooe: 0,
                            fe: 0,
                            co: 0,
                            total: 0,
                            ccet_adapt: 0,
                            ccet_miti: 0,
                            cc_typology_code: "-",
                            depth: depth,
                            isBold: false,
                            outputId: output.id,
                        },
                    });
                } else {
                    sources.forEach((fs) => {
                        const total =
                            Number(fs.ps_amount || 0) +
                            Number(fs.mooe_amount || 0) +
                            Number(fs.fe_amount || 0) +
                            Number(fs.co_amount || 0);
                        localRows.push({
                            id: `item-${rowIdCounter++}`,
                            type: "item",
                            item: {
                                ppa,
                                ppaNumber: number,
                                ref_code: ppa.full_code,
                                label: "",
                                officeAcronyms:
                                    output.offices?.map((o) => o.acronym).join(" / ") ||
                                    ppa.office?.acronym ||
                                    "",
                                start_date: output.start_date,
                                end_date: output.end_date,
                                expected_output: output.expected_output,
                                funding_source_code: fs.funding_source?.code || "-",
                                ps: Number(fs.ps_amount || 0),
                                mooe: Number(fs.mooe_amount || 0),
                                fe: Number(fs.fe_amount || 0),
                                co: Number(fs.co_amount || 0),
                                total: total,
                                ccet_adapt: Number(fs.ccet_adaptation || 0),
                                ccet_miti: Number(fs.ccet_mitigation || 0),
                                cc_typology_code: fs.cc_typology?.code || "-",
                                depth: depth,
                                isBold: false,
                                outputId: output.id,
                            },
                        });
                    });
                }
            });
        }

        return localRows;
    };

    // Iterate over the flat list of aipEntries, but we need to build a tree.
    // We'll build a map of ppa_id -> entry, and then sort by parent_id.
    const entryMap = new Map<number, AipEntry>();
    aipEntries.forEach((entry) => entryMap.set(entry.ppa_id, entry));

    // Find roots: entries whose ppa.parent_id is null (sorted like the UI does)
    const roots = aipEntries
        .filter((e) => e.ppa?.parent_id === null)
        .sort((a, b) => (a.ppa?.sort_order || 0) - (b.ppa?.sort_order || 0));

    // We'll process each root recursively, but we need to gather children.
    // We'll build a tree: for each ppa_id, we'll find children entries.
    const childrenMap = new Map<number, AipEntry[]>();
    aipEntries.forEach((entry) => {
        const parentId = entry.ppa?.parent_id;

        if (parentId !== null && parentId !== undefined) {
            if (!childrenMap.has(parentId)) childrenMap.set(parentId, []);

            childrenMap.get(parentId)!.push(entry);
        }
    });

    // Sort children by sort_order
    for (const arr of childrenMap.values()) {
        arr.sort((a, b) => (a.ppa?.sort_order || 0) - (b.ppa?.sort_order || 0));
    }

    // Now traverse
    const traverse = (entries: AipEntry[], depth: number, numbering: string[]): TableRow[] => {
        let result: TableRow[] = [];
        entries.forEach((entry, idx) => {
            const currentNumbering = depth === 0 ? [] : [...numbering, (idx + 1).toString()];
            // Same numbering as sortFlatLikeTree: letters at top level, dotted
            // counters (excluding the letter) below
            const number =
                depth === 0 ? `${toLetters(idx + 1)}.` : `${currentNumbering.join(".")}.`;
            const rows = processPpa(entry, depth, number);
            result = result.concat(rows);
            // Process children
            const children = childrenMap.get(entry.ppa_id) || [];

            if (children.length > 0) {
                const childRows = traverse(children, depth + 1, currentNumbering);
                result = result.concat(childRows);
            }
        });

        return result;
    };

    // Start with roots
    const allRows = traverse(roots, 0, []);

    // Suppress duplicate PPA‑level and output‑level columns
    let lastPpaId: number | null = null;
    let lastOutputId: number | null = null;

    allRows.forEach((row) => {
        if (row.type !== "item") return;

        const item = row.item;
        const ppaId = item.ppa?.id ?? null;
        const outputId = item.outputId ?? null;

        // ---------- PPA‑level suppression ----------
        if (ppaId !== lastPpaId) {
            // First row of a new PPA: show number, PPA name and ref code
            item.label = `${item.ppaNumber} ${item.ppa?.name || ""}`;
            item.ref_code = item.ppa?.full_code || "";
            lastPpaId = ppaId;
            lastOutputId = null; // reset output grouping
        } else {
            // Same PPA: blank out PPA‑level columns
            item.label = "";
            item.ref_code = "";
        }

        // ---------- Output‑level suppression ----------
        const isSameOutput = outputId !== null && outputId === lastOutputId;

        if (!isSameOutput) {
            // First row of a new output (or no output at all): keep output fields
            lastOutputId = outputId;
        } else {
            // Same output: blank out output‑level columns
            item.officeAcronyms = "";
            item.start_date = null;
            item.end_date = null;
            item.expected_output = "";
        }
    });

    // Mark the last item row of each PPA group
    let currentPpaId: number | null = null;
    let lastPpaItemRow: TableRow | null = null;

    for (const row of allRows) {
        if (row.type !== "item") continue;

        const ppaId = row.item?.ppa?.id ?? null;

        if (lastPpaItemRow && ppaId !== currentPpaId) {
            lastPpaItemRow.isLastInPpaGroup = true;
        }

        currentPpaId = ppaId;
        lastPpaItemRow = row;
    }

    if (lastPpaItemRow) {
        lastPpaItemRow.isLastInPpaGroup = true;
    }

    // Add grand total row
    const allItems = allRows.filter((r) => r.type === "item");

    if (allItems.length > 0) {
        const grandTotals = calculateTotals(allItems.map((r) => r.item));
        allRows.push({
            id: `grand-total-${rowIdCounter++}`,
            type: "grand-total",
            label: "GRAND TOTAL",
            totals: grandTotals,
        });
    }

    return allRows;
}
