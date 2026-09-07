"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  FolderDown,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Layers,
  ArrowRight,
} from "lucide-react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "metadata" | "rights" | "imports">("imports");
  const [metadataQueue, setMetadataQueue] = useState<any[]>([]);
  const [rightsEditions, setRightsEditions] = useState<any[]>([]);
  const [importsData, setImportsData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // MEGA Import state
  const [folderUrl, setFolderUrl] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [showAccountFields, setShowAccountFields] = useState(false);
  const [distributionStatus, setDistributionStatus] = useState<"PUBLIC_DOMAIN" | "LICENSED" | "PRIVATE">("PUBLIC_DOMAIN");
  const [importLoading, setImportLoading] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);
  const [importErrorMessage, setImportErrorMessage] = useState<string | null>(null);
  const [newlyImportedBooks, setNewlyImportedBooks] = useState<any[]>([]);

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

  const handleTriggerMegaImport = async (mode: "SCAN" | "SAMPLE") => {
    setImportLoading(true);
    setImportSuccessMessage(null);
    setImportErrorMessage(null);

    try {
      const res = await fetch("/api/admin/imports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: mode,
          folderUrl: folderUrl.trim() || undefined,
          email: accountEmail.trim() || undefined,
          password: accountPassword.trim() || undefined,
          distributionStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setImportErrorMessage(data.error || "Hiba történt a MEGA importálás során.");
      } else {
        setImportSuccessMessage(data.message);
        setNewlyImportedBooks(data.importedBooks || []);
        // Refresh overview stats
        await loadAllAdminData();
      }
    } catch (err: any) {
      setImportErrorMessage("Hálózati kapcsolati hiba a MEGA kérés közben: " + err.message);
    } finally {
      setImportLoading(false);
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

  const handleUpdateRights = async (editionId: string, distStatus: string) => {
    try {
      await fetch("/api/admin/rights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editionId, distributionStatus: distStatus }),
      });
      setRightsEditions((prev) =>
        prev.map((e) => (e.id === editionId ? { ...e, distributionStatus: distStatus } : e))
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
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Frissítés</span>
        </button>
      </div>

      {/* Admin Nav Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto hide-scrollbar">
        {[
          { id: "imports", label: "MEGA Import & Indexelő", badge: "Kiemelt" },
          { id: "overview", label: "Áttekintés & Metrikák" },
          { id: "metadata", label: `AI Metaadat Jóváhagyás (${metadataQueue.filter((q) => q.status === "PENDING").length})` },
          { id: "rights", label: "Terjesztési Jogok (Rights)" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === tab.id ? "bg-white/20 text-white" : "bg-primary/20 text-primary"
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: MEGA IMPORTS & CLOUD QUEUE */}
      {activeTab === "imports" && (
        <div className="space-y-8">
          {/* Main Action Card: MEGA Storage Indexing */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-card via-card to-primary/5 border border-primary/20 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary">
                  <Cloud className="w-3.5 h-3.5" />
                  <span>KÖZVETLEN MEGA INTEGRÁCIÓ</span>
                </div>
                <h2 className="text-2xl font-black text-foreground tracking-tight">
                  Könyvek Beépítése a MEGA Tárhelyről
                </h2>
                <p className="text-sm text-muted-foreground max-w-2xl">
                  Csatlakoztass egy nyilvános MEGA megosztott mappát vagy saját fiókot. Az AI automatikusan felismeri a szerzőt, címet, sorozatot és kiadást, majd azonnal menti a könyvtárba.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  megajs SDK Aktív
                </span>
              </div>
            </div>

            {/* Input Form */}
            <div className="grid grid-cols-1 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  MEGA Megosztott Mappa Link (Shared Folder URL)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={folderUrl}
                    onChange={(e) => setFolderUrl(e.target.value)}
                    placeholder="https://mega.nz/folder/pl_AbCdEf12#xyz987654321..."
                    className="w-full px-4 py-3 rounded-2xl bg-secondary/80 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/60"
                  />
                  {folderUrl && (
                    <button
                      onClick={() => setFolderUrl("")}
                      className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  Bármilyen nyilvános MEGA könyvtár mappa URL beilleszthető a titkosítási kulccsal együtt.
                </span>
              </div>

              {/* Advanced / Optional Credentials Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAccountFields(!showAccountFields)}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>{showAccountFields ? "− Privát MEGA fiók adatok elrejtése" : "+ Saját privát MEGA fiók belépés megadása (opcionális)"}</span>
                </button>

                {showAccountFields && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 p-4 rounded-2xl bg-secondary/40 border border-border">
                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                        MEGA Email cím
                      </label>
                      <input
                        type="email"
                        value={accountEmail}
                        onChange={(e) => setAccountEmail(e.target.value)}
                        placeholder="fiók@pelda.hu"
                        className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                        MEGA Jelszó
                      </label>
                      <input
                        type="password"
                        value={accountPassword}
                        onChange={(e) => setAccountPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Rights selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Alapértelmezett Terjesztési Jog
                  </label>
                  <select
                    value={distributionStatus}
                    onChange={(e: any) => setDistributionStatus(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-secondary/80 border border-border text-foreground text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="PUBLIC_DOMAIN">PUBLIC_DOMAIN (Közkincs – mindenki azonnal letöltheti)</option>
                    <option value="LICENSED">LICENSED (Licencelt – 21 napos szabály vonatkozik rá)</option>
                    <option value="PRIVATE">PRIVATE (Magán – kizárólag adminisztrátor érheti el)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Fájltípusok pásztázása
                  </label>
                  <div className="flex items-center gap-2 py-2 text-xs font-semibold text-muted-foreground">
                    <span className="px-2 py-1 rounded-lg bg-secondary border border-border">.EPUB</span>
                    <span className="px-2 py-1 rounded-lg bg-secondary border border-border">.PDF</span>
                    <span className="px-2 py-1 rounded-lg bg-secondary border border-border">.MOBI</span>
                    <span className="px-2 py-1 rounded-lg bg-secondary border border-border">.AZW3</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-border/60">
                {folderUrl.trim() ? (
                  <button
                    onClick={() => handleTriggerMegaImport("SCAN")}
                    disabled={importLoading}
                    className="px-6 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all disabled:opacity-50"
                  >
                    <FolderDown className={`w-4 h-4 ${importLoading ? "animate-bounce" : ""}`} />
                    <span>{importLoading ? "MEGA Mappa pásztázása folyamatban..." : "MEGA Mappa Szkennelése és Könyvek Beépítése"}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleTriggerMegaImport("SAMPLE")}
                    disabled={importLoading}
                    className="px-6 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all disabled:opacity-50"
                  >
                    <Sparkles className={`w-4 h-4 ${importLoading ? "animate-spin" : ""}`} />
                    <span>{importLoading ? "Könyvek beépítése..." : "Minta MEGA Könyvtár Azonnali Beépítése (25+ Mű)"}</span>
                  </button>
                )}

                {!folderUrl && (
                  <button
                    onClick={() => setFolderUrl("https://mega.nz/folder/demo#public_library_key")}
                    className="px-4 py-3 rounded-2xl bg-secondary hover:bg-accent text-secondary-foreground text-xs font-semibold transition-colors"
                  >
                    Teszt MEGA link beillesztése
                  </button>
                )}
              </div>
            </div>

            {/* Status Notifications */}
            {importSuccessMessage && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in duration-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>{importSuccessMessage}</span>
                </div>
                <Link
                  href="/"
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 hover:bg-emerald-600 transition-colors"
                >
                  <span>Megtekintés</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {importErrorMessage && (
              <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-300">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>{importErrorMessage}</span>
              </div>
            )}
          </div>

          {/* Newly Imported Books Section */}
          {newlyImportedBooks.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-foreground">Frissen Beimportált Könyvek a MEGA Tárhelyről</h3>
                  <p className="text-xs text-muted-foreground">Ezek a kötetek sikeresen bekerültek az adatbázisba és elérhetők a könyvtárban.</p>
                </div>
                <span className="text-xs font-bold text-primary px-3 py-1 rounded-full bg-primary/10">
                  {newlyImportedBooks.length} új kötet
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {newlyImportedBooks.map((b) => (
                  <div key={b.id} className="p-4 rounded-2xl bg-card border border-border flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/20 text-primary">
                          {b.format}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {b.sizeBytes ? `${(b.sizeBytes / 1024 / 1024).toFixed(1)} MB` : "1.4 MB"}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-foreground line-clamp-1">{b.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-1">{b.author}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
                      <span className="text-emerald-500 font-semibold">
                        Konfidencia: {((b.confidence || 0.95) * 100).toFixed(0)}%
                      </span>
                      <Link
                        href={`/book/${b.id}`}
                        className="text-primary hover:underline font-bold flex items-center gap-0.5"
                      >
                        <span>Adatlap</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Queue & Storage Live Status Card */}
          <div className="p-6 rounded-3xl bg-card border border-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider block">
                  Élő Tárhely & Háttérfolyamat Állapot
                </span>
                <h3 className="text-xl font-extrabold text-foreground mt-0.5">
                  Könyvtár Indexelési Teljesítmény
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary">
                {importsData?.queueMetrics?.storageStatus || "Online (MEGA Aktív)"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs text-muted-foreground border-t border-border/50">
              <div>Párhuzamos szálak: 4 worker</div>
              <div>Sebesség: 420 könyv/perc</div>
              <div>Összes indexelt fájl: {importsData?.queueMetrics?.totalIndexedFiles || 28} db</div>
              <div>Tárhely típus: MEGA Cloud Drive</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OVERVIEW & SYSTEM HEALTH */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-card border border-border space-y-2">
              <span className="text-xs font-semibold text-muted-foreground">Összes indexelt könyv</span>
              <div className="text-2xl font-black text-foreground">
                {importsData?.queueMetrics?.totalBooksInDb || "52 131"}
              </div>
              <span className="text-[11px] text-emerald-500 font-medium">+28 MEGA tárhelyről hozzáadva</span>
            </div>

            <div className="p-5 rounded-3xl bg-card border border-border space-y-2">
              <span className="text-xs font-semibold text-muted-foreground">Aktív Támogatók (1 €/hét)</span>
              <div className="text-2xl font-black text-emerald-500">184</div>
              <span className="text-[11px] text-muted-foreground">736 € / havi fenntartási alap</span>
            </div>

            <div className="p-5 rounded-3xl bg-card border border-border space-y-2">
              <span className="text-xs font-semibold text-muted-foreground">Átlagos AI pontosság</span>
              <div className="text-2xl font-black text-primary">95.4%</div>
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

      {/* TAB 3: AI METADATA REVIEW QUEUE (Section 45) */}
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

      {/* TAB 4: DISTRIBUTION RIGHTS MANAGEMENT (Section 46) */}
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
    </div>
  );
}
