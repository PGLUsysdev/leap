import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export type SheetSelectionMode = 'single' | 'multiple';

interface ImportSheetPickerProps {
    sheets: string[];
    selected: string[];
    mode: SheetSelectionMode;
    onChange: (selected: string[]) => void;
}

export function ImportSheetPicker({
    sheets,
    selected,
    mode,
    onChange,
}: ImportSheetPickerProps) {
    if (mode === 'single') {
        const value = selected[0] ?? '';

        return (
            <ToggleGroup
                type="single"
                value={value}
                onValueChange={((v: unknown) => {
                    console.log('[picker] single raw v:', v, 'type:', typeof v, 'isArray:', Array.isArray(v));
                    // Base-ui may emit string or string[] depending on version — normalize to string[]
                    const normalized = Array.isArray(v)
                        ? (v as unknown[])
                              .flat()
                              .map((s) => String(s).trim())
                              .filter(Boolean)
                        : v
                          ? [String(v).trim()]
                          : [];
                    console.log('[picker] normalized arr:', normalized);
                    onChange(normalized);
                }) as unknown as (value: string) => void}
                className="flex flex-wrap justify-start"
            >
                {sheets.map((sheet) => (
                    <ToggleGroupItem key={sheet} value={sheet}>
                        {sheet}
                    </ToggleGroupItem>
                ))}
            </ToggleGroup>
        );
    }

    return (
        <ToggleGroup
            type="multiple"
            value={selected}
            onValueChange={((v: unknown) => {
                console.log('[picker] multiple raw v:', v, 'isArray:', Array.isArray(v));
                const arr = Array.isArray(v)
                    ? (v as unknown[]).flat().map((s) => String(s).trim()).filter(Boolean)
                    : [];
                console.log('[picker] normalized multiple arr:', arr);
                onChange(arr);
            }) as unknown as (value: string[]) => void}
            className="flex flex-wrap justify-start"
        >
            {sheets.map((sheet) => (
                <ToggleGroupItem key={sheet} value={sheet}>
                    {sheet}
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
    );
}
