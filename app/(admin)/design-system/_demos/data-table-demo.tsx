"use client";

import {
  Eye,
  Pencil,
  Download,
  Archive,
  Plus,
  FileDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/composite/data-table";
import type { ActionMenuItem } from "@/components/composite/action-menu";

interface TitleFile {
  id: string;
  property: string;
  status: string;
  type: string;
  amount: number;
  closer: string;
  date: string;
  [key: string]: unknown;
}

const STATUS_STYLES: Record<string, string> = {
  "Clear to Close": "bg-success-20 text-success-80 border-success-60/30",
  "In Curative": "bg-warning-20 text-warning-80 border-warning-60/30",
  Opened: "bg-sapphire-10 text-sapphire-80 border-sapphire-40/30",
  Signing: "bg-amethyst-20 text-amethyst-80 border-amethyst-40/30",
  Recording: "bg-onyx-10 text-onyx-70 border-onyx-30/30",
};

const TYPE_STYLES: Record<string, string> = {
  Purchase: "bg-sapphire-20 text-sapphire-80 border-sapphire-40/30",
  Refinance: "bg-success-20 text-success-80 border-success-60/30",
  Wholesale: "bg-garnet-20 text-garnet-80 border-garnet-40/30",
  PASA: "bg-amethyst-20 text-amethyst-80 border-amethyst-40/30",
};

const FILES: TitleFile[] = [
  { id: "24-1847", property: "123 Main St, Columbus, OH", status: "Clear to Close", type: "Purchase", amount: 425000, closer: "Sarah K.", date: "2026-03-20" },
  { id: "24-1852", property: "456 Oak Ave, Delaware, OH", status: "In Curative", type: "Refinance", amount: 312000, closer: "Mike R.", date: "2026-03-18" },
  { id: "24-1861", property: "789 Elm Blvd, Westerville, OH", status: "Opened", type: "Purchase", amount: 589000, closer: "Sarah K.", date: "2026-03-22" },
  { id: "24-1870", property: "321 Pine Rd, Dublin, OH", status: "Signing", type: "Wholesale", amount: 195000, closer: "James L.", date: "2026-03-19" },
  { id: "24-1878", property: "654 Maple Dr, Gahanna, OH", status: "Clear to Close", type: "PASA", amount: 275000, closer: "Mike R.", date: "2026-03-21" },
  { id: "24-1885", property: "987 Birch Ln, Hilliard, OH", status: "Recording", type: "Purchase", amount: 460000, closer: "Sarah K.", date: "2026-03-17" },
  { id: "24-1892", property: "147 Cedar Way, Powell, OH", status: "In Curative", type: "Refinance", amount: 340000, closer: "James L.", date: "2026-03-23" },
  { id: "24-1901", property: "258 Walnut Ct, Worthington, OH", status: "Opened", type: "Purchase", amount: 515000, closer: "Mike R.", date: "2026-03-24" },
];

const columns: Column<TitleFile>[] = [
  {
    key: "id",
    header: "File #",
    sortable: true,
    render: (val) => (
      <span className="font-mono text-sm font-medium text-onyx-80">{String(val)}</span>
    ),
  },
  {
    key: "property",
    header: "Property",
    sortable: true,
    className: "max-w-[220px]",
    render: (val) => (
      <span className="block truncate">{String(val)}</span>
    ),
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (_, row) => (
      <Badge variant="glass" size="sm" className={STATUS_STYLES[row.status as string]}>
        {row.status as string}
      </Badge>
    ),
  },
  {
    key: "type",
    header: "Type",
    sortable: true,
    render: (_, row) => (
      <Badge variant="glass" size="sm" className={TYPE_STYLES[row.type as string]}>
        {row.type as string}
      </Badge>
    ),
  },
  {
    key: "amount",
    header: "Amount",
    sortable: true,
    className: "text-right",
    render: (val) => (
      <span className="font-mono text-sm">
        ${(val as number).toLocaleString()}
      </span>
    ),
  },
  {
    key: "closer",
    header: "Closer",
    sortable: true,
  },
  {
    key: "date",
    header: "Date",
    sortable: true,
    render: (val) => (
      <span className="text-onyx-60">{String(val)}</span>
    ),
  },
];

function getActions(_row: TitleFile): ActionMenuItem[] {
  return [
    { label: "View File", icon: <Eye className="h-4 w-4" />, onClick: () => {} },
    { label: "Edit", icon: <Pencil className="h-4 w-4" />, onClick: () => {} },
    { label: "Download Docs", icon: <Download className="h-4 w-4" />, onClick: () => {} },
    { label: "Archive", icon: <Archive className="h-4 w-4" />, onClick: () => {}, variant: "danger" as const, separator: true },
  ];
}

export function DataTableDemo() {
  return (
    <DataTable
      title="Active Deals"
      description="8 deals across all closers"
      columns={columns}
      data={FILES}
      filterKey="property"
      filterPlaceholder="Search by property..."
      pageSize={5}
      actions={getActions}
      toolbar={
        <>
          <Button variant="outline" size="sm">
            <FileDown className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Add File
          </Button>
        </>
      }
    />
  );
}
