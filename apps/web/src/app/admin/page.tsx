"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Database,
  Cloud,
  Cpu,
  Check,
  X,
  Edit2,
  Lock,
  FileCheck,
  AlertTriangle,
  RefreshCw,
  Sparkles,
} from "lucide-react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "metadata" | "rights" | "imports">("overview");
  const [metadataQueue, setMetadataQueue] = useState<any[]>([]);
  const [rightsEditions, setRightsEditions] = useState<any[]>([]);
  const [importsData, setImportsData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [metaRes, rightsRes, importsRes] = await Promise.all([
        fetch("/api/admin/metadata"),
        fetch("/api/admin/rights"),
        fetch("/api/admin/imports"),
      ]);

      if (metaRes.ok) {
        const meta = await metaRes.json();
        setMetadataQueue(meta.queue || []);
      }
      if (rightsRes.ok) {
        const rights = await rightsRes.json();
        setRightsEditions(rights.editions || []);
      }
      if (importsRes.ok) {
        const imp = await importsRes.json();
        setImportsData(imp);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMetadataAction = async (id: string, action: "APPROVE" | "REJECT") => {
    try {
      await fetch("/api/admin/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      setMetadataQueue((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: action === "APPROVE" ? "APPROVED" : "REJECTED" } : item))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateRights = async (editionId: string, distributionStatus: string) => {
    try {
      await fetch("/api/admin/rights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editionId, distributionStatus }),
      });
      setRightsEditions((prev) =>
        prev.map((e) => (e.id === editionId ? { ...e, distributionStatus } : e))
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>RENDSZERGAZDA ÉS JOGKEZELŐ PULT</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Adminisztráció</h1>
        </div>

        <button
          onClick={loadAllAdminData}
          className="px-3.5 py-2 rounded-xl bg-secondary hover:bg-accent text-secondary-foreground text-xs font-medium flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Frissítés</span>
        </button>
      </div>

      {/* Admin Nav Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto hide-scrollbar">
        {[
          { id: "overview", label: "Áttekintés & Metrikák" },
          { id: "metadata", label: `AI Metaadat Jóváhagyás (${metadataQueue.filter((q) => q.status === "PENDING").length})` },
          { id: "rights", label: "Terjesztési Jogok (Rights)" },
          { id: "imports", label: "Import & Kötegelt Feldolgozás" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & SYSTEM HEALTH */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-card border border-border space-y-2">
              <span className="text-xs font-semibold text-muted-foreground">Összes indexelt könyv</span>
              <div className="text-2xl font-black text-foreground">52 131</div>
              <span className="text-[11px] text-emerald-500 font-medium">+142 az elmúlt 24 órában</span>
            </div>

            <div className="p-5 rounded-3xl bg-card border border-border space-y-2">
              <span className="text-xs font-semibold text-muted-foreground">Aktív Támogatók (1 €/hét)</span>
              <div className="text-2xl font-black text-emerald-500">184</div>
              <span className="text-[11px] text-muted-foreground">736 € / havi fenntartási alap</span>
            </div>

            <div className="p-5 rounded-3xl bg-card border border-border space-y-2">
              <span className="text-xs font-semibold text-muted-foreground">Átlagos AI pontosság</span>
              <div className="text-2xl font-black text-primary">94.8%</div>
              <span className="text-[11px] text-muted-foreground">Gemini + OpenLibrary match</span>
            </div>

            <div className="p-5 rounded-3xl bg-card border border-border space-y-2">
              <span className="text-xs font-semibold text-muted-foreground">Adatbázis & Vektorkereső</span>
              <div className="text-2xl font-black text-foreground">Online</div>
              <span className="text-[11px] text-emerald-500 font-medium">PostgreSQL + pgvector</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI METADATA REVIEW QUEUE (Section 45) */}
      {activeTab === "metadata" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">AI Metaadat Jóváhagyási Várólista</h2>
            <p className="text-xs text-muted-foreground">
              Az automatikus fájlelemző által kinyert, alacsonyabb konfidenciájú tételek emberi felülvizsgálatra.
            </p>
          </div>

          <div className="space-y-3">
            {metadataQueue.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-card border border-border flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <span className="text-[11px] font-mono text-muted-foreground block truncate">
                    Fájl: {item.rawFilename}
                  </span>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-extrabold text-base text-foreground">{item.detectedTitle}</span>
                    <span className="text-sm text-muted-foreground">— {item.detectedAuthor}</span>
                    {item.detectedSeries && (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-secondary font-medium">
                        {item.detectedSeries} #{item.detectedSeriesNumber}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                    <span>Forrás: {item.suggestedSource}</span>
                    <span className="font-semibold text-primary">
                      Konfidencia: {(item.overallConfidence * 100).toFixed(0)}%
                    </span>
                    <span className={`font-bold ${item.status === "APPROVED" ? "text-emerald-500" : item.status === "REJECTED" ? "text-destructive" : "text-amber-500"}`}>
                      [{item.status}]
                    </span>
                  </div>
                </div>

                {item.status === "PENDING" && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleMetadataAction(item.id, "APPROVE")}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Jóváhagyás</span>
                    </button>
                    <button
                      onClick={() => handleMetadataAction(item.id, "REJECT")}
                      className="px-3.5 py-1.5 rounded-xl bg-destructive hover:bg-destructive/80 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Elutasítás</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DISTRIBUTION RIGHTS MANAGEMENT (Section 46) */}
      {activeTab === "rights" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Terjesztési Jogosultságok Kezelése</h2>
            <p className="text-xs text-muted-foreground">
              Explicit tartalomjogi jelölések. A magánfájlok soha nem tölthetők le mások által.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/50 text-muted-foreground uppercase">
                <tr>
                  <th className="p-3">Könyv címe</th>
                  <th className="p-3">Terjesztési státusz</th>
                  <th className="p-3">Licenc / Forrás</th>
                  <th className="p-3">Módosítás</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rightsEditions.map((ed) => (
                  <tr key={ed.id} className="hover:bg-accent/30">
                    <td className="p-3 font-semibold text-foreground">{ed.bookTitle}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ed.distributionStatus === "PUBLIC_DOMAIN"
                          ? "bg-emerald-500/20 text-emerald-500"
                          : ed.distributionStatus === "LICENSED"
                          ? "bg-blue-500/20 text-blue-500"
                          : ed.distributionStatus === "CREATOR_AUTHORIZED"
                          ? "bg-teal-500/20 text-teal-500"
                          : "bg-purple-500/20 text-purple-500"
                      }`}>
                        {ed.distributionStatus}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{ed.rightsLicense}</td>
                    <td className="p-3">
                      <select
                        value={ed.distributionStatus}
                        onChange={(e) => handleUpdateRights(ed.id, e.target.value)}
                        className="px-2 py-1 rounded bg-secondary text-foreground text-xs border border-border focus:outline-none"
                      >
                        <option value="PRIVATE">PRIVATE (Magán)</option>
                        <option value="PUBLIC_DOMAIN">PUBLIC_DOMAIN (Közkincs)</option>
                        <option value="LICENSED">LICENSED (Licencelt)</option>
                        <option value="CREATOR_AUTHORIZED">CREATOR_AUTHORIZED (Szerzői engedély)</option>
                        <option value="RESTRICTED">RESTRICTED (Korlátozott)</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: IMPORTS & QUEUE PROGRESS (Section 35 & 36) */}
      {activeTab === "imports" && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-card border border-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider block">
                  Aktuális Háttérfolyamat (Queue)
                </span>
                <h3 className="text-xl font-extrabold text-foreground mt-0.5">
                  50 000+ Könyves Könyvtár Indexelése
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary animate-pulse">
                Feldolgozás alatt
              </span>
            </div>

            {/* Progress Bar (36,829 / 52,131 feldolgozva) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>36 829 / 52 131 fájl feldolgozva</span>
                <span>70.6%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-500" style={{ width: "70.6%" }} />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs text-muted-foreground border-t border-border/50">
              <div>Párhuzamos szálak: 4 worker</div>
              <div>Sebesség: 420 könyv/perc</div>
              <div>Duplikátum kiszűrve: 1 412 db</div>
              <div>Várható hátralévő idő: 36 perc</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
