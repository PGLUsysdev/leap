import { Head, router } from '@inertiajs/react';
import ExcelJS from 'exceljs';
import { FileSpreadsheet } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useState, useMemo } from 'react';
import { Badge } from '@/components/base-ui-components/ui/badge';
import { Button } from '@/components/base-ui-components/ui/button';
import {
    Field,
    FieldDescription,
    FieldLabel,
} from '@/components/base-ui-components/ui/field';
import { Input } from '@/components/base-ui-components/ui/input';
import {
    ScrollArea,
    ScrollBar,
} from '@/components/base-ui-components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/base-ui-components/ui/select';
import { Spinner } from '@/components/base-ui-components/ui/spinner';
import { Switch } from '@/components/base-ui-components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/base-ui-components/ui/table';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/base-ui-components/ui/tabs';
import {
    ToggleGroup,
    ToggleGroupItem,
} from '@/components/base-ui-components/ui/toggle-group';
import { cellText } from '@/lib/excel/cell-helpers';
import { getCategoryMatch, isTotalRow, normalize } from '@/lib/ppmp/normalize';
import type { ExistingCategory } from '@/lib/ppmp/normalize';
import { getDefaultSharedConfig } from '@/lib/ppmp/sheet-config';
import type { SharedSheetConfig } from '@/lib/ppmp/sheet-config';
import { index as categoryImportIndex } from '@/routes/category-import';
import { index as importsIndex } from '@/routes/imports';

type VerifyResult = {
    valid: boolean;
    message: string;
    errors: Array<{ row: number; message: string }>;
    groups: { procurement: number; additional: number; nonProcurement: number };
    details: string[];
};

type CatLocation = { sheet: string; row: number; col: string; address: string };
type ExtractResult = {
    filtered: Array<{
        row: number;
        raw: string;
        normalized: string;
        sheet: string;
        address: string;
    }>;
    unique: Array<{
        raw: string;
        normalized: string;
        rows: number[];
        count: number;
        sheets: string[];
        sheetCount: number;
        locations: CatLocation[];
    }>;
    duplicates: Array<{
        normalized: string;
        keptRow: number;
        keptSheet: string;
        keptAddress: string;
        duplicateRow: number;
        duplicateSheet: string;
        duplicateAddress: string;
        duplicateRaw: string;
    }>;
    excludedTotal: Array<{
        row: number;
        raw: string;
        normalized: string;
        sheet: string;
    }>;
    excludedCoa: Array<{
        row: number;
        raw: string;
        normalized: string;
        nextRowCoaRaw: string;
        nextRowCoaNormalized: string;
        sheet: string;
    }>;
    skippedCoaNotEmpty: Array<{
        row: number;
        coaRaw: string;
        coaNormalized: string;
        raw: string;
        normalized: string;
        sheet: string;
    }>;
    skippedProblematic: Array<{
        row: number;
        raw: string;
        normalized: string;
        reason: string;
        sheet: string;
    }>;
};

interface CategoryImportProps {
    existingCategories?: ExistingCategory[];
}

