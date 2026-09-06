import { Link } from '@inertiajs/react';
import { Fragment } from 'react';
import {
    Breadcrumb,
    BreadcrumbEllipsis,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/base-ui-components/ui/breadcrumb';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/base-ui-components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/base-ui-components/ui/sidebar';
import { collapseBreadcrumbs } from '@/lib/breadcrumb-collapse';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { visibleHead, hidden, tail, showEllipsis } = collapseBreadcrumbs(
        breadcrumbs,
        3,
    );

    const renderItem = (item: BreadcrumbItemType, isLast: boolean) => (
        <BreadcrumbItem
            key={`${item.title}-${item.href}`}
            className="min-w-0 shrink-0"
        >
            {isLast ? (
                <BreadcrumbPage
                    className="max-w-[12rem] truncate md:max-w-[16rem]"
                    title={item.title}
                >
                    {item.title}
                </BreadcrumbPage>
            ) : (
                <BreadcrumbLink
                    render={<Link href={item.href} />}
                    className="max-w-[12rem] truncate md:max-w-[16rem]"
                    title={item.title}
                >
                    {item.title}
                </BreadcrumbLink>
            )}
        </BreadcrumbItem>
    );

    return (
        // <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
        <header className="border-sidebar-border/50 flex h-12 shrink-0 items-center gap-2 overflow-hidden border-b px-6 transition-[width,height] ease-linear md:px-4">
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                <SidebarTrigger className="-ml-1 shrink-0" />
                {breadcrumbs.length > 0 && (
                    <Breadcrumb className="min-w-0 flex-1 overflow-hidden">
                        <BreadcrumbList className="flex-nowrap overflow-hidden">
                            {showEllipsis ? (
                                <>
                                    {visibleHead.map((item) => (
                                        <Fragment
                                            key={`head-${item.title}-${item.href}`}
                                        >
                                            {renderItem(item, false)}
                                            <BreadcrumbSeparator />
                                        </Fragment>
                                    ))}
                                    <BreadcrumbItem>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger
                                                render={
                                                    <button
                                                        type="button"
                                                        className="hover:bg-accent hover:text-accent-foreground flex items-center justify-center rounded-md p-1"
                                                        aria-label="More breadcrumbs"
                                                    />
                                                }
                                            >
                                                <BreadcrumbEllipsis />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                align="start"
                                                sideOffset={8}
                                                className="w-60 max-w-[40rem]"
                                            >
                                                {hidden.map((item) => (
                                                    <DropdownMenuItem
                                                        key={`hidden-${item.title}-${item.href}`}
                                                        render={
                                                            <Link
                                                                href={item.href}
                                                            />
                                                        }
                                                    >
                                                        <span className="truncate">
                                                            {item.title}
                                                        </span>
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator />
                                    {tail.map((item, idx) => {
                                        const isLast = idx === tail.length - 1;
                                        return (
                                            <Fragment
                                                key={`tail-${item.title}-${item.href}`}
                                            >
                                                {renderItem(item, isLast)}
                                                {!isLast && (
                                                    <BreadcrumbSeparator />
                                                )}
                                            </Fragment>
                                        );
                                    })}
                                </>
                            ) : (
                                breadcrumbs.map((item, index) => {
                                    const isLast =
                                        index === breadcrumbs.length - 1;
                                    return (
                                        <Fragment
                                            key={`${item.title}-${index}`}
                                        >
                                            {renderItem(item, isLast)}
                                            {!isLast && <BreadcrumbSeparator />}
                                        </Fragment>
                                    );
                                })
                            )}
                        </BreadcrumbList>
                    </Breadcrumb>
                )}
            </div>
        </header>
    );
}
