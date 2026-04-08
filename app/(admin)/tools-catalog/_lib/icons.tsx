import {
  Upload,
  FileText,
  FolderOpen,
  Search,
  UserPlus,
  UserMinus,
  BarChart,
  List,
  PlusCircle,
  Pencil,
  Sparkles,
  CheckCircle,
  XCircle,
  FlaskConical,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import type { ToolIconName } from "@/lib/tools/define-tool";

const ICON_MAP: Record<ToolIconName, LucideIcon> = {
  upload: Upload,
  "file-text": FileText,
  "folder-open": FolderOpen,
  search: Search,
  "user-plus": UserPlus,
  "user-minus": UserMinus,
  "bar-chart": BarChart,
  list: List,
  "plus-circle": PlusCircle,
  pencil: Pencil,
  sparkles: Sparkles,
  "check-circle": CheckCircle,
  "x-circle": XCircle,
  "flask-conical": FlaskConical,
  "credit-card": CreditCard,
};

export function ToolIcon({
  name,
  className,
}: {
  name?: ToolIconName;
  className?: string;
}) {
  const Icon = name ? (ICON_MAP[name] ?? FileText) : FileText;
  return <Icon className={className} />;
}
