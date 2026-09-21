/**
 * AIP ref-code helpers — own module, NOT shared with PPMP
 * (`lib/ppmp/*` has no ref-code concept).
 *
 * A valid data row always carries an AIP ref code whose first four
 * segments are the office prefix (`SSSS-L-TT-OOO`, e.g. `1000-1-03-009`).
 * Footer rows (signatories like "Prepared by:") never match, so the
 * prefix check is the sure-fire way to exclude them.
 */

const OFFICE_PREFIX_PATTERN = /^\d{4}-\d-\d{2}-\d{3}(?=-|$)/;

/** True when the value opens with an office prefix (`1000-1-03-009…`). */
export function hasAipRefCodePrefix(value: string | null): boolean {
    if (!value) return false;

    return OFFICE_PREFIX_PATTERN.test(value.trim());
}
