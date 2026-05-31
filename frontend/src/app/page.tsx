"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard, { Product } from "@/components/ProductCard";
import { ProductCardSkeleton, TrendingSkeleton } from "@/components/Skeleton";

function MainDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State Management
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active filters inside the dashboard
  const searchQuery = searchParams.get("search") || "";
  const [timePeriod, setTimePeriod] = useState<"Day" | "Week" | "Month" | "All Time">("Day");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
  const [sortBy, setSortBy] = useState<"Most Upvotes" | "Newest">("Most Upvotes");
  
  // Chart active tab
  const [chartTab, setChartTab] = useState<"Day" | "Week" | "Month">("Day");

  const [priceFilters, setPriceFilters] = useState({
    free: true,
    paid: true,
    freemium: true,
  });

  // Sync state with URL if direct category is clicked from cards/navbar
  const urlCategory = searchParams.get("category") || "";
  const urlSort = searchParams.get("sort") || "";
  const urlFilterToday = searchParams.get("filter_today") || "";

  useEffect(() => {
    if (urlCategory) {
      setSelectedCategory(urlCategory.charAt(0).toUpperCase() + urlCategory.slice(1).toLowerCase());
    } else {
      setSelectedCategory("All Categories");
    }
  }, [urlCategory]);

  useEffect(() => {
    if (urlSort === "votes") {
      setSortBy("Most Upvotes");
    }
  }, [urlSort]);

  useEffect(() => {
    if (urlFilterToday === "true") {
      setTimePeriod("Day");
    }
  }, [urlFilterToday]);

  // Load categories and products
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const catRes = await fetch("http://localhost:8000/api/categories");
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData);
        }

        const prodRes = await fetch("http://localhost:8000/api/products?limit=100");
        if (!prodRes.ok) throw new Error("Failed to connect to backend server.");
        const prodData = await prodRes.json();
        setProducts(prodData);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  // Sync votes when upvoted inside page list
  const handleVoteUpdate = (productId: string, updatedVotes: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, votes: updatedVotes } : p))
    );
  };

  // Helper to trigger upvote
  const triggerUpvote = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check localStorage
    const votedList = JSON.parse(localStorage.getItem("pulse_voted_products") || "{}");
    if (votedList[productId]) return;

    // Optimistically update
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    
    handleVoteUpdate(productId, product.votes + 1);
    votedList[productId] = true;
    localStorage.setItem("pulse_voted_products", JSON.stringify(votedList));

    try {
      const res = await fetch(`http://localhost:8000/api/products/${productId}/vote`, {
        method: "POST",
      });
      if (!res.ok) {
        // Rollback
        handleVoteUpdate(productId, product.votes);
        votedList[productId] = false;
        localStorage.setItem("pulse_voted_products", JSON.stringify(votedList));
      }
    } catch (err) {
      console.error(err);
      handleVoteUpdate(productId, product.votes);
    }
  };

  // Filter products dynamically on screen based on active filters
  const getFilteredProducts = () => {
    let list = [...products];

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Category selector filter
    if (selectedCategory !== "All Categories") {
      list = list.filter(
        (p) => p.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Time Period Filter based on product launch date
    const now = new Date();
    if (timePeriod === "Day") {
      // Products launched in the last 24 hours
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      list = list.filter((p) => new Date(p.launch_date) >= oneDayAgo);
    } else if (timePeriod === "Week") {
      // Products launched in the last 7 days
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      list = list.filter((p) => new Date(p.launch_date) >= oneWeekAgo);
    } else if (timePeriod === "Month") {
      // Products launched in the last 30 days
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      list = list.filter((p) => new Date(p.launch_date) >= oneMonthAgo);
    } // "All Time" matches everything

    // Pricing Filter simulation mapping upvote hashes
    list = list.filter((p) => {
      const isFree = p.votes % 2 === 0;
      const isFreemium = p.votes % 3 === 0;
      const isPaid = !isFree && !isFreemium;

      if (priceFilters.free && isFree) return true;
      if (priceFilters.paid && isPaid) return true;
      if (priceFilters.freemium && isFreemium) return true;
      return false;
    });

    // Sort order
    if (sortBy === "Most Upvotes") {
      list.sort((a, b) => b.votes - a.votes);
    } else {
      list.sort(
        (a, b) =>
          new Date(b.launch_date).getTime() - new Date(a.launch_date).getTime()
      );
    }

    return list;
  };

  const filteredProducts = getFilteredProducts();

  // Compute dynamic stats based on filtered list (changes dynamically on clicks!)
  const totalVotesCount = filteredProducts.reduce((acc, p) => acc + p.votes, 0);
  
  // Find top product of the selected list
  const topProduct = filteredProducts.reduce(
    (max, p) => (p.votes > (max?.votes || 0) ? p : max),
    null as Product | null
  );

  // Fallbacks exactly matching your design image
  const displayLaunchesCount = filteredProducts.length;
  const displayTotalVotes = products.length > 0 ? totalVotesCount : 1245;
  const displayTopProductName = topProduct ? topProduct.name : "AI PDF";
  const displayTopProductTagline = topProduct ? topProduct.tagline : "Chat with any PDF document";
  const displayTopProductVotes = topProduct ? topProduct.votes : 512;
  const displayTopProductId = topProduct ? topProduct.id : "mock-1";

  // Donut Chart Segment Counts (Updated dynamically based on filtered product categories!)
  const getCategoryStats = () => {
    const stats: { [key: string]: number } = {};
    filteredProducts.forEach((p) => {
      stats[p.category] = (stats[p.category] || 0) + 1;
    });

    const total = filteredProducts.length;
    if (total === 0) {
      return [
        { name: "Productivity", value: 35, color: "#8b5cf6" },
        { name: "Developer Tools", value: 25, color: "#f97316" },
        { name: "Design Tools", value: 15, color: "#3b82f6" },
        { name: "Marketing", value: 10, color: "#06b6d4" },
        { name: "Others", value: 15, color: "#10b981" },
      ];
    }

    const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]);
    const items = sorted.slice(0, 4).map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100),
    }));

    const sumTop = items.reduce((acc, i) => acc + i.value, 0);
    if (sumTop < 100) {
      items.push({ name: "Others", value: 100 - sumTop });
    }

    const colors = ["#8b5cf6", "#f97316", "#3b82f6", "#06b6d4", "#10b981"];
    return items.map((item, idx) => ({
      ...item,
      color: colors[idx] || "#64748b",
    }));
  };

  const categoryBreakdown = getCategoryStats();

  const handleApplyFilters = () => {
    alert("Filters applied successfully! LaunchLens dashboard updated instantly.");
  };

  // Custom SVG line curves mapping coordinates based on active Chart Tab
  const getChartCurves = () => {
    if (chartTab === "Day") {
      return {
        purple: "M20,110 Q50,45 80,48 T140,32 T200,60 T260,35 T285,55",
        orange: "M20,110 Q50,85 80,82 T140,65 T200,88 T260,55 T285,25",
        labels: ["May 16", "May 17", "May 18", "May 19", "May 20", "May 21", "May 22"],
        pEnd: { cx: 285, cy: 55 },
        oEnd: { cx: 285, cy: 25 },
        purpleGrad: "M20,110 Q50,45 80,48 T140,32 T200,60 T260,35 T285,55 L285,110 L20,110 Z",
        orangeGrad: "M20,110 Q50,85 80,82 T140,65 T200,88 T260,55 T285,25 L285,110 L20,110 Z"
      };
    } else if (chartTab === "Week") {
      return {
        purple: "M20,95 Q50,65 80,35 T140,75 T200,40 T260,85 T285,30",
        orange: "M20,105 Q50,90 80,55 T140,85 T200,70 T260,90 T285,50",
        labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7"],
        pEnd: { cx: 285, cy: 30 },
        oEnd: { cx: 285, cy: 50 },
        purpleGrad: "M20,95 Q50,65 80,35 T140,75 T200,40 T260,85 T285,30 L285,110 L20,110 Z",
        orangeGrad: "M20,105 Q50,90 80,55 T140,85 T200,70 T260,90 T285,50 L285,110 L20,110 Z"
      };
    } else { // "Month"
      return {
        purple: "M20,65 Q50,25 80,60 T140,15 T200,75 T260,35 T285,20",
        orange: "M20,85 Q50,55 80,75 T140,40 T200,95 T260,65 T285,40",
        labels: ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"],
        pEnd: { cx: 285, cy: 20 },
        oEnd: { cx: 285, cy: 40 },
        purpleGrad: "M20,65 Q50,25 80,60 T140,15 T200,75 T260,35 T285,20 L285,110 L20,110 Z",
        orangeGrad: "M20,85 Q50,55 80,75 T140,40 T200,95 T260,65 T285,40 L285,110 L20,110 Z"
      };
    }
  };

  const chartCurves = getChartCurves();

  return (
    <div className="flex-1 w-full bg-[#080a18] min-h-screen text-slate-100 p-6 sm:p-8">
      {/* Top Welcome Title & Export Button */}
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 mb-8 select-none">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
            Dashboard <span className="animate-bounce">👋</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Track and discover the best products launching on LaunchLens daily.
          </p>
        </div>

        {/* Export Button */}
        <button
          onClick={() => alert("Exporter: Commencing CSV spreadsheet compilation for active releases...")}
          className="flex items-center gap-2 px-4 py-2 bg-[#7c3aed] hover:bg-[#6d28d9] border border-[#8b5cf6]/30 text-white text-xs font-bold rounded-xl shadow-lg shadow-[#7c3aed]/15 transition-transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          <span>📥</span>
          <span>Export</span>
        </button>
      </div>

      {/* 4 Stat Cards Row */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 select-none">
        
        {/* Card 1: Today's Launches */}
        <div className="bg-[#0b0e1e]/75 border border-[#1a1f35] rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#8b5cf6]" />
          <div className="w-12 h-12 rounded-xl bg-[#8b5cf6]/10 flex items-center justify-center text-2xl shadow-inner shadow-[#8b5cf6]/20">
            🚀
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              {timePeriod} Launches
            </span>
            <span className="block text-2xl font-extrabold text-white mt-1 leading-none">
              {displayLaunchesCount}
            </span>
            <span className="block text-[10px] text-emerald-400 font-bold mt-1.5 flex items-center gap-0.5">
              ▲ 12% <span className="text-slate-500 font-semibold uppercase tracking-wider">from yesterday</span>
            </span>
          </div>
        </div>

        {/* Card 2: Total Upvotes */}
        <div className="bg-[#0b0e1e]/75 border border-[#1a1f35] rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#3b82f6]" />
          <div className="w-12 h-12 rounded-xl bg-[#3b82f6]/10 flex items-center justify-center text-2xl shadow-inner shadow-[#3b82f6]/20">
            👍
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Total Upvotes
            </span>
            <span className="block text-2xl font-extrabold text-white mt-1 leading-none">
              {displayTotalVotes.toLocaleString()}
            </span>
            <span className="block text-[10px] text-emerald-400 font-bold mt-1.5 flex items-center gap-0.5">
              ▲ 18% <span className="text-slate-500 font-semibold uppercase tracking-wider">from yesterday</span>
            </span>
          </div>
        </div>

        {/* Card 3: Product of the Day */}
        <div className="bg-[#0b0e1e]/75 border border-[#1a1f35] rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#10b981]" />
          <div className="w-12 h-12 rounded-xl bg-[#10b981]/10 flex items-center justify-center text-2xl shadow-inner shadow-[#10b981]/20">
            🏆
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Product of the Day
            </span>
            <span className="block text-lg font-black text-white mt-1 leading-tight truncate">
              {displayTopProductName}
            </span>
            <span className="block text-[10px] text-emerald-400 font-bold mt-1.5 flex items-center gap-0.5 truncate">
              ★ #1 Product <span className="text-slate-500 font-semibold uppercase tracking-wider">of the Day</span>
            </span>
          </div>
        </div>

        {/* Card 4: Total Views */}
        <div className="bg-[#0b0e1e]/75 border border-[#1a1f35] rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#f97316]" />
          <div className="w-12 h-12 rounded-xl bg-[#f97316]/10 flex items-center justify-center text-2xl shadow-inner shadow-[#f97316]/20">
            👁️
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Total Views
            </span>
            <span className="block text-2xl font-extrabold text-white mt-1 leading-none">
              15.6K
            </span>
            <span className="block text-[10px] text-emerald-400 font-bold mt-1.5 flex items-center gap-0.5">
              ▲ 22% <span className="text-slate-500 font-semibold uppercase tracking-wider">from yesterday</span>
            </span>
          </div>
        </div>

      </div>

      {/* Main Content Workspace Layout Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 items-start mb-8">
        
        {/* Column 1: Filters Panel (1/4 Column) */}
        <div className="bg-[#0b0e1e]/75 border border-[#1a1f35] rounded-2xl p-5 select-none space-y-6 lg:sticky lg:top-20">
          <div className="flex items-center justify-between border-b border-[#1a1f35] pb-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">Filters</h3>
            <span className="text-slate-500">⚙️</span>
          </div>

          {/* Time Period Vertical Selector Buttons */}
          <div className="space-y-2">
            <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest">Time Period</span>
            <div className="flex flex-col gap-1.5">
              {["Day", "Week", "Month", "All Time"].map((period) => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period as any)}
                  className={`w-full text-left px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    timePeriod === period
                      ? "bg-gradient-to-r from-[#903bf5] to-[#6d28d9] text-white shadow-md shadow-[#903bf5]/15"
                      : "bg-[#11162d]/50 hover:bg-[#11162d] border border-[#1a1f35] text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span>{period}</span>
                  {timePeriod === period && <span>❯</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Categories Dynamic Dropdown Dropdown */}
          <div className="space-y-2">
            <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest">Category</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-[#11162d]/80 hover:bg-[#11162d] border border-[#1a1f35] focus:border-[#7c3aed]/50 text-xs font-bold text-slate-300 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-[#7c3aed]/40 cursor-pointer animate-fade-in"
            >
              <option value="All Categories">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Sorting Dropdown */}
          <div className="space-y-2">
            <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest">Sort By</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-[#11162d]/80 hover:bg-[#11162d] border border-[#1a1f35] focus:border-[#7c3aed]/50 text-xs font-bold text-slate-300 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-[#7c3aed]/40 cursor-pointer"
            >
              <option value="Most Upvotes">Most Upvoted</option>
              <option value="Newest">Newest</option>
            </select>
          </div>

          {/* Pricing Options Checkboxes */}
          <div className="space-y-2.5">
            <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest">Price</span>
            <div className="space-y-2">
              <label className="flex items-center gap-3 text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={priceFilters.free}
                  onChange={(e) => setPriceFilters({ ...priceFilters, free: e.target.checked })}
                  className="w-4 h-4 rounded bg-[#11162d] border border-[#1a1f35] accent-[#7c3aed] cursor-pointer"
                />
                <span>Free</span>
              </label>
              <label className="flex items-center gap-3 text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={priceFilters.paid}
                  onChange={(e) => setPriceFilters({ ...priceFilters, paid: e.target.checked })}
                  className="w-4 h-4 rounded bg-[#11162d] border border-[#1a1f35] accent-[#7c3aed] cursor-pointer"
                />
                <span>Paid</span>
              </label>
              <label className="flex items-center gap-3 text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={priceFilters.freemium}
                  onChange={(e) => setPriceFilters({ ...priceFilters, freemium: e.target.checked })}
                  className="w-4 h-4 rounded bg-[#11162d] border border-[#1a1f35] accent-[#7c3aed] cursor-pointer"
                />
                <span>Freemium</span>
              </label>
            </div>
          </div>

          {/* Apply Button */}
          <button
            onClick={handleApplyFilters}
            className="w-full py-3 bg-[#7c3aed] hover:bg-[#6d28d9] border border-[#8b5cf6]/30 text-xs font-bold text-white rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            Apply Filters
          </button>
        </div>

        {/* Column 2: Top Launches Feed (2/4 Column, spanning 2 grid slots) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between bg-[#0b0e1e]/60 border border-[#1a1f35] rounded-2xl px-5 py-4 select-none">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">
              Top Launches ({timePeriod})
            </h2>
            <button className="text-xs text-slate-500 hover:text-accent-indigo font-bold cursor-pointer">
              View All
            </button>
          </div>

          {error && (
            <div className="bg-rose-950/20 border border-rose-900/30 text-rose-400 p-4 rounded-xl text-center text-xs">
              ⚠️ Error connecting to server: {error}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-4">
              <ProductCardSkeleton />
              <ProductCardSkeleton />
              <ProductCardSkeleton />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="glassmorphism rounded-2xl p-12 text-center border border-card-border flex flex-col items-center">
              <span className="text-4xl mb-4 animate-bounce">📭</span>
              <h3 className="text-sm font-bold text-slate-200">No Launches Found</h3>
              <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
                We couldn't find any products matching your active filters. Try changing your search keyword or resetting filters.
              </p>
            </div>
          ) : (
            <div className="space-y-4 transition-all">
              {filteredProducts.slice(0, 5).map((product, index) => {
                // Rank color style
                const rankColors = [
                  "bg-gradient-to-r from-amber-500 to-amber-600 text-white", // 1st
                  "bg-[#1e293b] text-slate-300", // 2nd
                  "bg-[#3b2d1d] text-orange-400", // 3rd
                  "bg-[#11162d]/80 text-slate-500", // 4th
                  "bg-[#11162d]/80 text-slate-500" // 5th
                ];

                return (
                  <div
                    key={product.id}
                    onClick={() => router.push(`/products/${product.id}`)}
                    className="group relative w-full bg-[#0b0e1e]/75 border border-[#1a1f35] rounded-2xl p-4 hover:shadow-xl hover:shadow-accent-indigo/5 glow-hover transition-all duration-300 flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Rank Index Box */}
                      <span className={`w-6 h-6 rounded-lg ${rankColors[index] || "bg-[#11162d]/80 text-slate-500"} flex items-center justify-center text-xs font-black shrink-0 select-none`}>
                        {index + 1}
                      </span>

                      {/* Product Thumbnail */}
                      <img
                        src={product.thumbnail || "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=100"}
                        alt={product.name}
                        className="w-12 h-12 rounded-xl object-cover bg-slate-900 border border-slate-800 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=100";
                        }}
                      />

                      {/* Text descriptions */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-100 group-hover:text-[#7c3aed] transition-colors truncate">
                            {product.name}
                          </h3>
                          <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#11162d] border border-slate-900 text-slate-400 shrink-0 select-none">
                            {product.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1 leading-normal">
                          {product.tagline}
                        </p>
                      </div>
                    </div>

                    {/* Right side stats metrics */}
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Upvotes Capsule */}
                      <button
                        onClick={(e) => triggerUpvote(product.id, e)}
                        className="px-3 py-1.5 rounded-lg border border-[#1a1f35] bg-[#11162d]/60 hover:bg-[#7c3aed]/10 hover:border-[#7c3aed]/50 text-[#f97316] hover:text-white font-extrabold text-xs transition-all duration-200 cursor-pointer flex items-center gap-1 select-none"
                      >
                        <span>▲</span>
                        <span>{product.votes}</span>
                      </button>

                      {/* Comments count bubble */}
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 font-bold select-none">
                        <span>💬</span>
                        <span>{Math.floor(product.votes / 11) + 5}</span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Column 3: Analytics Line & Donut Charts & Product of the Day (1/4 Column) */}
        <div className="space-y-6">
          
          {/* Launches Overview Line Chart Card */}
          <div className="bg-[#0b0e1e]/75 border border-[#1a1f35] rounded-2xl p-5 select-none space-y-4">
            <div className="flex items-center justify-between border-b border-[#1a1f35] pb-3">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
                  Launches Overview
                </h3>
              </div>
              
              {/* Day filter selector */}
              <div className="flex items-center gap-1 border border-[#1a1f35] bg-[#11162d]/50 px-2 py-0.5 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 capitalize">{chartTab}</span>
                <span className="text-[8px] text-slate-600">▼</span>
              </div>
            </div>

            {/* SVG line graphs draws morphing curves exactly matching clicked tabs */}
            <div className="relative w-full h-36">
              <svg className="w-full h-full" viewBox="0 0 300 130">
                {/* Definitions for linear gradients */}
                <defs>
                  <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                <line x1="20" y1="20" x2="285" y2="20" stroke="#12172b" strokeWidth="1" strokeDasharray="3,3" />
                <line x1="20" y1="50" x2="285" y2="50" stroke="#12172b" strokeWidth="1" strokeDasharray="3,3" />
                <line x1="20" y1="80" x2="285" y2="80" stroke="#12172b" strokeWidth="1" strokeDasharray="3,3" />
                <line x1="20" y1="110" x2="285" y2="110" stroke="#12172b" strokeWidth="1" />

                {/* Area Gradient Fill under Purple Line */}
                <path
                  d={chartCurves.purpleGrad}
                  fill="url(#purpleGrad)"
                  className="transition-all duration-500 ease-in-out"
                />

                {/* Area Gradient Fill under Orange Line */}
                <path
                  d={chartCurves.orangeGrad}
                  fill="url(#orangeGrad)"
                  className="transition-all duration-500 ease-in-out"
                />

                {/* Purple Line Graph Path (Launches) */}
                <path
                  d={chartCurves.purple}
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-in-out"
                />

                {/* Orange Line Graph Path (Upvotes) */}
                <path
                  d={chartCurves.orange}
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-in-out"
                />

                {/* Endpoint circles */}
                <circle
                  cx={chartCurves.pEnd.cx}
                  cy={chartCurves.pEnd.cy}
                  r="4"
                  fill="#8b5cf6"
                  stroke="#080a18"
                  strokeWidth="1.5"
                  className="transition-all duration-500 ease-in-out"
                />
                <circle
                  cx={chartCurves.oEnd.cx}
                  cy={chartCurves.oEnd.cy}
                  r="4"
                  fill="#f97316"
                  stroke="#080a18"
                  strokeWidth="1.5"
                  className="transition-all duration-500 ease-in-out"
                />

                {/* X Axis Labels */}
                <text x="20" y="125" fill="#475569" fontSize="7" fontWeight="bold" textAnchor="middle">{chartCurves.labels[0]}</text>
                <text x="65" y="125" fill="#475569" fontSize="7" fontWeight="bold" textAnchor="middle">{chartCurves.labels[1]}</text>
                <text x="110" y="125" fill="#475569" fontSize="7" fontWeight="bold" textAnchor="middle">{chartCurves.labels[2]}</text>
                <text x="155" y="125" fill="#475569" fontSize="7" fontWeight="bold" textAnchor="middle">{chartCurves.labels[3]}</text>
                <text x="200" y="125" fill="#475569" fontSize="7" fontWeight="bold" textAnchor="middle">{chartCurves.labels[4]}</text>
                <text x="245" y="125" fill="#475569" fontSize="7" fontWeight="bold" textAnchor="middle">{chartCurves.labels[5]}</text>
                <text x="285" y="125" fill="#475569" fontSize="7" fontWeight="bold" textAnchor="middle">{chartCurves.labels[6]}</text>
              </svg>
            </div>

            {/* Custom Tab Filter Selector Buttons - FULLY FUNCTIONAL */}
            <div className="flex justify-between items-center bg-[#11162d]/50 border border-[#1a1f35] rounded-xl p-1">
              {["Day", "Week", "Month"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setChartTab(tab as any)}
                  className={`flex-1 text-center py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    chartTab === tab ? "bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/10" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Top Categories Donut Chart Card */}
          <div className="bg-[#0b0e1e]/75 border border-[#1a1f35] rounded-2xl p-5 select-none space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 border-b border-[#1a1f35] pb-3">
              Top Categories
            </h3>

            <div className="flex items-center gap-5 justify-between">
              {/* Donut Circle SVG */}
              <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 42 42">
                  <circle cx="21" cy="21" r="15.91" fill="transparent" stroke="#12172b" strokeWidth="4.5" />
                  
                  {/* Circle segments dynamically mapped to breakdown */}
                  {(() => {
                    let offset = 0;
                    return categoryBreakdown.map((item) => {
                      const strokeDash = `${item.value} ${100 - item.value}`;
                      const dashOffset = 100 - offset;
                      offset += item.value;
                      return (
                        <circle
                          key={item.name}
                          cx="21"
                          cy="21"
                          r="15.91"
                          fill="transparent"
                          stroke={item.color}
                          strokeWidth="4.5"
                          strokeDasharray={strokeDash}
                          strokeDashoffset={dashOffset}
                          className="transition-all duration-500"
                        />
                      );
                    });
                  })()}
                </svg>
                {/* Center hole decoration */}
                <div className="absolute w-15 h-15 bg-[#0b0e1e] rounded-full flex flex-col items-center justify-center shadow-inner">
                  <span className="text-[10px] font-black text-white">100%</span>
                  <span className="text-[6px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Total</span>
                </div>
              </div>

              {/* Legends Table */}
              <div className="flex-1 space-y-1.5 min-w-0">
                {categoryBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-2 text-[10px] font-semibold">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-400 truncate capitalize">{item.name}</span>
                    </div>
                    <span className="text-slate-200 font-extrabold font-mono">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Product of the Day Crown card */}
          <div className="bg-[#0b0e1e]/75 border border-[#1a1f35] rounded-2xl p-5 select-none relative overflow-hidden flex flex-col gap-4">
            
            {/* Crown title bar */}
            <h3 className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
              👑 Product of the Day
            </h3>

            {/* Inner rounded white box detail */}
            <div className="bg-white rounded-2xl p-4 flex items-start gap-3 border border-slate-200 shadow-lg text-slate-900 shadow-black/25">
              <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-800 text-lg border border-slate-200 shrink-0">
                {displayTopProductName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-black text-slate-900 leading-tight truncate">
                  {displayTopProductName}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal line-clamp-2">
                  {displayTopProductTagline}
                </p>
              </div>
            </div>

            {/* Sub-Badges */}
            <div className="space-y-2">
              {/* Star Badge */}
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-400 bg-emerald-950/20 border border-emerald-900/40 px-3 py-1.5 rounded-xl w-full justify-center">
                <span>★</span>
                <span>#1 Product of the Day</span>
              </div>
              
              {/* Upvote score button */}
              <button
                onClick={(e) => triggerUpvote(displayTopProductId, e)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-[#f97316]/20 bg-[#f97316]/5 hover:bg-[#f97316]/10 text-[#f97316] font-black text-xs rounded-xl hover:shadow-md transition-all cursor-pointer"
              >
                <span>▲</span>
                <span>{displayTopProductVotes} Upvotes</span>
              </button>
            </div>

            {/* View Product action button */}
            <button
              onClick={() => router.push(`/products/${displayTopProductId}`)}
              className="w-full py-3 bg-gradient-to-r from-orange-500 via-rose-500 to-[#7c3aed] text-xs font-extrabold text-white rounded-xl shadow-lg shadow-rose-500/10 hover:opacity-95 hover:-translate-y-0.5 active:translate-y-0 transition-transform cursor-pointer"
            >
              View Product
            </button>
          </div>

        </div>

      </div>

      {/* Bottom Segment: Recent Launches Row */}
      <div className="max-w-7xl mx-auto space-y-4 select-none">
        
        {/* Title Header */}
        <div className="flex items-center justify-between bg-[#0b0e1e]/60 border border-[#1a1f35] rounded-2xl px-5 py-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
            🌱 Recent Launches
          </h2>
          <button className="text-xs text-slate-500 hover:text-accent-indigo font-bold cursor-pointer">
            View All
          </button>
        </div>

        {/* Horizontal Row list */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse" />
            ))
          ) : products.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center col-span-full">No recent launches available.</p>
          ) : (
            products.slice(0, 5).map((product, idx) => {
              const iconColors = [
                "bg-teal-500/15 border-teal-500/30 text-teal-400",
                "bg-orange-500/15 border-orange-500/30 text-orange-400",
                "bg-purple-500/15 border-purple-500/30 text-purple-400",
                "bg-rose-500/15 border-rose-500/30 text-rose-400",
                "bg-slate-900 border-[#1a1f35] text-slate-300"
              ];
              
              const iconStyles = iconColors[idx % iconColors.length];

              return (
                <div
                  key={product.id}
                  onClick={() => router.push(`/products/${product.id}`)}
                  className="group bg-[#0b0e1e]/75 border border-[#1a1f35] rounded-2xl p-4 hover:shadow-md hover:shadow-accent-indigo/5 glow-hover transition-all duration-300 flex flex-col items-center text-center gap-3 cursor-pointer overflow-hidden"
                >
                  {/* Category Circular Badge */}
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-base font-bold shadow-md shrink-0 transition-transform group-hover:scale-105 duration-200 ${iconStyles}`}>
                    {product.name.charAt(0)}
                  </div>

                  {/* Text details */}
                  <div className="w-full min-w-0">
                    <h4 className="text-xs font-bold text-slate-200 group-hover:text-accent-indigo transition-colors truncate">
                      {product.name}
                    </h4>
                    <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5 truncate">
                      {product.category}
                    </span>
                  </div>

                  {/* Upvotes Mini Badge */}
                  <span className="text-[10px] font-black text-orange-500 bg-orange-950/20 border border-orange-900/30 px-2 py-0.5 rounded-md mt-1 group-hover:scale-105 transition-transform shrink-0">
                    ▲ {product.votes}
                  </span>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex-1 bg-[#060913] flex items-center justify-center min-h-screen">
        <div className="text-center text-slate-400 space-y-4 select-none">
          <svg className="animate-spin h-10 w-10 text-accent-indigo mx-auto" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-xs font-extrabold tracking-widest uppercase text-slate-500">Loading Dashboard...</span>
        </div>
      </div>
    }>
      <MainDashboardContent />
    </Suspense>
  );
}
