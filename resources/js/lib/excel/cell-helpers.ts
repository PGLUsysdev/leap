import ExcelJS from 'exceljs';

export function cellText(cell: ExcelJS.Cell): string | null {
    let value: unknown = cell.value as unknown;
    if (value && typeof value === 'object') {
        if ('result' in (value as Record<string, unknown>)) {
            value = (value as { result: unknown }).result;
        } else if ('richText' in (value as Record<string, unknown>)) {
            const rt = (value as { richText: Array<{ text: string }> })
                .richText;
            if (Array.isArray(rt)) {
                const txt = rt
                    .map((r) => r.text)
                    .join('')
                    .trim();
                return txt || null;
            }
            return null;
        } else if ('text' in (value as Record<string, unknown>)) {
            const maybe = value as { text?: string; hyperlink?: string };
            const txt = (maybe.text ?? maybe.hyperlink ?? '') as string;
            return String(txt).trim() || null;
        } else {
            return null;
        }
    }
    if (value == null) return null;
    const s = String(value).trim();
    return s || null;
}
