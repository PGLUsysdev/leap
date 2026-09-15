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

type ImportItem = {
    title: string;
    description: string;
    href: string;
    icon: typeof FileSpreadsheet;
    badge: string;
    disabled?: boolean;
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
            },
            {
                title: 'Category–COA Mappings',
                description:
                    'Bulk import Category ↔ COA mappings from XLSX. Calibrate, verify format, and create mappings in bulk.',
                href: categoryCoaMappingIndex().url,
                icon: Tags,
                badge: 'Mappings',
            },
            {
                title: 'Price List Import',
                description:
                    'Import price list items (price-list only). Requires official Category + Mapping to exist first.',
                href: priceListImportIndex().url,
                icon: Receipt,
                badge: 'Price Lists',
            },
            {
                title: 'Price List Quantities Import',
                description:
                    'Import quantities against existing price list items from XLSX.',
                href: priceListQuantitiesImportIndex().url,
                icon: FileSpreadsheet,
                badge: 'Quantities',
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
            // {
            //     title: 'AIP Summary Import',
            //     description: 'Import AIP Summary from XLSX.',
            //     href: aipSummaryImportIndex().url,
            //     icon: FileSpreadsheet,
            //     badge: 'AIP Summary',
            // },
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
                    aria-disabled={item.disabled}
                    className={
                        'bg-primary text-primary-foreground hover:bg-primary/90 inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium shadow' +
                        (item.disabled ? ' pointer-events-none opacity-50' : '')
                    }
                >
                    Open <ArrowRight className="h-4 w-4" />
                </Link>
            </CardFooter>
        </Card>
    );
}

function ImportSourceSection({ source }: { source: ImportSource }) {
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
                            {source.items.length}{' '}
                            {source.items.length === 1
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
                {source.items.map((item) => (
                    <ImportCard key={item.title} item={item} />
                ))}
            </div>
        </section>
    );
}

export default function ImportsHub() {
    return (
        <>
            <Head title="Imports" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-1">
                    <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                        <Upload className="h-6 w-6" />
                        Imports
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Central hub for all import workflows, grouped by the
                        file they read from. New importers will be added here as
                        they become available.
                    </p>
                </div>

                {IMPORT_SOURCES.map((source) => (
                    <ImportSourceSection key={source.key} source={source} />
                ))}
            </div>
        </>
    );
}

ImportsHub.layout = {
    breadcrumbs: [{ title: 'Imports', href: '/imports' }],
};
