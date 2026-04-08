import {
  LayoutDashboard,
  Search,
  Receipt,
  FileText,
  MessageCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface FileSubItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

export const FILE_SUB_ITEMS: FileSubItem[] = [
  { label: "Overview", icon: LayoutDashboard, path: "" },
  { label: "Title Tracker", icon: Search, path: "/title-tracker" },
  { label: "Live Ledger", icon: Receipt, path: "/live-ledger" },
  { label: "Documents", icon: FileText, path: "/documents" },
  { label: "Messages", icon: MessageCircle, path: "/messages" },
];
