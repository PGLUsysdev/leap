// resources/js/pages/imports/index.tsx

import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    ClipboardList,
    FileSpreadsheet,
    Receipt,
    Tags,
    Upload,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { index as aipSummaryImportIndex } from '@/routes/aip-summary-import';
import { index as categoryCoaMappingIndex } from '@/routes/category-coa-mapping';
import { index as categoryImportIndex } from '@/routes/category-import';
import { index as priceListImportIndex } from '@/routes/price-list-import';
import { index as priceListQuantitiesImportIndex } from '@/routes/price-list-quantities-import';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

type Can = {
    category: boolean;
    categoryCoaMapping: boolean;
    priceList: boolean;
    priceListQuantities: boolean;
    aipSummary: boolean;
};

type ImportItem = {
    title: string;
    description: string;
    href: string;
    icon: typeof FileSpreadsheet;
    badge: string;
    canKey: keyof Can;
};

type ImportSource = {
    key: string;
    /** File input type this group of importers reads from. */
    title: string;
    description: string;
    icon: typeof FileSpreadsheet;
    items: ImportItem[];
};

const IMPORT_SOURCES: ImportSource[] = [
    {
        key: 'ppmp',
        title: 'PPMP',
        description:
            'Import workflows that read from the PPMP (XLSX) file. Run these in order: Category → Category–COA Mapping → Price List → Quantities.',
        icon: FileSpreadsheet,
        items: [
            {
                title: 'Category Import',
                description:
                    'Import PPMP categories from XLSX. Calibrate columns/headers, verify format, and bulk create categories.',
                href: categoryImportIndex().url,
                icon: FileSpreadsheet,
                badge: 'Categories',
                canKey: 'category',
            },
            {
                title: 'Category–COA Mappings',
                description:
                    'Bulk import Category ↔ COA mappings from XLSX. Calibrate, verify format, and create mappings in bulk.',
                href: categoryCoaMappingIndex().url,
                icon: Tags,
                badge: 'Mappings',
                canKey: 'categoryCoaMapping',
            },
            {
                title: 'Price List Import',
                description:
                    'Import price list items (price-list only). Requires official Category + Mapping to exist first.',
                href: priceListImportIndex().url,
                icon: Receipt,
                badge: 'Price Lists',
                canKey: 'priceList',
            },
            {
                title: 'Price List Quantities Import',
                description:
                    'Import quantities against existing price list items from XLSX.',
                href: priceListQuantitiesImportIndex().url,
                icon: FileSpreadsheet,
                badge: 'Quantities',
                canKey: 'priceListQuantities',
            },
        ],
    },
    {
        key: 'aip',
        title: 'AIP Summary Form',
        description:
            'Import workflows that read from the AIP Summary form (XLSX).',
        icon: ClipboardList,
        items: [
            {
                title: 'AIP Summary Import',
                description: 'Import AIP Summary from XLSX.',
                href: aipSummaryImportIndex().url,
                icon: FileSpreadsheet,
                badge: 'AIP Summary',
                canKey: 'aipSummary',
            },
        ],
    },
];

function ImportCard({ item }: { item: ImportItem }) {
    return (
        <Card key={item.title} className="flex flex-col">
            <CardHeader>
                <div className="flex items-start justify-between gap-2">
                    <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                        <item.icon className="h-5 w-5" />
                    </div>
                    <Badge variant="secondary">{item.badge}</Badge>
                </div>
                <CardTitle className="pt-3">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1" />
            <CardFooter>
                <Link
                    href={item.href}
                    prefetch
                    className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium shadow"
                >
                    Open <ArrowRight className="h-4 w-4" />
                </Link>
            </CardFooter>
        </Card>
    );
}

function ImportSourceSection({
    source,
    visibleItems,
}: {
    source: ImportSource;
    visibleItems: ImportItem[];
}) {
    return (
        <section className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
                <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                    <source.icon className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold tracking-tight">
                            {source.title}
                        </h2>
                        <Badge variant="outline">
                            {visibleItems.length}{' '}
                            {visibleItems.length === 1
                                ? 'importer'
                                : 'importers'}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        {source.description}
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleItems.map((item) => (
                    <ImportCard key={item.title} item={item} />
                ))}
            </div>
        </section>
    );
}

export default function ImportsHub({ can }: { can: Can }) {
    // Filter items by permission; drop sections that end up empty.
    const visibleSources = IMPORT_SOURCES.map((source) => ({
        source,
        visibleItems: source.items.filter((item) => can[item.canKey]),
    })).filter(({ visibleItems }) => visibleItems.length > 0);

    return (
        <>
            <Head title="Imports" />
            <ScrollArea className="h-[calc(100vh-3rem)] w-full">
                <div className="flex flex-col gap-6 p-4 md:p-6">
                    <div className="flex flex-col gap-1">
                        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                            <Upload className="h-6 w-6" />
                            Imports
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Central hub for all import workflows, grouped by the
                            file they read from. New importers will be added
                            here as they become available.
                        </p>
                    </div>

                    {visibleSources.length === 0 ? (
                        <div className="text-muted-foreground border-muted rounded-lg border border-dashed p-8 text-center text-sm">
                            You don&apos;t have access to any import workflows
                            yet. Ask an administrator to grant you the relevant
                            permissions.
                        </div>
                    ) : (
                        visibleSources.map(({ source, visibleItems }) => (
                            <ImportSourceSection
                                key={source.key}
                                source={source}
                                visibleItems={visibleItems}
                            />
                        ))
                    )}
                </div>
                <ScrollBar orientation="vertical" />
            </ScrollArea>
        </>
    );
}

ImportsHub.layout = {
    breadcrumbs: [{ title: 'Imports', href: '/imports' }],
};
