"use client";

import Image from "next/image";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/* ---------- variants ---------- */

const avatarVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-full font-medium select-none",
  {
    variants: {
      size: {
        xs: "h-5 w-5 text-[10px]",
        sm: "h-7 w-7 text-xs",
        md: "h-9 w-9 text-sm",
        lg: "h-11 w-11 text-base",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

/* ---------- color map ---------- */

/** Deterministic pastel background from name hash */
const AVATAR_COLORS = [
  { bg: "bg-sapphire-20", text: "text-sapphire-80" },
  { bg: "bg-amethyst-20", text: "text-amethyst-80" },
  { bg: "bg-garnet-20", text: "text-garnet-80" },
  { bg: "bg-success-20", text: "text-success-80" },
  { bg: "bg-warning-20", text: "text-warning-80" },
] as const;

function colorForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ---------- component ---------- */

export interface UserAvatarProps
  extends VariantProps<typeof avatarVariants> {
  name: string;
  imageUrl?: string;
  className?: string;
}

export function UserAvatar({ name, imageUrl, size, className }: UserAvatarProps) {
  const color = colorForName(name);
  const initials = getInitials(name);

  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={name}
        width={size === "lg" ? 40 : size === "sm" ? 24 : 32}
        height={size === "lg" ? 40 : size === "sm" ? 24 : 32}
        className={cn(avatarVariants({ size }), "object-cover", className)}
      />
    );
  }

  return (
    <span
      className={cn(avatarVariants({ size }), color.bg, color.text, className)}
      title={name}
    >
      {initials}
    </span>
  );
}
