import React, { useState } from 'react';
import { Database, ShieldCheck, ArrowDownLeft, ArrowUpRight, Filter, Plus, RefreshCw, Key, Hash, FileSpreadsheet } from 'lucide-react';
import { InventoryTransaction } from '../types/mrp';

interface InventoryLedgerProps {
  ledger: InventoryTransaction[];
  onAddStockAdjustment: (partNumber: string, partName: string, quantityChange: number, location: string) => void;
}

export const InventoryLedger: React.FC<InventoryLedgerProps> = ({ ledger, onAddStockAdjustment }) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  // Adjustment Modal
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false);
  const [partNumberInput, setPartNumberInput] = useState('CELL-4680-NCMA');
  const [partNameInput, setPartNameInput] = useState('4680 NCMA Li-Ion Cell');
  const [qtyChangeInput, setQtyChangeInput] = useState(500);
  const [locationInput, setLocationInput] = useState('Warehouse A-01');

  const filteredLedger = filterType === 'ALL' ? ledger : ledger.filter((t) => t.type === filterType);

  const handleAdjSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddStockAdjustment(partNumberInput, partNameInput, Number(qtyChangeInput), locationInput);
    setIsAdjModalOpen(false);
  };

  const typeBadge = (type: InventoryTransaction['type']) => {
    switch (type) {
      case 'PROCUREMENT_RECEIPT':
        return <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-mono font-semibold">PROCUREMENT IN</span>;
      case 'CONSUMPTION_WO':
        return <span className="px-2 py-0.5 text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded font-mono font-semibold">WO CONSUMPTION</span>;
      case 'PRODUCTION_MO':
        return <span className="px-2 py-0.5 text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded font-mono font-semibold">MO FINISHED</span>;
      case 'ADJUSTMENT':
        return <span className="px-2 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-mono font-semibold">ADJUSTMENT</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded font-mono">{type}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white font-mono">Atomic Double-Entry Inventory Ledger</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time stock movement ledger with SHA-256 cryptographic transaction hashes for tamper verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAdjModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Post Adjustment</span>
          </button>
        </div>
      </div>

      {/* Ledger Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-mono">Filter Ledger:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-950 text-white border border-slate-800 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
            >
              <option value="ALL">All Ledger Movements</option>
              <option value="PROCUREMENT_RECEIPT">Procurement Receipt</option>
              <option value="CONSUMPTION_WO">WO Material Consumption</option>
              <option value="PRODUCTION_MO">MO Production Stock In</option>
              <option value="ADJUSTMENT">Manual Stock Adjustments</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Cryptographic Hash Ledger Chain Intact</span>
          </div>
        </div>

        {/* Transaction Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Part Details</th>
                <th className="py-3 px-3 text-right">Qty Change</th>
                <th className="py-3 px-3 text-right">Balance After</th>
                <th className="py-3 px-3">Reference / Location</th>
                <th className="py-3 px-3 font-mono">Crypto Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredLedger.map((tx) => {
                const isPositive = tx.quantityChange > 0;
                return (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">{typeBadge(tx.type)}</td>

                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-white">{tx.partNumber}</div>
                      <div className="text-[11px] text-slate-400">{tx.partName}</div>
                    </td>

                    <td className={`py-3 px-3 text-right font-mono font-bold whitespace-nowrap ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPositive ? `+${tx.quantityChange.toLocaleString()}` : tx.quantityChange.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-200">
                      {tx.balanceAfter.toLocaleString()}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-mono text-slate-300">{tx.referenceId}</div>
                      <div className="text-[11px] text-slate-400">{tx.location}</div>
                    </td>

                    <td className="py-3 px-3 font-mono text-[10px] text-amber-300/80 bg-slate-950/80 rounded px-2 py-1 border border-slate-800 whitespace-nowrap">
                      {tx.txHash}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* Manual Stock Adjustment Modal */}
      {isAdjModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white space-y-4">
            <h3 className="text-sm font-bold font-mono">Post Manual Inventory Ledger Movement</h3>

            <form onSubmit={handleAdjSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Part Number</label>
                <input
                  type="text"
                  required
                  value={partNumberInput}
                  onChange={(e) => setPartNumberInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 font-mono text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Part Description</label>
                <input
                  type="text"
                  required
                  value={partNameInput}
                  onChange={(e) => setPartNameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Quantity Change (+ or -)</label>
                <input
                  type="number"
                  required
                  value={qtyChangeInput}
                  onChange={(e) => setQtyChangeInput(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 font-mono text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Warehouse Location</label>
                <input
                  type="text"
                  required
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg"
                >
                  Post to Hash Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
