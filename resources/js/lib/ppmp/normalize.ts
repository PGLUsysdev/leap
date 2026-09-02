export function normalize(str: string): string {
    return str.trim().replace(/\s+/g, " ").toLowerCase();
}

export function isTotalRow(normalized: string): boolean {
    return /\s*-\s*total$/.test(normalized) || /^total\b/.test(normalized);
}

export const SHORT_PROCUREMENT_ROOTS = new Set(["oil", "gas", "ink", "lab", "cop", "car", "med", "law"]);

export function levenshtein(a: string, b: string): number {
    if (a === b) return 0;
    const al = a.length;
    const bl = b.length;
    if (al === 0) return bl;
    if (bl === 0) return al;
    let prev = Array(bl + 1)
        .fill(0)
        .map((_, i) => i);
    let cur = Array(bl + 1).fill(0);
    for (let i = 1; i <= al; i++) {
        cur[0] = i;
        for (let j = 1; j <= bl; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
        }
        [prev, cur] = [cur, prev];
    }
    return prev[bl];
}

export type ExistingCategory = { id: number; name: string; is_non_procurement: boolean; is_additional: boolean };
export type ExistingCoa = { id: number; account_number: string; path: string; account_title: string };

export function getCategoryMatch(
    candidateNorm: string,
    existingCategories: ExistingCategory[],
): { type: "strict" | "partial" | "none"; match?: ExistingCategory; topMatches?: Array<{ category: ExistingCategory; score: number }> } {
    for (const dbCat of existingCategories) {
        const dbNorm = normalize(dbCat.name);
        if (candidateNorm === dbNorm) return { type: "strict", match: dbCat };
    }
    const partials: Array<{ category: ExistingCategory; score: number }> = [];
    const candidateLen = candidateNorm.length;
    for (const dbCat of existingCategories) {
        const dbNorm = normalize(dbCat.name);
        const dbLen = dbNorm.length;
        const levThreshold = dbLen <= 5 ? 1 : dbLen <= 12 ? 2 : 3;
        const dist = levenshtein(candidateNorm, dbNorm);
        if (dist <= levThreshold) {
            partials.push({ category: dbCat, score: dist });
            continue;
        }
        const isEligibleLength = candidateLen >= 4 || SHORT_PROCUREMENT_ROOTS.has(candidateNorm);
        if (isEligibleLength && (dbNorm.includes(candidateNorm) || candidateNorm.includes(dbNorm))) {
            partials.push({ category: dbCat, score: 99 });
        }
    }
    if (partials.length > 0) {
        partials.sort((a, b) => a.score - b.score);
        return { type: "partial", topMatches: partials.slice(0, 3) };
    }
    return { type: "none" };
}

export function columnToNumber(col: string): number {
    let n = 0;
    for (const ch of col.toUpperCase()) {
        if (ch < "A" || ch > "Z") continue;
        n = n * 26 + (ch.charCodeAt(0) - 64);
    }
    return n;
}

export function numberToColumn(n: number): string {
    let s = "";
    while (n > 0) {
        const m = (n - 1) % 26;
        s = String.fromCharCode(65 + m) + s;
        n = Math.floor((n - 1) / 26);
    }
    return s;
}

export function leftColumn(col: string): string {
    const n = columnToNumber(col);
    if (n <= 1) return col;
    return numberToColumn(n - 1);
}

export function getCoaMatch(
    candidateNorm: string,
    existingCoas: ExistingCoa[],
    mode: "auto" | "account_number" | "account_title",
): { type: "strict" | "partial" | "none"; match?: ExistingCoa; topMatches?: Array<{ coa: ExistingCoa; score: number }> } {
    const normalizeCoa = (c: ExistingCoa) => ({
        title: normalize(c.account_title),
        number: normalize(c.account_number),
        path: normalize(c.path),
        pathNoDash: normalize(c.path.replace(/-/g, " ")),
    });
    for (const coa of existingCoas) {
        const n = normalizeCoa(coa);
        if (mode === "account_title") {
            if (candidateNorm === n.title) return { type: "strict", match: coa };
        } else if (mode === "account_number") {
            if (candidateNorm === n.number || candidateNorm === n.path || candidateNorm === n.pathNoDash) return { type: "strict", match: coa };
        } else {
            if (candidateNorm === n.title || candidateNorm === n.number || candidateNorm === n.path || candidateNorm === n.pathNoDash) return { type: "strict", match: coa };
        }
    }
    const partials: Array<{ coa: ExistingCoa; score: number }> = [];
    const candidateLen = candidateNorm.length;
    for (const coa of existingCoas) {
        const n = normalizeCoa(coa);
        const targets = mode === "account_title" ? [n.title] : mode === "account_number" ? [n.number, n.path, n.pathNoDash] : [n.title, n.number, n.path, n.pathNoDash];
        let bestScore: number | null = null;
        for (const t of targets) {
            const tLen = t.length;
            const levThreshold = tLen <= 5 ? 1 : tLen <= 12 ? 2 : 3;
            const dist = levenshtein(candidateNorm, t);
            if (dist <= levThreshold) {
                bestScore = bestScore === null ? dist : Math.min(bestScore, dist);
            }
            const isEligibleLength = candidateLen >= 4;
            if (isEligibleLength && (t.includes(candidateNorm) || candidateNorm.includes(t))) {
                bestScore = bestScore === null ? 99 : Math.min(bestScore, 99);
            }
        }
        if (bestScore !== null) partials.push({ coa, score: bestScore });
    }
    if (partials.length > 0) {
        partials.sort((a, b) => a.score - b.score);
        return { type: "partial", topMatches: partials.slice(0, 3) };
    }
    return { type: "none" };
}
