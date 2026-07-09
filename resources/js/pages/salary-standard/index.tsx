import { DataTable } from "@/components/data-table";
import AppLayout from "@/layouts/app-layout";
import type { BreadcrumbItem } from "@/types";
import type { FiscalYear, SalaryStandard, SalaryScheduleMatrixRow } from "@/types";
import getColumns from "./columns/salary-standard-cols";
import { useMemo, useState } from "react";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const breadcrumbs: BreadcrumbItem[] = [{ title: "Salary Standards", href: "#" }];

const TRANCHE_MAP: Record<number, string> = {
    2024: "First Tranche",
    2025: "Second Tranche",
    2026: "Third Tranche",
    2027: "Fourth Tranche",
};

interface SalaryStandardProps {
    salaryStandtards: SalaryStandard[];
    fiscalYears: FiscalYear[];
}

export default function SalaryStandard({ salaryStandtards, fiscalYears }: SalaryStandardProps) {
    console.log(salaryStandtards);

    const activeFiscalYear = fiscalYears.find((fy) => fy.status === "draft");
    const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<number>(
        activeFiscalYear?.id ?? fiscalYears[0]?.id,
    );

    const selectedFiscalYear = fiscalYears.find((fy) => fy.id === selectedFiscalYearId);
    const trancheLabel = selectedFiscalYear ? TRANCHE_MAP[selectedFiscalYear.year] : null;

    const filteredStandards = useMemo(
        () =>
            selectedFiscalYearId
                ? salaryStandtards.filter((s) => s.fiscal_year_id === selectedFiscalYearId)
                : salaryStandtards,
        [salaryStandtards, selectedFiscalYearId],
    );

    const { matrixData, maxStep } = useMemo(() => {
        // Group by a combined key of "fiscalYearId_salaryGrade"
        const groupMap: Record<
            string,
            {
                fiscal_year_id: number;
                salary_grade: number;
                steps: Record<string, number | null>;
            }
        > = {};

        let detectedMaxStep = 1;

        filteredStandards.forEach((item) => {
            const fyId = item.fiscal_year_id;
            const grade = item.salary_grade;
            const step = item.step_increment;
            const rate = item.monthly_rate ? parseFloat(item.monthly_rate) : null;

            if (step > detectedMaxStep) {
                detectedMaxStep = step;
            }

            const groupKey = `${fyId}_${grade}`;

            if (!groupMap[groupKey]) {
                groupMap[groupKey] = {
                    fiscal_year_id: fyId,
                    salary_grade: grade,
                    steps: {},
                };
            }
            groupMap[groupKey].steps[`step_${step}`] = rate;
        });

        // Convert grouped objects to rows
        const rows = Object.values(groupMap)
            .map((group) => {
                const row: Record<string, any> = {
                    id: `fy${group.fiscal_year_id}_grade${group.salary_grade}`,
                    fiscal_year_id: group.fiscal_year_id,
                    salary_grade: group.salary_grade,
                };

                for (let s = 1; s <= detectedMaxStep; s++) {
                    row[`step_${s}`] =
                        group.steps[`step_${s}`] !== undefined ? group.steps[`step_${s}`] : null;
                }

                return row as SalaryScheduleMatrixRow;
            })
            // Sort by Fiscal Year first, then by Salary Grade
            .sort((a, b) => {
                if (a.fiscal_year_id !== b.fiscal_year_id) {
                    return a.fiscal_year_id - b.fiscal_year_id;
                }
                return a.salary_grade - b.salary_grade;
            });

        return { matrixData: rows, maxStep: detectedMaxStep };
    }, [filteredStandards]);

    const columns = useMemo(() => getColumns(maxStep), [maxStep]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="pt-4">
                <DataTable columns={columns} data={matrixData} withSearch={true} negativeHeight={8}>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold whitespace-nowrap">
                                Salary Standards
                                {selectedFiscalYear && ` — ${selectedFiscalYear.year}`}
                                {trancheLabel && ` (${trancheLabel})`}
                            </h2>
                        </div>
                        <Select
                            value={String(selectedFiscalYearId)}
                            onValueChange={(value) => setSelectedFiscalYearId(Number(value))}
                        >
                            <SelectTrigger className="w-full max-w-48">
                                <SelectValue placeholder="Select Fiscal Year" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Fiscal Years</SelectLabel>
                                    {fiscalYears.map((fy) => (
                                        <SelectItem key={fy.id} value={String(fy.id)}>
                                            {fy.year}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                        <span>2024 — First Tranche</span>
                        <span>2025 — Second Tranche</span>
                        <span>2026 — Third Tranche</span>
                        <span>2027 — Fourth Tranche</span>
                    </div>
                </DataTable>
            </div>
        </AppLayout>
    );
}
