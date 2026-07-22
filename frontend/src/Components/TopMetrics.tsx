import React from 'react';

interface TopMetricsProps {
  data?: {
    totalThreats?: string;
    threatGrowth?: string;
    avgResponseTime?: string;
    responseTimeDelta?: string;
    containmentRate?: string;
    pendingCases?: string;
  };
}

export default function TopMetrics({ data }: TopMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      
      {/* Tarjeta 1: Total Threats (24h) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-lg">
        <span className="text-slate-400 text-xs font-semibold tracking-wider uppercase">Total Threats (24h)</span>
        <div className="flex items-baseline justify-between mt-2">
          <h3 className="text-2xl font-bold text-white">{data?.totalThreats || "1,482"}</h3>
          <span className="text-emerald-400 text-xs font-medium flex items-center bg-emerald-500/10 px-2 py-0.5 rounded">
            ↑ {data?.threatGrowth || "12%"}
          </span>
        </div>
      </div>

      {/* Tarjeta 2: Avg. SOAR Response Time */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-lg">
        <span className="text-slate-400 text-xs font-semibold tracking-wider uppercase">Avg. SOAR Response Time</span>
        <div className="flex items-baseline justify-between mt-2">
          <h3 className="text-2xl font-bold text-white">{data?.avgResponseTime || "45ms"}</h3>
          <span className="text-emerald-400 text-xs font-medium flex items-center bg-emerald-500/10 px-2 py-0.5 rounded">
            ↓ {data?.responseTimeDelta || "8%"}
          </span>
        </div>
      </div>

      {/* Tarjeta 3: Auto-Containment Rate */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-lg">
        <span className="text-slate-400 text-xs font-semibold tracking-wider uppercase">Auto-Containment Rate</span>
        <div className="flex items-baseline justify-between mt-2">
          <h3 className="text-2xl font-bold text-emerald-400">{data?.containmentRate || "96.8%"}</h3>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
        </div>
      </div>

      {/* Tarjeta 4: Pending Review Cases */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-lg">
        <span className="text-slate-400 text-xs font-semibold tracking-wider uppercase">Pending Review</span>
        <div className="flex items-baseline justify-between mt-2">
          <h3 className="text-2xl font-bold text-amber-400">{data?.pendingCases || "18 Cases"}</h3>
          <span className="text-amber-400 text-xs font-medium bg-amber-500/10 px-2 py-0.5 rounded">
            Action Req.
          </span>
        </div>
      </div>

    </div>
  );
}