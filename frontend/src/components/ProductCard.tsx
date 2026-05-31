"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export interface Product {
  id: string;
  name: string;
  tagline: string;
  description?: string;
  votes: number;
  launch_date: string;
  thumbnail?: string;
  website_url?: string;
  category: string;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [votes, setVotes] = useState(product.votes);
  const [hasVoted, setHasVoted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Sync vote state with local storage on mount to identify previously upvoted items
  useEffect(() => {
    const votedList = JSON.parse(localStorage.getItem("pulse_voted_products") || "{}");
    if (votedList[product.id]) {
      setHasVoted(true);
    }
  }, [product.id]);

  // Keep internal votes count synchronized with parent data updates (e.g. after background syncs)
  useEffect(() => {
    setVotes(product.votes);
  }, [product.votes]);

  const handleVote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (hasVoted) return; // Prevent double voting

    // Optimistic UI updates
    setVotes((prev) => prev + 1);
    setHasVoted(true);
    setIsAnimating(true);

    // Save voted status in localStorage
    const votedList = JSON.parse(localStorage.getItem("pulse_voted_products") || "{}");
    votedList[product.id] = true;
    localStorage.setItem("pulse_voted_products", JSON.stringify(votedList));

    try {
      const res = await fetch(`http://localhost:8000/api/products/${product.id}/vote`, {
        method: "POST",
      });
      if (!res.ok) {
        // Rollback on error
        setVotes((prev) => prev - 1);
        setHasVoted(false);
        votedList[product.id] = false;
        localStorage.setItem("pulse_voted_products", JSON.stringify(votedList));
      }
    } catch (err) {
      console.error("Upvoting request failed:", err);
      setVotes((prev) => prev - 1);
      setHasVoted(false);
    }

    setTimeout(() => setIsAnimating(false), 450);
  };

  const handleCategoryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", product.category);
    router.push(`/?${params.toString()}`);
  };

  // Safe fallback thumbnail if none specified
  const thumbnailSrc = imgError || !product.thumbnail 
    ? "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=180" 
    : product.thumbnail;

  return (
    <div className="group relative w-full glassmorphism rounded-2xl p-5 hover:shadow-xl hover:shadow-accent-indigo/5 glow-hover transition-all duration-300 flex flex-col md:flex-row items-center justify-between gap-5 border border-card-border overflow-hidden">
      
      {/* Decorative background glow on card hover */}
      <div className="absolute -inset-px bg-gradient-to-r from-accent-indigo/0 via-accent-indigo/0 to-accent-cyan/0 group-hover:from-accent-indigo/5 group-hover:to-accent-cyan/5 transition-all duration-500 rounded-2xl pointer-events-none -z-10" />

      {/* Main content clickable area leading to Product Details */}
      <Link href={`/products/${product.id}`} className="flex flex-1 items-start gap-5 w-full cursor-pointer">
        {/* Product Image */}
        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0 select-none">
          <img
            src={thumbnailSrc}
            alt={`${product.name} thumbnail`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        </div>

        {/* Text descriptions */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-lg font-bold text-slate-100 group-hover:text-accent-indigo transition-colors duration-200 truncate">
              {product.name}
            </h3>
            
            {/* Category Pill Tag */}
            <button
              onClick={handleCategoryClick}
              className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-900/80 hover:bg-accent-cyan/15 text-slate-400 hover:text-accent-cyan border border-slate-800 hover:border-accent-cyan/30 transition-all cursor-pointer"
            >
              {product.category}
            </button>
          </div>
          
          <p className="text-sm text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {product.tagline}
          </p>

          {product.description && (
            <p className="text-xs text-slate-500 mt-2 line-clamp-1 italic">
              {product.description}
            </p>
          )}
        </div>
      </Link>

      {/* Upvote Button Column */}
      <button
        onClick={handleVote}
        className={`w-full md:w-auto flex flex-row md:flex-col items-center justify-center gap-1.5 px-5 py-3 md:py-4 rounded-xl border font-bold transition-all duration-300 cursor-pointer ${
          hasVoted
            ? "bg-gradient-to-r from-accent-indigo to-indigo-600 border-accent-indigo text-white shadow-lg shadow-accent-indigo/25"
            : "bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white"
        } ${isAnimating ? "animate-vote" : ""}`}
      >
        <span className={`text-lg md:text-xl transition-transform duration-200 ${hasVoted ? "scale-110" : "group-hover:-translate-y-0.5"}`}>
          ▲
        </span>
        <span className="text-xs md:text-sm font-extrabold tracking-tight">
          {votes}
        </span>
      </button>

    </div>
  );
}
