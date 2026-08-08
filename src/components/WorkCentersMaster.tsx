import React, { useState } from 'react';
import { Factory, Wrench, Clock, DollarSign, Activity, AlertTriangle, Plus, CheckCircle2, PauseCircle, Power, BarChart3 } from 'lucide-react';

export interface WorkCenterItem {
  id: string;
  code: string;
  name: string;
  location: string;
  hourlyRate: number; // $ per hour
  capacityUnitsPerDay: number;
  status: 'OPERATIONAL' | 'MAINTENANCE' | 'IDLE';
  utilizationPct: number;
  activeOperator?: string;
  downtimeLogs: { id: string; timestamp: string; reason: string; durationMinutes: number }[];
}

export const INITIAL_WORK_CENTERS: WorkCenterItem[] = [
  {
    id: 'wc_01',
    code: 'WC-ASY-01',
    name: 'Assembly Line Alpha',
    location: 'Building A - Bay 1',
    hourlyRate: 65.0,
    capacityUnitsPerDay: 40,
    status: 'OPERATIONAL',
    utilizationPct: 88,
    activeOperator: 'Elena Rostova',
    downtimeLogs: [
      { id: 'dt_101', timestamp: '2026-08-06 14:20', reason: 'Pneumatic Screwdriver Calibration', durationMinutes: 25 },
    ],
  },
  {
    id: 'wc_02',
    code: 'WC-PNT-02',
    name: 'Paint Floor Beta',
    location: 'Building A - Spray Enclosure 2',
    hourlyRate: 85.0,
    capacityUnitsPerDay: 30,
    status: 'OPERATIONAL',
    utilizationPct: 76,
    activeOperator: 'Marcus Vance',
    downtimeLogs: [
      { id: 'dt_102', timestamp: '2026-08-07 09:10', reason: 'IR Lamp Heating Element Replacement', durationMinutes: 40 },
    ],
  },
  {
    id: 'wc_03',
    code: 'WC-PKG-03',
    name: 'Packaging Line Gamma',
    location: 'Building B - Shipping Terminal',
    hourlyRate: 45.0,
    capacityUnitsPerDay: 100,
    status: 'OPERATIONAL',
    utilizationPct: 92,
    activeOperator: 'Elena Rostova',
    downtimeLogs: [],
  },
  {
    id: 'wc_04',
    code: 'WC-BAT-04',
    name: 'Station Alpha - Battery Bay',
    location: 'Cleanroom Facility 1',
    hourlyRate: 120.0,
    capacityUnitsPerDay: 15,
    status: 'OPERATIONAL',
    utilizationPct: 95,
    activeOperator: 'Elena Rostova',
    downtimeLogs: [
      { id: 'dt_103', timestamp: '2026-08-05 11:00', reason: 'High-Voltage Isolation Barrier Audit', durationMinutes: 15 },
    ],
  },
  {
    id: 'wc_05',
    code: 'WC-WND-05',
    name: 'Station Beta - Precision Winding',
    location: 'Building B - Heavy CNC Wing',
    hourlyRate: 110.0,
    capacityUnitsPerDay: 20,
    status: 'MAINTENANCE',
    utilizationPct: 42,
    activeOperator: 'Unassigned',
    downtimeLogs: [
      { id: 'dt_104', timestamp: '2026-08-08 07:00', reason: 'Scheduled Spindle Bearing Lubrication', durationMinutes: 120 },
    ],
  },
  {
    id: 'wc_06',
    code: 'WC-QA-06',
    name: 'Station Delta - End of Line QA',
    location: 'Building C - Testing Lab',
    hourlyRate: 95.0,
    capacityUnitsPerDay: 50,
    status: 'OPERATIONAL',
    utilizationPct: 81,
    activeOperator: 'Patricia Hayes',
    downtimeLogs: [],
  },
];

