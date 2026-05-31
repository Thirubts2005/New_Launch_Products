"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Product } from "@/components/ProductCard";

interface Comment {
  id: number;
  author: string;
  avatar: string;
  role: string;
  text: string;
  timeAgo: string;
  likes: number;
}

// Generate realistic simulated discussion comments based on the product category
const getSimulatedComments = (category: string): Comment[] => {
  const common = [
    {
      id: 1,
      author: "Alex Rivers",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80",
      role: "Lead Engineer @ Vercel",
      text: "This is absolutely phenomenal. We've been looking for a solution that integrates this smoothly with our active workflows. The user experience is incredibly snappy!",
      timeAgo: "2 hours ago",
      likes: 12,
    },
  ];

  if (category.toLowerCase() === "ai") {
    return [
      ...common,
      {
        id: 2,
        author: "Sarah Chen",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80",
        role: "AI Researcher @ OpenAI",
        text: "The local-first model approach here is highly impressive. How do you handle context window scaling when parsing massive folder trees? Does it index locally using WebGPU or do we spin up a docker background container?",
        timeAgo: "4 hours ago",
        likes: 28,
      },
      {
        id: 3,
        author: "Marcus Brody",
        avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80&auto=format&fit=crop&q=80",
        role: "Product Manager @ Notion",
        text: "Privacy first is the biggest selling point here. Standard enterprise clients flat out reject sending document vectors to third-party cloud engines. Huge congratulations on this launch!",
        timeAgo: "5 hours ago",
        likes: 9,
      }
    ];
  } else if (category.toLowerCase() === "developer tools") {
    return [
      ...common,
      {
        id: 2,
        author: "Devon Miller",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80",
        role: "DevOps Engineer @ HashiCorp",
        text: "I spun this up locally and was amazed by the memory footprint. Using native engines rather than bundling heavy electron layers makes a massive difference in laptop battery life when running 10+ instances.",
        timeAgo: "1 hour ago",
        likes: 19,
      },
      {
        id: 3,
        author: "Elena Rostova",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&auto=format&fit=crop&q=80",
        role: "Fullstack Architect",
        text: "Does this support multi-workspace config files? I'd love to drop a visual dotfile inside my git root to customize standard terminal environments for our onboarders. Excellent work!",
        timeAgo: "6 hours ago",
        likes: 7,
      }
    ];
  } else if (category.toLowerCase() === "design") {
    return [
      ...common,
      {
        id: 2,
        author: "Clara Croft",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80",
        role: "Senior UI Designer @ Figma",
        text: "The Tailwind variables importing engine is flawless. Usually visual designers break responsive wrapping grids, but the drag precision bounding boxes here map to standard flex layers perfectly.",
        timeAgo: "3 hours ago",
        likes: 31,
      },
      {
        id: 3,
        author: "Julian Karr",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=80",
        role: "Creative Director",
        text: "Absolute game changer for bootstrapping SaaS marketing pages. Visualizing spacing margins alongside tailwind utility class previews speeds up rapid iteration significantly. Upvoted!",
        timeAgo: "8 hours ago",
        likes: 14,
      }
    ];
  } else {
    return [
      ...common,
      {
        id: 2,
        author: "Derrick Vance",
        avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=80&auto=format&fit=crop&q=80",
        role: "Growth Marketer",
        text: "The analytics breakdown is ultra-clean. I love how it isolates simple layout changes against visual metrics without burdening page speed load times.",
        timeAgo: "5 hours ago",
        likes: 11,
      }
    ];
  }
};

