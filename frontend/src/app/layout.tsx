import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LaunchLens — Discover the Next Big Thing in Technology",
  description: "LaunchLens aggregates today's most innovative software creations, AI helpers, visual templates, and developer tooling. Upvote your favorite project launches!",
  keywords: ["tech launches", "product finder", "software", "AI assistants", "developer tools", "web design"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-[#060913] text-foreground flex overflow-hidden font-sans">
        
        {/* Left Sidebar Layout (Wrapped in Suspense for searchParams pre-render check) */}
        <Suspense fallback={<div className="w-64 bg-[#0b0e1e] border-r border-[#1a1f35]" />}>
          <Sidebar />
        </Suspense>
        
        {/* Right Dashboard Workspace Column */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Top Header Controls (Wrapped in Suspense for searchParams check) */}
          <Suspense fallback={<div className="h-16 bg-[#0b0e1e]/60 border-b border-[#1a1f35]" />}>
            <Header />
          </Suspense>
          
          {/* Page viewport */}
          <main className="flex-1 overflow-y-auto no-scrollbar bg-[#060913]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
