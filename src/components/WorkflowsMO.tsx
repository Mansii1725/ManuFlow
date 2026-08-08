import React, { useState } from 'react';
import { Workflow, Play, CheckCircle2, AlertCircle, Plus, Clock, User, ArrowRight, ShieldCheck, Factory, Filter } from 'lucide-react';
import { ManufacturingOrder, WorkOrder, OrderStatus, User as UserType } from '../types/mrp';

interface WorkflowsMOProps {
  orders: ManufacturingOrder[];
  currentUser: UserType;
  onUpdateWoStatus: (woId: string, newStatus: OrderStatus) => Promise<{ success?: boolean; error?: string }>;
  onCreateMo: (productPartNumber: string, targetQuantity: number, priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => void;
}

export const WorkflowsMO: React.FC<WorkflowsMOProps> = ({ orders, currentUser, onUpdateWoStatus, onCreateMo }) => {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [transitionError, setTransitionError] = useState<string | null>(null);

  // New MO Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProductPart, setSelectedProductPart] = useState('TBL-WOOD-001');
  const [targetQuantityInput, setTargetQuantityInput] = useState(10);
  const [priorityInput, setPriorityInput] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');

  const filteredOrders = statusFilter === 'ALL' ? orders : orders.filter((o) => o.status === statusFilter);

  const handleStatusChangeClick = async (woId: string, newStatus: OrderStatus) => {
    setTransitionError(null);
    const result = await onUpdateWoStatus(woId, newStatus);
    if (result.error) {
      setTransitionError(result.error);
    }
  };

  const handleCreateMoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateMo(selectedProductPart, targetQuantityInput, priorityInput);
    setIsCreateModalOpen(false);
  };

