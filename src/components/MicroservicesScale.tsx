import React from 'react';
import { Cpu, Server, Activity, Zap, RefreshCw, Layers, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { ServiceMetric } from '../types/mrp';

interface MicroservicesScaleProps {
  services: ServiceMetric[];
  onTriggerSurge: () => void;
}

export const MicroservicesScale: React.FC<MicroservicesScaleProps> = ({ services, onTriggerSurge }) => {
  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Server className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white font-mono">Microservices Topology & Horizontal Pod Autoscaler</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Horizontal Scalability architecture with automated load balancing and latency optimization under high traffic surges.
          </p>
        </div>

        <button
          onClick={onTriggerSurge}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow transition"
        >
          <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>Simulate Load Surge & Trigger HPA Pods</span>
        </button>
      </div>

      {/* Microservice Pod Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((svc, idx) => {
          const isSurging = svc.status === 'SURGE';

          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl border space-y-4 transition ${
                isSurging
                  ? 'bg-indigo-950/30 border-indigo-700/60 shadow-lg shadow-indigo-950/50'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-white font-mono">{svc.serviceName}</h3>
                </div>

                <span
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded font-mono ${
                    isSurging
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {svc.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Active Pod Replicas</span>
                  <strong className="text-indigo-400 text-base">{svc.instancesCount} Pods</strong>
                </div>

                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Avg Latency</span>
                  <strong className="text-emerald-400 text-base">{svc.latencyMs} ms</strong>
                </div>

                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">CPU Load</span>
                  <strong className="text-amber-400 text-base">{svc.cpuUtilizationPct}%</strong>
                </div>

                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Throughput</span>
                  <strong className="text-sky-400 text-base">{svc.throughputRps} RPS</strong>
                </div>
              </div>

              {/* Progress bar for CPU */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Capacity Utilization</span>
                  <span>{svc.cpuUtilizationPct}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      svc.cpuUtilizationPct > 80 ? 'bg-rose-500' : svc.cpuUtilizationPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${svc.cpuUtilizationPct}%` }}
                  />
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
