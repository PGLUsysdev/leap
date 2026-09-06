import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    FileSpreadsheet,
    Receipt,
    Tags,
    Upload,
} from 'lucide-react';
import { Badge } from '@/components/base-ui-components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/base-ui-components/ui/card';
import { index as aipSummaryImportIndex } from '@/routes/aip-summary-import';
import { index as categoryCoaMappingIndex } from '@/routes/category-coa-mapping';
import { index as categoryImportIndex } from '@/routes/category-import';
import { index as priceListImportIndex } from '@/routes/price-list-import';

type ImportItem = {
    title: string;
    description: string;
    href: string;
    icon: typeof FileSpreadsheet;
    badge: string;
    disabled?: boolean;
};

const IMPORTS: ImportItem[] = [
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
        title: 'AIP Summary Import',
        description: 'Import AIP Summary from XLSX.',
        href: aipSummaryImportIndex().url,
        icon: FileSpreadsheet,
        badge: 'AIP Summary',
    },
];

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
                        Central hub for all import workflows. New importers will
                        be added here as they become available.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {IMPORTS.map((item) => (
                        <Card key={item.title} className="flex flex-col">
                            <CardHeader>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                                        <item.icon className="h-5 w-5" />
                                    </div>
                                    <Badge variant="secondary">
                                        {item.badge}
                                    </Badge>
                                </div>
                                <CardTitle className="pt-3">
                                    {item.title}
                                </CardTitle>
                                <CardDescription>
                                    {item.description}
                                </CardDescription>
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
                    ))}

                    {/* Placeholder for future imports */}
                    <Card className="flex flex-col border-dashed">
                        <CardHeader>
                            <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                                <Upload className="text-muted-foreground h-5 w-5" />
                            </div>
                            <CardTitle className="text-muted-foreground pt-3">
                                More imports coming soon
                            </CardTitle>
                            <CardDescription>
                                AIP Summary and other bulk importers will appear
                                here.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1" />
                        <CardFooter>
                            <span className="text-muted-foreground text-xs">
                                Registry pattern — add entry to IMPORTS array to
                                extend.
                            </span>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </>
    );
}

ImportsHub.layout = {
    breadcrumbs: [{ title: 'Imports', href: '/imports' }],
};
