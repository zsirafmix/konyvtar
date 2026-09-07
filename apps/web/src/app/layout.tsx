import type { Metadata } from "next";
import "@/styles/globals.css";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { Header } from "@/components/Header";
import { MobileNavbar } from "@/components/MobileNavbar";

export const metadata: Metadata = {
  title: "Librarian AI – Intelligens Digitális Könyvtár",
  description: "Modern, AI-alapú digitális könyvtár, szemantikus kereső és közösségi olvasóplatform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hu" className="dark">
      <body className="min-h-screen bg-background text-foreground flex antialiased">
        {/* Left Desktop Sidebar */}
        <DesktopSidebar userRole="ADMIN" isSupporter={true} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
          <Header />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileNavbar />
      </body>
    </html>
  );
}