  const statusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PLANNED':
        return <span className="px-2.5 py-1 text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200 rounded-lg">PLANNED</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 rounded-lg">IN PROGRESS</span>;
      case 'DONE':
        return <span className="px-2.5 py-1 text-xs font-semibold bg-[#e1efe6] text-emerald-800 border border-[#b8dbc4] rounded-lg">COMPLETED</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold bg-stone-200 text-stone-700 rounded-lg">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#e1efe6] text-emerald-800 border border-[#bcdcc7] rounded-xl">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-800">Manufacturing Orders & Routing Sequence</h2>
              <p className="text-xs text-stone-600 mt-0.5">
                Track sequential work orders, assign operators, and record production completions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Pills */}
          <div className="flex bg-[#eae5d8] border border-[#d6d0c0] p-1 rounded-xl text-xs font-medium">
            {(['ALL', 'PLANNED', 'IN_PROGRESS', 'DONE'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  statusFilter === st ? 'bg-[#3b7a57] text-white font-bold shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {st === 'ALL' ? 'All Orders' : st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#3b7a57] hover:bg-[#2d6144] text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Order</span>
          </button>
        </div>
      </div>

      {/* Transition Rule Error Alert */}
      {transitionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-rose-900">Workflow Sequence Constraint Exception</h4>
            <p className="mt-0.5 text-rose-700">{transitionError}</p>
          </div>
          <button
            onClick={() => setTransitionError(null)}
            className="text-rose-600 hover:text-rose-900 text-xs font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-6">
        {filteredOrders.map((mo) => (
          <div key={mo.id} className="glass-card p-6 space-y-5">
            
            {/* Manufacturing Order Title */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#e2ddd0]">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-emerald-900 bg-[#e1efe6] px-3 py-1 rounded-xl border border-[#bcdcc7]">
                  {mo.orderNumber}
                </span>
                <div>
                  <h3 className="text-base font-bold text-stone-800">{mo.productName}</h3>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Part ID: <strong className="text-stone-800 font-mono">{mo.productPartNumber}</strong> &bull; Target Quantity:{' '}
                    <strong className="text-stone-800 font-semibold">{mo.targetQuantity} units</strong> &bull; Estimated Cost:{' '}
                    <strong className="text-emerald-800 font-semibold">${mo.totalEstimatedCost.toLocaleString()}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {statusBadge(mo.status)}
                <span className="text-xs font-medium text-stone-600">
                  Priority: <strong className="text-amber-800">{mo.priority}</strong>
                </span>
              </div>
            </div>

            {/* Work Orders Sequence Cards */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 font-mono">
                Work Center Operations & Execution Sequence
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mo.workOrders.map((wo) => {
                  const isDone = wo.status === 'DONE';
                  const isInProgress = wo.status === 'IN_PROGRESS';

                  return (
                    <div
                      key={wo.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition ${
                        isDone
                          ? 'bg-[#f2f8f4] border-[#c0e0cc]'
                          : isInProgress
                          ? 'bg-[#fef8ed] border-[#f2d8b2]'
                          : 'bg-[#faf8f4] border-[#e0dad0]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-mono font-bold text-emerald-900 bg-[#e8e3d5] px-2 py-0.5 rounded border border-[#d2cbba]">
                            Step {wo.sequence}
                          </span>
                          {statusBadge(wo.status)}
                        </div>

                        <h5 className="text-sm font-bold text-stone-800 leading-snug mb-1">{wo.operationName}</h5>
                        <p className="text-xs text-stone-600 font-medium">{wo.workCenter}</p>

                        {wo.assignedOperator && (
                          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-stone-600">
                            <User className="w-3.5 h-3.5 text-stone-500" />
                            <span>Operator: <strong className="text-stone-800">{wo.assignedOperator}</strong></span>
                          </div>
                        )}
                      </div>

                      {/* State Transition Actions */}
                      <div className="pt-3 border-t border-[#e2ddd0]">
                        {wo.status === 'PLANNED' && (
                          <button
                            onClick={() => handleStatusChangeClick(wo.id, 'IN_PROGRESS')}
                            className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>Start Operation</span>
                          </button>
                        )}

                        {wo.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => handleStatusChangeClick(wo.id, 'DONE')}
                            className="w-full py-2 bg-[#3b7a57] hover:bg-[#2d6144] text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Complete</span>
                          </button>
                        )}

                        {wo.status === 'DONE' && (
                          <div className="py-1.5 bg-[#e1efe6] text-emerald-800 border border-[#b8dbc4] text-xs font-semibold rounded-lg text-center flex items-center justify-center gap-1">
                            <ShieldCheck className="w-4 h-4 text-emerald-700" />
                            <span>Operation Completed</span>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Create New Manufacturing Order Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#fbf9f5] border border-[#d6d0c0] max-w-md w-full p-6 text-stone-800 space-y-4 shadow-xl rounded-2xl">
            <h3 className="text-base font-bold text-stone-800">Create Manufacturing Order (MO)</h3>

            <form onSubmit={handleCreateMoSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Target Product Recipe</label>
                <select
                  value={selectedProductPart}
                  onChange={(e) => setSelectedProductPart(e.target.value)}
                  className="input-style"
                >
                  <option value="TBL-WOOD-001" className="bg-[#fbf9f5] text-stone-800">TBL-WOOD-001 (Wooden Table - Solid Oak)</option>
                  <option value="EV-DRIVE-800KW" className="bg-[#fbf9f5] text-stone-800">EV-DRIVE-800KW (800kW EV Drive Unit)</option>
                  <option value="BAT-PACK-100KWH" className="bg-[#fbf9f5] text-stone-800">BAT-PACK-100KWH (100kWh Battery Pack)</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Target Production Quantity</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  required
                  value={targetQuantityInput}
                  onChange={(e) => setTargetQuantityInput(Number(e.target.value))}
                  className="input-style font-mono"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Order Priority</label>
                <select
                  value={priorityInput}
                  onChange={(e) => setPriorityInput(e.target.value as any)}
                  className="input-style"
                >
                  <option value="LOW" className="bg-[#fbf9f5] text-stone-800">LOW</option>
                  <option value="MEDIUM" className="bg-[#fbf9f5] text-stone-800">MEDIUM</option>
                  <option value="HIGH" className="bg-[#fbf9f5] text-stone-800">HIGH</option>
                  <option value="CRITICAL" className="bg-[#fbf9f5] text-stone-800">CRITICAL</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-[#eae5d8] hover:bg-[#ded8c8] text-stone-700 font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#3b7a57] hover:bg-[#2d6144] text-white font-semibold rounded-xl cursor-pointer shadow-xs"
                >
                  Dispatch Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