export default function CategoryImport({
    existingCategories = [],
}: CategoryImportProps) {
    const [sheets, setSheets] = useState<string[]>([]);
    const [workbook, setWorkbook] = useState<ExcelJS.Workbook | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Calibrations – shared + per-sheet (snapshot mode: shared does not auto-overwrite per-sheet until Apply)
    const [calibrationMode, setCalibrationMode] = useState<
        'shared' | 'per-sheet'
    >('shared');
    const [sharedConfig, setSharedConfig] = useState<SharedSheetConfig | null>(
        null,
    );
    const [calibrations, setCalibrations] = useState<
        Record<string, SharedSheetConfig>
    >({});
    const [currentSheet, setCurrentSheet] = useState<string>('');

    const [verifyResults, setVerifyResults] = useState<
        Record<string, VerifyResult>
    >({});
    const [activeVerifySheet, setActiveVerifySheet] = useState<string>('');
    const [extractResult, setExtractResult] = useState<ExtractResult | null>(
        null,
    );
    const [step, setStep] = useState<
        'upload' | 'calibrate' | 'verify' | 'extract'
    >('upload');
    const [importing, setImporting] = useState(false);
    const [skipProblematic, setSkipProblematic] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [isAdditionalDraft, setIsAdditionalDraft] = useState<
        Record<string, boolean>
    >({});

    function getEffectiveConfig(sheet: string): SharedSheetConfig {
        if (calibrationMode === 'shared' && sharedConfig) return sharedConfig;

        return calibrations[sheet] ?? sharedConfig ?? getDefaultSharedConfig();
    }

    const canCalibrate = selectedSheets.length > 0;
    const canVerify =
        canCalibrate &&
        !!workbook &&
        selectedSheets.length > 0 &&
        !!sharedConfig;
    const allVerifyValid =
        selectedSheets.length > 0 &&
        selectedSheets.every((s) => verifyResults[s]?.valid);
    const hasAnyVerify = selectedSheets.some((s) => !!verifyResults[s]);
    const canExtract =
        canVerify && hasAnyVerify && (allVerifyValid || skipProblematic);

    const extractionStats = useMemo(() => {
        if (!extractResult) return null;

        return {
            raw: extractResult.filtered.length,
            unique: extractResult.unique.length,
            duplicates: extractResult.duplicates.length,
        };
    }, [extractResult]);

    async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];

        if (!file) return;

        const isXlsx =
            file.name.toLowerCase().endsWith('.xlsx') ||
            file.type ===
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        if (!isXlsx) {
            setError('Only .xlsx files are allowed.');
            setSheets([]);
            setWorkbook(null);
            setSelectedSheets([]);
            setCurrentSheet('');
            setSharedConfig(null);
            setCalibrations({});
            setFileName(null);
            e.target.value = '';

            return;
        }

        setError(null);
        setLoading(true);
        setFileName(file.name);
        setSelectedSheets([]);
        setCurrentSheet('');
        setSharedConfig(null);
        setCalibrations({});
        setVerifyResults({});
        setActiveVerifySheet('');
        setExtractResult(null);
        setStep('upload');

        try {
            const wb = new ExcelJS.Workbook();
            const arrayBuffer = await file.arrayBuffer();
            await wb.xlsx.load(arrayBuffer);
            setWorkbook(wb);
            setSheets(wb.worksheets.map((ws) => ws.name));
        } catch {
            setError(
                'Failed to parse .xlsx file. Please ensure it is a valid Excel file.',
            );
            setSheets([]);
            setWorkbook(null);
            setSelectedSheets([]);
            setCurrentSheet('');
            setSharedConfig(null);
            setCalibrations({});
        } finally {
            setLoading(false);
        }
    }

    function handleSheetToggle(sheet: string) {
        setSelectedSheets((prev) => {
            const next = prev.includes(sheet)
                ? prev.filter((s) => s !== sheet)
                : [...prev, sheet];
            // reset verification when selection changes
            setVerifyResults({});
            setActiveVerifySheet(next[0] ?? '');
            setExtractResult(null);
            setSkipProblematic(false);

            if (next.length > 0 && !next.includes(currentSheet))
                setCurrentSheet(next[0]);

            if (next.length === 0) setCurrentSheet('');

            return next;
        });
    }

    function handleSheetSelect(sheet: string) {
        handleSheetToggle(sheet);
    }

    function ensureCalibrationsInitialized() {
        if (sharedConfig) return;

        const def = getDefaultSharedConfig();
        setSharedConfig(def);
        const clones: Record<string, SharedSheetConfig> = {};

        for (const s of selectedSheets) clones[s] = { ...def };

        setCalibrations(clones);

        if (!currentSheet && selectedSheets[0])
            setCurrentSheet(selectedSheets[0]);
    }

    function handleApplySharedToAll() {
        if (!sharedConfig) return;

        const next: Record<string, SharedSheetConfig> = {};

        for (const s of selectedSheets) next[s] = { ...sharedConfig };

        setCalibrations(next);
    }

    function handleCopyCurrentToAll() {
        const src = calibrations[currentSheet] ?? sharedConfig;

        if (!src) return;

        const next: Record<string, SharedSheetConfig> = {};

        for (const s of selectedSheets) next[s] = { ...src };

        setCalibrations(next);
        // snapshot – do not overwrite sharedConfig
    }

    function updateSharedConfig(patch: Partial<SharedSheetConfig>) {
        setSharedConfig((prev) => ({
            ...(prev ?? getDefaultSharedConfig()),
            ...patch,
        }));
    }

    function updateCurrentCalibration(patch: Partial<SharedSheetConfig>) {
        if (!currentSheet) return;

        setCalibrations((prev) => ({
            ...prev,
            [currentSheet]: {
                ...(prev[currentSheet] ??
                    sharedConfig ??
                    getDefaultSharedConfig()),
                ...patch,
            },
        }));
    }

    function verifySheet(sheet: string, cfg: SharedSheetConfig): VerifyResult {
        if (!workbook) {
            return {
                valid: false,
                message: 'Workbook not loaded',
                errors: [{ row: 0, message: 'Workbook not loaded' }],
                groups: { procurement: 0, additional: 0, nonProcurement: 0 },
                details: [],
            };
        }

        const ws = workbook.getWorksheet(sheet);

        if (!ws) {
            return {
                valid: false,
                message: `Worksheet "${sheet}" not found`,
                errors: [{ row: 0, message: `Worksheet "${sheet}" not found` }],
                groups: { procurement: 0, additional: 0, nonProcurement: 0 },
                details: [],
            };
        }

        const dataColumn = cfg.columnConfig.category;
        const coaColumn = cfg.columnConfig.coa;
        const itemColumn = cfg.columnConfig.itemNumber;
        const { headerRow, additionalItemsHeaderRow, nonProcurementHeaderRow } =
            cfg.rowConfig;
        const { coaLabelMode } = cfg;

        if (headerRow === '' || headerRow == null) {
            return {
                valid: false,
                message: 'Header Row is required',
                errors: [
                    {
                        row: 0,
                        message: 'Header Row is required — check calibration',
                    },
                ],
                groups: { procurement: 0, additional: 0, nonProcurement: 0 },
                details: [],
            };
        }

        const lastRow = ws.actualRowCount;
        const procurementStart = headerRow + 1;
        const procurementEnd = additionalItemsHeaderRow
            ? additionalItemsHeaderRow - 1
            : nonProcurementHeaderRow
              ? nonProcurementHeaderRow - 1
              : lastRow;
        const additionalStart = additionalItemsHeaderRow
            ? additionalItemsHeaderRow + 1
            : -1;
        const additionalEnd = nonProcurementHeaderRow
            ? nonProcurementHeaderRow - 1
            : lastRow;
        const nonProcStart = nonProcurementHeaderRow
            ? nonProcurementHeaderRow + 1
            : -1;
        const nonProcEnd = lastRow;

        const errors: Array<{ row: number; message: string }> = [];
        const details: string[] = [];
        details.push(
            `COA label mode: ${coaLabelMode === 'without-label' ? 'Without label (COA on item rows)' : 'With label (COA label rows)'}`,
        );

        const groups = { procurement: 0, additional: 0, nonProcurement: 0 };
        const countData = (s: number, e: number) => {
            if (s < 0 || e < 0 || s > e) return 0;

            let c = 0;

            for (let r = s; r <= e && r <= lastRow; r++) {
                const v = cellText(ws.getRow(r).getCell(dataColumn));

                if (v) c++;
            }

            return c;
        };
        groups.procurement = additionalItemsHeaderRow
            ? countData(procurementStart, procurementEnd)
            : countData(
                  procurementStart,
                  nonProcurementHeaderRow
                      ? nonProcurementHeaderRow - 1
                      : lastRow,
              );
        groups.additional = additionalItemsHeaderRow
            ? countData(additionalStart, additionalEnd)
            : 0;
        groups.nonProcurement = nonProcurementHeaderRow
            ? countData(nonProcStart, nonProcEnd)
            : 0;

        if (!additionalItemsHeaderRow) {
            details.push(
                'Additional Items header not calibrated — skipping additional group check',
            );
        }

        if (!nonProcurementHeaderRow) {
            details.push(
                'Non-Procurement header not calibrated — skipping non-procurement group check',
            );
        }

        if (procurementStart > procurementEnd) {
            errors.push({
                row: procurementStart,
                message: `Procurement range invalid [${procurementStart}..${procurementEnd}] — check header calibrations`,
            });
        } else if (groups.procurement === 0) {
            errors.push({
                row: procurementStart,
                message:
                    'No data found in procurement group — check header calibration',
            });
        }

        if (additionalItemsHeaderRow && groups.additional === 0) {
            errors.push({
                row: additionalStart,
                message: 'No data found in additional items group',
            });
        }

        const verifyStart = procurementStart;
        const verifyEnd = procurementEnd;

        type CatGroup = {
            cat: string;
            catRow: number;
            coas: Array<{ coa: string; coaRow: number; items: number }>;
            totalRow?: number;
        };
        const catGroups: CatGroup[] = [];
        let currentCat: CatGroup | null = null;
        let currentCoa: { coa: string; coaRow: number; items: number } | null =
            null;

        const flushCat = (totalRow?: number) => {
            if (currentCat) {
                if (currentCoa) {
                    currentCat.coas.push({ ...currentCoa });
                    currentCoa = null;
                }

                if (totalRow) currentCat.totalRow = totalRow;

                catGroups.push(currentCat);
                currentCat = null;
            }
        };

        for (let r = verifyStart; r <= verifyEnd && r <= lastRow; r++) {
            const row = ws.getRow(r);
            const coaRaw = cellText(row.getCell(coaColumn));
            const dataRaw = cellText(row.getCell(dataColumn));
            const itemRaw = cellText(row.getCell(itemColumn));

            if (!dataRaw && !coaRaw) continue;

            const coaNorm = coaRaw ? normalize(coaRaw) : null;
            const dataNorm = dataRaw ? normalize(dataRaw) : null;

            if (dataNorm === 'description') continue;

            if (coaNorm && dataRaw) {
                if (!currentCat) {
                    errors.push({
                        row: r,
                        message: `Item at row ${r} ("${dataRaw}") found without active category`,
                    });
                    continue;
                }

                if (coaLabelMode === 'without-label') {
                    // COA directly on item row – group by COA value, no label rows expected
                    if (!currentCoa || coaNorm !== normalize(currentCoa.coa)) {
                        if (currentCoa) {
                            if (currentCoa.items === 0) {
                                errors.push({
                                    row: currentCoa.coaRow,
                                    message: `COA "${currentCoa.coa}" at row ${currentCoa.coaRow} in cat "${currentCat.cat}" has no items before next COA`,
                                });
                            }

                            currentCat.coas.push({ ...currentCoa });
                        }

                        currentCoa = { coa: coaRaw!, coaRow: r, items: 1 };
                    } else {
                        currentCoa.items += 1;
                    }

                    continue;
                } else {
                    if (!currentCoa) {
                        errors.push({
                            row: r,
                            message: `Item at row ${r} ("${dataRaw}") found without active COA in cat "${currentCat.cat}"`,
                        });
                        continue;
                    }

                    if (coaNorm !== normalize(currentCoa.coa)) {
                        errors.push({
                            row: r,
                            message: `Item COA mismatch at row ${r}: D="${coaRaw}" != current COA "${currentCoa.coa}" in cat "${currentCat.cat}"`,
                        });
                    }

                    currentCoa.items += 1;
                    continue;
                }
            }

            if (!dataRaw || !dataNorm) continue;

            if (itemRaw && dataRaw && !coaNorm) {
                errors.push({
                    row: r,
                    message: `Item at row ${r} ("${dataRaw}") has an item number but no COA (D)`,
                });
                continue;
            }

            if (isTotalRow(dataNorm)) {
                const expected = currentCat
                    ? normalize(`${currentCat.cat} - total`)
                    : null;

                if (!currentCat) {
                    errors.push({
                        row: r,
                        message: `Total "${dataRaw}" at row ${r} without active category`,
                    });
                } else if (expected && dataNorm !== expected) {
                    errors.push({
                        row: r,
                        message: `Total mismatch at row ${r}: got "${dataRaw}" (norm "${dataNorm}") expected "${currentCat.cat} - TOTAL"`,
                    });
                }

                if (currentCat) {
                    if (currentCoa) {
                        currentCat.coas.push({ ...currentCoa });
                        currentCoa = null;
                    }

                    if (currentCat.coas.length === 0) {
                        errors.push({
                            row: r,
                            message: `Category "${currentCat.cat}" at row ${currentCat.catRow} has no COA groups before total`,
                        });
                    } else {
                        for (const c of currentCat.coas) {
                            if (c.items === 0) {
                                errors.push({
                                    row: c.coaRow,
                                    message: `COA "${c.coa}" at row ${c.coaRow} in cat "${currentCat.cat}" has no items`,
                                });
                            }
                        }
                    }

                    flushCat(r);
                }

                continue;
            }

            if (coaLabelMode === 'with-label') {
                let isCoaLabel = false;
                let nextCoaRaw: string | null = null;
                let nextCoaNorm: string | null = null;

                if (r + 1 <= lastRow) {
                    nextCoaRaw = cellText(ws.getRow(r + 1).getCell(coaColumn));
                    nextCoaNorm = nextCoaRaw ? normalize(nextCoaRaw) : null;

                    if (nextCoaNorm && dataNorm && nextCoaNorm === dataNorm)
                        isCoaLabel = true;
                }

                if (isCoaLabel) {
                    if (!currentCat) {
                        errors.push({
                            row: r,
                            message: `COA "${dataRaw}" at row ${r} found without active category`,
                        });
                        continue;
                    }

                    if (currentCoa) {
                        if (currentCoa.items === 0) {
                            errors.push({
                                row: currentCoa.coaRow,
                                message: `COA "${currentCoa.coa}" at row ${currentCoa.coaRow} in cat "${currentCat.cat}" has no items before next COA`,
                            });
                        }

                        currentCat.coas.push({ ...currentCoa });
                    }

                    currentCoa = { coa: dataRaw, coaRow: r, items: 0 };
                    continue;
                }

                if (nextCoaNorm && dataNorm) {
                    errors.push({
                        row: r,
                        message: `COA label "${dataRaw}" at row ${r} mismatched next D "${nextCoaRaw}" after normalize (expected same) — not treated as category`,
                    });
                    continue;
                }
            }

            if (currentCat) {
                errors.push({
                    row: r,
                    message: `Category "${dataRaw}" at row ${r} started before previous cat "${currentCat.cat}" (row ${currentCat.catRow}) closed with " - TOTAL"`,
                });

                if (currentCoa) {
                    if (currentCoa.items === 0) {
                        errors.push({
                            row: currentCoa.coaRow,
                            message: `COA "${currentCoa.coa}" at row ${currentCoa.coaRow} in cat "${currentCat.cat}" has no items`,
                        });
                    }

                    currentCat.coas.push({ ...currentCoa });
                    currentCoa = null;
                }

                catGroups.push(currentCat);
            }

            currentCat = { cat: dataRaw, catRow: r, coas: [] };
            currentCoa = null;
        }

        if (currentCat) {
            if (currentCoa) {
                if (currentCoa.items === 0) {
                    errors.push({
                        row: currentCoa.coaRow,
                        message: `COA "${currentCoa.coa}" at row ${currentCoa.coaRow} in cat "${currentCat.cat}" has no items at end`,
                    });
                }

                currentCat.coas.push({ ...currentCoa });
            }

            if (!currentCat.totalRow) {
                errors.push({
                    row: currentCat.catRow,
                    message: `Category "${currentCat.cat}" at row ${currentCat.catRow} missing closing "${currentCat.cat} - TOTAL" (found ${currentCat.coas.length} COA(s))`,
                });
            } else if (currentCat.coas.length === 0) {
                errors.push({
                    row: currentCat.catRow,
                    message: `Category "${currentCat.cat}" has no COAs`,
                });
            }

            catGroups.push(currentCat);
        }

        if (catGroups.length) {
            details.push(
                `Procurement groups: ${catGroups.length} cat(s) verified in rows [${verifyStart}..${verifyEnd}] (excluding additional)`,
            );

            for (const g of catGroups) {
                details.push(
                    `  Cat "${g.cat}" row ${g.catRow}: ${g.coas.length} COA(s)${g.totalRow ? ` → total at ${g.totalRow}` : ' MISSING total'}`,
                );
            }
        }

        const procurementErrors = errors.filter(
            (e) => e.row <= verifyEnd || e.message.includes('Procurement'),
        );
        const valid = procurementErrors.length === 0;
        const message = valid
            ? `✅ Format OK — ${catGroups.length} procurement cat group(s) verified` +
              (groups.additional || groups.nonProcurement
                  ? ` | Additional: ${groups.additional ? 'found' : '—'}, Non-Proc: ${groups.nonProcurement ? 'found' : '—'}`
                  : '')
            : `❌ Found ${errors.length} issue(s) in procurement format`;
        console.log(`[${sheet}]`, message, errors, catGroups);

        return { valid, message, errors, groups, details };
    }

    function handleVerify() {
        setSkipProblematic(false);
        setExtractResult(null);

        if (!workbook || selectedSheets.length === 0) return;

        // ensure calibration initialized
        if (!sharedConfig) ensureCalibrationsInitialized();

        const next: Record<string, VerifyResult> = {};

        for (const sheet of selectedSheets) {
            const cfg = getEffectiveConfig(sheet);
            const result = verifySheet(sheet, cfg);
            next[sheet] = result;
        }

        setVerifyResults(next);
        const firstInvalid = selectedSheets.find((s) => !next[s]?.valid);
        setActiveVerifySheet(firstInvalid ?? selectedSheets[0] ?? '');

        if (Object.keys(next).length) {
            console.table(
                Object.entries(next).map(([sh, r]) => ({
                    sheet: sh,
                    valid: r.valid,
                    errors: r.errors.length,
                    message: r.message,
                })),
            );
        }
    }

    function handleExtract() {
        if (!workbook || selectedSheets.length === 0) return;

        const filtered: ExtractResult['filtered'] = [];
        const excludedTotal: ExtractResult['excludedTotal'] = [];
        const excludedCoa: ExtractResult['excludedCoa'] = [];
        const skippedCoaNotEmpty: ExtractResult['skippedCoaNotEmpty'] = [];
        const skippedProblematic: ExtractResult['skippedProblematic'] = [];

        // Build per-sheet problematic lookups when skipProblematic is on
        const problematicBySheet = new Map<
            string,
            { rows: Set<number>; norms: Set<string> }
        >();

        if (skipProblematic) {
            for (const sheet of selectedSheets) {
                const vr = verifyResults[sheet];

                if (!vr || vr.valid) continue;

                const rows = new Set<number>();
                const norms = new Set<string>();

                for (const e of vr.errors) {
                    rows.add(e.row);
                    const quoted = e.message.match(/"([^"]+)"/g);

                    if (quoted) {
                        for (const q of quoted) {
                            const inner = q.slice(1, -1);

                            if (inner) norms.add(normalize(inner));
                        }
                    }
                }

                problematicBySheet.set(sheet, { rows, norms });
            }
        }

        for (const sheet of selectedSheets) {
            const cfg = getEffectiveConfig(sheet);
            const dataColumn = cfg.columnConfig.category;
            const coaColumn = cfg.columnConfig.coa;
            const itemColumn = cfg.columnConfig.itemNumber;
            const {
                headerRow,
                additionalItemsHeaderRow,
                nonProcurementHeaderRow,
            } = cfg.rowConfig;
            const { coaLabelMode } = cfg;

            if (headerRow === '' || headerRow == null) continue;

            const ws = workbook!.getWorksheet(sheet);

            if (!ws) continue;

            const startRow = headerRow + 1;
            const lastRow = ws.actualRowCount;
            const prob = problematicBySheet.get(sheet);
            const probRows = prob?.rows ?? new Set<number>();
            const probNorms = prob?.norms ?? new Set<string>();

            for (let r = startRow; r <= lastRow; r++) {
                const row = ws.getRow(r);
                const coaRaw = cellText(row.getCell(coaColumn));
                const dataRaw = cellText(row.getCell(dataColumn));
                const itemRaw = cellText(row.getCell(itemColumn));

                if (!dataRaw) continue;

                const coaNorm = coaRaw ? normalize(coaRaw) : null;
                const dataNorm = normalize(dataRaw);

                if (dataNorm === 'description') continue;

                if (additionalItemsHeaderRow && r === additionalItemsHeaderRow)
                    continue;

                if (nonProcurementHeaderRow && r === nonProcurementHeaderRow)
                    continue;

                if (
                    dataNorm === 'non-procurement requirements' ||
                    dataNorm === 'additional items' ||
                    dataNorm === 'procurement requirements'
                ) {
                    continue;
                }

                if (additionalItemsHeaderRow && r > additionalItemsHeaderRow)
                    continue;

                if (nonProcurementHeaderRow && r > nonProcurementHeaderRow)
                    continue;

                if (
                    skipProblematic &&
                    prob &&
                    (probRows.has(r) || probNorms.has(dataNorm))
                ) {
                    const reason = probRows.has(r)
                        ? `row ${r} flagged in verify (${sheet})`
                        : `normalized "${dataNorm}" flagged (${sheet})`;
                    skippedProblematic.push({
                        row: r,
                        raw: dataRaw,
                        normalized: dataNorm,
                        reason,
                        sheet,
                    });
                    continue;
                }

                if (
                    skipProblematic &&
                    prob &&
                    coaNorm &&
                    (probRows.has(r) || probNorms.has(coaNorm))
                ) {
                    skippedProblematic.push({
                        row: r,
                        raw: dataRaw,
                        normalized: dataNorm,
                        reason: `COA "${coaRaw}" flagged (${sheet})`,
                        sheet,
                    });
                    continue;
                }

                if (coaNorm) {
                    skippedCoaNotEmpty.push({
                        row: r,
                        coaRaw: coaRaw!,
                        coaNormalized: coaNorm,
                        raw: dataRaw,
                        normalized: dataNorm,
                        sheet,
                    });
                    continue;
                }

                if (itemRaw && !coaNorm) {
                    // Item-numbered row without COA — flagged in verify, never a category
                    continue;
                }

                if (isTotalRow(dataNorm)) {
                    excludedTotal.push({
                        row: r,
                        raw: dataRaw,
                        normalized: dataNorm,
                        sheet,
                    });
                    continue;
                }

                if (coaLabelMode === 'with-label' && r + 1 <= lastRow) {
                    const nextRow = ws.getRow(r + 1);
                    const nextCoaRaw = cellText(nextRow.getCell(coaColumn));
                    const nextCoaNorm = nextCoaRaw
                        ? normalize(nextCoaRaw)
                        : null;

                    if (nextCoaNorm && nextCoaNorm === dataNorm) {
                        excludedCoa.push({
                            row: r,
                            raw: dataRaw,
                            normalized: dataNorm,
                            nextRowCoaRaw: nextCoaRaw!,
                            nextRowCoaNormalized: nextCoaNorm,
                            sheet,
                        });
                        continue;
                    }
                }

                const address = `${sheet}!${dataColumn}${r}`;
                filtered.push({
                    row: r,
                    raw: dataRaw,
                    normalized: dataNorm,
                    sheet,
                    address,
                });
            }
        }

        // Global dedupe across all sheets – keep sheet count + locations
        type SeenVal = {
            raw: string;
            normalized: string;
            rows: number[];
            sheets: string[];
            locations: CatLocation[];
        };
        const seen = new Map<string, SeenVal>();
        const duplicates: ExtractResult['duplicates'] = [];

        for (const c of filtered) {
            const existing = seen.get(c.normalized);
            const loc: CatLocation = {
                sheet: c.sheet,
                row: c.row,
                col: getEffectiveConfig(c.sheet).columnConfig.category,
                address: c.address,
            };

            if (!existing) {
                seen.set(c.normalized, {
                    raw: c.raw,
                    normalized: c.normalized,
                    rows: [c.row],
                    sheets: [c.sheet],
                    locations: [loc],
                });
            } else {
                existing.rows.push(c.row);

                if (!existing.sheets.includes(c.sheet))
                    existing.sheets.push(c.sheet);

                existing.locations.push(loc);
                const kept = existing.locations[0];
                duplicates.push({
                    normalized: c.normalized,
                    keptRow: kept.row,
                    keptSheet: kept.sheet,
                    keptAddress: kept.address,
                    duplicateRow: c.row,
                    duplicateSheet: c.sheet,
                    duplicateAddress: c.address,
                    duplicateRaw: c.raw,
                });
            }
        }

        const unique = [...seen.values()].map((v) => ({
            raw: v.raw,
            normalized: v.normalized,
            rows: v.rows,
            count: v.locations.length,
            sheets: v.sheets,
            sheetCount: v.sheets.length,
            locations: v.locations,
        }));
        // sort by sheetCount desc then raw
        unique.sort(
            (a, b) => b.sheetCount - a.sheetCount || a.raw.localeCompare(b.raw),
        );

        console.log('Extract multi-sheet', {
            filtered,
            unique,
            duplicates,
            excludedTotal,
            excludedCoa,
            skippedProblematic,
        });

        if (skippedProblematic.length > 0) {
            console.table(
                skippedProblematic.map((s) => ({
                    sheet: s.sheet,
                    row: s.row,
                    raw: s.raw,
                    reason: s.reason,
                })),
            );
        }

        setExtractResult({
            filtered,
            unique,
            duplicates,
            excludedTotal,
            excludedCoa,
            skippedCoaNotEmpty,
            skippedProblematic,
        });
        setSelected(new Set(unique.map((u) => u.normalized)));
        setIsAdditionalDraft({});
    }

    function handleImport() {
        if (!extractResult || extractResult.unique.length === 0) return;

        const toImport = extractResult.unique.filter((u) =>
            selected.has(u.normalized),
        );

        if (toImport.length === 0) return;

        setImporting(true);
        router.post(
            '/category-import' as const,
            {
                categories: toImport.map((u) => ({
                    name: u.raw,
                    normalized: u.normalized,
                    is_additional: isAdditionalDraft[u.normalized] ?? false,
                })),
            } as never,
            {
                onFinish: () => setImporting(false),
            },
        );
    }

    return (
        <>
            <ScrollArea className="h-[calc(100vh-3rem)] border">
                <Head title="Category Import" />
                <div className="flex flex-col gap-4 p-4">
                    <h1 className="text-2xl font-semibold">Category Import</h1>

                    {fileName && !loading && (
                        <div className="bg-muted/40 supports-[backdrop-filter]:bg-muted/30 sticky top-0 z-10 flex items-center gap-2 rounded-md border px-3 py-2 text-sm backdrop-blur">
                            <FileSpreadsheet className="text-muted-foreground h-4 w-4 shrink-0" />
                            <span
                                className="max-w-[42ch] truncate font-medium"
                                title={fileName}
                            >
                                {fileName}
                            </span>
                            <span className="text-muted-foreground hidden sm:inline">
                                •
                            </span>
                            <span className="text-muted-foreground truncate">
                                {selectedSheets.length > 0
                                    ? `${selectedSheets.length}/${sheets.length} sheets: ${selectedSheets.join(', ')}`
                                    : `${sheets.length} sheet${sheets.length === 1 ? '' : 's'} found`}
                            </span>
                            {selectedSheets.length > 0 &&
                                selectedSheets.length !== sheets.length && (
                                    <span className="text-muted-foreground hidden text-xs sm:inline">
                                        ({sheets.length} total)
                                    </span>
                                )}
                        </div>
                    )}

                    <Tabs
                        value={step}
                        onValueChange={(v) => setStep(v as typeof step)}
                    >
                        <TabsList variant="line" className="w-full">
                            <TabsTrigger value="upload" className="flex-1">
                                1. Upload & Sheets
                                {selectedSheets.length > 0 && (
                                    <span className="text-muted-foreground ml-1 text-xs">
                                        {selectedSheets.length}✓
                                    </span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger
                                value="calibrate"
                                disabled={!canCalibrate}
                            >
                                2. Calibrate
                                {sharedConfig && (
                                    <span className="text-muted-foreground ml-1 text-xs">
                                        {calibrationMode === 'shared'
                                            ? 'shared'
                                            : 'per-sheet'}
                                    </span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="verify" disabled={!canVerify}>
                                3. Verify Format
                                {allVerifyValid && (
                                    <span className="ml-1 text-xs text-green-600">
                                        ✓ {selectedSheets.length}
                                    </span>
                                )}
                                {!allVerifyValid && hasAnyVerify && (
                                    <span className="ml-1 text-xs text-amber-600">
                                        {
                                            Object.values(verifyResults).filter(
                                                (r) => r.valid,
                                            ).length
                                        }
                                        /{selectedSheets.length}
                                    </span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="extract" disabled={!canExtract}>
                                4. Extract & Import
                                {extractResult && (
                                    <span className="text-muted-foreground ml-1 text-xs">
                                        {extractResult.unique.length}
                                    </span>
                                )}
                                {!allVerifyValid &&
                                    skipProblematic &&
                                    hasAnyVerify && (
                                        <span className="ml-1 text-xs text-amber-600">
                                            skip
                                        </span>
                                    )}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent
                            value="upload"
                            className="mt-4 flex flex-col gap-4"
                        >
                            <Field>
                                <FieldLabel htmlFor="category-import-file">
                                    Excel File (.xlsx only)
                                </FieldLabel>
                                <Input
                                    id="category-import-file"
                                    type="file"
                                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                    onChange={handleFileChange}
                                    disabled={loading}
                                />
                                <FieldDescription>
                                    Select an .xlsx file. Only .xlsx is accepted
                                    (ExcelJS).
                                </FieldDescription>
                                {error && (
                                    <p className="text-destructive text-sm">
                                        {error}
                                    </p>
                                )}
                            </Field>
                            {loading && (
                                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                                    <Spinner /> Parsing workbook...
                                </div>
                            )}
                            {!loading && sheets.length > 0 && (
                                <Field>
                                    <FieldLabel>
                                        Sheets — click to select one or more
                                        (multi-sheet)
                                    </FieldLabel>
                                    <div className="flex flex-wrap gap-2 rounded-lg border p-3">
                                        {sheets.map((sheet) => {
                                            const isSelected =
                                                selectedSheets.includes(sheet);

                                            return (
                                                <Badge
                                                    key={sheet}
                                                    variant={
                                                        isSelected
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                    className="cursor-pointer text-sm transition-colors hover:opacity-80"
                                                    onClick={() =>
                                                        handleSheetToggle(sheet)
                                                    }
                                                >
                                                    {sheet} {isSelected && '✓'}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                    <FieldDescription>
                                        Selected:{' '}
                                        <span className="text-foreground font-medium">
                                            {selectedSheets.length > 0
                                                ? selectedSheets.join(', ')
                                                : 'none'}
                                        </span>{' '}
                                        — {selectedSheets.length}/
                                        {sheets.length} sheets
                                    </FieldDescription>
                                    {selectedSheets.length > 1 && (
                                        <p className="text-muted-foreground text-xs">
                                            Shared calibration will apply to all{' '}
                                            {selectedSheets.length} sheets;
                                            per-sheet mode lets you adjust
                                            individually.
                                        </p>
                                    )}
                                </Field>
                            )}
                            <div className="flex justify-end">
                                <Button
                                    disabled={selectedSheets.length === 0}
                                    onClick={() => {
                                        ensureCalibrationsInitialized();
                                        setStep('calibrate');
                                    }}
                                >
                                    Next: Calibrate{' '}
                                    {selectedSheets.length > 0 &&
                                        `(${selectedSheets.length} sheets)`}
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent
                            value="calibrate"
                            className="mt-4 flex flex-col gap-4"
                        >
                            <div className="bg-muted/20 flex flex-wrap items-center gap-3 rounded-lg border p-3">
                                <span className="text-sm font-medium">
                                    Scope:
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        variant={
                                            calibrationMode === 'shared'
                                                ? 'default'
                                                : 'outline'
                                        }
                                        size="sm"
                                        onClick={() => {
                                            if (
                                                calibrationMode ===
                                                    'per-sheet' &&
                                                calibrations[currentSheet]
                                            ) {
                                                setSharedConfig({
                                                    ...calibrations[
                                                        currentSheet
                                                    ],
                                                });
                                            } else if (!sharedConfig) {
                                                ensureCalibrationsInitialized();
                                            }

                                            setCalibrationMode('shared');
                                        }}
                                    >
                                        Shared — all {selectedSheets.length}{' '}
                                        sheets
                                    </Button>
                                    <Button
                                        variant={
                                            calibrationMode === 'per-sheet'
                                                ? 'default'
                                                : 'outline'
                                        }
                                        size="sm"
                                        onClick={() => {
                                            if (sharedConfig) {
                                                const next: Record<
                                                    string,
                                                    SharedSheetConfig
                                                > = {};

                                                for (const s of selectedSheets) {
                                                    next[s] = {
                                                        ...sharedConfig,
                                                        ...calibrations[s],
                                                    };
                                                }

                                                // keep existing per-sheet overrides
                                                setCalibrations(next);

                                                if (
                                                    !currentSheet &&
                                                    selectedSheets[0]
                                                ) {
                                                    setCurrentSheet(
                                                        selectedSheets[0],
                                                    );
                                                }
                                            }

                                            setCalibrationMode('per-sheet');
                                        }}
                                    >
                                        Per-sheet
                                    </Button>
                                </div>
                                <span className="text-muted-foreground text-xs">
                                    {calibrationMode === 'shared'
                                        ? `Start row ${sharedConfig?.rowConfig.headerRow === '' || sharedConfig?.rowConfig.headerRow == null ? 7 : sharedConfig.rowConfig.headerRow} applies to every sheet — change once. Snapshot: use “Apply to all” to overwrite per-sheet.`
                                        : `Each sheet can differ. Editing ${currentSheet || '—'} only affects that sheet.`}
                                </span>
                                {calibrationMode === 'shared' ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleApplySharedToAll}
                                        disabled={!sharedConfig}
                                    >
                                        Apply shared to all (
                                        {selectedSheets.length})
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCopyCurrentToAll}
                                        disabled={!currentSheet}
                                    >
                                        Copy “{currentSheet}” to all
                                    </Button>
                                )}
                            </div>

                            {calibrationMode === 'per-sheet' &&
                                selectedSheets.length > 1 && (
                                    <Field>
                                        <FieldLabel>Editing sheet</FieldLabel>
                                        <Select
                                            value={currentSheet}
                                            onValueChange={setCurrentSheet}
                                        >
                                            <SelectTrigger className="w-[260px]">
                                                <SelectValue placeholder="Select sheet to edit" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {selectedSheets.map((s) => (
                                                        <SelectItem
                                                            key={s}
                                                            value={s}
                                                        >
                                                            {s}{' '}
                                                            {verifyResults[s]
                                                                ?.valid
                                                                ? '✓'
                                                                : verifyResults[
                                                                        s
                                                                    ]
                                                                  ? '❌'
                                                                  : ''}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        <FieldDescription>
                                            Per-sheet calibration — changes
                                            affect only the selected sheet.
                                        </FieldDescription>
                                    </Field>
                                )}

                            {(() => {
                                const cfg =
                                    calibrationMode === 'shared'
                                        ? (sharedConfig ??
                                          getDefaultSharedConfig())
                                        : (calibrations[currentSheet] ??
                                          sharedConfig ??
                                          getDefaultSharedConfig());
                                const onChange = (
                                    patch: Partial<SharedSheetConfig>,
                                ) => {
                                    if (calibrationMode === 'shared')
                                        updateSharedConfig(patch);
                                    else updateCurrentCalibration(patch);

                                    setVerifyResults({});
                                    setExtractResult(null);
                                };

                                return (
                                    <div className="rounded-lg border p-4">
                                        <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
                                            Calibration{' '}
                                            {calibrationMode === 'shared'
                                                ? `(Shared – ${selectedSheets.length} sheets)`
                                                : `(Per-sheet – ${currentSheet || selectedSheets[0]})`}
                                        </p>
                                        <div className="grid grid-cols-3 gap-4">
                                            <Field>
                                                <FieldLabel htmlFor="data-column">
                                                    Data Column
                                                </FieldLabel>
                                                <Input
                                                    id="data-column"
                                                    value={
                                                        cfg.columnConfig
                                                            .category
                                                    }
                                                    onChange={(e) =>
                                                        onChange({
                                                            columnConfig: {
                                                                ...cfg.columnConfig,
                                                                category:
                                                                    e.target.value.toUpperCase(),
                                                            },
                                                        })
                                                    }
                                                    className="w-16"
                                                    placeholder="F"
                                                />
                                                <FieldDescription>
                                                    Category data — default F
                                                </FieldDescription>
                                            </Field>
                                            <Field>
                                                <FieldLabel htmlFor="coa-column">
                                                    Chart of Accounts Column
                                                </FieldLabel>
                                                <Input
                                                    id="coa-column"
                                                    value={cfg.columnConfig.coa}
                                                    onChange={(e) =>
                                                        onChange({
                                                            columnConfig: {
                                                                ...cfg.columnConfig,
                                                                coa: e.target.value.toUpperCase(),
                                                            },
                                                        })
                                                    }
                                                    className="w-16"
                                                    placeholder="D"
                                                />
                                                <FieldDescription>
                                                    COA column — empty means
                                                    category. Default D
                                                </FieldDescription>
                                            </Field>
                                            <Field>
                                                <FieldLabel htmlFor="unit-column">
                                                    Unit Column
                                                </FieldLabel>
                                                <Input
                                                    id="unit-column"
                                                    value={
                                                        cfg.columnConfig.unit
                                                    }
                                                    onChange={(e) =>
                                                        onChange({
                                                            columnConfig: {
                                                                ...cfg.columnConfig,
                                                                unit: e.target.value.toUpperCase(),
                                                            },
                                                        })
                                                    }
                                                    className="w-16"
                                                    placeholder="G"
                                                />
                                                <FieldDescription>
                                                    Not consumed by this
                                                    importer — standard field
                                                </FieldDescription>
                                            </Field>
                                            <Field>
                                                <FieldLabel htmlFor="price-column">
                                                    Price Column
                                                </FieldLabel>
                                                <Input
                                                    id="price-column"
                                                    value={
                                                        cfg.columnConfig.price
                                                    }
                                                    onChange={(e) =>
                                                        onChange({
                                                            columnConfig: {
                                                                ...cfg.columnConfig,
                                                                price: e.target.value.toUpperCase(),
                                                            },
                                                        })
                                                    }
                                                    className="w-16"
                                                    placeholder="H"
                                                />
                                                <FieldDescription>
                                                    Not consumed by this
                                                    importer — standard field
                                                </FieldDescription>
                                            </Field>
                                            <Field>
                                                <FieldLabel htmlFor="item-number-column">
                                                    Item No. Column
                                                </FieldLabel>
                                                <Input
                                                    id="item-number-column"
                                                    value={
                                                        cfg.columnConfig
                                                            .itemNumber
                                                    }
                                                    onChange={(e) =>
                                                        onChange({
                                                            columnConfig: {
                                                                ...cfg.columnConfig,
                                                                itemNumber:
                                                                    e.target.value.toUpperCase(),
                                                            },
                                                        })
                                                    }
                                                    className="w-16"
                                                    placeholder="E"
                                                />
                                                <FieldDescription>
                                                    Item number — placeholder
                                                    detection. Default E
                                                </FieldDescription>
                                            </Field>
                                            <Field>
                                                <FieldLabel htmlFor="header-row">
                                                    Header Row
                                                </FieldLabel>
                                                <Input
                                                    id="header-row"
                                                    type="number"
                                                    value={
                                                        cfg.rowConfig
                                                            .headerRow ?? ''
                                                    }
                                                    onChange={(e) =>
                                                        onChange({
                                                            rowConfig: {
                                                                ...cfg.rowConfig,
                                                                headerRow:
                                                                    e.target
                                                                        .value ===
                                                                    ''
                                                                        ? ''
                                                                        : Number(
                                                                              e
                                                                                  .target
                                                                                  .value,
                                                                          ),
                                                            },
                                                        })
                                                    }
                                                    className="w-20"
                                                    placeholder="7"
                                                />
                                                <FieldDescription>
                                                    Header{' '}
                                                    {cfg.rowConfig.headerRow ===
                                                        '' ||
                                                    cfg.rowConfig.headerRow ==
                                                        null
                                                        ? '—'
                                                        : cfg.rowConfig
                                                              .headerRow}
                                                    ; data starts{' '}
                                                    {cfg.rowConfig.headerRow ===
                                                        '' ||
                                                    cfg.rowConfig.headerRow ==
                                                        null
                                                        ? '—'
                                                        : cfg.rowConfig
                                                              .headerRow + 1}
                                                </FieldDescription>
                                            </Field>
                                        </div>
                                        <Field className="mt-4">
                                            <FieldLabel>
                                                COA items format *
                                            </FieldLabel>
                                            <ToggleGroup
                                                variant="outline"
                                                spacing={2}
                                                value={[cfg.coaLabelMode]}
                                                onValueChange={(value) => {
                                                    if (value.length > 0) {
                                                        onChange({
                                                            coaLabelMode:
                                                                value[0] as SharedSheetConfig['coaLabelMode'],
                                                        });
                                                    }
                                                }}
                                                className="w-full"
                                            >
                                                <ToggleGroupItem
                                                    value="with-label"
                                                    className="h-auto flex-1 flex-col items-start gap-1 border p-3 text-left whitespace-normal"
                                                >
                                                    <span className="font-medium">
                                                        With COA label rows
                                                    </span>
                                                    <span className="text-muted-foreground text-xs font-normal whitespace-normal">
                                                        Category → COA label in
                                                        F (next D same) → Items
                                                        with D=COA
                                                    </span>
                                                    <span className="text-muted-foreground/70 font-mono text-xs">
                                                        Cat 1 → coa 1 → items /
                                                        coa 2 → items → Cat 1 -
                                                        Total
                                                    </span>
                                                </ToggleGroupItem>
                                                <ToggleGroupItem
                                                    value="without-label"
                                                    className="h-auto flex-1 flex-col items-start gap-1 border p-3 text-left whitespace-normal"
                                                >
                                                    <span className="font-medium">
                                                        Without label
                                                    </span>
                                                    <span className="text-muted-foreground text-xs font-normal whitespace-normal">
                                                        Category → Items
                                                        directly with D=COA (no
                                                        extra label row)
                                                    </span>
                                                    <span className="text-muted-foreground/70 font-mono text-xs">
                                                        Cat 1 → items (coa 1),
                                                        items (coa 2) → Cat 1 -
                                                        Total
                                                    </span>
                                                </ToggleGroupItem>
                                            </ToggleGroup>
                                            <FieldDescription>
                                                Choose the layout your sheets
                                                use. Both tables you showed are
                                                supported.
                                            </FieldDescription>
                                        </Field>
                                        <div className="mt-4 grid grid-cols-2 gap-4">
                                            <Field>
                                                <FieldLabel htmlFor="additional-header-row">
                                                    Additional Items Header Row
                                                </FieldLabel>
                                                <Input
                                                    id="additional-header-row"
                                                    type="number"
                                                    value={
                                                        cfg.rowConfig
                                                            .additionalItemsHeaderRow ??
                                                        ''
                                                    }
                                                    onChange={(e) => {
                                                        const v = e.target.value
                                                            ? Number(
                                                                  e.target
                                                                      .value,
                                                              )
                                                            : null;
                                                        onChange({
                                                            rowConfig: {
                                                                ...cfg.rowConfig,
                                                                additionalItemsHeaderRow:
                                                                    v,
                                                            },
                                                        });
                                                    }}
                                                    className="w-24"
                                                    placeholder="e.g. 85"
                                                />
                                                <FieldDescription>
                                                    {cfg.rowConfig
                                                        .additionalItemsHeaderRow
                                                        ? `Resumes at ${cfg.rowConfig.additionalItemsHeaderRow + 1}`
                                                        : 'Leave empty if none'}
                                                </FieldDescription>
                                            </Field>
                                            <Field>
                                                <FieldLabel htmlFor="nonproc-header-row">
                                                    Non-Procurement Header Row
                                                </FieldLabel>
                                                <Input
                                                    id="nonproc-header-row"
                                                    type="number"
                                                    value={
                                                        cfg.rowConfig
                                                            .nonProcurementHeaderRow ??
                                                        ''
                                                    }
                                                    onChange={(e) => {
                                                        const v = e.target.value
                                                            ? Number(
                                                                  e.target
                                                                      .value,
                                                              )
                                                            : null;
                                                        onChange({
                                                            rowConfig: {
                                                                ...cfg.rowConfig,
                                                                nonProcurementHeaderRow:
                                                                    v,
                                                            },
                                                        });
                                                    }}
                                                    className="w-24"
                                                    placeholder="e.g. 1258"
                                                />
                                                <FieldDescription>
                                                    {cfg.rowConfig
                                                        .nonProcurementHeaderRow
                                                        ? `Starts at ${cfg.rowConfig.nonProcurementHeaderRow + 1}`
                                                        : 'Leave empty if none'}
                                                </FieldDescription>
                                            </Field>
                                        </div>
                                        <div className="text-muted-foreground mt-3 text-xs">
                                            Groups: procurement [
                                            {cfg.rowConfig.headerRow === '' ||
                                            cfg.rowConfig.headerRow == null
                                                ? '—'
                                                : cfg.rowConfig.headerRow + 1}
                                            ..
                                            {cfg.rowConfig
                                                .additionalItemsHeaderRow
                                                ? cfg.rowConfig
                                                      .additionalItemsHeaderRow -
                                                  1
                                                : cfg.rowConfig
                                                        .nonProcurementHeaderRow
                                                  ? cfg.rowConfig
                                                        .nonProcurementHeaderRow -
                                                    1
                                                  : 'last'}
                                            ] → additional [
                                            {cfg.rowConfig
                                                .additionalItemsHeaderRow
                                                ? cfg.rowConfig
                                                      .additionalItemsHeaderRow +
                                                  1
                                                : '—'}
                                            ..
                                            {cfg.rowConfig
                                                .nonProcurementHeaderRow
                                                ? cfg.rowConfig
                                                      .nonProcurementHeaderRow -
                                                  1
                                                : 'last'}
                                            ] → non-proc [
                                            {cfg.rowConfig
                                                .nonProcurementHeaderRow
                                                ? cfg.rowConfig
                                                      .nonProcurementHeaderRow +
                                                  1
                                                : '—'}
                                            ..last]
                                        </div>
                                        {calibrationMode === 'per-sheet' && (
                                            <div className="mt-3 text-xs">
                                                <span className="text-muted-foreground">
                                                    Effective for{' '}
                                                    {selectedSheets.length}{' '}
                                                    sheets:{' '}
                                                </span>
                                                {selectedSheets.map((s) => {
                                                    const c =
                                                        calibrations[s] ??
                                                        sharedConfig;
                                                    const same =
                                                        c &&
                                                        cfg &&
                                                        c.rowConfig
                                                            .headerRow ===
                                                            cfg.rowConfig
                                                                .headerRow &&
                                                        c.columnConfig
                                                            .category ===
                                                            cfg.columnConfig
                                                                .category &&
                                                        c.columnConfig.coa ===
                                                            cfg.columnConfig
                                                                .coa &&
                                                        c.coaLabelMode ===
                                                            cfg.coaLabelMode;

                                                    return (
                                                        <Badge
                                                            key={s}
                                                            variant={
                                                                same
                                                                    ? 'secondary'
                                                                    : 'outline'
                                                            }
                                                            className="mr-1 text-xs"
                                                        >
                                                            {s}:{' '}
                                                            {c
                                                                ? `${c.columnConfig.category}/${c.columnConfig.coa} H${c.rowConfig.headerRow} ${c.coaLabelMode === 'without-label' ? 'no-label' : 'label'}`
                                                                : 'default'}
                                                        </Badge>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                            <div className="flex justify-between">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep('upload')}
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={() => setStep('verify')}
                                    disabled={!canVerify}
                                >
                                    Next: Verify Format
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent
                            value="verify"
                            className="mt-4 flex flex-col gap-4"
                        >
                            <div className="rounded-lg border p-4">
                                <p className="mb-2 text-sm font-medium">
                                    Verify procurement format per sheet
                                    (categories not in additional)
                                </p>
                                <p className="text-muted-foreground mb-3 text-xs">
                                    Checks each selected sheet (
                                    {selectedSheets.length}) with its
                                    calibration ({calibrationMode}) — cat →
                                    coa(s) → items → cat - total. Per-sheet
                                    results below.
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="secondary"
                                        disabled={!canVerify}
                                        onClick={handleVerify}
                                    >
                                        Verify {selectedSheets.length} Sheet
                                        {selectedSheets.length === 1 ? '' : 's'}
                                    </Button>
                                    {hasAnyVerify && (
                                        <span className="text-muted-foreground text-xs">
                                            {
                                                Object.values(
                                                    verifyResults,
                                                ).filter((r) => r.valid).length
                                            }
                                            /{selectedSheets.length} valid
                                            {allVerifyValid && ' — all ✅'}
                                        </span>
                                    )}
                                </div>
                                {hasAnyVerify && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {selectedSheets.map((sh) => {
                                            const r = verifyResults[sh];

                                            if (!r) {
                                                return (
                                                    <Badge
                                                        key={sh}
                                                        variant="secondary"
                                                    >
                                                        {sh}: —
                                                    </Badge>
                                                );
                                            }

                                            return (
                                                <Badge
                                                    key={sh}
                                                    variant={
                                                        r.valid
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                    className={
                                                        r.valid
                                                            ? 'bg-green-600'
                                                            : 'bg-amber-500'
                                                    }
                                                >
                                                    {sh}:{' '}
                                                    {r.valid ? '✅' : '❌'}{' '}
                                                    {r.errors.length} issues
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                )}
                                {hasAnyVerify && selectedSheets.length > 1 && (
                                    <Tabs
                                        value={activeVerifySheet}
                                        onValueChange={setActiveVerifySheet}
                                        className="mt-4"
                                    >
                                        <TabsList
                                            variant="line"
                                            className="w-full"
                                        >
                                            {selectedSheets.map((sh) => {
                                                const r = verifyResults[sh];

                                                return (
                                                    <TabsTrigger
                                                        key={sh}
                                                        value={sh}
                                                        className="flex-1"
                                                    >
                                                        {sh}{' '}
                                                        {r?.valid ? (
                                                            <span className="ml-1 text-xs text-green-600">
                                                                ✓
                                                            </span>
                                                        ) : r ? (
                                                            <span className="ml-1 text-xs text-amber-600">
                                                                ❌{' '}
                                                                {
                                                                    r.errors
                                                                        .length
                                                                }
                                                            </span>
                                                        ) : null}
                                                    </TabsTrigger>
                                                );
                                            })}
                                        </TabsList>
                                        {selectedSheets.map((sh) => {
                                            const verifyResult =
                                                verifyResults[sh];

                                            if (!verifyResult) {
                                                return (
                                                    <TabsContent
                                                        key={sh}
                                                        value={sh}
                                                    >
                                                        <div className="text-muted-foreground p-4 text-sm">
                                                            Not verified yet.
                                                        </div>
                                                    </TabsContent>
                                                );
                                            }

                                            return (
                                                <TabsContent
                                                    key={sh}
                                                    value={sh}
                                                >
                                                    <div
                                                        className={`mt-4 rounded-md border p-3 text-sm ${verifyResult.valid ? 'border-green-200 bg-green-50 text-green-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}
                                                    >
                                                        <div className="font-medium">
                                                            {
                                                                verifyResult.message
                                                            }{' '}
                                                            <span className="text-xs font-normal opacity-70">
                                                                — {sh}
                                                            </span>
                                                        </div>
                                                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                                            <Badge
                                                                variant={
                                                                    verifyResult
                                                                        .groups
                                                                        .procurement
                                                                        ? 'default'
                                                                        : 'secondary'
                                                                }
                                                            >
                                                                Procurement:{' '}
                                                                {
                                                                    verifyResult
                                                                        .groups
                                                                        .procurement
                                                                }{' '}
                                                                cells
                                                            </Badge>
                                                            <Badge
                                                                variant={
                                                                    verifyResult
                                                                        .groups
                                                                        .additional
                                                                        ? 'default'
                                                                        : 'secondary'
                                                                }
                                                            >
                                                                Additional:{' '}
                                                                {
                                                                    verifyResult
                                                                        .groups
                                                                        .additional
                                                                }{' '}
                                                                cells
                                                            </Badge>
                                                            <Badge
                                                                variant={
                                                                    verifyResult
                                                                        .groups
                                                                        .nonProcurement
                                                                        ? 'default'
                                                                        : 'secondary'
                                                                }
                                                            >
                                                                Non-Proc:{' '}
                                                                {
                                                                    verifyResult
                                                                        .groups
                                                                        .nonProcurement
                                                                }{' '}
                                                                cells
                                                            </Badge>
                                                        </div>
                                                        {verifyResult.details
                                                            .length > 0 && (
                                                            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs opacity-80">
                                                                {verifyResult.details.map(
                                                                    (d, i) => (
                                                                        <li
                                                                            key={
                                                                                i
                                                                            }
                                                                        >
                                                                            {d}
                                                                        </li>
                                                                    ),
                                                                )}
                                                            </ul>
                                                        )}
                                                        {verifyResult.errors
                                                            .length > 0 && (
                                                            <div className="mt-3">
                                                                <div className="text-xs font-semibold">
                                                                    Issues (
                                                                    {
                                                                        verifyResult
                                                                            .errors
                                                                            .length
                                                                    }
                                                                    ) in {sh}:
                                                                </div>
                                                                <ul className="mt-1 max-h-48 list-disc overflow-auto pl-5">
                                                                    {verifyResult.errors.map(
                                                                        (
                                                                            e,
                                                                            i,
                                                                        ) => (
                                                                            <li
                                                                                key={
                                                                                    i
                                                                                }
                                                                            >
                                                                                <span className="font-mono">
                                                                                    Row{' '}
                                                                                    {
                                                                                        e.row
                                                                                    }
                                                                                    :
                                                                                </span>{' '}
                                                                                {
                                                                                    e.message
                                                                                }
                                                                            </li>
                                                                        ),
                                                                    )}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TabsContent>
                                            );
                                        })}
                                    </Tabs>
                                )}
                                {hasAnyVerify &&
                                    selectedSheets.length === 1 &&
                                    (() => {
                                        const sh = selectedSheets[0];
                                        const verifyResult = verifyResults[sh];

                                        if (!verifyResult) return null;

                                        return (
                                            <div
                                                className={`mt-4 rounded-md border p-3 text-sm ${verifyResult.valid ? 'border-green-200 bg-green-50 text-green-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}
                                            >
                                                <div className="font-medium">
                                                    {verifyResult.message}
                                                </div>
                                                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                                    <Badge
                                                        variant={
                                                            verifyResult.groups
                                                                .procurement
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        Procurement:{' '}
                                                        {
                                                            verifyResult.groups
                                                                .procurement
                                                        }{' '}
                                                        cells
                                                    </Badge>
                                                    <Badge
                                                        variant={
                                                            verifyResult.groups
                                                                .additional
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        Additional:{' '}
                                                        {
                                                            verifyResult.groups
                                                                .additional
                                                        }{' '}
                                                        cells
                                                    </Badge>
                                                    <Badge
                                                        variant={
                                                            verifyResult.groups
                                                                .nonProcurement
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        Non-Proc:{' '}
                                                        {
                                                            verifyResult.groups
                                                                .nonProcurement
                                                        }{' '}
                                                        cells
                                                    </Badge>
                                                </div>
                                                {verifyResult.details.length >
                                                    0 && (
                                                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs opacity-80">
                                                        {verifyResult.details.map(
                                                            (d, i) => (
                                                                <li key={i}>
                                                                    {d}
                                                                </li>
                                                            ),
                                                        )}
                                                    </ul>
                                                )}
                                                {verifyResult.errors.length >
                                                    0 && (
                                                    <div className="mt-3">
                                                        <div className="text-xs font-semibold">
                                                            Issues (
                                                            {
                                                                verifyResult
                                                                    .errors
                                                                    .length
                                                            }
                                                            ):
                                                        </div>
                                                        <ul className="mt-1 max-h-48 list-disc overflow-auto pl-5">
                                                            {verifyResult.errors.map(
                                                                (e, i) => (
                                                                    <li key={i}>
                                                                        <span className="font-mono">
                                                                            Row{' '}
                                                                            {
                                                                                e.row
                                                                            }
                                                                            :
                                                                        </span>{' '}
                                                                        {
                                                                            e.message
                                                                        }
                                                                    </li>
                                                                ),
                                                            )}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                {hasAnyVerify && !allVerifyValid && (
                                    <div className="mt-4 flex items-center gap-2 rounded-md border border-amber-200 bg-white p-2">
                                        <Switch
                                            checked={skipProblematic}
                                            onCheckedChange={setSkipProblematic}
                                            size="sm"
                                        />
                                        <span className="text-xs">
                                            Skip{' '}
                                            {Object.values(
                                                verifyResults,
                                            ).reduce(
                                                (a, r) =>
                                                    a +
                                                    (r.valid
                                                        ? 0
                                                        : r.errors.length),
                                                0,
                                            )}{' '}
                                            problematic row(s) across{' '}
                                            {
                                                selectedSheets.filter(
                                                    (s) =>
                                                        !verifyResults[s]
                                                            ?.valid,
                                                ).length
                                            }{' '}
                                            sheet(s) and proceed to extraction
                                            (they will show as{' '}
                                            <span className="font-medium">
                                                skipped: problematic
                                            </span>{' '}
                                            in Review)
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-between">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep('calibrate')}
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={() => setStep('extract')}
                                    disabled={!canExtract}
                                >
                                    {allVerifyValid
                                        ? `Next: Extract (${selectedSheets.length} sheets)`
                                        : skipProblematic && hasAnyVerify
                                          ? 'Next: Extract (skipping problematic)'
                                          : 'Fix verification first'}
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent
                            value="extract"
                            className="mt-4 flex flex-col gap-4"
                        >
                            {!canExtract ? (
                                <div className="text-muted-foreground rounded-lg border p-8 text-center text-sm">
                                    {hasAnyVerify ? (
                                        <>
                                            Verification failed —{' '}
                                            {
                                                Object.values(
                                                    verifyResults,
                                                ).filter((r) => !r.valid).length
                                            }{' '}
                                            sheet(s) invalid — enable{' '}
                                            <span className="font-medium">
                                                Skip problematic rows
                                            </span>{' '}
                                            in Verify tab to proceed, or fix
                                            sheet format. (
                                            {selectedSheets.length} sheets
                                            selected,{' '}
                                            {
                                                Object.values(
                                                    verifyResults,
                                                ).filter((r) => r.valid).length
                                            }{' '}
                                            valid)
                                        </>
                                    ) : (
                                        'Verify format first (must be valid or skipped) to enable extraction.'
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            onClick={handleExtract}
                                            disabled={
                                                selectedSheets.length === 0
                                            }
                                        >
                                            Extract Categories (
                                            {selectedSheets.length} sheets)
                                        </Button>
                                        {extractResult && (
                                            <span className="text-muted-foreground text-sm">
                                                Raw{' '}
                                                {extractResult.filtered.length}{' '}
                                                → Unique{' '}
                                                {extractResult.unique.length}{' '}
                                                (duplicates{' '}
                                                {
                                                    extractResult.duplicates
                                                        .length
                                                }
                                                ) across {selectedSheets.length}{' '}
                                                sheets
                                            </span>
                                        )}
                                    </div>

                                    {extractResult && (
                                        <>
                                            <div className="grid grid-cols-5 gap-2 text-xs">
                                                <div className="rounded-md border p-2 text-center">
                                                    <div className="text-lg font-semibold">
                                                        {extractionStats?.raw}
                                                    </div>
                                                    <div className="text-muted-foreground">
                                                        Raw
                                                    </div>
                                                </div>
                                                <div className="rounded-md border bg-green-50 p-2 text-center">
                                                    <div className="text-lg font-semibold text-green-700">
                                                        {
                                                            extractionStats?.unique
                                                        }
                                                    </div>
                                                    <div className="text-muted-foreground">
                                                        Unique
                                                    </div>
                                                </div>
                                                <div className="rounded-md border p-2 text-center">
                                                    <div className="text-lg font-semibold">
                                                        {
                                                            extractResult
                                                                .duplicates
                                                                .length
                                                        }
                                                    </div>
                                                    <div className="text-muted-foreground">
                                                        Duplicates
                                                    </div>
                                                </div>
                                                <div className="rounded-md border p-2 text-center">
                                                    <div className="text-lg font-semibold">
                                                        {
                                                            extractResult
                                                                .excludedTotal
                                                                .length
                                                        }
                                                    </div>
                                                    <div className="text-muted-foreground">
                                                        Totals excluded
                                                    </div>
                                                </div>
                                                <div
                                                    className={`rounded-md border p-2 text-center ${extractResult.skippedProblematic.length > 0 ? 'border-amber-200 bg-amber-50' : ''}`}
                                                >
                                                    <div
                                                        className={`text-lg font-semibold ${extractResult.skippedProblematic.length > 0 ? 'text-amber-700' : ''}`}
                                                    >
                                                        {
                                                            extractResult
                                                                .skippedProblematic
                                                                .length
                                                        }
                                                    </div>
                                                    <div className="text-muted-foreground">
                                                        Skipped: problematic
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="rounded-lg border">
                                                <div className="flex items-start justify-between gap-3 p-3">
                                                    <div>
                                                        <h3 className="text-sm font-semibold">
                                                            Review — Unique
                                                            Categories (
                                                            {
                                                                extractResult
                                                                    .unique
                                                                    .length
                                                            }
                                                            ) across{' '}
                                                            {
                                                                selectedSheets.length
                                                            }{' '}
                                                            sheets
                                                        </h3>
                                                        <p className="text-muted-foreground text-xs">
                                                            Global dedupe by
                                                            normalized across
                                                            all{' '}
                                                            {
                                                                selectedSheets.length
                                                            }{' '}
                                                            sheets. Check to
                                                            import. Strict =
                                                            exact normalized
                                                            match in DB. Partial
                                                            = substring (≥4 or
                                                            whitelist
                                                            oil/gas/ink/lab/cop/car/med/law)
                                                            or Levenshtein
                                                            ≤1/2/3. No
                                                            auto-merge.
                                                        </p>
                                                    </div>
                                                    <div className="flex shrink-0 gap-1">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                setSelected(
                                                                    new Set(
                                                                        extractResult.unique.map(
                                                                            (
                                                                                u,
                                                                            ) =>
                                                                                u.normalized,
                                                                        ),
                                                                    ),
                                                                )
                                                            }
                                                        >
                                                            Select all
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                setSelected(
                                                                    new Set(),
                                                                )
                                                            }
                                                        >
                                                            Select none
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                const onlyNew =
                                                                    extractResult.unique
                                                                        .filter(
                                                                            (
                                                                                u,
                                                                            ) =>
                                                                                getCategoryMatch(
                                                                                    u.normalized,
                                                                                    existingCategories,
                                                                                )
                                                                                    .type ===
                                                                                'none',
                                                                        )
                                                                        .map(
                                                                            (
                                                                                u,
                                                                            ) =>
                                                                                u.normalized,
                                                                        );
                                                                setSelected(
                                                                    new Set(
                                                                        onlyNew,
                                                                    ),
                                                                );
                                                            }}
                                                        >
                                                            Only new
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="text-muted-foreground px-3 pb-2 text-xs">
                                                    Selected {selected.size}/
                                                    {
                                                        extractResult.unique
                                                            .length
                                                    }{' '}
                                                    will be imported. Unchecked
                                                    stays in sheet only. Default
                                                    is_additional = false
                                                    (toggle per row if
                                                    Additional).
                                                </div>
                                                <div className="max-h-96 overflow-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead className="w-10 text-center">
                                                                    Import
                                                                </TableHead>
                                                                <TableHead>
                                                                    Raw
                                                                </TableHead>
                                                                <TableHead>
                                                                    DB Match
                                                                </TableHead>
                                                                <TableHead>
                                                                    Sheets
                                                                </TableHead>
                                                                <TableHead>
                                                                    Locations
                                                                </TableHead>
                                                                <TableHead className="text-center">
                                                                    Count
                                                                </TableHead>
                                                                <TableHead className="text-center">
                                                                    Additional
                                                                </TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {extractResult.unique
                                                                .slice(0, 80)
                                                                .map((u) => {
                                                                    const match =
                                                                        getCategoryMatch(
                                                                            u.normalized,
                                                                            existingCategories,
                                                                        );
                                                                    const isSelected =
                                                                        selected.has(
                                                                            u.normalized,
                                                                        );
                                                                    const isStrict =
                                                                        match.type ===
                                                                        'strict';
                                                                    const partials =
                                                                        match.type ===
                                                                        'partial'
                                                                            ? (match.topMatches ??
                                                                              [])
                                                                            : [];

                                                                    return (
                                                                        <TableRow
                                                                            key={
                                                                                u.normalized
                                                                            }
                                                                        >
                                                                            <TableCell className="text-center">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={
                                                                                        isSelected
                                                                                    }
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) => {
                                                                                        const next =
                                                                                            new Set(
                                                                                                selected,
                                                                                            );

                                                                                        if (
                                                                                            e
                                                                                                .target
                                                                                                .checked
                                                                                        ) {
                                                                                            next.add(
                                                                                                u.normalized,
                                                                                            );
                                                                                        } else {
                                                                                            next.delete(
                                                                                                u.normalized,
                                                                                            );
                                                                                        }

                                                                                        setSelected(
                                                                                            next,
                                                                                        );
                                                                                    }}
                                                                                    className="h-4 w-4"
                                                                                />
                                                                            </TableCell>
                                                                            <TableCell
                                                                                className="max-w-[18ch] truncate text-xs"
                                                                                title={
                                                                                    u.raw
                                                                                }
                                                                            >
                                                                                {
                                                                                    u.raw
                                                                                }
                                                                            </TableCell>
                                                                            <TableCell className="max-w-[28ch] text-xs">
                                                                                {isStrict ? (
                                                                                    <Badge
                                                                                        variant="secondary"
                                                                                        className="bg-amber-100 text-amber-800"
                                                                                        title={
                                                                                            (
                                                                                                match as any
                                                                                            )
                                                                                                .match
                                                                                                ?.name
                                                                                        }
                                                                                    >
                                                                                        Exists:{' '}
                                                                                        {
                                                                                            (
                                                                                                match as any
                                                                                            )
                                                                                                .match
                                                                                                ?.name
                                                                                        }
                                                                                    </Badge>
                                                                                ) : partials.length >
                                                                                  0 ? (
                                                                                    <div className="flex flex-col gap-1">
                                                                                        {partials.map(
                                                                                            (
                                                                                                p,
                                                                                                idx,
                                                                                            ) => (
                                                                                                <Badge
                                                                                                    key={
                                                                                                        idx
                                                                                                    }
                                                                                                    variant="outline"
                                                                                                    className="justify-start truncate text-xs"
                                                                                                    title={`${p.category.name} (score ${p.score})`}
                                                                                                >
                                                                                                    {
                                                                                                        p
                                                                                                            .category
                                                                                                            .name
                                                                                                    }{' '}
                                                                                                    {p.score ===
                                                                                                    99
                                                                                                        ? '(substr)'
                                                                                                        : `(lev ${p.score})`}
                                                                                                </Badge>
                                                                                            ),
                                                                                        )}
                                                                                    </div>
                                                                                ) : (
                                                                                    <span className="text-muted-foreground">
                                                                                        —
                                                                                        new
                                                                                    </span>
                                                                                )}
                                                                                <div
                                                                                    className="text-muted-foreground truncate text-xs"
                                                                                    title={
                                                                                        u.normalized
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        u.normalized
                                                                                    }
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell className="text-center">
                                                                                <Badge
                                                                                    variant={
                                                                                        u.sheetCount ===
                                                                                        selectedSheets.length
                                                                                            ? 'default'
                                                                                            : u.sheetCount >
                                                                                                1
                                                                                              ? 'secondary'
                                                                                              : 'outline'
                                                                                    }
                                                                                    className="font-mono text-xs"
                                                                                    title={u.sheets.join(
                                                                                        ', ',
                                                                                    )}
                                                                                >
                                                                                    {
                                                                                        u.sheetCount
                                                                                    }
                                                                                    /
                                                                                    {
                                                                                        selectedSheets.length
                                                                                    }
                                                                                </Badge>
                                                                            </TableCell>
                                                                            <TableCell
                                                                                className="max-w-[22ch] truncate font-mono text-xs"
                                                                                title={u.locations
                                                                                    .map(
                                                                                        (
                                                                                            l,
                                                                                        ) =>
                                                                                            l.address,
                                                                                    )
                                                                                    .join(
                                                                                        ', ',
                                                                                    )}
                                                                            >
                                                                                {u.locations
                                                                                    .slice(
                                                                                        0,
                                                                                        1,
                                                                                    )
                                                                                    .map(
                                                                                        (
                                                                                            l,
                                                                                        ) =>
                                                                                            l.address,
                                                                                    )
                                                                                    .join(
                                                                                        ', ',
                                                                                    )}
                                                                                <span className="text-muted-foreground">
                                                                                    {' '}
                                                                                    (
                                                                                    {
                                                                                        u
                                                                                            .locations[0]
                                                                                            ?.col
                                                                                    }
                                                                                    {
                                                                                        u
                                                                                            .locations[0]
                                                                                            ?.row
                                                                                    }
                                                                                    )
                                                                                </span>
                                                                            </TableCell>
                                                                            <TableCell className="text-center font-mono text-xs">
                                                                                {
                                                                                    u.count
                                                                                }
                                                                            </TableCell>
                                                                            <TableCell className="text-center">
                                                                                <Switch
                                                                                    checked={
                                                                                        isAdditionalDraft[
                                                                                            u
                                                                                                .normalized
                                                                                        ] ??
                                                                                        false
                                                                                    }
                                                                                    onCheckedChange={(
                                                                                        v,
                                                                                    ) =>
                                                                                        setIsAdditionalDraft(
                                                                                            (
                                                                                                prev,
                                                                                            ) => ({
                                                                                                ...prev,
                                                                                                [u.normalized]:
                                                                                                    v,
                                                                                            }),
                                                                                        )
                                                                                    }
                                                                                    size="sm"
                                                                                />
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    );
                                                                })}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                                {extractResult.unique.length >
                                                    80 && (
                                                    <div className="text-muted-foreground p-2 text-center text-xs">
                                                        Showing first 80 of{' '}
                                                        {
                                                            extractResult.unique
                                                                .length
                                                        }
                                                    </div>
                                                )}
                                                <div className="text-muted-foreground p-3 text-xs">
                                                    Total filtered{' '}
                                                    {
                                                        extractResult.filtered
                                                            .length
                                                    }{' '}
                                                    — unique{' '}
                                                    {
                                                        extractResult.unique
                                                            .length
                                                    }{' '}
                                                    — duplicates{' '}
                                                    {
                                                        extractResult.duplicates
                                                            .length
                                                    }{' '}
                                                    — selected {selected.size}.
                                                    Each unique shows where it
                                                    was found:{' '}
                                                    <span className="font-mono">
                                                        Sheet1!F12
                                                    </span>
                                                    . Strict = exact DB match;
                                                    Partial = substring (≥4 or
                                                    oil/gas/ink/lab/cop/car/med/law)
                                                    or Levenshtein ≤1/2/3.
                                                </div>
                                            </div>

                                            {extractResult.duplicates.length >
                                                0 && (
                                                <div className="rounded-lg border p-3">
                                                    <h4 className="text-xs font-semibold">
                                                        Duplicates (normalized
                                                        exact) — global across{' '}
                                                        {selectedSheets.length}{' '}
                                                        sheets
                                                    </h4>
                                                    <ul className="mt-1 max-h-40 list-disc overflow-auto pl-5 text-xs">
                                                        {extractResult.duplicates
                                                            .slice(0, 15)
                                                            .map((d, i) => (
                                                                <li key={i}>
                                                                    <span className="font-mono">
                                                                        {
                                                                            d.normalized
                                                                        }
                                                                    </span>{' '}
                                                                    — kept{' '}
                                                                    <span className="font-mono">
                                                                        {
                                                                            d.keptAddress
                                                                        }
                                                                    </span>{' '}
                                                                    (
                                                                    {
                                                                        d.keptSheet
                                                                    }
                                                                    !{d.keptRow}
                                                                    ), duplicate{' '}
                                                                    <span className="font-mono">
                                                                        {
                                                                            d.duplicateAddress
                                                                        }
                                                                    </span>{' '}
                                                                    (“
                                                                    {
                                                                        d.duplicateRaw
                                                                    }
                                                                    ”)
                                                                </li>
                                                            ))}
                                                    </ul>
                                                    {extractResult.duplicates
                                                        .length > 15 && (
                                                        <div className="text-muted-foreground mt-1 text-xs">
                                                            Showing 15 of{' '}
                                                            {
                                                                extractResult
                                                                    .duplicates
                                                                    .length
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {extractResult.skippedProblematic
                                                .length > 0 && (
                                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                                    <h4 className="text-xs font-semibold text-amber-900">
                                                        Skipped: Problematic
                                                        (from Verify) — per
                                                        sheet
                                                    </h4>
                                                    <p className="text-xs text-amber-800">
                                                        Excluded rows flagged in
                                                        Verify (row or
                                                        normalized match) per
                                                        sheet. Shown for review.
                                                    </p>
                                                    <ul className="mt-1 max-h-40 list-disc overflow-auto pl-5 text-xs text-amber-900">
                                                        {extractResult.skippedProblematic
                                                            .slice(0, 20)
                                                            .map((s, i) => (
                                                                <li key={i}>
                                                                    <span className="font-mono">
                                                                        {
                                                                            s.sheet
                                                                        }
                                                                        !{s.row}
                                                                        :
                                                                    </span>{' '}
                                                                    “{s.raw}” →{' '}
                                                                    <span className="font-mono">
                                                                        {
                                                                            s.normalized
                                                                        }
                                                                    </span>{' '}
                                                                    —{' '}
                                                                    <span className="italic">
                                                                        {
                                                                            s.reason
                                                                        }
                                                                    </span>
                                                                </li>
                                                            ))}
                                                    </ul>
                                                    {extractResult
                                                        .skippedProblematic
                                                        .length > 20 && (
                                                        <div className="mt-1 text-xs text-amber-800">
                                                            Showing first 20 of{' '}
                                                            {
                                                                extractResult
                                                                    .skippedProblematic
                                                                    .length
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 rounded-lg border p-3">
                                                <Button
                                                    onClick={handleImport}
                                                    disabled={
                                                        importing ||
                                                        selected.size === 0
                                                    }
                                                >
                                                    {importing ? (
                                                        <>
                                                            <Spinner />{' '}
                                                            Importing...
                                                        </>
                                                    ) : (
                                                        `Import ${selected.size} Categories`
                                                    )}
                                                </Button>
                                                <span className="text-muted-foreground text-xs">
                                                    Will create ppmp_categories
                                                    where not exists (strict
                                                    normalized match). Selected{' '}
                                                    {selected.size}/
                                                    {
                                                        extractResult.unique
                                                            .length
                                                    }
                                                    . Additional flag per row
                                                    (default false, sentinels
                                                    is_additional false).
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                            <div className="flex justify-between">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep('verify')}
                                >
                                    Back
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setStep('calibrate')}
                                >
                                    Recalibrate
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <ScrollBar orientation="vertical" />
            </ScrollArea>
        </>
    );
}

CategoryImport.layout = {
    breadcrumbs: [
        { title: 'Imports', href: importsIndex().url },
        { title: 'Category Import', href: categoryImportIndex().url },
    ],
};
