import { Head } from '@inertiajs/react';
import { FileSpreadsheet } from 'lucide-react';
import type { ReactNode } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface ImportTab {
    value: string;
    label: string;
    disabled?: boolean;
}

interface ImportPageShellProps {
    title: string;
    description: ReactNode;
    fileName: string | null;
    loading?: boolean;
    step: string;
    onStepChange: (value: string) => void;
    tabs: ImportTab[];
    children: ReactNode;
}

export function ImportPageShell({
    title,
    description,
    fileName,
    loading = false,
    step,
    onStepChange,
    tabs,
    children,
}: ImportPageShellProps) {
    return (
        <ScrollArea className="h-[calc(100vh-3rem)]">
            <Head title={title} />
            <div className="flex flex-col gap-4 p-4">
                <h1 className="text-2xl font-bold">{title}</h1>
                <p className="text-muted-foreground text-sm">{description}</p>

                {fileName && !loading && (
                    <div className="bg-muted/40 supports-[backdrop-filter]:bg-muted/30 sticky top-0 z-10 flex items-center gap-2 rounded-md border px-3 py-2 text-sm backdrop-blur">
                        <FileSpreadsheet className="text-muted-foreground h-4 w-4 shrink-0" />
                        <span
                            className="max-w-[42ch] truncate font-medium"
                            title={fileName}
                        >
                            {fileName}
                        </span>
                    </div>
                )}

                <Tabs value={step} onValueChange={onStepChange}>
                    <TabsList>
                        {tabs.map((tab) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                disabled={tab.disabled}
                            >
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {children}
                </Tabs>
            </div>

            <ScrollBar orientation="vertical" />
        </ScrollArea>
    );
}
