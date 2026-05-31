"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [darkMode, setDarkMode] = useState(true);

  // Active filter category from URL
  const currentCategory = searchParams.get("category") || "";
  const currentSort = searchParams.get("sort") || "votes";

  const menuItems = [
    { name: "Dashboard", icon: "🏠", path: "/", active: pathname === "/" && !searchParams.get("filter_today") },
    { name: "Today's Launches", icon: "🚀", path: "/?filter_today=true", active: searchParams.get("filter_today") === "true" },
    { name: "Analytics", icon: "📊", path: "#" },
    { name: "Top Products", icon: "⭐", path: "/?sort=votes" },
    { name: "Categories", icon: "📁", path: "#" },
    { name: "Bookmarks", icon: "🔖", path: "#" },
    { name: "Compare", icon: "🔀", path: "#" },
    { name: "Trending", icon: "⚡", path: "/?sort=votes" },
    { name: "Newsletter", icon: "✉️", path: "#" },
    { name: "Settings", icon: "⚙️", path: "#" },
  ];

  const handleMenuClick = (item: typeof menuItems[0], e: React.MouseEvent) => {
    if (item.path === "#") {
      e.preventDefault();
      return;
    }
    router.push(item.path);
  };

  return (
    <aside className="w-64 border-r border-[#1a1f35] bg-[#0b0e1e] flex flex-col shrink-0 h-screen overflow-y-auto no-scrollbar py-6 px-4">
      {/* Brand Header Logo */}
      <Link href="/" className="flex items-center gap-3 px-2 mb-8">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/25">
          <span className="text-lg">🚀</span>
        </div>
        <div>
          <span className="text-lg font-black tracking-tight text-white">
            LaunchLens
          </span>
        </div>
      </Link>

      {/* Navigation Menu List */}
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => (
          <a
            key={item.name}
            href={item.path}
            onClick={(e) => handleMenuClick(item, e)}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 group cursor-pointer ${
              item.active
                ? "bg-gradient-to-r from-[#903bf5] to-[#6d28d9] text-white shadow-lg shadow-[#903bf5]/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`text-base transition-transform group-hover:scale-110 duration-200 ${item.active ? "opacity-100" : "opacity-60 group-hover:opacity-90"}`}>
                {item.icon}
              </span>
              <span>{item.name}</span>
            </div>
            {item.active && <span className="text-[10px] text-white">❯</span>}
          </a>
        ))}
      </nav>

      {/* Sidebar Pro Plan Card promotion */}
      <div className="mt-6 mb-6 p-4 rounded-2xl bg-gradient-to-b from-[#181236]/80 to-[#0e0c1f]/90 border border-[#312563] relative overflow-hidden text-center shadow-md select-none group">
        {/* Background glow flare */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#7c3aed]/10 rounded-full blur-2xl pointer-events-none" />
        
        {/* Graphic */}
        <div className="relative w-16 h-16 mx-auto mb-3 select-none flex items-center justify-center animate-pulse">
          <span className="text-4xl filter drop-shadow-[0_0_12px_rgba(139,92,246,0.5)]">🚀</span>
        </div>
        
        <h4 className="text-sm font-bold text-slate-100">Pro Plan</h4>
        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
          Unlock all features and get more insights.
        </p>
        
        <button className="mt-4 w-full py-2 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-rose-500 hover:opacity-95 shadow-md shadow-orange-500/20 active:translate-y-0 hover:-translate-y-0.5 transition-all cursor-pointer">
          Upgrade Now
        </button>
      </div>

      {/* Dark Mode Switcher Toggle */}
      <div className="pt-4 border-t border-[#1a1f35] flex items-center justify-between px-2 select-none">
        <div className="flex items-center gap-2.5 text-slate-400">
          <span className="text-base">🌙</span>
          <span className="text-xs font-bold uppercase tracking-wider">Dark Mode</span>
        </div>
        
        {/* Switch Slider */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`w-10 h-5.5 rounded-full p-0.5 transition-all duration-300 ${
            darkMode ? "bg-[#7c3aed]" : "bg-slate-800"
          } relative flex items-center cursor-pointer`}
        >
          <div
            className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transition-all duration-300 transform ${
              darkMode ? "translate-x-4.5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </aside>
  );
}
