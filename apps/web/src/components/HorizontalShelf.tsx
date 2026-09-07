"use client";

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BookCard, BookCardProps } from "./BookCard";

export interface HorizontalShelfProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  books: BookCardProps[];
  actionLabel?: string;
  actionHref?: string;
}

export const HorizontalShelf: React.FC<HorizontalShelfProps> = ({
  title,
  subtitle,
  icon,
  books,
  actionLabel,
  actionHref,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 600;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (!books || books.length === 0) return null;

  return (
    <section className="py-4 my-2">
      {/* Shelf Header */}
      <div className="flex items-end justify-between px-4 sm:px-6 mb-3">
        <div>
          <div className="flex items-center gap-2">
            {icon && <span className="text-primary">{icon}</span>}
            <h2 className="text-xl font-bold text-foreground tracking-tight">{title}</h2>
          </div>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {actionLabel && actionHref && (
            <a
              href={actionHref}
              className="text-xs font-semibold text-primary hover:underline mr-2 hidden sm:inline-block"
            >
              {actionLabel}
            </a>
          )}
          <button
            onClick={() => handleScroll("left")}
            className="p-1.5 rounded-full bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
            title="Görgetés balra"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll("right")}
            className="p-1.5 rounded-full bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
            title="Görgetés jobbra"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Books Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto px-4 sm:px-6 py-2 hide-scrollbar scroll-smooth"
      >
        {books.map((book) => (
          <BookCard key={book.id} {...book} />
        ))}
      </div>
    </section>
  );
};
