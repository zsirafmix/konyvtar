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
  Users,
  User,
  Shield,
  Crown,
  Key,
  Sliders,
  Plus,
  Trash2,
  Save,
  Search,
  UploadCloud,
  FileUp,
  Image as ImageIcon,
} from "lucide-react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"users" | "imports" | "overview" | "metadata" | "rights">("users");
  const [metadataQueue, setMetadataQueue] = useState<any[]>([]);
  const [rightsEditions, setRightsEditions] = useState<any[]>([]);
  const [importsData, setImportsData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Users & Permissions state
  const [usersList, setUsersList] = useState<any[]>([]);
  const [activeUser, setActiveUser] = useState<any>(null);
  const [userSearch, setUserSearch] = useState("");
  const [userMessage, setUserMessage] = useState<string | null>(null);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "moderator" | "superuser" | "user">("user");
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [userSavingId, setUserSavingId] = useState<string | null>(null);

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

  // New Book Upload Modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadAuthor, setUploadAuthor] = useState("");
  const [uploadGenre, setUploadGenre] = useState("Sci-Fi");
  const [uploadYear, setUploadYear] = useState(new Date().getFullYear().toString());
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadCoverUrl, setUploadCoverUrl] = useState("");
  const [uploadCoverFile, setUploadCoverFile] = useState<File | null>(null);
  const [uploadBookFile, setUploadBookFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupSource, setLookupSource] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessBook, setUploadSuccessBook] = useState<any | null>(null);

  const lookupMetadata = async (filename?: string, titleToSearch?: string, authorToSearch?: string) => {
    const qTitle = titleToSearch !== undefined ? titleToSearch : uploadTitle;
    const qAuthor = authorToSearch !== undefined ? authorToSearch : uploadAuthor;
    const qFile = filename || (uploadBookFile ? uploadBookFile.name : "");
    if (!qFile && !qTitle) return;

    setLookupLoading(true);
    setLookupSource(null);
    try {
      const res = await fetch("/api/admin/lookup-book-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: qFile, title: qTitle, author: qAuthor }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.metadata) {
          const m = data.metadata;
          if (m.title) setUploadTitle(m.title);
          if (m.author && m.author !== "Ismeretlen szerző") setUploadAuthor(m.author);
          if (m.genre) setUploadGenre(m.genre);
          if (m.publishedYear) setUploadYear(m.publishedYear.toString());
          if (m.description) setUploadDescription(m.description);
          if (m.coverUrl) setUploadCoverUrl(m.coverUrl);
          setLookupSource(m.source || "Google Books");
        }
      }
    } catch (err) {
      console.warn("Metadata lookup error:", err);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleBookFileSelect = (file: File) => {
    setUploadBookFile(file);
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    let detectedAuthor = "";
    let detectedTitle = nameWithoutExt;

    if (nameWithoutExt.includes(" - ")) {
      const parts = nameWithoutExt.split(" - ");
      detectedAuthor = parts[0]?.trim() || "";
      detectedTitle = parts.slice(1).join(" - ").trim() || "";
    }

    if (detectedAuthor && !uploadAuthor) setUploadAuthor(detectedAuthor);
    if (detectedTitle && !uploadTitle) setUploadTitle(detectedTitle);

    // Automatically lookup metadata & cover
    lookupMetadata(file.name, detectedTitle || uploadTitle, detectedAuthor || uploadAuthor);
  };

  const handleResetUploadForm = () => {
    setUploadTitle("");
    setUploadAuthor("");
    setUploadGenre("Sci-Fi");
    setUploadYear(new Date().getFullYear().toString());
    setUploadDescription("");
    setUploadCoverUrl("");
    setUploadCoverFile(null);
    setUploadBookFile(null);
    setUploadError(null);
    setLookupLoading(false);
    setLookupSource(null);
    setUploadSuccessBook(null);
  };

  const handleSubmitUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      setUploadError("A könyv címének megadása kötelező.");
      return;
    }
    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("title", uploadTitle.trim());
      formData.append("author", uploadAuthor.trim() || "Ismeretlen szerző");
      formData.append("genre", uploadGenre);
      formData.append("publishedYear", uploadYear || new Date().getFullYear().toString());
      formData.append("description", uploadDescription.trim());
      if (uploadCoverUrl.trim()) {
        formData.append("coverUrl", uploadCoverUrl.trim());
      }
      if (uploadCoverFile) {
        formData.append("coverFile", uploadCoverFile);
      }
      if (uploadBookFile) {
        formData.append("bookFile", uploadBookFile);
      }

      const res = await fetch("/api/admin/upload-book", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Hiba történt a könyv feltöltése során.");
      } else {
        setUploadSuccessBook(data.book);
        setUserMessage(`A(z) „${uploadTitle}” sikeresen feltöltve a könyvtárba és a MEGA tárhelyre!`);
        await loadAllAdminData();
      }
    } catch (err: any) {
      setUploadError("Hálózati hiba a feltöltés során: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [metaRes, rightsRes, importsRes, usersRes] = await Promise.all([
        fetch("/api/admin/metadata"),
        fetch("/api/admin/rights"),
        fetch("/api/admin/imports"),
        fetch("/api/admin/users"),
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
      if (usersRes && usersRes.ok) {
        const uData = await usersRes.json();
        setUsersList(uData.users || []);
        setActiveUser(uData.activeUser || null);
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

  const handleUpdateUserRole = async (userId: string, role: string) => {
    setUserSavingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList((prev) => prev.map((u) => (u.id === userId ? data.user : u)));
        setUserMessage(data.message);
        setTimeout(() => setUserMessage(null), 4000);
      }
    } catch (err: any) {
      setUserMessage("Hiba a mentés során: " + err.message);
    } finally {
      setUserSavingId(null);
    }
  };

  const handleTogglePermission = async (userId: string, permKey: string, currentValue: boolean) => {
    setUserSavingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permissions: {
            [permKey]: !currentValue,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList((prev) => prev.map((u) => (u.id === userId ? data.user : u)));
        setUserMessage("Jogosultság azonnal módosítva!");
        setTimeout(() => setUserMessage(null), 3000);
      }
    } catch (err: any) {
      setUserMessage("Hiba a jogosultság mentésekor: " + err.message);
    } finally {
      setUserSavingId(null);
    }
  };

  const handleUpdateAiLimit = async (userId: string, limit: number) => {
    setUserSavingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permissions: {
            aiDailyLimit: limit,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList((prev) => prev.map((u) => (u.id === userId ? data.user : u)));
        setUserMessage("Napi AI limit frissítve!");
        setTimeout(() => setUserMessage(null), 3000);
      }
    } catch (err: any) {
      setUserMessage("Hiba: " + err.message);
    } finally {
      setUserSavingId(null);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserEmail.includes("@")) {
      setUserMessage("Kérlek adj meg egy érvényes email címet!");
      return;
    }
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName.trim() || newUserEmail.split("@")[0],
          email: newUserEmail.trim(),
          role: newUserRole,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList((prev) => [...prev, data.user]);
        setNewUserName("");
        setNewUserEmail("");
        setShowNewUserForm(false);
        setUserMessage(data.message);
        setTimeout(() => setUserMessage(null), 4000);
      }
    } catch (err: any) {
      setUserMessage("Hiba a létrehozáskor: " + err.message);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Biztosan törölni szeretnéd „${userName}” felhasználót?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        setUsersList((prev) => prev.filter((u) => u.id !== userId));
        setUserMessage("A felhasználó sikeresen törölve!");
        setTimeout(() => setUserMessage(null), 4000);
      } else {
        const err = await res.json();
        setUserMessage(err.error || "A felhasználó nem törölhető.");
      }
    } catch (err: any) {
      setUserMessage("Hiba a törléskor: " + err.message);
    }
  };

  const handleSwitchSession = async (userId: string) => {
    try {
      const res = await fetch("/api/auth/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId }),
      });
      if (res.ok) {
        const data = await res.json();
        setUserMessage(`Imperszonáció aktív: ${data.targetUser.displayName}. Átirányítás a főoldalra...`);
        setTimeout(() => {
          window.location.href = "/";
        }, 1200);
      } else {
        const err = await res.json();
        setUserMessage("Hiba: " + err.error);
      }
    } catch (err: any) {
      setUserMessage("Hiba az átváltáskor: " + err.message);
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

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              handleResetUploadForm();
              setShowUploadModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-2 transition-all shadow-md hover:shadow-emerald-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Új könyv feltöltése</span>
          </button>

          <button
            onClick={loadAllAdminData}
            className="px-3.5 py-2 rounded-xl bg-secondary hover:bg-accent text-secondary-foreground text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Frissítés</span>
          </button>
        </div>
      </div>

      {userMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-between animate-in fade-in">
          <span>{userMessage}</span>
          <button onClick={() => setUserMessage(null)} className="text-xs opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Admin Nav Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto hide-scrollbar">
        {[
          { id: "users", label: "Felhasználók és Jogosultságok", badge: `${usersList.length} fő` },
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

      {/* TAB 0: USERS & GRANULAR PERMISSIONS */}
      {activeTab === "users" && (
        <div className="space-y-8">
          {/* Top Role Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase">
                <Crown className="w-4 h-4" />
                <span>Adminisztrátorok</span>
              </div>
              <p className="text-2xl font-extrabold text-foreground">
                {usersList.filter((u) => u.role === "admin").length} fő
              </p>
              <p className="text-[11px] text-muted-foreground">Teljes rendszer- és jogkezelés</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-500 uppercase">
                <Shield className="w-4 h-4" />
                <span>Moderátorok</span>
              </div>
              <p className="text-2xl font-extrabold text-foreground">
                {usersList.filter((u) => u.role === "moderator").length} fő
              </p>
              <p className="text-[11px] text-muted-foreground">Tartalom- és klubmoderáció</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-emerald-500/30 bg-emerald-500/5 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase">
                <Sparkles className="w-4 h-4" />
                <span>1$ Superuserek</span>
              </div>
              <p className="text-2xl font-extrabold text-foreground">
                {usersList.filter((u) => u.role === "superuser").length} fő
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Befizetett 1$ támogatás ✓</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                <User className="w-4 h-4" />
                <span>Olvasók & Vendégek</span>
              </div>
              <p className="text-2xl font-extrabold text-foreground">
                {usersList.filter((u) => u.role === "user").length} fő
              </p>
              <p className="text-[11px] text-muted-foreground">Alapértelmezett olvasói jogok</p>
            </div>
          </div>

          {/* Active Testing User Banner */}
          {activeUser && (
            <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {activeUser.role === "admin" ? "👑" : activeUser.role === "superuser" ? "⭐" : activeUser.role === "moderator" ? "🛡️" : "📖"}
                </div>
                <div>
                  <span className="text-muted-foreground block">Jelenleg tesztelt aktív fiók:</span>
                  <span className="font-bold text-foreground text-sm">
                    {activeUser.name} ({activeUser.email}) — <span className="text-primary uppercase font-extrabold">{activeUser.role}</span>
                  </span>
                </div>
              </div>
              <span className="text-muted-foreground text-[11px]">
                Az alábbi felhasználóknál a „Tesztelés ezzel a fiókkal” gombbal azonnal válthatsz szerepkört.
              </span>
            </div>
          )}

          {/* Toolbar: Search + Add New User */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Felhasználó keresése név vagy e-mail alapján..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
            </div>

            <button
              onClick={() => setShowNewUserForm(!showNewUserForm)}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{showNewUserForm ? "Űrlap bezárása" : "Új felhasználó hozzáadása"}</span>
            </button>
          </div>

          {/* Create User Form Drawer */}
          {showNewUserForm && (
            <div className="p-6 rounded-3xl bg-card border border-primary/30 shadow-xl space-y-4 animate-in fade-in">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <span>Új felhasználó regisztrálása a rendszerbe</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Teljes név (pl. Minta János)"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="px-3 py-2 bg-secondary/50 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="email"
                  placeholder="E-mail cím (pl. janos@gmail.com)"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="px-3 py-2 bg-secondary/50 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="px-3 py-2 bg-secondary/50 border border-border rounded-xl text-xs text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  <option value="user">User (Normál Olvasó)</option>
                  <option value="superuser">Superuser (1$ Támogató)</option>
                  <option value="moderator">Moderator (Közösségi Moderátor)</option>
                  <option value="admin">Admin (Rendszergazda)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowNewUserForm(false)}
                  className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-accent cursor-pointer"
                >
                  Mégse
                </button>
                <button
                  onClick={handleCreateUser}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 cursor-pointer shadow-md"
                >
                  Felhasználó létrehozása
                </button>
              </div>
            </div>
          )}

          {/* User Cards with Detailed Permission Controls */}
          <div className="space-y-4">
            {usersList
              .filter((u) => {
                if (!userSearch.trim()) return true;
                const q = userSearch.toLowerCase();
                return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
              })
              .map((u) => {
                const isCurrentActive = activeUser?.id === u.id;
                const isSaving = userSavingId === u.id;

                return (
                  <div
                    key={u.id}
                    className={`p-5 rounded-3xl bg-card border transition-all space-y-4 ${
                      isCurrentActive
                        ? "border-primary shadow-lg ring-2 ring-primary/20"
                        : "border-border hover:border-border/80"
                    }`}
                  >
                    {/* User Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                          u.role === "admin"
                            ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                            : u.role === "moderator"
                            ? "bg-blue-500/20 text-blue-500 border border-blue-500/30"
                            : u.role === "superuser"
                            ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
                            : "bg-secondary text-foreground"
                        }`}>
                          {u.role === "admin" ? "👑" : u.role === "superuser" ? "⭐" : u.role === "moderator" ? "🛡️" : "📖"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-sm text-foreground">{u.name}</h4>
                            {isCurrentActive && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary/20 text-primary">
                                AKTÍV FIÓK
                              </span>
                            )}
                            {u.role === "superuser" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-500">
                                1$ TÁMOGATÓ
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{u.email} • ID: <span className="font-mono text-[10px]">{u.id}</span></p>
                        </div>
                      </div>

                      {/* Role Dropdown */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <label className="text-xs font-semibold text-muted-foreground">Szint:</label>
                        <select
                          value={u.role}
                          onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                          disabled={isSaving}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none cursor-pointer ${
                            u.role === "admin"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                              : u.role === "moderator"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                              : u.role === "superuser"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                              : "bg-secondary text-foreground border-border"
                          }`}
                        >
                          <option value="admin">👑 Adminisztrátor</option>
                          <option value="moderator">🛡️ Moderátor</option>
                          <option value="superuser">⭐ Superuser (1$ Támogató)</option>
                          <option value="user">📖 Olvasó (User)</option>
                        </select>
                      </div>
                    </div>

                    {/* Permissions Matrix for this User */}
                    <div className="bg-secondary/30 rounded-2xl p-4 border border-border/50 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <span>Külön beállítható jogok ezen felhasználónál:</span>
                        {isSaving && <span className="text-primary text-[10px] animate-pulse">Mentés folyamatban...</span>}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1">
                        {/* canDownload */}
                        <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer bg-card/70 p-2.5 rounded-xl border border-border/40 hover:border-border">
                          <input
                            type="checkbox"
                            checked={Boolean(u.permissions?.canDownload)}
                            onChange={() => handleTogglePermission(u.id, "canDownload", Boolean(u.permissions?.canDownload))}
                            className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                          />
                          <span>Fájl letöltés</span>
                        </label>

                        {/* canDirectDownload */}
                        <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer bg-card/70 p-2.5 rounded-xl border border-border/40 hover:border-border">
                          <input
                            type="checkbox"
                            checked={Boolean(u.permissions?.canDirectDownload)}
                            onChange={() => handleTogglePermission(u.id, "canDirectDownload", Boolean(u.permissions?.canDirectDownload))}
                            className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                          />
                          <span>Közvetlen letöltés</span>
                        </label>

                        {/* canUploadPrivate */}
                        <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer bg-card/70 p-2.5 rounded-xl border border-border/40 hover:border-border">
                          <input
                            type="checkbox"
                            checked={Boolean(u.permissions?.canUploadPrivate)}
                            onChange={() => handleTogglePermission(u.id, "canUploadPrivate", Boolean(u.permissions?.canUploadPrivate))}
                            className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                          />
                          <span>Privát könyvek</span>
                        </label>

                        {/* canModerate */}
                        <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer bg-card/70 p-2.5 rounded-xl border border-border/40 hover:border-border">
                          <input
                            type="checkbox"
                            checked={Boolean(u.permissions?.canModerate)}
                            onChange={() => handleTogglePermission(u.id, "canModerate", Boolean(u.permissions?.canModerate))}
                            className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                          />
                          <span>Moderáció</span>
                        </label>

                        {/* canAdmin */}
                        <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer bg-card/70 p-2.5 rounded-xl border border-border/40 hover:border-border">
                          <input
                            type="checkbox"
                            checked={Boolean(u.permissions?.canAdmin)}
                            onChange={() => handleTogglePermission(u.id, "canAdmin", Boolean(u.permissions?.canAdmin))}
                            className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                          />
                          <span>Admin pult</span>
                        </label>

                        {/* canUseChat */}
                        <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer bg-card/70 p-2.5 rounded-xl border border-border/40 hover:border-border">
                          <input
                            type="checkbox"
                            checked={Boolean(u.permissions?.canUseChat ?? true)}
                            onChange={() => handleTogglePermission(u.id, "canUseChat", Boolean(u.permissions?.canUseChat ?? true))}
                            className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                          />
                          <span>Chat olvasás</span>
                        </label>

                        {/* canSendChatMessages */}
                        <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer bg-card/70 p-2.5 rounded-xl border border-border/40 hover:border-border">
                          <input
                            type="checkbox"
                            checked={Boolean(u.permissions?.canSendChatMessages ?? true)}
                            onChange={() => handleTogglePermission(u.id, "canSendChatMessages", Boolean(u.permissions?.canSendChatMessages ?? true))}
                            className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                          />
                          <span>Üzenetküldés</span>
                        </label>

                        {/* canCreateChatRooms */}
                        <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer bg-card/70 p-2.5 rounded-xl border border-border/40 hover:border-border">
                          <input
                            type="checkbox"
                            checked={Boolean(u.permissions?.canCreateChatRooms)}
                            onChange={() => handleTogglePermission(u.id, "canCreateChatRooms", Boolean(u.permissions?.canCreateChatRooms))}
                            className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                          />
                          <span>Új szobák</span>
                        </label>

                        {/* canModerateChat */}
                        <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer bg-card/70 p-2.5 rounded-xl border border-border/40 hover:border-border">
                          <input
                            type="checkbox"
                            checked={Boolean(u.permissions?.canModerateChat)}
                            onChange={() => handleTogglePermission(u.id, "canModerateChat", Boolean(u.permissions?.canModerateChat))}
                            className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                          />
                          <span>Chat moderáció</span>
                        </label>
                      </div>

                      {/* AI Daily limit adjuster */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/40 text-xs">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="font-semibold text-foreground">Napi AI Könyvtáros kérdések kerete:</span>
                          <span className="font-bold text-primary px-2 py-0.5 rounded-md bg-primary/10">
                            {u.permissions?.aiDailyLimit || 20} kérdés / nap
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {[10, 50, 500, 1000, 9999].map((limitVal) => (
                            <button
                              key={limitVal}
                              onClick={() => handleUpdateAiLimit(u.id, limitVal)}
                              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                                (u.permissions?.aiDailyLimit || 20) === limitVal
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-card text-muted-foreground hover:text-foreground border border-border/40"
                              }`}
                            >
                              {limitVal === 9999 ? "Korlátlan" : limitVal}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="text-[11px] text-muted-foreground flex items-center gap-3">
                        <span>Könyvek olvasva: <b>{u.stats?.booksRead || 0}</b></span>
                        <span>Letöltések: <b>{u.stats?.downloadsCount || 0}</b></span>
                        {u.stats?.contributedUSD > 0 && (
                          <span className="text-emerald-500 font-bold">Támogatás: ${u.stats.contributedUSD}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!isCurrentActive && (
                          <button
                            onClick={() => handleSwitchSession(u.id)}
                            className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-accent text-secondary-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Key className="w-3.5 h-3.5 text-primary" />
                            <span>Tesztelés ezzel a fiókkal</span>
                          </button>
                        )}

                        {u.id !== "usr_admin_01" && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                            title="Felhasználó törlése"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

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
              <div>Összes indexelt fájl: {importsData?.queueMetrics?.totalIndexedFiles ? importsData.queueMetrics.totalIndexedFiles.toLocaleString("hu-HU") : "39 288"} db</div>
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
                {importsData?.queueMetrics?.totalBooksInDb ? importsData.queueMetrics.totalBooksInDb.toLocaleString("hu-HU") : "11 472"}
              </div>
              <span className="text-[11px] text-emerald-500 font-medium">11 472 Calibre kötet a MEGA tárhelyről indexelve</span>
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

      {/* Upload Book Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 my-8">
            {/* Close button */}
            <button
              onClick={() => {
                setShowUploadModal(false);
                handleResetUploadForm();
              }}
              className="absolute right-5 top-5 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
                <UploadCloud className="w-3.5 h-3.5" />
                <span>KÖZVETLEN MEGA FELHŐTÁR FELTÖLTÉS</span>
              </div>
              <h2 className="text-2xl font-black text-foreground tracking-tight">
                Új könyv feltöltése a könyvtárba
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Tölts fel egy e-könyv fájlt (EPUB, PDF, MOBI), és add meg a kötet adatait. A könyv azonnal megjelenik a főoldal „Újonnan feltöltött könyvek” polcán!
              </p>
            </div>

            {uploadError && (
              <div className="p-4 rounded-2xl bg-destructive/15 border border-destructive/30 text-xs sm:text-sm text-destructive font-medium">
                {uploadError}
              </div>
            )}

            {uploadSuccessBook ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 text-center space-y-4 animate-in fade-in">
                <div className="w-14 h-14 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center font-bold text-2xl shadow-lg">
                  ✓
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    Könyv sikeresen feltöltve és aktiválva!
                  </h3>
                  <p className="text-sm text-foreground font-semibold">
                    „{uploadSuccessBook.title}” — {uploadSuccessBook.author || "Ismeretlen"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    A kötet azonnal elérhető a könyvtárban, és a főoldalon a legfrissebb könyvek élén szerepel.
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <Link
                    href={`/book/${uploadSuccessBook.slug}`}
                    className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
                  >
                    Könyv adatlapjának megnyitása
                  </Link>
                  <Link
                    href="/"
                    className="px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-xs font-bold hover:bg-accent transition-colors"
                  >
                    Főoldal megtekintése
                  </Link>
                  <button
                    type="button"
                    onClick={handleResetUploadForm}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Másik könyv feltöltése
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitUpload} className="space-y-5">
                {/* File Dropzone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    E-könyv fájl kiválasztása (EPUB, PDF, MOBI, AZW3) *
                  </label>
                  <div className="border-2 border-dashed border-border rounded-2xl p-4 sm:p-6 text-center hover:border-primary/50 transition-colors bg-secondary/30 relative">
                    <input
                      type="file"
                      accept=".epub,.pdf,.mobi,.azw3,.prc"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleBookFileSelect(file);
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <FileUp className="w-8 h-8 text-primary mx-auto mb-2 opacity-80" />
                    {uploadBookFile ? (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-emerald-500">
                          Kiválasztva: {uploadBookFile.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {(uploadBookFile.size / (1024 * 1024)).toFixed(2)} MB • Kattints a cseréhez
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-foreground">
                          Húzd ide a fájlt, vagy kattints a tallózáshoz
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          A cím és a szerző automatikusan felismerésre kerül a fájlnévből
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Auto-lookup Status Banner */}
                {lookupLoading && (
                  <div className="flex items-center gap-2.5 text-xs text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/25 p-3 rounded-xl animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400 flex-shrink-0" />
                    <span>Könyvadatok és borító automatikus keresése (Google Books & Wikipédia)...</span>
                  </div>
                )}

                {lookupSource && !lookupLoading && (
                  <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Metaadatok és borító sikeresen betöltve forrásból: {lookupSource}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => lookupMetadata()}
                      className="text-[11px] text-emerald-300 underline hover:text-emerald-200 cursor-pointer"
                    >
                      Újra lekérés
                    </button>
                  </div>
                )}

                {/* Title & Author Inputs */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">Könyv címe *</label>
                      <input
                        type="text"
                        required
                        placeholder="Pl. Alapítvány és Birodalom"
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/60 border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">Szerző</label>
                      <input
                        type="text"
                        placeholder="Pl. Isaac Asimov"
                        value={uploadAuthor}
                        onChange={(e) => setUploadAuthor(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/60 border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {(uploadTitle || uploadAuthor) && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={lookupLoading}
                        onClick={() => lookupMetadata()}
                        className="text-[11px] font-semibold text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Metaadatok és borító automatikus keresése a beírt cím alapján</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Genre & Published Year */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Műfaj / Kategória</label>
                    <select
                      value={uploadGenre}
                      onChange={(e) => setUploadGenre(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/60 border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {[
                        "Sci-Fi",
                        "Fantasy",
                        "Krimi & Bűnügyi",
                        "Kalandregény",
                        "Magyar Irodalom",
                        "Horror & Thriller",
                        "Romantikus",
                        "Történelmi Regény",
                        "Humor & Szatíra",
                        "Világirodalom",
                        "Ifjúsági & Családi",
                        "Disztópia",
                        "Kiberpunk",
                        "Filozófia",
                        "Ismeretterjesztő & Tudomány",
                        "Általános",
                      ].map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Kiadás éve</label>
                    <input
                      type="number"
                      placeholder="2024"
                      value={uploadYear}
                      onChange={(e) => setUploadYear(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/60 border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Cover selection with preview */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground block">Borítókép</label>
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    {uploadCoverUrl && (
                      <div className="w-20 h-28 rounded-xl overflow-hidden border border-border/80 shadow-md bg-secondary/80 flex-shrink-0 relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={uploadCoverUrl}
                          alt="Borító előnézet"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1 text-[9px] text-center text-white font-medium">
                          Előnézet
                        </div>
                      </div>
                    )}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                      <div className="space-y-1">
                        <span className="text-[11px] text-muted-foreground block">Képfájl (.jpg, .png):</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              setUploadCoverFile(f);
                              const reader = new FileReader();
                              reader.onload = () => {
                                if (typeof reader.result === "string") {
                                  setUploadCoverUrl(reader.result);
                                }
                              };
                              reader.readAsDataURL(f);
                            }
                          }}
                          className="text-xs text-muted-foreground file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90 cursor-pointer w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[11px] text-muted-foreground block">Borító URL link:</span>
                        <input
                          type="url"
                          placeholder="https://books.google.com/..."
                          value={uploadCoverUrl}
                          onChange={(e) => setUploadCoverUrl(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-secondary/60 border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Leírás / Fülszöveg (opcionális)</label>
                  <textarea
                    rows={3}
                    placeholder="Rövid cselekmény-összefoglaló az olvasóknak..."
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/60 border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                {/* Submit button */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      handleResetUploadForm();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-xs font-bold hover:bg-accent transition-colors cursor-pointer"
                  >
                    Mégse
                  </button>

                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-2 transition-all shadow-lg hover:shadow-emerald-600/25 cursor-pointer disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Feltöltés a MEGA-ra...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        <span>Könyv mentése és közzététele</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