export default function ProductDetails() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [votes, setVotes] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://localhost:8000/api/products/${productId}`);
        if (!res.ok) throw new Error("Product details not found on the backend.");
        
        const data = await res.json();
        setProduct(data);
        setVotes(data.votes);
        setComments(getSimulatedComments(data.category));

        // Check local storage for vote history
        const votedList = JSON.parse(localStorage.getItem("pulse_voted_products") || "{}");
        if (votedList[productId]) {
          setHasVoted(true);
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  const handleVote = async () => {
    if (hasVoted || !product) return;

    setVotes((prev) => prev + 1);
    setHasVoted(true);
    setIsAnimating(true);

    const votedList = JSON.parse(localStorage.getItem("pulse_voted_products") || "{}");
    votedList[product.id] = true;
    localStorage.setItem("pulse_voted_products", JSON.stringify(votedList));

    try {
      const res = await fetch(`http://localhost:8000/api/products/${product.id}/vote`, {
        method: "POST",
      });
      if (!res.ok) {
        // Rollback
        setVotes((prev) => prev - 1);
        setHasVoted(false);
        votedList[product.id] = false;
        localStorage.setItem("pulse_voted_products", JSON.stringify(votedList));
      }
    } catch (err) {
      console.error("Upvote request failed:", err);
      setVotes((prev) => prev - 1);
      setHasVoted(false);
    }

    setTimeout(() => setIsAnimating(false), 450);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const commentToAdd: Comment = {
      id: Date.now(),
      author: "Community Member (You)",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&auto=format&fit=crop&q=80",
      role: "Maker & Designer",
      text: newComment.trim(),
      timeAgo: "Just now",
      likes: 0,
    };

    setComments((prev) => [commentToAdd, ...prev]);
    setNewComment("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#060913] flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-slate-400 space-y-3">
            <div className="w-12 h-12 border-4 border-accent-indigo border-t-transparent rounded-full animate-spin mx-auto" />
            <span className="text-xs uppercase font-extrabold tracking-widest text-slate-500">Loading Product Info...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#060913] flex flex-col">
        <div className="flex-1 max-w-xl mx-auto px-4 py-16 text-center flex flex-col items-center justify-center">
          <span className="text-5xl mb-4">🔍</span>
          <h2 className="text-2xl font-black text-white">Details Unavailable</h2>
          <p className="text-slate-400 mt-2 text-sm leading-relaxed">
            {error || "We could not find a product matching this query. It may have been deleted or the server is disconnected."}
          </p>
          <Link
            href="/"
            className="mt-6 px-6 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 font-bold rounded-xl hover:-translate-y-0.5 transition-transform"
          >
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const thumbnailSrc = imgError || !product.thumbnail 
    ? "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=180" 
    : product.thumbnail;

  return (
    <div className="min-h-screen bg-[#060913] flex flex-col">
      <main className="flex-1 w-full grid-bg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Breadcrumbs Navigation */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-accent-indigo uppercase tracking-wider mb-6 group cursor-pointer"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            Back to Dashboard
          </Link>

          {/* Product Hero Segment */}
          <div className="glassmorphism rounded-3xl p-6 sm:p-8 border border-card-border mb-8 relative overflow-hidden">
            
            {/* Background Glow */}
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-accent-indigo/10 rounded-full blur-3xl -z-10" />

            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
              
              {/* Product Info Column */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                {/* Thumbnail */}
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0 select-none">
                  <img
                    src={thumbnailSrc}
                    alt={`${product.name} Logo`}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                  />
                </div>

                {/* Text details */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                      {product.name}
                    </h1>
                    <span className="px-3 py-1 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 text-xs font-black uppercase text-accent-cyan tracking-widest">
                      {product.category}
                    </span>
                  </div>
                  
                  <p className="text-base text-slate-300 font-medium">
                    {product.tagline}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 justify-center sm:justify-start">
                    <span>📅 Launched {new Date(product.launch_date).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>📈 Rank #{Math.floor(votes / 35) + 1} Today</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Column */}
              <div className="flex flex-row md:flex-col items-center gap-3 w-full md:w-auto shrink-0 pt-4 md:pt-0">
                {/* Website visit button */}
                {product.website_url && (
                  <a
                    href={product.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 md:flex-none text-center block px-6 py-3.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-bold rounded-2xl hover:-translate-y-0.5 active:translate-y-0 shadow-lg transition-all cursor-pointer text-sm"
                  >
                    🔗 Visit Website
                  </a>
                )}

                {/* Big Details Upvote button */}
                <button
                  onClick={handleVote}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl border font-bold text-sm transition-all duration-300 cursor-pointer ${
                    hasVoted
                      ? "bg-gradient-to-r from-accent-indigo to-indigo-600 border-accent-indigo text-white shadow-lg shadow-accent-indigo/25"
                      : "bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white hover:-translate-y-0.5 active:translate-y-0"
                  } ${isAnimating ? "animate-vote" : ""}`}
                >
                  <span className="text-base">▲</span>
                  <span>Upvote Product</span>
                  <span className="bg-white/10 px-2 py-0.5 rounded-lg text-xs font-mono">
                    {votes}
                  </span>
                </button>
              </div>

            </div>

            {/* Detailed Description */}
            {product.description && (
              <div className="mt-8 pt-8 border-t border-slate-900/80">
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-500 mb-3">About {product.name}</h3>
                <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

          </div>

          {/* Discussion & Product Stats split Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Comments Thread Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glassmorphism rounded-2xl p-6 border border-card-border">
                <h3 className="text-base font-extrabold text-slate-200 mb-6 flex items-center gap-2 select-none">
                  💬 Community Discussion
                  <span className="text-xs bg-slate-900 border border-slate-800 text-slate-500 font-mono font-bold px-2 py-0.5 rounded-md">
                    {comments.length}
                  </span>
                </h3>

                {/* Add a Comment input Form */}
                <form onSubmit={handleAddComment} className="flex gap-4 items-start mb-8">
                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-slate-900 border border-slate-800 select-none">
                    <img
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&auto=format&fit=crop&q=80"
                      alt="User avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <textarea
                      placeholder="Ask a question or share your thoughts with the maker..."
                      rows={3}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full bg-slate-900/30 hover:bg-slate-900/60 focus:bg-slate-950 border border-slate-800 focus:border-accent-indigo rounded-xl p-3 text-sm text-foreground placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accent-indigo transition-all"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          newComment.trim()
                            ? "bg-accent-indigo border-accent-indigo text-white hover:-translate-y-0.5 shadow-md shadow-accent-indigo/15 active:translate-y-0"
                            : "bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed"
                        }`}
                      >
                        Submit Comment
                      </button>
                    </div>
                  </div>
                </form>

                {/* Comments List */}
                <div className="space-y-6">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4 items-start pb-5 border-b border-slate-900 last:border-b-0 last:pb-0">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-slate-900 border border-slate-800 select-none">
                        <img
                          src={comment.avatar}
                          alt={`${comment.author} avatar`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Comment text row */}
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-200">{comment.author}</span>
                          <span className="text-[10px] text-accent-indigo bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded-md font-semibold">
                            {comment.role}
                          </span>
                          <span className="text-[11px] text-slate-500 ml-auto">{comment.timeAgo}</span>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">
                          {comment.text}
                        </p>
                        
                        {/* Upvote comment like button */}
                        <div className="flex items-center gap-1.5 pt-1 select-none">
                          <button className="text-xs text-slate-500 hover:text-accent-indigo flex items-center gap-1 cursor-pointer">
                            ▲ Upvote Comment
                          </button>
                          {comment.likes > 0 && (
                            <span className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800/80 px-1.5 py-0.5 rounded font-mono font-bold">
                              {comment.likes}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Product Meta Specs Column */}
            <div className="space-y-6">
              <div className="glassmorphism rounded-2xl p-5 border border-card-border space-y-5">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">
                  Product Metrics
                </h3>

                <div className="space-y-4 text-sm">
                  <div className="flex items-center justify-between py-2.5 border-b border-slate-900">
                    <span className="text-slate-500 font-bold uppercase text-[11px] tracking-wider">Status</span>
                    <span className="text-emerald-400 font-bold bg-emerald-950/20 border border-emerald-900/40 px-2 py-0.5 rounded-md text-xs select-none">
                      Active Launch
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 border-b border-slate-900">
                    <span className="text-slate-500 font-bold uppercase text-[11px] tracking-wider">Total Votes</span>
                    <span className="text-slate-300 font-extrabold font-mono">{votes} upvotes</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 border-b border-slate-900">
                    <span className="text-slate-500 font-bold uppercase text-[11px] tracking-wider">Source</span>
                    <span className="text-slate-300 font-bold">LaunchPulse Sync</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-slate-500 font-bold uppercase text-[11px] tracking-wider">Launch Date</span>
                    <span className="text-slate-300 font-semibold">{new Date(product.launch_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Share Card Promotion */}
              <div className="glassmorphism rounded-2xl p-5 border border-card-border text-center space-y-4">
                <h4 className="text-sm font-extrabold text-white">Share {product.name}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Support the maker by sharing this launch pulse card on Twitter, LinkedIn, or developer boards!
                </p>
                <div className="flex gap-2">
                  <button className="flex-1 bg-slate-900 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold py-2 rounded-xl text-xs transition-transform hover:-translate-y-0.5 cursor-pointer">
                    🐦 X / Twitter
                  </button>
                  <button className="flex-1 bg-slate-900 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold py-2 rounded-xl text-xs transition-transform hover:-translate-y-0.5 cursor-pointer">
                    🔗 Copy Link
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
