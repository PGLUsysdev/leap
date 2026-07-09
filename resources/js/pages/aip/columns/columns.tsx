import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChartOfAccount, FiscalYear, FundingSource, PriceList } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { RowData } from "@tanstack/react-table";

declare module "@tanstack/react-table" {
    interface TableMeta<TData extends RowData> {
        onEdit?: (data: TData) => void;
        onDelete?: (data: TData) => void;

        onAdd?: (data: TData, type?: "Program" | "Project" | "Activity" | "Sub-Activity") => void;
        onUpdateStatus?: (data: TData, status: "draft" | "open" | "locked" | "archived") => void;
        onOpen?: (data: TData) => void;
        onGeneratePdf?: (data: TData) => void;
        onOpenPpmpSummary?: (data: TData) => void;
        onReorder?: (activeId: string, overId: string) => void;
        onShowChildren?: (data: TData) => void;
        onMove?: (data: TData) => void;
        onSelect?: (data: TData, boolean: boolean) => void;
        onEditPerms?: () => void;
        meta?: {
            priceLists?: PriceList[];
            chartOfAccounts?: ChartOfAccount[];
            fundingSources?: FundingSource[];
        };
        selectedItemToMove: TData;
    }
}

const columnHelper = createColumnHelper<FiscalYear>();

const columns = (
    canUpdateStatus: boolean,
    canOpenAip: boolean,
    disableOpenAip: boolean,
    canGenerateApp: boolean,
    canOpenPpmpSummary: boolean,
) => {
    const cols = [
        columnHelper.accessor("year", {
            header: "Fiscal Year",
            cell: (value) => <span className="text-wrap">{value.getValue()}</span>,
        }),
        columnHelper.accessor("status", {
            header: "Status",
            cell: (info) => {
                const status = info.getValue();

                const STATUS_MAP = {
                    draft: { label: "Draft", variant: "secondary" as const },
                    open: { label: "Open", variant: "default" as const },
                    locked: { label: "Locked", variant: "outline" as const },
                    archived: {
                        label: "Archived",
                        variant: "outline" as const,
                    },
                } as const;

                const config = STATUS_MAP[status] || {
                    label: status,
                    variant: "secondary",
                };

                return (
                    <Badge variant={config.variant} className="capitalize">
                        {config.label}
                    </Badge>
                );
            },
        }),
        columnHelper.accessor("created_at", {
            header: "Created At",
            cell: (info) => {
                const rawValue = info.getValue();
                const date = new Date(String(rawValue));
                const formattedDate = date.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                });

                return <span className="text-wrap">{formattedDate}</span>;
            },
        }),
        columnHelper.accessor("updated_at", {
            header: "Updated At",
            cell: (info) => {
                const rawValue = info.getValue();
                const date = new Date(String(rawValue));
                const formattedDate = date.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                });

                return <span className="text-wrap">{formattedDate}</span>;
            },
        }),
        ...(canUpdateStatus || canOpenAip || canGenerateApp || canOpenPpmpSummary
            ? [
                  columnHelper.display({
                      id: "action",
                      size: (() => {
                          const count = [
                              canUpdateStatus,
                              canOpenAip,
                              canGenerateApp,
                              canOpenPpmpSummary,
                          ].filter(Boolean).length;
                          return count === 0
                              ? 0
                              : count === 1
                                ? 48
                                : count === 2
                                  ? 84
                                  : count === 3
                                    ? 120
                                    : 154;
                      })(),
                      cell: ({ row, table }) => {
                          const initialStatus = row.original.status;

                          return (
                              <div className="flex items-center gap-1">
                                  {canUpdateStatus && (
                                      <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                              <Button
                                                  variant="outline"
                                                  size="icon"
                                                  title="Change AIP status"
                                                  onClick={() =>
                                                      table.options.meta?.onEdit?.(row.original)
                                                  }
                                              >
                                                  <Pencil />
                                              </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent>
                                              <DropdownMenuGroup>
                                                  <DropdownMenuLabel>
                                                      Change AIP Status
                                                  </DropdownMenuLabel>
                                                  <DropdownMenuItem
                                                      onClick={() =>
                                                          table.options.meta?.onUpdateStatus?.(
                                                              row.original,
                                                              "draft",
                                                          )
                                                      }
                                                      disabled={initialStatus === "draft"}
                                                  >
                                                      Draft
                                                  </DropdownMenuItem>
                                                  <DropdownMenuItem
                                                      onClick={() =>
                                                          table.options.meta?.onUpdateStatus?.(
                                                              row.original,
                                                              "open",
                                                          )
                                                      }
                                                      disabled={initialStatus === "open"}
                                                  >
                                                      Open
                                                  </DropdownMenuItem>
                                                  <DropdownMenuItem
                                                      onClick={() =>
                                                          table.options.meta?.onUpdateStatus?.(
                                                              row.original,
                                                              "locked",
                                                          )
                                                      }
                                                      disabled={initialStatus === "locked"}
                                                  >
                                                      Locked
                                                  </DropdownMenuItem>
                                                  <DropdownMenuItem
                                                      onClick={() =>
                                                          table.options.meta?.onUpdateStatus?.(
                                                              row.original,
                                                              "archived",
                                                          )
                                                      }
                                                      disabled={initialStatus === "archived"}
                                                  >
                                                      Archived
                                                  </DropdownMenuItem>
                                              </DropdownMenuGroup>
                                          </DropdownMenuContent>
                                      </DropdownMenu>
                                  )}

                                  {canGenerateApp && (
                                      <Button
                                          variant="outline"
                                          title="Generate APP"
                                          size="icon"
                                          onClick={() => {
                                              table.options.meta?.onGeneratePdf?.(row.original);
                                          }}
                                      >
                                          <FileText />
                                      </Button>
                                  )}

                                  {canOpenAip && (
                                      <Button
                                          variant="outline"
                                          size="icon"
                                          title="Open AIP"
                                          disabled={disableOpenAip}
                                          onClick={() => table.options.meta?.onOpen?.(row.original)}
                                      >
                                          <ExternalLink />
                                      </Button>
                                  )}

                                  {canOpenPpmpSummary && (
                                      <Button
                                          variant="outline"
                                          title="Open PPMP Summary"
                                          size="icon"
                                          onClick={() => {
                                              table.options.meta?.onOpenPpmpSummary?.(row.original);
                                          }}
                                      >
                                          <ExternalLink />
                                      </Button>
                                  )}
                              </div>
                          );
                      },
                  }),
              ]
            : []),
    ];

    return cols;
};

export default columns;
