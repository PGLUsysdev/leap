import ExcelJS from 'exceljs';

export function cellText(cell: ExcelJS.Cell): string | null {
    let value: unknown = cell.value as unknown;

    // Real Excel dates arrive as Date objects — format with LOCAL parts
    // (never toISOString: UTC conversion shifts midnight +0800 dates).
    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) return null;

        const y = value.getFullYear();
        const m = String(value.getMonth() + 1).padStart(2, '0');
        const d = String(value.getDate()).padStart(2, '0');

        return `${y}-${m}-${d}`;
    }

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
