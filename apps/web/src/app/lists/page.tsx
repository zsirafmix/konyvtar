"use client";

import React from "react";
import Link from "next/link";
import { ListTree, Heart, BookOpen, Plus } from "lucide-react";

export default function ListsPage() {
  const lists = [
    {
      id: "l1",
      title: "Alapvető Hard Sci-Fi Mesterművek",
      description: "A tudományos fantasztikum legátgondoltabb és legnagyobb hatású regényei egy helyen.",
      creator: "Főkönyvtáros Admin",
      bookCount: 4,
      likeCount: 28,
      covers: [
        "https://images.unsplash.com/photo-1618609377864-68609b857e90?w=200&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=200&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=200&auto=format&fit=crop&q=80",
      ],
    },
    {
      id: "l2",
      title: "20 Alapvető Kiberpunk Könyv",
      description: "Hálózatok, testmódosítások, mesterséges intelligencia és a virtuális valóság határai.",
      creator: "Kiss Péter",
      bookCount: 20,
      likeCount: 42,
      covers: [
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=200&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=200&auto=format&fit=crop&q=80",
      ],
    },
    {
      id: "l3",
      title: "Könyvek, amelyek megváltoztatták a gondolkodásomat",
      description: "Filozófiai esszék, rendszerszemlélet és játékelméleti klasszikusok.",
      creator: "Kovács Anna",
      bookCount: 8,
      likeCount: 19,
      covers: [
        "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=200&auto=format&fit=crop&q=80",
      ],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Közösségi Listák</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Tematikus könyvgyűjtemények az olvasóktól és a kurátoroktól.
          </p>
        </div>

        <button className="px-4 py-2 rounded-full bg-primary text-primary-foreground font-semibold text-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          <span>Új lista létrehozása</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lists.map((l) => (
          <div key={l.id} className="p-6 rounded-3xl bg-card border border-border space-y-4 hover:border-primary/50 transition-colors shadow-sm">
            {/* Covers collage */}
            <div className="flex -space-x-4 overflow-hidden py-1">
              {l.covers.map((c, i) => (
                <img
                  key={i}
                  src={c}
                  alt=""
                  className="w-16 aspect-[2/3] object-cover rounded-lg shadow-md border-2 border-card"
                />
              ))}
            </div>

            <div className="space-y-1.5">
              <h2 className="font-bold text-base text-foreground leading-snug">{l.title}</h2>
              <p className="text-xs text-muted-foreground line-clamp-2">{l.description}</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs text-muted-foreground">
              <span>Készítette: {l.creator}</span>
              <div className="flex items-center gap-1 text-red-500 font-semibold">
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>{l.likeCount}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
