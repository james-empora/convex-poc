"use client";

import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { transformResourceRefs } from "@/lib/chat/remark-resource-links";
import { ResourceLink } from "./resource-link";

/** Allow empora:// URLs through; delegate everything else to the default sanitizer. */
function urlTransform(url: string): string {
  if (url.startsWith("empora://")) return url;
  return defaultUrlTransform(url);
}

interface MarkdownRendererProps {
  content: string;
  className?: string;
  /** Use light text colors for dark backgrounds (e.g. user chat bubbles). */
  dark?: boolean;
}

export function MarkdownRenderer({ content, className, dark = false }: MarkdownRendererProps) {
  // Color tokens swap between light (default) and dark variants
  const t = dark
    ? {
        heading: "text-white",
        body: "text-white/90",
        muted: "text-white/70",
        strong: "text-white",
        link: "text-white underline decoration-white/40",
        linkHover: "hover:text-white/80",
        codeBg: "bg-white/15",
        codeText: "text-white/90",
        preBg: "bg-white/10",
        preText: "text-white/90",
        border: "border-white/20",
        quoteBorder: "border-white/30",
        quoteText: "text-white/70",
        thBg: "bg-white/10",
      }
    : {
        heading: "text-onyx-100",
        body: "text-onyx-90",
        muted: "text-onyx-60",
        strong: "text-onyx-100",
        link: "text-sapphire-60 underline decoration-sapphire-30",
        linkHover: "hover:text-sapphire-70",
        codeBg: "bg-onyx-10",
        codeText: "text-onyx-80",
        preBg: "bg-onyx-10",
        preText: "text-onyx-80",
        border: "border-onyx-20",
        quoteBorder: "border-sapphire-30",
        quoteText: "text-onyx-60",
        thBg: "bg-onyx-10",
      };

  return (
    <div className={cn("text-sm leading-relaxed", className)}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      urlTransform={urlTransform}
      components={{
        h1: ({ children }) => (
          <h1 className={cn("mb-3 mt-4 font-display text-lg font-semibold first:mt-0", t.heading)}>
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className={cn("mb-2 mt-3 font-display text-base font-semibold first:mt-0", t.heading)}>
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className={cn("mb-2 mt-3 text-sm font-semibold first:mt-0", t.heading)}>
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className={cn("mb-2 last:mb-0", t.body)}>{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="mb-2 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>
        ),
        li: ({ children }) => (
          <li className={t.body}>{children}</li>
        ),
        strong: ({ children }) => (
          <strong className={cn("font-semibold", t.strong)}>{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic">{children}</em>
        ),
        a: ({ href, children }) => {
          if (href?.startsWith("empora://")) {
            return <ResourceLink href={href}>{children}</ResourceLink>;
          }
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn("underline-offset-2", t.link, t.linkHover)}
            >
              {children}
            </a>
          );
        },
        code: ({ className: codeClassName, children, ...props }) => {
          const isInline = !codeClassName;
          if (isInline) {
            return (
              <code className={cn("rounded px-1.5 py-0.5 font-mono text-xs", t.codeBg, t.codeText)}>
                {children}
              </code>
            );
          }
          return (
            <code className={cn("block", codeClassName)} {...props}>
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className={cn("mb-2 overflow-x-auto rounded-lg p-3 font-mono text-xs last:mb-0", t.preBg, t.preText)}>
            {children}
          </pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className={cn("mb-2 border-l-2 pl-3 italic last:mb-0", t.quoteBorder, t.quoteText)}>
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="mb-2 overflow-x-auto last:mb-0">
            <table className="w-full border-collapse text-xs">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className={cn("border px-2 py-1.5 text-left font-semibold", t.border, t.thBg, t.codeText)}>
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className={cn("border px-2 py-1.5", t.border, t.muted)}>
            {children}
          </td>
        ),
        hr: () => <hr className={cn("my-3", t.border)} />,
      }}
    >
      {transformResourceRefs(content)}
    </ReactMarkdown>
    </div>
  );
}
