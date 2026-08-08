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
      <div className="glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#e1efe6] text-emerald-800 border border-[#bcdcc7] rounded-xl">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-800 font-mono">Microservices Topology & Horizontal Pod Autoscaler</h2>
              <p className="text-xs text-stone-600 mt-0.5">
                Horizontal Scalability architecture with automated load balancing and latency optimization under high traffic surges.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onTriggerSurge}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#3b7a57] hover:bg-[#2d6144] text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
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
                  ? 'bg-amber-50/90 border-amber-300 shadow-xs'
                  : 'glass-card'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#e2ddd0]">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-800" />
                  <h3 className="text-xs font-bold text-stone-800 font-mono">{svc.serviceName}</h3>
                </div>

                <span
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded font-mono ${
                    isSurging
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                      : 'bg-[#e1efe6] text-emerald-800 border border-[#bcdcc7]'
                  }`}
                >
                  {svc.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 bg-[#fbf9f5] rounded-lg border border-[#dcd6c8]">
                  <span className="text-stone-500 text-[10px] block">Active Pod Replicas</span>
                  <strong className="text-emerald-900 text-base">{svc.instancesCount} Pods</strong>
                </div>

                <div className="p-2 bg-[#fbf9f5] rounded-lg border border-[#dcd6c8]">
                  <span className="text-stone-500 text-[10px] block">Avg Latency</span>
                  <strong className="text-emerald-800 text-base">{svc.latencyMs} ms</strong>
                </div>

                <div className="p-2 bg-[#fbf9f5] rounded-lg border border-[#dcd6c8]">
                  <span className="text-stone-500 text-[10px] block">CPU Load</span>
                  <strong className="text-amber-800 text-base">{svc.cpuUtilizationPct}%</strong>
                </div>

                <div className="p-2 bg-[#fbf9f5] rounded-lg border border-[#dcd6c8]">
                  <span className="text-stone-500 text-[10px] block">Throughput</span>
                  <strong className="text-stone-800 text-base">{svc.throughputRps} RPS</strong>
                </div>
              </div>

              {/* Progress bar for CPU */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-stone-600">
                  <span>Capacity Utilization</span>
                  <span>{svc.cpuUtilizationPct}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#e8e3d5] rounded-full overflow-hidden border border-[#d2cbba]">
                  <div
                    className={`h-full transition-all duration-300 ${
                      svc.cpuUtilizationPct > 80 ? 'bg-rose-700' : svc.cpuUtilizationPct > 50 ? 'bg-amber-600' : 'bg-[#3b7a57]'
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
