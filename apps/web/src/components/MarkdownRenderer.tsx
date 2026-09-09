"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, Sparkles, CheckCircle2, ChevronRight } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Parses inline formatting like **bold**, *italic*, and [title](url)
 */
function renderInlineFormatting(text: string): React.ReactNode[] {
  // Regex to match markdown links [text](url), bold **text**, and italic *text*
  const tokenRegex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|_([^_]+)_)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    // Push preceding text
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const fullMatch = match[0];
    const linkText = match[2];
    const linkUrl = match[3];
    const boldText = match[4];
    const italicTextStar = match[5];
    const italicTextUnderscore = match[6];

    if (linkText && linkUrl) {
      const isInternalBook = linkUrl.startsWith("/book/") || linkUrl.startsWith("/");
      parts.push(
        <Link
          key={match.index}
          href={linkUrl}
          className="inline-flex items-center gap-1 font-bold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-lg text-xs transition-colors mx-0.5"
        >
          {isInternalBook && <BookOpen className="w-3 h-3 text-primary shrink-0" />}
          <span>{linkText}</span>
        </Link>
      );
    } else if (boldText) {
      parts.push(
        <strong key={match.index} className="font-bold text-foreground">
          {boldText}
        </strong>
      );
    } else if (italicTextStar || italicTextUnderscore) {
      parts.push(
        <em key={match.index} className="italic text-foreground/85">
          {italicTextStar || italicTextUnderscore}
        </em>
      );
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = "" }) => {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushList = () => {
    if (currentList) {
      const isOrdered = currentList.type === "ol";
      elements.push(
        <div key={`list-${elements.length}`} className="my-3 space-y-1.5 pl-1">
          {currentList.items.map((itemText, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/90 leading-relaxed"
            >
              <div className="mt-1 shrink-0">
                {isOrdered ? (
                  <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[11px] font-black flex items-center justify-center">
                    {idx + 1}
                  </span>
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1" />
                )}
              </div>
              <div className="flex-1">{renderInlineFormatting(itemText)}</div>
            </div>
          ))}
        </div>
      );
      currentList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      flushList();
      continue;
    }

    // Heading 3: ### Title
    if (line.startsWith("### ")) {
      flushList();
      const title = line.replace(/^###\s+/, "");
      elements.push(
        <h3
          key={`h3-${i}`}
          className="text-base sm:text-lg font-black text-foreground flex items-center gap-2 mt-4 mb-2 pb-1.5 border-b border-border/50 tracking-tight"
        >
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{renderInlineFormatting(title)}</span>
        </h3>
      );
      continue;
    }

    // Heading 4: #### Subtitle
    if (line.startsWith("#### ")) {
      flushList();
      const title = line.replace(/^####\s+/, "");
      elements.push(
        <h4
          key={`h4-${i}`}
          className="text-sm font-extrabold text-foreground flex items-center gap-1.5 mt-3 mb-1 text-primary"
        >
          <ChevronRight className="w-3.5 h-3.5" />
          <span>{renderInlineFormatting(title)}</span>
        </h4>
      );
      continue;
    }

    // Blockquote: > Quote
    if (line.startsWith("> ")) {
      flushList();
      const quote = line.replace(/^>\s+/, "");
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="border-l-4 border-emerald-500/80 bg-emerald-500/10 dark:bg-emerald-950/20 pl-3.5 py-2 my-3 rounded-r-2xl text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed"
        >
          {renderInlineFormatting(quote)}
        </blockquote>
      );
      continue;
    }

    // Unordered list item: * item or - item
    if (line.startsWith("* ") || line.startsWith("- ")) {
      const itemText = line.replace(/^[*\-]\s+/, "");
      if (!currentList || currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(itemText);
      continue;
    }

    // Ordered list item: 1. item
    const olMatch = line.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      const itemText = olMatch[1];
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(itemText);
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={`p-${i}`} className="text-xs sm:text-sm text-foreground/90 leading-relaxed my-2">
        {renderInlineFormatting(line)}
      </p>
    );
  }

  flushList();

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
};