export const WorkCentersMaster: React.FC = () => {
  const [workCenters, setWorkCenters] = useState<WorkCenterItem[]>(INITIAL_WORK_CENTERS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCenterForDowntime, setSelectedCenterForDowntime] = useState<WorkCenterItem | null>(null);

  // Form States
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newRate, setNewRate] = useState(75);
  const [newCapacity, setNewCapacity] = useState(50);

  // Downtime Log Form
  const [downtimeReason, setDowntimeReason] = useState('');
  const [downtimeMins, setDowntimeMins] = useState(30);

  const handleToggleStatus = (id: string) => {
    setWorkCenters((prev) =>
      prev.map((wc) => {
        if (wc.id === id) {
          const nextStatus = wc.status === 'OPERATIONAL' ? 'MAINTENANCE' : wc.status === 'MAINTENANCE' ? 'IDLE' : 'OPERATIONAL';
          return { ...wc, status: nextStatus };
        }
        return wc;
      })
    );
  };

  const handleAddWorkCenter = (e: React.FormEvent) => {
    e.preventDefault();
    const newWc: WorkCenterItem = {
      id: `wc_${Date.now()}`,
      code: newCode || `WC-NEW-${Math.floor(10 + Math.random() * 89)}`,
      name: newName,
      location: newLocation || 'Building A - Main Floor',
      hourlyRate: Number(newRate),
      capacityUnitsPerDay: Number(newCapacity),
      status: 'OPERATIONAL',
      utilizationPct: 75,
      activeOperator: 'On Demand',
      downtimeLogs: [],
    };
    setWorkCenters([newWc, ...workCenters]);
    setIsAddModalOpen(false);
    setNewName('');
    setNewCode('');
  };

  const handleAddDowntimeLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCenterForDowntime) return;

    const newLog = {
      id: `dt_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      reason: downtimeReason,
      durationMinutes: Number(downtimeMins),
    };

    setWorkCenters((prev) =>
      prev.map((wc) => {
        if (wc.id === selectedCenterForDowntime.id) {
          return {
            ...wc,
            status: 'MAINTENANCE',
            utilizationPct: Math.max(20, wc.utilizationPct - 15),
            downtimeLogs: [newLog, ...wc.downtimeLogs],
          };
        }
        return wc;
      })
    );

    setSelectedCenterForDowntime(null);
    setDowntimeReason('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Factory className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white font-mono">Work Centers Master & Machine Costing</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time machine status tracking, hourly cost calculation ($/hr), maintenance logs, and live capacity utilization %.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Work Center</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Work Centers</span>
            <Factory className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{workCenters.length} Stations</div>
          <p className="text-[11px] text-slate-400">Shop floor machinery & assembly bays</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Operational</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {workCenters.filter((w) => w.status === 'OPERATIONAL').length} / {workCenters.length}
          </div>
          <p className="text-[11px] text-emerald-400/80">Running at optimal throughput</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Avg Hourly Rate</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            ${(workCenters.reduce((acc, w) => acc + w.hourlyRate, 0) / (workCenters.length || 1)).toFixed(2)}/hr
          </div>
          <p className="text-[11px] text-slate-400">Direct operational machine cost</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Avg Utilization %</span>
            <BarChart3 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-sky-400">
            {Math.round(workCenters.reduce((acc, w) => acc + w.utilizationPct, 0) / (workCenters.length || 1))}%
          </div>
          <p className="text-[11px] text-slate-400">Shift workload efficiency rating</p>
        </div>
      </div>

      {/* Work Centers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workCenters.map((wc) => {
          const isOperational = wc.status === 'OPERATIONAL';
          const isMaintenance = wc.status === 'MAINTENANCE';

          return (
            <div key={wc.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {wc.code}
                    </span>
                    <h3 className="text-sm font-bold text-white font-mono mt-1">{wc.name}</h3>
                    <p className="text-xs text-slate-400">{wc.location}</p>
                  </div>

                  <button
                    onClick={() => handleToggleStatus(wc.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                      isOperational
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                        : isMaintenance
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                    title="Click to toggle status (Operational -> Maintenance -> Idle)"
                  >
                    {wc.status}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Hourly Costing</span>
                    <span className="font-mono font-bold text-amber-400">${wc.hourlyRate.toFixed(2)}/hr</span>
                  </div>

                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Daily Capacity</span>
                    <span className="font-mono font-bold text-white">{wc.capacityUnitsPerDay} units/day</span>
                  </div>
                </div>

                {/* Utilization Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Capacity Utilization</span>
                    <span className="font-mono font-bold text-sky-400">{wc.utilizationPct}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-500 ${
                        wc.utilizationPct > 90 ? 'bg-amber-500' : wc.utilizationPct > 70 ? 'bg-indigo-500' : 'bg-sky-500'
                      }`}
                      style={{ width: `${wc.utilizationPct}%` }}
                    />
                  </div>
                </div>

                {/* Downtime Logs Section */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-mono font-bold">Downtime Logs ({wc.downtimeLogs.length})</span>
                    <button
                      onClick={() => setSelectedCenterForDowntime(wc)}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium underline"
                    >
                      + Log Event
                    </button>
                  </div>

                  {wc.downtimeLogs.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No downtime recorded for this station.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                      {wc.downtimeLogs.map((dt) => (
                        <div key={dt.id} className="p-1.5 bg-slate-950 rounded border border-slate-800/60 text-[11px] text-slate-300 flex items-start justify-between gap-2">
                          <div>
                            <p className="text-rose-300 font-medium leading-tight">{dt.reason}</p>
                            <span className="text-[9px] text-slate-400">{dt.timestamp}</span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-amber-400 shrink-0">{dt.durationMinutes}m</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-800/60 flex items-center justify-between">
                <span>Active Operator: <strong className="text-slate-200">{wc.activeOperator || 'None'}</strong></span>
                <span className="font-mono">ID: {wc.id}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add New Work Center */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold font-mono">Create Work Center Station</h3>

            <form onSubmit={handleAddWorkCenter} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Station Code</label>
                <input
                  type="text"
                  placeholder="e.g. WC-CNC-07"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Work Center Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Precision CNC Milling Station"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Factory Location / Wing</label>
                <input
                  type="text"
                  placeholder="e.g. Building B - CNC Hall"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Hourly Cost ($/hr)</label>
                  <input
                    type="number"
                    min={10}
                    max={500}
                    value={newRate}
                    onChange={(e) => setNewRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Capacity (Units/Day)</label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg"
                >
                  Save Station
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Log Downtime Event */}
      {selectedCenterForDowntime && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold font-mono">
              Log Machine Downtime: {selectedCenterForDowntime.name}
            </h3>

            <form onSubmit={handleAddDowntimeLog} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Downtime Reason / Fault Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hydraulic pressure sensor fault"
                  value={downtimeReason}
                  onChange={(e) => setDowntimeReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Duration (Minutes)</label>
                <input
                  type="number"
                  min={5}
                  max={1440}
                  value={downtimeMins}
                  onChange={(e) => setDowntimeMins(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCenterForDowntime(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-lg"
                >
                  Record Downtime & Flag Maintenance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
