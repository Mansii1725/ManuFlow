import React, { useState } from 'react';
import { Database, ShieldCheck, Filter, Plus } from 'lucide-react';
import { InventoryTransaction } from '../types/mrp';

interface InventoryLedgerProps {
  ledger: InventoryTransaction[];
  onAddStockAdjustment: (partNumber: string, partName: string, quantityChange: number, location: string) => void;
}

export const InventoryLedger: React.FC<InventoryLedgerProps> = ({ ledger, onAddStockAdjustment }) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  // Adjustment Modal
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false);
  const [partNumberInput, setPartNumberInput] = useState('OAK-PLANK-01');
  const [partNameInput, setPartNameInput] = useState('Solid Oak Timber Plank 2m');
  const [qtyChangeInput, setQtyChangeInput] = useState(100);
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
        return <span className="px-2.5 py-0.5 text-[11px] bg-[#e1efe6] text-emerald-800 border border-[#bcdcc7] rounded-md font-mono font-bold">PROCUREMENT IN</span>;
      case 'CONSUMPTION_WO':
        return <span className="px-2.5 py-0.5 text-[11px] bg-rose-100 text-rose-800 border border-rose-200 rounded-md font-mono font-bold">WO CONSUMPTION</span>;
      case 'PRODUCTION_MO':
        return <span className="px-2.5 py-0.5 text-[11px] bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-md font-mono font-bold">MO FINISHED</span>;
      case 'ADJUSTMENT':
        return <span className="px-2.5 py-0.5 text-[11px] bg-amber-100 text-amber-800 border border-amber-200 rounded-md font-mono font-bold">ADJUSTMENT</span>;
      default:
        return <span className="px-2.5 py-0.5 text-[11px] bg-stone-200 text-stone-700 border border-stone-300 rounded-md font-mono">{type}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#e1efe6] text-emerald-800 border border-[#bcdcc7] rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-800">Inventory Ledger & Material Movements</h2>
              <p className="text-xs text-stone-600 mt-0.5">
                Real-time stock ledger with transaction references and balance tracking across warehouse locations.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsAdjModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#3b7a57] hover:bg-[#2d6144] text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Post Stock Adjustment</span>
        </button>
      </div>

      {/* Ledger Table Container */}
      <div className="glass-card p-5 space-y-4">
        
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#e2ddd0] text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-stone-500" />
            <span className="text-stone-700 font-semibold">Filter Ledger:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-style py-1.5"
            >
              <option value="ALL" className="bg-[#fbf9f5] text-stone-800">All Stock Movements</option>
              <option value="PROCUREMENT_RECEIPT" className="bg-[#fbf9f5] text-stone-800">Procurement Receipt</option>
              <option value="CONSUMPTION_WO" className="bg-[#fbf9f5] text-stone-800">WO Material Consumption</option>
              <option value="PRODUCTION_MO" className="bg-[#fbf9f5] text-stone-800">MO Production Stock In</option>
              <option value="ADJUSTMENT" className="bg-[#fbf9f5] text-stone-800">Manual Stock Adjustments</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-stone-600 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span className="font-medium">Audit Ledger Intact</span>
          </div>
        </div>

        {/* Transaction Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-[#f0ebe0] text-stone-700 font-mono text-[11px] uppercase border-b border-[#e2ddd0]">
              <tr>
                <th className="py-3 px-3 font-semibold">Timestamp</th>
                <th className="py-3 px-3 font-semibold">Type</th>
                <th className="py-3 px-3 font-semibold">Part Details</th>
                <th className="py-3 px-3 text-right font-semibold">Qty Change</th>
                <th className="py-3 px-3 text-right font-semibold">Balance After</th>
                <th className="py-3 px-3 font-semibold">Reference / Location</th>
                <th className="py-3 px-3 font-mono font-semibold">Tx ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8e3d5] font-sans">
              {filteredLedger.map((tx) => {
                const isPositive = tx.quantityChange > 0;
                return (
                  <tr key={tx.id} className="hover:bg-[#f3efea] transition">
                    <td className="py-3 px-3 font-mono text-xs text-stone-500 whitespace-nowrap">
                      {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">{typeBadge(tx.type)}</td>

                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-stone-800">{tx.partNumber}</div>
                      <div className="text-[11px] text-stone-500">{tx.partName}</div>
                    </td>

                    <td className={`py-3 px-3 text-right font-mono font-bold whitespace-nowrap ${isPositive ? 'text-emerald-800' : 'text-rose-800'}`}>
                      {isPositive ? `+${tx.quantityChange.toLocaleString()}` : tx.quantityChange.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-stone-900">
                      {tx.balanceAfter.toLocaleString()}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-mono font-semibold text-stone-800">{tx.referenceId}</div>
                      <div className="text-[11px] text-stone-500">{tx.location}</div>
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] text-stone-600 bg-[#f7f5ef] rounded px-2 py-1 border border-[#dcd6c8] whitespace-nowrap">
                      {tx.txHash ? tx.txHash.substring(0, 12) + '...' : tx.id}
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
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#fbf9f5] border border-[#d6d0c0] max-w-md w-full p-6 text-stone-800 space-y-4 shadow-xl rounded-2xl">
            <h3 className="text-base font-bold text-stone-800">Post Inventory Stock Movement</h3>

            <form onSubmit={handleAdjSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Part Number</label>
                <input
                  type="text"
                  required
                  value={partNumberInput}
                  onChange={(e) => setPartNumberInput(e.target.value)}
                  className="input-style font-mono"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Part Description</label>
                <input
                  type="text"
                  required
                  value={partNameInput}
                  onChange={(e) => setPartNameInput(e.target.value)}
                  className="input-style font-medium"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Quantity Change (+ or -)</label>
                <input
                  type="number"
                  required
                  value={qtyChangeInput}
                  onChange={(e) => setQtyChangeInput(Number(e.target.value))}
                  className="input-style font-mono"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Warehouse Location</label>
                <input
                  type="text"
                  required
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  className="input-style font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAdjModalOpen(false)}
                  className="px-4 py-2 bg-[#eae5d8] hover:bg-[#ded8c8] text-stone-700 font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#3b7a57] hover:bg-[#2d6144] text-white font-semibold rounded-xl cursor-pointer shadow-xs"
                >
                  Post to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
