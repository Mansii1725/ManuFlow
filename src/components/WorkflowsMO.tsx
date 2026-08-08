import React, { useState } from 'react';
import { Workflow, Play, CheckCircle2, AlertOctagon, Plus, Clock, User, ArrowRight, ShieldCheck, Factory, Filter } from 'lucide-react';
import { ManufacturingOrder, WorkOrder, OrderStatus, User as UserType } from '../types/mrp';

interface WorkflowsMOProps {
  orders: ManufacturingOrder[];
  currentUser: UserType;
  onUpdateWoStatus: (woId: string, newStatus: OrderStatus) => Promise<{ success?: boolean; error?: string }>;
  onCreateMo: (productPartNumber: string, targetQuantity: number, priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => void;
}

export const WorkflowsMO: React.FC<WorkflowsMOProps> = ({ orders, currentUser, onUpdateWoStatus, onCreateMo }) => {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [activeTab, setActiveTab] = useState<'KANBAN' | 'LIST'>('KANBAN');
  const [transitionError, setTransitionError] = useState<string | null>(null);

  // New MO Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProductPart, setSelectedProductPart] = useState('EV-DRIVE-800KW');
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
        return <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-300 border border-slate-700 rounded-md font-semibold">PLANNED</span>;
      case 'IN_PROGRESS':
        return <span className="px-2 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md font-semibold">IN PROGRESS</span>;
      case 'DONE':
        return <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md font-semibold">DONE</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-400 rounded-md font-semibold">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Workflow className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white font-mono">State-Driven MO & Work Order Execution</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enforced sequential transitions: Planned &rarr; In Progress &rarr; Done with automated atomic material posting.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter Buttons */}
          <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
            {(['ALL', 'PLANNED', 'IN_PROGRESS', 'DONE'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  statusFilter === st ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* Workflow Transition Error Banner if Rule Violation Occurs */}
      {transitionError && (
        <div className="p-4 bg-rose-950/70 border border-rose-800 text-rose-200 rounded-2xl text-xs flex items-start gap-3 shadow-lg">
          <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-rose-300">State Transition Validation Rule Exception</h4>
            <p className="mt-0.5 text-rose-200">{transitionError}</p>
          </div>
          <button
            onClick={() => setTransitionError(null)}
            className="text-rose-400 hover:text-rose-200 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Orders List View / Cards */}
      <div className="space-y-6">
        {filteredOrders.map((mo) => (
          <div key={mo.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            
            {/* Manufacturing Order Header Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                  {mo.orderNumber}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">{mo.productName}</h3>
                  <p className="text-xs text-slate-400">
                    Part: <strong className="text-slate-200">{mo.productPartNumber}</strong> | Target Qty:{' '}
                    <strong className="text-white">{mo.targetQuantity} units</strong> | Est. Cost:${' '}
                    <strong className="text-emerald-400">{mo.totalEstimatedCost.toLocaleString()}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                {statusBadge(mo.status)}
                <span className="text-slate-400 text-[11px]">
                  Priority: <strong className="text-amber-400">{mo.priority}</strong>
                </span>
              </div>
            </div>

            {/* Work Orders Operations Pipeline Sequence */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                Routing Operations & Work Center Sequence
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {mo.workOrders.map((wo) => {
                  const isDone = wo.status === 'DONE';
                  const isInProgress = wo.status === 'IN_PROGRESS';

                  return (
                    <div
                      key={wo.id}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-3 transition ${
                        isDone
                          ? 'bg-emerald-950/20 border-emerald-800/40'
                          : isInProgress
                          ? 'bg-amber-950/20 border-amber-800/50'
                          : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-[11px] mb-1.5">
                          <span className="font-mono font-bold text-indigo-300">Seq {wo.sequence}</span>
                          {statusBadge(wo.status)}
                        </div>

                        <h5 className="text-xs font-bold text-white leading-tight mb-1">{wo.operationName}</h5>
                        <p className="text-[11px] text-slate-400 font-mono">{wo.workCenter}</p>

                        {wo.assignedOperator && (
                          <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-300">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>Op: {wo.assignedOperator}</span>
                          </div>
                        )}
                      </div>

                      {/* State Transition Actions */}
                      <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                        {wo.status === 'PLANNED' && (
                          <button
                            onClick={() => handleStatusChangeClick(wo.id, 'IN_PROGRESS')}
                            className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs transition flex items-center justify-center gap-1"
                          >
                            <Play className="w-3.5 h-3.5 fill-slate-950" />
                            <span>Start Work Order</span>
                          </button>
                        )}

                        {wo.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => handleStatusChangeClick(wo.id, 'DONE')}
                            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-1 shadow"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark WO Complete</span>
                          </button>
                        )}

                        {wo.status === 'DONE' && (
                          <div className="p-1.5 bg-emerald-900/30 text-emerald-300 text-[11px] font-medium rounded text-center flex items-center justify-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold font-mono">Create Manufacturing Order (MO)</h3>

            <form onSubmit={handleCreateMoSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Target Finished Product</label>
                <select
                  value={selectedProductPart}
                  onChange={(e) => setSelectedProductPart(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="TBL-WOOD-001">TBL-WOOD-001 (Wooden Table - Solid Oak Recipe)</option>
                  <option value="EV-DRIVE-800KW">EV-DRIVE-800KW (800kW Electric Vehicle Drive Unit)</option>
                  <option value="BAT-PACK-100KWH">BAT-PACK-100KWH (100kWh Battery Pack)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Target Production Quantity</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  required
                  value={targetQuantityInput}
                  onChange={(e) => setTargetQuantityInput(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Order Priority</label>
                <select
                  value={priorityInput}
                  onChange={(e) => setPriorityInput(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg"
                >
                  Dispatch MO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
