import React, { useState } from 'react';
import { ShoppingBag, Plus, PackageCheck, Truck } from 'lucide-react';
import { PurchaseOrder } from '../types/mrp';

interface ProcurementDbProps {
  purchaseOrders: PurchaseOrder[];
  onCreatePo: (partNumber: string, partName: string, quantity: number, unitPrice: number, supplier: string) => void;
  onReceivePo: (poId: string) => void;
}

export const ProcurementDb: React.FC<ProcurementDbProps> = ({ purchaseOrders, onCreatePo, onReceivePo }) => {
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [supplierInput, setSupplierInput] = useState('TimberCraft Suppliers');
  const [partNumInput, setPartNumInput] = useState('OAK-PLANK-01');
  const [partNameInput, setPartNameInput] = useState('Solid Oak Timber Plank 2m');
  const [qtyInput, setQtyInput] = useState(500);
  const [priceInput, setPriceInput] = useState(12.5);

  const handleSubmitPo = (e: React.FormEvent) => {
    e.preventDefault();
    onCreatePo(partNumInput, partNameInput, qtyInput, priceInput, supplierInput);
    setIsPoModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#e1efe6] text-emerald-800 border border-[#bcdcc7] rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-800">Procurement & Supplier Purchase Orders</h2>
              <p className="text-xs text-stone-600 mt-0.5">
                Manage raw material procurement, track shipments, and receive vendor inventory stock directly into the ledger.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsPoModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#3b7a57] hover:bg-[#2d6144] text-white font-semibold rounded-xl text-xs shadow-xs transition cursor-pointer"
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
                  ? 'bg-[#e1efe6]/60 border-[#bcdcc7]'
                  : isInTransit
                  ? 'bg-amber-50/80 border-amber-200'
                  : 'glass-card'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#e2ddd0]">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                    {po.poNumber}
                  </span>
                  <span className="text-sm font-bold text-stone-800">{po.supplierName}</span>
                </div>

                <span
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                    isReceived
                      ? 'bg-[#e1efe6] text-emerald-800 border border-[#bcdcc7]'
                      : isInTransit
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-stone-200 text-stone-700 border border-stone-300'
                  }`}
                >
                  {po.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-stone-700">
                <div className="flex justify-between">
                  <span className="text-stone-500 font-medium">Material Part:</span>
                  <strong className="text-stone-800 font-mono">{po.partNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-medium">Quantity Ordered:</span>
                  <strong className="text-stone-800 font-mono">{po.quantityOrdered.toLocaleString()} PCS</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-medium">Total Valuation:</span>
                  <strong className="text-emerald-800 font-mono">${po.totalCost.toLocaleString()}</strong>
                </div>
                {po.createdReason && (
                  <div className="text-[11px] text-stone-500 pt-1 italic">
                    Reason: {po.createdReason}
                  </div>
                )}
              </div>

              {!isReceived && (
                <div className="pt-2 border-t border-[#e2ddd0]">
                  <button
                    onClick={() => onReceivePo(po.id)}
                    className="w-full py-2 bg-[#3b7a57] hover:bg-[#2d6144] text-white font-semibold rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <PackageCheck className="w-4 h-4" />
                    <span>Receive Shipment & Inject Stock</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* New PO Modal */}
      {isPoModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#fbf9f5] border border-[#d6d0c0] max-w-md w-full p-6 text-stone-800 space-y-4 shadow-xl rounded-2xl">
            <h3 className="text-base font-bold text-stone-800">Issue Purchase Order to Supplier</h3>

            <form onSubmit={handleSubmitPo} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Supplier Name</label>
                <input
                  type="text"
                  required
                  value={supplierInput}
                  onChange={(e) => setSupplierInput(e.target.value)}
                  className="input-style font-medium"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Part Number</label>
                <input
                  type="text"
                  required
                  value={partNumInput}
                  onChange={(e) => setPartNumInput(e.target.value)}
                  className="input-style font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    value={qtyInput}
                    onChange={(e) => setQtyInput(Number(e.target.value))}
                    className="input-style font-mono"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Unit Price ($)</label>
                  <input
                    type="number"
                    required
                    value={priceInput}
                    onChange={(e) => setPriceInput(Number(e.target.value))}
                    className="input-style font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPoModalOpen(false)}
                  className="px-4 py-2 bg-[#eae5d8] hover:bg-[#ded8c8] text-stone-700 font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#3b7a57] hover:bg-[#2d6144] text-white font-semibold rounded-xl cursor-pointer shadow-xs"
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
