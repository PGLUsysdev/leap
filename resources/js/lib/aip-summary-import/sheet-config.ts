/**
 * AIP Summary sheet calibration — own config, NOT shared with the PPMP
 * importers (`lib/ppmp/sheet-config.ts`). The AIP sheet is a different
 * layout (fixed A–O flat rows), so it gets its own type + defaults.
 *
 * Docs: `docs/aip-summary-file-structure.md` (sheet spec),
 * `docs/aip-summary-import.md` (import logic).
 */

export const AIP_SUMMARY_FIELDS = [
    'refCode',
    'description',
    'office',
    'startDate',
    'endDate',
    'expectedOutput',
    'fundingSource',
    'adaptation',
    'mitigation',
    'typology',
] as const;

export type AipSummaryField = (typeof AIP_SUMMARY_FIELDS)[number];

export type AipSummaryColumnConfig = Record<AipSummaryField, string>;

export type AipSummarySheetConfig = {
    columnConfig: AipSummaryColumnConfig;
    /** 1-indexed leaf-header row. Empty until the user calibrates it. */
    headerRow: number | '';
    /** When true (default), the row directly below the header must hold `1`–`15` at the calibrated columns. */
    hasNumberRow: boolean;
};

export const AIP_SUMMARY_FIELD_LABELS: Record<AipSummaryField, string> = {
    refCode: 'AIP Reference Code (A)',
    description: 'PPA Description (B)',
    office: 'Implementing Office (C)',
    startDate: 'Starting Date (D)',
    endDate: 'Completion Date (E)',
    expectedOutput: 'Expected Outputs (F)',
    fundingSource: 'Funding Source (G)',
    adaptation: 'Adaptation (M)',
    mitigation: 'Mitigation (N)',
    typology: 'Typology Code (O)',
};

export const AIP_SUMMARY_FIELD_GROUPS: Array<{
    title: string;
    fields: AipSummaryField[];
}> = [
    { title: 'Identity (A–C)', fields: ['refCode', 'description', 'office'] },
    { title: 'Schedule (D–E)', fields: ['startDate', 'endDate'] },
    { title: 'Output (F–G)', fields: ['expectedOutput', 'fundingSource'] },
    {
        title: 'Climate (M–O)',
        fields: ['adaptation', 'mitigation', 'typology'],
    },
];

export function getDefaultAipSummaryConfig(): AipSummarySheetConfig {
    // Amount columns (H–L) are not imported, so they get no calibration entry.
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'M', 'N', 'O'];

    const columnConfig = Object.fromEntries(
        AIP_SUMMARY_FIELDS.map((field, i) => [field, letters[i]]),
    ) as AipSummaryColumnConfig;

    return { columnConfig, headerRow: '', hasNumberRow: true };
}
