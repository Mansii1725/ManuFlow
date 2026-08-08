import React, { useState } from 'react';
import { ShoppingBag, Truck, CheckCircle2, Plus, ArrowRight, Clock, AlertTriangle, Building2, PackageCheck } from 'lucide-react';
import { PurchaseOrder } from '../types/mrp';

interface ProcurementDbProps {
  purchaseOrders: PurchaseOrder[];
  onCreatePo: (partNumber: string, partName: string, quantity: number, unitPrice: number, supplier: string) => void;
  onReceivePo: (poId: string) => void;
}

export const ProcurementDb: React.FC<ProcurementDbProps> = ({ purchaseOrders, onCreatePo, onReceivePo }) => {
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [supplierInput, setSupplierInput] = useState('GigaCell Energy Ltd');
  const [partNumInput, setPartNumInput] = useState('CELL-4680-NCMA');
  const [partNameInput, setPartNameInput] = useState('4680 NCMA Li-Ion Cell');
  const [qtyInput, setQtyInput] = useState(10000);
  const [priceInput, setPriceInput] = useState(6.5);

  const handleSubmitPo = (e: React.FormEvent) => {
    e.preventDefault();
    onCreatePo(partNumInput, partNameInput, qtyInput, priceInput, supplierInput);
    setIsPoModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white font-mono">Procurement Database & Supplier Reorder Engine</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated Reorder Point (ROP) PO dispatch and real-time vendor receiving stock injection.
          </p>
        </div>

        <button
          onClick={() => setIsPoModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>Issue Purchase Order</span>
        </button>
      </div>

      {/* PO Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {purchaseOrders.map((po) => {
          const isReceived = po.status === 'RECEIVED';
          const isInTransit = po.status === 'IN_TRANSIT';

          return (
            <div
              key={po.id}
              className={`p-5 rounded-2xl border space-y-4 transition ${
                isReceived
                  ? 'bg-emerald-950/20 border-emerald-800/40'
                  : isInTransit
                  ? 'bg-amber-950/20 border-amber-800/50'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {po.poNumber}
                  </span>
                  <span className="text-xs font-bold text-white font-mono">{po.supplierName}</span>
                </div>

                <span
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                    isReceived
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : isInTransit
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {po.status}
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Material Part:</span>
                  <strong className="text-white font-mono">{po.partNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Quantity Ordered:</span>
                  <strong className="text-white font-mono">{po.quantityOrdered.toLocaleString()} PCS</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Valuation:</span>
                  <strong className="text-emerald-400 font-mono">${po.totalCost.toLocaleString()}</strong>
                </div>
                <div className="text-[11px] text-slate-400 pt-1">
                  <em>Reason: {po.createdReason}</em>
                </div>
              </div>

              {!isReceived && (
                <div className="pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => onReceivePo(po.id)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow transition flex items-center justify-center gap-1.5"
                  >
                    <PackageCheck className="w-4 h-4" />
                    <span>Receive Shipment & Inject Stock into Ledger</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* New PO Modal */}
      {isPoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white space-y-4">
            <h3 className="text-sm font-bold font-mono">Issue Purchase Order to Supplier</h3>

            <form onSubmit={handleSubmitPo} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Supplier Name</label>
                <input
                  type="text"
                  required
                  value={supplierInput}
                  onChange={(e) => setSupplierInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Part Number</label>
                <input
                  type="text"
                  required
                  value={partNumInput}
                  onChange={(e) => setPartNumInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    value={qtyInput}
                    onChange={(e) => setQtyInput(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Unit Price ($)</label>
                  <input
                    type="number"
                    required
                    value={priceInput}
                    onChange={(e) => setPriceInput(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPoModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg"
                >
                  Issue Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
