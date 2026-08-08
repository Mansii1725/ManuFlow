import React, { useState } from 'react';
import { Layers, ChevronRight, ChevronDown, Package, Plus, Calculator, AlertTriangle, Layers3, ArrowUpRight, DollarSign, Clock, ShieldAlert } from 'lucide-react';
import { BomItem } from '../types/mrp';

interface BomExplorerProps {
  bomData: BomItem[];
  onAddBomItem: (newItem: BomItem) => void;
}

export const BomExplorer: React.FC<BomExplorerProps> = ({ bomData, onAddBomItem }) => {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    bom_ev_drive_800: true,
    bom_sub_battery: true,
    bom_sub_motor: true,
  });

  // Exploded BOM Calculator States
  const [selectedProductPart, setSelectedProductPart] = useState('EV-DRIVE-800KW');
  const [targetBatchQuantity, setTargetBatchQuantity] = useState(25);
  const [explodedResults, setExplodedResults] = useState<any[] | null>(null);
  const [calculatedTotalCost, setCalculatedTotalCost] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // New Item Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPartNumber, setNewPartNumber] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<'FINISHED_GOOD' | 'SUB_ASSEMBLY' | 'RAW_MATERIAL' | 'COMPONENT'>('COMPONENT');
  const [newUnitCost, setNewUnitCost] = useState(150);
  const [newStock, setNewStock] = useState(500);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  // Run Exploded BOM Calculation via API
  const handleCalculateExplosion = async () => {
    setIsCalculating(true);
    try {
      const res = await fetch(`/api/mrp/bom/explode/${selectedProductPart}?quantity=${targetBatchQuantity}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Explosion calculation failed');

      setExplodedResults(data.explodedRequirements);
      setCalculatedTotalCost(data.totalCalculatedCost);
    } catch (err) {
      console.error('Explosion error', err);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartNumber || !newName) return;

    onAddBomItem({
      id: `bom_${Date.now()}`,
      partNumber: newPartNumber,
      name: newName,
      category: newCategory,
      quantityRequired: 1,
      unitOfMeasure: 'PCS',
      unitCost: newUnitCost,
      scrapFactor: 0.02,
      currentStock: newStock,
      reorderPoint: 50,
      leadTimeDays: 7,
    });

    setIsAddModalOpen(false);
    setNewPartNumber('');
    setNewName('');
  };

  // Recursive Tree Component Render
  const renderBomTreeNode = (node: BomItem, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = !!expandedNodes[node.id];

    const categoryColors = {
      FINISHED_GOOD: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
      SUB_ASSEMBLY: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
      RAW_MATERIAL: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      COMPONENT: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
    };

    return (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center justify-between p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60 transition mb-1 text-xs`}
          style={{ marginLeft: `${depth * 20}px` }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {hasChildren ? (
              <button
                onClick={() => toggleNode(node.id)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <div className="w-5" />
            )}

            <Package className="w-4 h-4 text-slate-400 shrink-0" />

            <span className="font-mono font-semibold text-slate-200">{node.partNumber}</span>
            <span className="text-slate-300 truncate font-medium">{node.name}</span>

            <span className={`px-2 py-0.5 text-[10px] rounded-md border font-semibold ${categoryColors[node.category]}`}>
              {node.category.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 text-[11px] shrink-0">
            <div>
              <span>Qty Req: </span>
              <strong className="text-white">{node.quantityRequired} {node.unitOfMeasure}</strong>
            </div>

            <div>
              <span>Scrap Factor: </span>
              <strong className="text-amber-400">{((node.scrapFactor || 0) * 100).toFixed(1)}%</strong>
            </div>

            <div>
              <span>Unit Cost: </span>
              <strong className="text-emerald-400">${node.unitCost.toLocaleString()}</strong>
            </div>

            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
              <span>Stock: </span>
              <strong className={node.currentStock < node.reorderPoint ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                {node.currentStock.toLocaleString()}
              </strong>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {node.children!.map((child) => renderBomTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Control Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white font-mono">Recursive Multi-Level Bill of Materials (BOM)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Hierarchical recipe mapping for Assemblies, Sub-assemblies, Components & Raw Materials with Scrap Adjustments.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add BOM Item</span>
        </button>
      </div>

      {/* Main Grid: Tree View + Exploded Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: BOM Tree Hierarchy */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              Assembly Hierarchy Tree
            </h3>
            <span className="text-[11px] text-slate-400">Click arrows to expand sub-assemblies</span>
          </div>

          <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
            {bomData.map((node) => renderBomTreeNode(node, 0))}
          </div>
        </div>

        {/* Right Column: Exploded BOM Requirement Engine */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Calculator className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
              Exploded BOM Requirement Engine
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Select Target Finished Good</label>
              <select
                value={selectedProductPart}
                onChange={(e) => setSelectedProductPart(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="EV-DRIVE-800KW">EV-DRIVE-800KW (800kW EV Drive Unit)</option>
                <option value="BAT-PACK-100KWH">BAT-PACK-100KWH (100kWh Battery Pack)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Production Batch Quantity</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={targetBatchQuantity}
                  onChange={(e) => setTargetBatchQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleCalculateExplosion}
                  disabled={isCalculating}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs transition flex items-center gap-1.5 shrink-0"
                >
                  <Layers3 className="w-3.5 h-3.5" />
                  <span>{isCalculating ? 'Exploding...' : 'Explode BOM'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Calculation Results Output */}
          {explodedResults && (
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-emerald-300 font-medium">Calculated Rollup Cost</span>
                  <p className="text-base font-bold font-mono text-emerald-400">
                    ${calculatedTotalCost?.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400">Unique Components</span>
                  <p className="text-xs font-bold text-slate-200">{explodedResults.length} Items</p>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {explodedResults.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border flex items-center justify-between ${
                      item.reorderNeeded
                        ? 'bg-rose-950/30 border-rose-800/60 text-rose-200'
                        : 'bg-slate-950 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-mono font-semibold">
                        <span>{item.partNumber}</span>
                        {item.reorderNeeded && (
                          <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-300 text-[9px] rounded border border-rose-500/30">
                            Reorder Needed
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate max-w-[180px]">{item.name}</p>
                    </div>

                    <div className="text-right font-mono">
                      <div className="font-bold text-white">
                        {item.requiredQty.toLocaleString()} {item.uom}
                      </div>
                      <div className="text-[10px] text-slate-400">Stock: {item.stock.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Add New BOM Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white space-y-4">
            <h3 className="text-sm font-bold font-mono">Register New Part in BOM Catalog</h3>

            <form onSubmit={handleAddNewItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Part Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SENSOR-TEMP-800V"
                  value={newPartNumber}
                  onChange={(e) => setNewPartNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Part / Component Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. High Precision Thermal Sensor"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Category Classification</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="FINISHED_GOOD">Finished Good</option>
                  <option value="SUB_ASSEMBLY">Sub-assembly</option>
                  <option value="COMPONENT">Component</option>
                  <option value="RAW_MATERIAL">Raw Material</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Unit Cost ($)</label>
                  <input
                    type="number"
                    value={newUnitCost}
                    onChange={(e) => setNewUnitCost(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
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
                  Save to BOM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
