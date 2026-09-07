"use client";

import React, { useState } from "react";
import { Settings, Shield, Bell, Eye, Key, Save, Check } from "lucide-react";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  // Settings states (Section 54 Privacy requirements)
  const [isLibraryPublic, setIsLibraryPublic] = useState(false);
  const [isReadingHistoryPublic, setIsReadingHistoryPublic] = useState(true);
  const [isRatingsPublic, setIsRatingsPublic] = useState(true);
  const [isFavoritesPublic, setIsFavoritesPublic] = useState(true);
  const [isSupporterBadgeVisible, setIsSupporterBadgeVisible] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [newBookAlerts, setNewBookAlerts] = useState(true);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 space-y-8 pb-24">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Beállítások</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Adatvédelem, értesítések és fiók testreszabása.
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-500" />
          <span>A beállításaid sikeresen elmentve!</span>
        </div>
      )}

      {/* ADATVÉDELEM (PRIVACY - SECTION 54) */}
      <section className="p-6 rounded-3xl bg-card border border-border space-y-4">
        <div className="flex items-center gap-2 text-foreground font-bold text-base">
          <Eye className="w-5 h-5 text-primary" />
          <h2>Adatvédelem és Láthatóság</h2>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          A privát könyvtárad alapértelmezetten el van zárva mások elől. Itt határozhatod meg, hogy a nyilvános profilodon mi jelenjen meg.
        </p>

        <div className="space-y-3 pt-2 divide-y divide-border text-xs">
          <div className="flex items-center justify-between py-2">
            <div>
              <span className="font-bold text-foreground block">Könyvtár tartalma nyilvános</span>
              <span className="text-muted-foreground text-[11px]">Mások láthatják-e a feltöltött könyveid listáját</span>
            </div>
            <input
              type="checkbox"
              checked={isLibraryPublic}
              onChange={(e) => setIsLibraryPublic(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <span className="font-bold text-foreground block">Olvasási előzmények megjelenítése</span>
              <span className="text-muted-foreground text-[11px]">Befejezett és épp olvasott kötetek</span>
            </div>
            <input
              type="checkbox"
              checked={isReadingHistoryPublic}
              onChange={(e) => setIsReadingHistoryPublic(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <span className="font-bold text-foreground block">Csillagértékelések és vélemények</span>
              <span className="text-muted-foreground text-[11px]">1–5 csillagos értékeléseid és szöveges kritikáid</span>
            </div>
            <input
              type="checkbox"
              checked={isRatingsPublic}
              onChange={(e) => setIsRatingsPublic(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <span className="font-bold text-foreground block">Kedvenc könyvek listája</span>
              <span className="text-muted-foreground text-[11px]">A szívvel megjelölt legkedvesebb műveid</span>
            </div>
            <input
              type="checkbox"
              checked={isFavoritesPublic}
              onChange={(e) => setIsFavoritesPublic(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <span className="font-bold text-foreground block">Supporting Member kitűző láthatósága</span>
              <span className="text-muted-foreground text-[11px]">Támogatói jelvény megjelenítése a profilodon</span>
            </div>
            <input
              type="checkbox"
              checked={isSupporterBadgeVisible}
              onChange={(e) => setIsSupporterBadgeVisible(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
            />
          </div>
        </div>
      </section>

      {/* ÉRTESÍTÉSEK (SECTION 48 & 49) */}
      <section className="p-6 rounded-3xl bg-card border border-border space-y-4">
        <div className="flex items-center gap-2 text-foreground font-bold text-base">
          <Bell className="w-5 h-5 text-primary" />
          <h2>Értesítések</h2>
        </div>

        <div className="space-y-3 pt-1 divide-y divide-border text-xs">
          <div className="flex items-center justify-between py-2">
            <div>
              <span className="font-bold text-foreground block">„Új könyv” értesítések</span>
              <span className="text-muted-foreground text-[11px]">Értesítés, ha egy követett szerzőtől vagy sorozatból új jogszerű könyv kerül a könyvtárba</span>
            </div>
            <input
              type="checkbox"
              checked={newBookAlerts}
              onChange={(e) => setNewBookAlerts(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <span className="font-bold text-foreground block">Heti e-mail összefoglaló</span>
              <span className="text-muted-foreground text-[11px]">Közösségi aktivitások és friss könyvklub témák</span>
            </div>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
            />
          </div>
        </div>
      </section>

      {/* SAVE BUTTON */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md"
        >
          <Save className="w-4 h-4" />
          <span>Beállítások mentése</span>
        </button>
      </div>
    </div>
  );
}
