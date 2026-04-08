"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Settings, LogOut, User, Wrench, Users, LayoutGrid, Palette, FlaskConical, Play, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/composite/user-avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

/* ---------- types ---------- */

export interface WorkspaceTab {
  id: string;
  label: string;
  href: string;
}

interface AppNavbarProps {
  workspaces: WorkspaceTab[];
  /** Current user display name */
  userName?: string;
  /** Current user avatar URL */
  userAvatarUrl?: string;
  /** Unread notification count (0 = no badge) */
  notificationCount?: number;
  onSettingsClick?: () => void;
  onNotificationsClick?: () => void;
  /** "pill" (default) = rounded; "flat" = rectangular; "underline" = bottom accent border */
  tabVariant?: "pill" | "flat" | "underline";
  className?: string;
}

/* ---------- component ---------- */

export function AppNavbar({
  workspaces,
  userName = "David Landreman",
  userAvatarUrl,
  notificationCount = 0,
  onSettingsClick,
  onNotificationsClick,
  tabVariant = "pill",
  className,
}: AppNavbarProps) {
  const pathname = usePathname();
  const isFlat = tabVariant === "flat";
  const isUnderline = tabVariant === "underline";
  const isFullHeight = isFlat || isUnderline;
  const iconBtnClass = isFlat
    ? "text-onyx-60 hover:bg-onyx-30/50 hover:text-onyx-80"
    : "text-onyx-50 hover:bg-onyx-10 hover:text-onyx-80";

  return (
    <nav
      className={cn(
        "flex h-12 shrink-0 items-center px-4",
        isFlat
          ? "bg-onyx-20"
          : "border-b border-onyx-20 bg-white",
        className,
      )}
    >
      {/* Left: Logo + Workspace tabs */}
      <div className={cn("flex gap-4", isFullHeight ? "h-full items-stretch" : "items-center")}>
        <div className="flex items-center">
          <Image
            src="/empora-logo.svg"
            alt="Empora"
            width={24}
            height={24}
            className="h-6 w-auto"
          />
        </div>

        <div className={cn(
          "flex",
          isFullHeight ? "items-stretch gap-0" : "items-center gap-0.5"
        )}>
          {workspaces.map((ws) => {
            const isActive = pathname.startsWith(ws.href);
            return (
              <Link
                key={ws.id}
                href={ws.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  isUnderline
                    ? cn(
                        "flex items-center border-b-2 px-3",
                        isActive
                          ? "border-sapphire-50 text-onyx-100"
                          : "border-transparent text-onyx-60 hover:text-onyx-80"
                      )
                    : isFlat
                      ? cn(
                          "flex items-center px-3",
                          isActive
                            ? "bg-white text-onyx-100"
                            : "text-onyx-60 hover:bg-onyx-30/50 hover:text-onyx-80"
                        )
                      : cn(
                          "rounded-md px-3 py-1.5",
                          isActive
                            ? "bg-sapphire-10 text-sapphire-70"
                            : "text-onyx-60 hover:bg-onyx-10 hover:text-onyx-80"
                        ),
                )}
              >
                {ws.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: Tools, Notifications, Settings, User */}
      <div className="flex items-center gap-1">
        {/* Tools */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn("inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors", iconBtnClass)}
            >
              <Wrench className="h-4 w-4" />
              <span className="sr-only">Tools</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/entities">
                <Users className="mr-2 h-4 w-4" />
                Manage Entities
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/skills">
                <Sparkles className="mr-2 h-4 w-4" />
                Skills
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/tools-catalog">
                <LayoutGrid className="mr-2 h-4 w-4" />
                Tools Catalog
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/schema-forms">
                <FlaskConical className="mr-2 h-4 w-4" />
                Schema Forms
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/design-system">
                <Palette className="mr-2 h-4 w-4" />
                Design System
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <button
          type="button"
          onClick={onNotificationsClick}
          className={cn("relative inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors", iconBtnClass)}
        >
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-garnet-60 px-1 text-[10px] font-bold text-white">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </button>

        {/* Settings */}
        <button
          type="button"
          onClick={onSettingsClick}
          className={cn("inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors", iconBtnClass)}
        >
          <Settings className="h-4 w-4" />
          <span className="sr-only">Settings</span>
        </button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="ml-1 rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-sapphire-50"
            >
              <UserAvatar
                name={userName}
                imageUrl={userAvatarUrl}
                size="sm"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>{userName}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" asChild>
              <a href="/auth/logout">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
