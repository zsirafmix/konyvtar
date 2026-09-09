"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Award,
  Check,
  Sparkles,
  ShieldCheck,
  CreditCard,
  QrCode,
  Lock,
  ArrowRight,
  Zap,
  CheckCircle2,
  Crown,
  Shield,
  HelpCircle,
} from "lucide-react";

export default function SupporterPage() {
  const [provider, setProvider] = useState<"paypal" | "revolut">("paypal");
  const [processing, setProcessing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [orderIdInput, setOrderIdInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");

  React.useEffect(() => {
    async function loadAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user?.email) {
            setUserEmail(data.user.email);
          }
          if (data.user?.role === "superuser" || data.user?.membershipStatus === "SUPPORTER") {
            setSubscribed(true);
          }
        }
      } catch {}
    }
    loadAuth();
  }, []);

  const handlePayPalPayment = async () => {
    setProcessing(true);
    setErrorMessage(null);

    // Generate or use user-provided order ID
    const orderIdToVerify = orderIdInput.trim() || `PP-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;

    try {
      const res = await fetch("/api/payments/paypal/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderIdToVerify,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubscribed(true);
        setSuccessMessage(data.message || "Sikeres fizetés! A fiókod mostantól Superuser rangú.");
      } else {
        setErrorMessage(data.error || "A fizetés hitelesítése sikertelen.");
      }
    } catch (err: any) {
      setErrorMessage("Hálózati hiba: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleRevolutPayment = async () => {
    setProcessing(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/payments/revolut", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm_transfer",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubscribed(true);
        setSuccessMessage(data.message || "Sikeres Revolut fizetés! A fiókod mostantól Superuser rangú.");
      } else {
        setErrorMessage(data.error || "A fizetés feldolgozása sikertelen.");
      }
    } catch (err: any) {
      setErrorMessage("Hiba: " + err.message);
    } finally {
      setProcessing(false);
    }
  };


  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-12 pb-24">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <Award className="w-4 h-4 text-emerald-500" />
          <span>SUPERUSER • 1$ TÁMOGATÓI TAGSÁG</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight">
          Csatlakozz a könyvtár Superuser közösségéhez
        </h1>
        <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Mindössze egyetlen szimbolikus <span className="text-foreground font-bold">1 dolláros (1 USD)</span> hozzájárulással örökös Superuser rangot kapsz: azonnali korlátlan letöltéssel és maximális AI kapacitással.
        </p>
      </div>

      {/* Success Notification */}
      {subscribed && (
        <div className="p-6 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/40 text-center space-y-3 animate-in fade-in zoom-in-95">
          <div className="w-12 h-12 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center font-bold text-xl shadow-lg">
            ✓
          </div>
          <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
            Köszönjük! A fiókod mostantól hivatalosan SUPERUSER!
          </h3>
          <p className="text-xs sm:text-sm text-foreground max-w-md mx-auto">
            {successMessage}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              href="/discover"
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 shadow-sm"
            >
              Katalógus böngészése (11 472 könyv)
            </Link>
            <Link
              href="/admin"
              className="px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-bold text-xs hover:bg-accent"
            >
              Adminisztrációs pult megnyitása
            </Link>
          </div>
        </div>
      )}

      {/* Main Payment Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Col: Superuser Benefits */}
        <div className="md:col-span-7 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border space-y-6 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Sparkles className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-foreground">Mit kapsz a szimbolikus 1 $-ért?</h3>
                <p className="text-xs text-muted-foreground">Minden funkció azonnal, korlátozások nélkül aktiválódik.</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  title: "Azonnali, korlátlan letöltés (EPUB, MOBI, PDF)",
                  desc: "Nincs 21 napos várakozási idő vagy letöltési sorbanállás. Bármely kötet másodpercek alatt az olvasódon van.",
                },
                {
                  title: "Korlátlan AI Könyvtáros és RAG keresés",
                  desc: "Napi 1000+ részletes szemantikus elemzés, cselekmény-összefoglaló és egyedi stílusajánlás.",
                },
                {
                  title: "Saját privát felhőtár kezelése",
                  desc: "Feltöltheted saját digitális könyveidet, és közvetlenül szinkronizálhatod a MEGA felhőtárral.",
                },
                {
                  title: "Kiemelt Superuser Kitűző a profilon",
                  desc: "Arany/Smaragd támogatói kitűző a közösségi listákban és a könyvklubokban.",
                },
                {
                  title: "Örökös hozzáférés",
                  desc: "Nincs havonta ismétlődő kötelező levonás, a Superuser státusz azonnal rögzítésre kerül a fiókodban.",
                },
              ].map((b, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-foreground">{b.title}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Privacy note */}
            <div className="p-4 rounded-2xl bg-secondary/40 border border-border text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <Lock className="w-3.5 h-3.5 text-primary" />
                <span>100% Anonim & Védett Tranzakció</span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                A rendszer úgy van beállítva, hogy a PayPal és Revolut felületen kizárólag a <b>Librarian AI Digitális Könyvtár</b> márkanév jelenik meg. A magánszemély neve és privát e-mail címe teljesen rejtve marad a támogatók előtt.
              </p>
            </div>
          </div>
        </div>

        {/* Right Col: Checkout Box */}
        <div className="md:col-span-5 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-card to-secondary/30 border-2 border-emerald-500/30 shadow-2xl space-y-6">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-4xl font-extrabold text-foreground">1 $</span>
                <span className="text-xs font-semibold text-muted-foreground ml-1.5">(egyszeri 1 USD)</span>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-500">
                SUPERUSER RANG
              </span>
            </div>

            {/* Email input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">A fiókod e-mail címe:</label>
              <input
                type="email"
                placeholder="pelda@gmail.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-[10px] text-muted-foreground">Erre az e-mailre kerül aktiválásra a Superuser rang.</p>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">Válassz fizetési módot:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProvider("paypal")}
                  className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    provider === "paypal"
                      ? "border-emerald-500 bg-emerald-500/10 text-foreground ring-1 ring-emerald-500"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  <span>PayPal (1 $)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider("revolut")}
                  className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    provider === "revolut"
                      ? "border-emerald-500 bg-emerald-500/10 text-foreground ring-1 ring-emerald-500"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Zap className="w-4 h-4 text-purple-500" />
                  <span>Revolut Pay (1 $)</span>
                </button>
              </div>
            </div>

            {/* Provider specific action button */}
            {provider === "paypal" ? (
              <div className="space-y-3">
                <button
                  onClick={handlePayPalPayment}
                  disabled={processing}
                  className="w-full py-3.5 rounded-2xl bg-[#0070BA] hover:bg-[#005ea6] text-white font-extrabold text-sm transition-all shadow-lg hover:shadow-[#0070BA]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{processing ? "Feldolgozás..." : "Fizetés PayPal-lal (1 USD)"}</span>
                </button>
                <p className="text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Bankkártyás fizetés PayPal fiók nélkül is lehetséges</span>
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleRevolutPayment}
                  disabled={processing}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm transition-all shadow-lg hover:shadow-purple-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>{processing ? "Feldolgozás..." : "Fizetés Revolut Pay-jel (1 USD)"}</span>
                </button>
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-600 dark:text-purple-300 flex items-center justify-between">
                  <span>Revolut Revtag: <b>@librarian_ai</b></span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-[10px] font-bold">Előkészítve</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Role Breakdown Table */}
      <div className="pt-8 space-y-6">
        <h2 className="text-2xl font-extrabold text-center text-foreground">
          Látogatói és Felhasználói Szintek Összehasonlítása
        </h2>

        <div className="overflow-x-auto rounded-3xl border border-border bg-card">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/30 text-muted-foreground uppercase tracking-wider text-[11px]">
                <th className="py-4 px-5 font-bold">Funkció / Jogosultság</th>
                <th className="py-4 px-4 font-bold text-center">User (Látogató)</th>
                <th className="py-4 px-4 font-bold text-center text-emerald-500">Superuser (1$)</th>
                <th className="py-4 px-4 font-bold text-center text-blue-500">Moderátor</th>
                <th className="py-4 px-4 font-bold text-center text-amber-500">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-3.5 px-5 font-medium text-foreground">Könyvtár böngészése (11 472 könyv, 22 műfaj)</td>
                <td className="py-3.5 px-4 text-center text-emerald-500 font-bold">Igen ✓</td>
                <td className="py-3.5 px-4 text-center text-emerald-500 font-bold">Igen ✓</td>
                <td className="py-3.5 px-4 text-center text-emerald-500 font-bold">Igen ✓</td>
                <td className="py-3.5 px-4 text-center text-emerald-500 font-bold">Igen ✓</td>
              </tr>
              <tr>
                <td className="py-3.5 px-5 font-medium text-foreground">Könyvletöltés (EPUB, MOBI, PDF)</td>
                <td className="py-3.5 px-4 text-center text-muted-foreground">Alap sebesség</td>
                <td className="py-3.5 px-4 text-center text-emerald-500 font-bold">Azonnali közvetlen ✓</td>
                <td className="py-3.5 px-4 text-center text-emerald-500 font-bold">Azonnali közvetlen ✓</td>
                <td className="py-3.5 px-4 text-center text-emerald-500 font-bold">Azonnali közvetlen ✓</td>
              </tr>
              <tr>
                <td className="py-3.5 px-5 font-medium text-foreground">AI Könyvtáros napi kérdéskeret</td>
                <td className="py-3.5 px-4 text-center text-muted-foreground">20 kérdés / nap</td>
                <td className="py-3.5 px-4 text-center text-emerald-500 font-bold">1 000 kérdés / nap</td>
                <td className="py-3.5 px-4 text-center text-blue-500 font-bold">500 kérdés / nap</td>
                <td className="py-3.5 px-4 text-center text-amber-500 font-bold">Korlátlan (9999)</td>
              </tr>
              <tr>
                <td className="py-3.5 px-5 font-medium text-foreground">Saját privát könyvek és MEGA szinkron</td>
                <td className="py-3.5 px-4 text-center text-muted-foreground">–</td>
                <td className="py-3.5 px-4 text-center text-emerald-500 font-bold">Elérhető ✓</td>
                <td className="py-3.5 px-4 text-center text-emerald-500 font-bold">Elérhető ✓</td>
                <td className="py-3.5 px-4 text-center text-emerald-500 font-bold">Elérhető ✓</td>
              </tr>
              <tr>
                <td className="py-3.5 px-5 font-medium text-foreground">Tartalom- és könyvklub moderálás</td>
                <td className="py-3.5 px-4 text-center text-muted-foreground">–</td>
                <td className="py-3.5 px-4 text-center text-muted-foreground">–</td>
                <td className="py-3.5 px-4 text-center text-blue-500 font-bold">Engedélyezve ✓</td>
                <td className="py-3.5 px-4 text-center text-amber-500 font-bold">Engedélyezve ✓</td>
              </tr>
              <tr>
                <td className="py-3.5 px-5 font-medium text-foreground">Rendszergazda pult és felhasználói jogok kezelése</td>
                <td className="py-3.5 px-4 text-center text-muted-foreground">–</td>
                <td className="py-3.5 px-4 text-center text-muted-foreground">–</td>
                <td className="py-3.5 px-4 text-center text-muted-foreground">–</td>
                <td className="py-3.5 px-4 text-center text-amber-500 font-bold">Teljes kontroll 👑</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

