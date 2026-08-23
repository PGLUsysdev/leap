import { useMemo } from "react";
import { Field, FieldDescription, FieldLabel } from "@/components/base-ui-components/ui/field";
import { Input } from "@/components/base-ui-components/ui/input";
import { cn } from "@/lib/utils";
import type { FundingSource } from "@/types";
import type { PpaFundingSourceRow } from "./extract";

interface FundingSourceMapProps {
    fundingSources: PpaFundingSourceRow[];
    allFundingSources: FundingSource[];
    mappings: Record<string, string>;
    onMappingsChange: (mappings: Record<string, string>) => void;
}

interface FundingSourceEntry {
    excelCode: string;
    mappedToCode: string;
    resolvedId: number | null;
    status: "mapped" | "unmapped" | "not_found";
    count: number;
}

export function FundingSourceMap({
    fundingSources,
    allFundingSources,
    mappings,
    onMappingsChange,
}: FundingSourceMapProps) {
    const dbCodeToId = useMemo(() => {
        const map = new Map<string, number>();

        for (const fs of allFundingSources) {
            map.set(fs.code, fs.id);
        }

        return map;
    }, [allFundingSources]);

    const entries: FundingSourceEntry[] = useMemo(() => {
        const codeCounts = new Map<string, number>();
        for (const fs of fundingSources) {
            const code = fs.funding_source_id;
            if (code) {
                codeCounts.set(code, (codeCounts.get(code) ?? 0) + 1);
            }
        }

        // Build case-insensitive lookup from the user's mappings
        const mappingKeyLookup = new Map<string, string>();
        for (const [key, value] of Object.entries(mappings)) {
            mappingKeyLookup.set(key.toLowerCase(), value);
        }

        return [...codeCounts.keys()].sort().map((excelCode) => {
            // Try exact match first, then case-insensitive fallback
            const mappedToCode =
                mappings[excelCode] ?? mappingKeyLookup.get(excelCode.toLowerCase()) ?? excelCode;

            const resolvedId = dbCodeToId.get(mappedToCode) ?? null;

            let status: FundingSourceEntry["status"];

            if (resolvedId !== null) {
                status = "mapped";
            } else if (mappedToCode !== excelCode) {
                status = "not_found";
            } else {
                status = "unmapped";
            }

            return {
                excelCode,
                mappedToCode,
                resolvedId,
                status,
                count: codeCounts.get(excelCode) ?? 0,
            };
        });
    }, [fundingSources, mappings, dbCodeToId]);

    // Derive unique existing DB codes for the datalist suggestion

    const dbCodes = useMemo(
        () => [...new Set(allFundingSources.map((fs) => fs.code))].sort(),
        [allFundingSources],
    );

    function handleCodeChange(excelCode: string, newMappedCode: string) {
        onMappingsChange({
            ...mappings,
            [excelCode]: newMappedCode.trim() || excelCode,
        });
    }

    const mappedCount = entries.filter((e) => e.status === "mapped").length;
    const totalCount = entries.length;

    if (totalCount === 0) {
        return null;
    }

    return (
        <div className="mt-6 space-y-3">
            <Field>
                <FieldLabel>
                    Funding Source Mapping ({mappedCount}/{totalCount} mapped)
                </FieldLabel>
                <FieldDescription>
                    Map the funding source codes from the Excel file to codes in the database. Codes
                    that match directly are pre-filled. Edit the "Map to DB Code" column for codes
                    that need a different mapping.
                </FieldDescription>
            </Field>

            <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-muted/50">
                            <th className="px-3 py-2 text-left font-medium">Excel Code</th>
                            <th className="px-3 py-2 text-left font-medium">Map to DB Code</th>
                            <th className="px-3 py-2 text-center font-medium">Status</th>
                            <th className="px-3 py-2 text-right font-medium">Rows</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((entry) => {
                            const isDbCodeValid = dbCodes.includes(entry.mappedToCode);

                            return (
                                <tr key={entry.excelCode} className="border-t">
                                    <td className="px-3 py-2 font-mono text-xs">
                                        {entry.excelCode}
                                    </td>
                                    <td className="px-3 py-2">
                                        <Input
                                            value={entry.mappedToCode}
                                            onChange={(e) =>
                                                handleCodeChange(entry.excelCode, e.target.value)
                                            }
                                            list="db-codes"
                                            className={cn(
                                                "h-7 text-xs",
                                                !isDbCodeValid && "border-destructive",
                                            )}
                                        />
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        {isDbCodeValid ? (
                                            <span className="text-xs text-green-600">✓ mapped</span>
                                        ) : entry.mappedToCode === entry.excelCode ? (
                                            <span className="text-xs text-amber-600">
                                                ? unmapped
                                            </span>
                                        ) : (
                                            <span className="text-xs text-destructive">
                                                ✗ not found
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2 text-right text-muted-foreground">
                                        {entry.count}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <datalist id="db-codes">
                {dbCodes.map((code) => (
                    <option key={code} value={code} />
                ))}
            </datalist>
        </div>
    );
}
