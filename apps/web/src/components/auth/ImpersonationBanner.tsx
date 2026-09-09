"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, LogOut } from "lucide-react";

interface ImpersonationBannerProps {
  displayName: string;
  adminName?: string;
}

export const ImpersonationBanner: React.FC<ImpersonationBannerProps> = ({
  displayName,
  adminName = "Főadminisztrátor",
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStopImpersonation = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/impersonate", {
        method: "DELETE",
      });
      if (res.ok) {
        window.location.href = "/admin";
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error("Nem sikerült leállítani az imperszonációt:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-md sticky top-0 z-50 animate-fadeIn">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-900 shrink-0 animate-bounce" />
        <span>
          <strong>FIGYELEM: Imperszonációs tesztmód aktív!</strong> Jelenleg a(z){" "}
          <span className="underline decoration-2 font-bold">{displayName}</span> fiók nevében jársz el
          (Eredeti fiók: {adminName}).
        </span>
      </div>

      <button
        onClick={handleStopImpersonation}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber-950 text-amber-100 hover:bg-black transition-colors shrink-0 text-xs font-bold cursor-pointer disabled:opacity-50"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>{loading ? "Visszatérés..." : "Visszatérés az Admin fiókhoz"}</span>
      </button>
    </div>
  );
};
