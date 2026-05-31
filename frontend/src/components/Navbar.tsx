"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "success" | "error">("idle");
  const [syncCount, setSyncCount] = useState<number | null>(null);

  // Read active search query from URL parameters
  const currentSearch = searchParams.get("search") || "";
  const [searchInput, setSearchInput] = useState(currentSearch);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchInput.trim()) {
      params.set("search", searchInput.trim());
    } else {
      params.delete("search");
    }
    router.push(`/?${params.toString()}`);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    router.push(`/?${params.toString()}`);
  };

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncStatus("idle");
    
    try {
      // Connect to our FastAPI backend manual sync endpoint
      const response = await fetch("http://localhost:8000/api/sync", {
        method: "POST",
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSyncStatus("success");
        setSyncCount(data.added_count);
        // Refresh page to show newly synced products
        router.refresh();
        // Clear success message after 4 seconds
        setTimeout(() => setSyncStatus("idle"), 4000);
      } else {
        setSyncStatus("error");
        setTimeout(() => setSyncStatus("idle"), 4000);
      }
    } catch (error) {
      console.error("Sync error:", error);
      setSyncStatus("error");
      setTimeout(() => setSyncStatus("idle"), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full glassmorphic border-b border-card-border backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-indigo to-accent-cyan flex items-center justify-center text-white shadow-md shadow-accent-indigo/20 group-hover:scale-105 transition-transform duration-200">
            <span className="text-xl font-bold">🚀</span>
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-200 via-indigo-400 to-cyan-300 bg-clip-text text-transparent group-hover:opacity-95 transition-opacity">
              LaunchPulse
            </span>
            <span className="block text-[10px] text-text-muted font-medium uppercase tracking-wider">
              Innovation Tracker
            </span>
          </div>
        </Link>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search products, taglines, or tools..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-slate-900/50 hover:bg-slate-900/80 focus:bg-slate-950 border border-slate-800 focus:border-accent-indigo rounded-xl px-4 py-2 text-sm text-foreground placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accent-indigo transition-all duration-200"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-500 hover:text-foreground text-xs"
            >
              ✕
            </button>
          )}
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-accent-cyan transition-colors"
          >
            🔍
          </button>
        </form>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Status Message */}
          {syncStatus === "success" && (
            <span className="text-[12px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-3 py-1.5 rounded-lg animate-fade-in flex items-center gap-1.5">
              ✅ Synced {syncCount} products!
            </span>
          )}
          {syncStatus === "error" && (
            <span className="text-[12px] text-rose-400 bg-rose-950/40 border border-rose-900/50 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              ❌ Sync Failed
            </span>
          )}

          {/* Sync Button */}
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border transition-all duration-300 ${
              isSyncing
                ? "bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-gradient-to-r from-accent-indigo to-accent-indigo/90 border-accent-indigo/40 hover:border-accent-indigo text-white hover:shadow-lg hover:shadow-accent-indigo/20 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            }`}
          >
            {isSyncing ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-slate-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Syncing...
              </>
            ) : (
              <>
                <span>🔄</span>
                <span>Sync Launches</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
