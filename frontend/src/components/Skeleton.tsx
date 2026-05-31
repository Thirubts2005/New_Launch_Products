export function ProductCardSkeleton() {
  return (
    <div className="w-full glassmorphism rounded-2xl p-5 border border-card-border flex flex-col md:flex-row items-center justify-between gap-5 animate-pulse">
      <div className="flex flex-1 items-start gap-5 w-full">
        {/* Image Box */}
        <div className="w-16 h-16 rounded-xl bg-slate-800/80 shrink-0" />
        
        {/* Info Rows */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-5 w-36 bg-slate-800 rounded-lg" />
            <div className="h-4 w-16 bg-slate-800/60 rounded-lg" />
          </div>
          <div className="h-4 w-full bg-slate-800/70 rounded-lg" />
          <div className="h-3 w-3/4 bg-slate-800/50 rounded-lg" />
        </div>
      </div>
      
      {/* Upvote Button Placeholder */}
      <div className="w-full md:w-16 h-16 bg-slate-800 rounded-xl shrink-0" />
    </div>
  );
}

export function TrendingSkeleton() {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-900 last:border-b-0 animate-pulse">
      <div className="w-8 h-8 rounded-lg bg-slate-800 shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-3.5 w-3/4 bg-slate-800 rounded-md" />
        <div className="h-3 w-1/2 bg-slate-800/60 rounded-md" />
      </div>
      <div className="w-10 h-6 bg-slate-800/80 rounded-md shrink-0" />
    </div>
  );
}
