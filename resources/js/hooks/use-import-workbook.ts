import ExcelJS from 'exceljs';
import type { ChangeEvent } from 'react';
import { useState } from 'react';

export function useImportWorkbook(onReset?: () => void) {
    const [sheets, setSheets] = useState<string[]>([]);
    const [workbook, setWorkbook] = useState<ExcelJS.Workbook | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];

        if (!file) return;

        const isXlsx =
            file.name.toLowerCase().endsWith('.xlsx') ||
            file.type ===
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        if (!isXlsx) {
            setSheets([]);
            setWorkbook(null);
            setFileName(null);
            setError('Only .xlsx files are allowed.');
            onReset?.();
            e.target.value = '';

            return;
        }

        setError(null);
        setLoading(true);
        setFileName(file.name);
        onReset?.();

        try {
            const wb = new ExcelJS.Workbook();
            const buf = await file.arrayBuffer();
            await wb.xlsx.load(buf);
            setWorkbook(wb);
            setSheets(
                wb.worksheets.map((ws) => ws.name.trim()).filter((n) => n.length > 0),
            );
        } catch {
            setSheets([]);
            setWorkbook(null);
            setFileName(null);
            setError(
                'Failed to parse .xlsx file. Please ensure it is a valid Excel file.',
            );
        } finally {
            setLoading(false);
        }
    }

    return {
        sheets,
        workbook,
        fileName,
        loading,
        error,
        setError,
        setWorkbook,
        setSheets,
        setFileName,
        handleFileChange,
    };
}
