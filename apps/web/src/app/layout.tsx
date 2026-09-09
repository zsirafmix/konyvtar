import type { Metadata } from "next";
import "@/styles/globals.css";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { Header } from "@/components/Header";
import { MobileNavbar } from "@/components/MobileNavbar";
import { ImpersonationBanner } from "@/components/auth/ImpersonationBanner";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Librarian AI – Intelligens Digitális Könyvtár",
  description: "Modern, AI-alapú digitális könyvtár, szemantikus kereső és közösségi olvasóplatform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  const userRole = user ? (user.role.toUpperCase() as any) : "USER";
  const isSupporter = user ? (user.membershipStatus === "SUPPORTER" || user.role === "admin" || user.role === "superuser") : false;

  return (
    <html lang="hu" className="dark">
      <body className="min-h-screen bg-background text-foreground flex flex-col antialiased">
        {/* Impersonation Banner if active */}
        {user?.isImpersonating && (
          <ImpersonationBanner
            displayName={user.displayName}
            adminName={user.realAdmin?.displayName}
          />
        )}

        <div className="flex flex-1 min-h-screen">
          {/* Left Desktop Sidebar (rendered when user exists or general browsing) */}
          {user && (
            <DesktopSidebar userRole={userRole} isSupporter={isSupporter} />
          )}

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
            {user && <Header />}
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        {user && <MobileNavbar />}
      </body>
    </html>
  );
}
