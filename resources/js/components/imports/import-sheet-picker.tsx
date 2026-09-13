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
                onValueChange={(v) => onChange(v ? [v] : [])}
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
            onValueChange={onChange}
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
