"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Award, Check, Sparkles, Clock, Heart, ShieldCheck, HelpCircle } from "lucide-react";

export default function SupporterPage() {
  const [subscribed, setSubscribed] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-12 pb-24">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <Award className="w-4 h-4 text-emerald-500" />
          <span>SUPPORTING LIBRARY MEMBER</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight">
          Támogasd a digitális könyvtár működését
        </h1>
        <p className="text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          A Librarian AI egy közösségi, nyílt kezdeményezés. Nem zárunk el tartalmakat falak mögé: a támogatói tagság önkéntes hozzájárulás a felhőtár és az AI infrastruktúra fenntartásához.
        </p>
      </div>

      {/* Subscription Card */}
      <div className="max-w-md mx-auto rounded-3xl p-8 bg-gradient-to-b from-card to-secondary/30 border-2 border-emerald-500/30 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-emerald-500 text-white font-extrabold text-[10px] uppercase tracking-wider px-4 py-1 rounded-bl-xl">
          Önkéntes Támogatás
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-foreground">1 €</span>
            <span className="text-sm font-semibold text-muted-foreground">/ hét</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Bármikor lemondható, nincsenek rejtett költségek.</p>
        </div>

        <div className="space-y-3 pt-2">
          {[
            {
              title: "Azonnali hozzáférés új könyvekhez",
              desc: "Nem kell megvárnod a 21 napos periódust az újonnan indexelt könyveknél.",
            },
            {
              title: "Fejlettebb AI és magasabb limitek",
              desc: "Korlátlan Ask My Library RAG kérdés és részletes szemantikus elemzések.",
            },
            {
              title: "Supporting Member kitűző a profilon",
              desc: "Közösségi elismerés (amely a beállításokban tetszés szerint elrejthető).",
            },
            {
              title: "Részletes olvasási statisztikák",
              desc: "Mélyreható grafikonok az olvasási szokásaidról, műfajaidról és sebességedről.",
            },
          ].map((feature, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <span className="font-semibold text-xs text-foreground block">{feature.title}</span>
                <span className="text-[11px] text-muted-foreground block">{feature.desc}</span>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setSubscribed(true)}
          className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-md hover:shadow-emerald-500/20"
        >
          {subscribed ? "Köszönjük a támogatást! (Aktív tagság) ✓" : "Csatlakozás támogatóként (1 € / hét)"}
        </button>

        <p className="text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Biztonságos európai bankkártyás fizetés (Stripe)</span>
        </p>
      </div>

      {/* Comparison: Free Member vs Supporting Member */}
      <div className="pt-8 space-y-6">
        <h2 className="text-2xl font-bold text-center text-foreground">
          Ingyenes Olvasó vs. Támogató Tag
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Funkció</th>
                <th className="py-3 px-4 font-semibold text-center">Ingyenes Tag (Free)</th>
                <th className="py-3 px-4 font-semibold text-center text-emerald-500">Támogató (Supporter)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              <tr>
                <td className="py-3.5 px-4 font-medium text-foreground">Saját könyvtár és fájlok kezelése</td>
                <td className="py-3.5 px-4 text-center text-emerald-500 font-bold">Korlátlan</td>
                <td className="py-3.5 px-4 text-center text-emerald-500 font-bold">Korlátlan</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium text-foreground">Közösségi könyvek letöltése</td>
                <td className="py-3.5 px-4 text-center text-muted-foreground">
                  21 napos várakozás után
                </td>
                <td className="py-3.5 px-4 text-center text-emerald-500 font-bold">
                  Azonnal
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium text-foreground">Szemantikus AI és RAG keresés</td>
                <td className="py-3.5 px-4 text-center text-muted-foreground">Napi 10 lekérdezés</td>
                <td className="py-3.5 px-4 text-center text-emerald-500 font-bold">Korlátlan</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium text-foreground">Közösségi funkciók, listák, klubok</td>
                <td className="py-3.5 px-4 text-center text-emerald-500 font-bold">Elérhető</td>
                <td className="py-3.5 px-4 text-center text-emerald-500 font-bold">Elérhető</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium text-foreground">Supporter Badge és extra statisztikák</td>
                <td className="py-3.5 px-4 text-center text-muted-foreground">–</td>
                <td className="py-3.5 px-4 text-center text-emerald-500 font-bold">Igen ✓</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
