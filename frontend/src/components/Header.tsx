"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read search term from URL
  const currentSearch = searchParams.get("search") || "";
  const [searchInput, setSearchInput] = useState(currentSearch);

  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

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

  return (
    <header className="h-16 border-b border-[#1a1f35] bg-[#0b0e1e]/60 backdrop-blur-md px-6 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-40 select-none">
      
      {/* Top Search Input Box */}
      <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
          🔍
        </span>
        <input
          type="text"
          placeholder="Search products, categories, or keywords..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full bg-[#11162d]/70 hover:bg-[#11162d]/90 focus:bg-[#11162d] border border-[#1a1f35] focus:border-[#7c3aed]/50 rounded-xl pl-10 pr-16 py-2 text-xs text-foreground placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#7c3aed]/40 transition-all duration-200"
        />
        {searchInput && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-12 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 text-[10px] cursor-pointer"
          >
            ✕
          </button>
        )}
        {/* Keyboard shortcut prompt */}
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 border border-[#1a1f35] bg-[#0b0e1e] text-[9px] font-bold text-slate-500 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 pointer-events-none select-none">
          <span>⌘</span>
          <span>K</span>
        </span>
      </form>

      {/* Profile & Notification Center */}
      <div className="flex items-center gap-4 shrink-0">
        
        {/* Notification Bell */}
        <button className="relative w-10 h-10 rounded-xl bg-[#11162d]/75 border border-[#1a1f35] flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-[#11162d] transition-all cursor-pointer">
          <span className="text-lg">🔔</span>
          {/* Unread dot badge */}
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 border border-[#11162d] shadow-sm animate-ping" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 border border-[#11162d] shadow-sm" />
        </button>

        {/* Profile Details Stack */}
        <div className="flex items-center gap-3">
          {/* Avatar Icon */}
          <div className="w-10 h-10 rounded-xl border border-[#1a1f35] overflow-hidden bg-slate-900 select-none">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
              alt="Arjun Developer Profile Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Stack Info */}
          <div className="hidden sm:block text-left select-none">
            <span className="block text-xs font-bold text-slate-200 leading-tight">
              Hey, Arjun
            </span>
            <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
              Developer
            </span>
          </div>
        </div>

      </div>
    </header>
  );
}
