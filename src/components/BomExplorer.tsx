import React, { useState } from 'react';
import { Layers, ChevronRight, ChevronDown, Package, Plus, Calculator, Layers3 } from 'lucide-react';
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
    bom_tbl_001: true,
  });

  // Exploded BOM Calculator States
  const [selectedProductPart, setSelectedProductPart] = useState('TBL-WOOD-001');
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
      FINISHED_GOOD: 'bg-[#e1efe6] text-emerald-900 border-[#b2d8be]',
      SUB_ASSEMBLY: 'bg-teal-100 text-teal-900 border-teal-200',
      RAW_MATERIAL: 'bg-amber-100 text-amber-900 border-amber-200',
      COMPONENT: 'bg-stone-200 text-stone-800 border-stone-300',
    };

    return (
      <div key={node.id} className="select-none">
        <div
          className="flex items-center justify-between p-3 rounded-xl border border-[#dcd6c8] hover:border-[#3b7a57] bg-[#fbf9f5] transition mb-1.5 text-xs shadow-2xs"
          style={{ marginLeft: `${depth * 20}px` }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {hasChildren ? (
              <button
                onClick={() => toggleNode(node.id)}
                className="p-1 text-stone-500 hover:text-stone-900 rounded hover:bg-stone-200 cursor-pointer"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <div className="w-6" />
            )}

            <Package className="w-4 h-4 text-stone-500 shrink-0" />

            <span className="font-mono font-bold text-emerald-900">{node.partNumber}</span>
            <span className="text-stone-800 truncate font-medium">{node.name}</span>

            <span className={`px-2 py-0.5 text-[10px] rounded-md border font-semibold ${categoryColors[node.category]}`}>
              {node.category.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-4 text-stone-700 text-xs shrink-0 font-medium">
            <div>
              <span className="text-stone-500">Qty Req: </span>
              <strong className="text-stone-900">{node.quantityRequired} {node.unitOfMeasure}</strong>
            </div>

            <div>
              <span className="text-stone-500">Unit Cost: </span>
              <strong className="text-emerald-800">${node.unitCost.toLocaleString()}</strong>
            </div>

            <div className="flex items-center gap-1 bg-[#f0ebd9] px-2 py-1 rounded-lg border border-[#d2cbba] font-mono text-[11px]">
              <span className="text-stone-500">Stock: </span>
              <strong className={node.currentStock < node.reorderPoint ? 'text-rose-700 font-bold' : 'text-stone-800'}>
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
      
      {/* Top Banner */}
      <div className="glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#e1efe6] text-emerald-800 border border-[#bcdcc7] rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-800">Multi-Level Bill of Materials (BOM)</h2>
              <p className="text-xs text-stone-600 mt-0.5">
                Hierarchical tree recipe structure for finished goods, sub-assemblies, and raw component parts.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#3b7a57] hover:bg-[#2d6144] text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add BOM Part</span>
        </button>
      </div>

      {/* Main Grid: Tree View + Exploded Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: BOM Tree Hierarchy */}
        <div className="lg:col-span-7 glass-card p-5 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#e2ddd0]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 font-mono">
              Assembly Recipe Tree
            </h3>
            <span className="text-xs text-stone-500">Click arrows to expand parts</span>
          </div>

          <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
            {bomData.map((node) => renderBomTreeNode(node, 0))}
          </div>
        </div>

        {/* Right Column: Exploded BOM Requirement Engine */}
        <div className="lg:col-span-5 glass-card p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#e2ddd0]">
            <Calculator className="w-4 h-4 text-emerald-800" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 font-mono">
              Exploded BOM Requirement Engine
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Target Product</label>
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
              <label className="block text-xs font-semibold text-stone-700 mb-1">Production Batch Quantity</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={targetBatchQuantity}
                  onChange={(e) => setTargetBatchQuantity(Math.max(1, Number(e.target.value)))}
                  className="input-style font-mono"
                />
                <button
                  onClick={handleCalculateExplosion}
                  disabled={isCalculating}
                  className="px-4 py-2 bg-[#3b7a57] hover:bg-[#2d6144] text-white font-semibold rounded-xl text-xs transition flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                >
                  <Layers3 className="w-4 h-4" />
                  <span>{isCalculating ? 'Exploding...' : 'Explode BOM'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Calculation Results Output */}
          {explodedResults && (
            <div className="pt-3 border-t border-[#e2ddd0] space-y-3">
              <div className="p-4 bg-[#e1efe6] border border-[#b8dbc4] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-900 font-semibold block">Total Estimated Material Cost</span>
                  <p className="text-lg font-bold font-mono text-emerald-800 mt-0.5">
                    ${calculatedTotalCost?.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-stone-600 block">Required Parts</span>
                  <p className="text-xs font-bold text-stone-900">{explodedResults.length} Components</p>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 text-xs">
                {explodedResults.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      item.reorderNeeded
                        ? 'bg-rose-50 border-rose-200 text-rose-800'
                        : 'bg-[#fbf9f5] border-[#dcd6c8] text-stone-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-mono font-bold">
                        <span>{item.partNumber}</span>
                        {item.reorderNeeded && (
                          <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 text-[10px] rounded font-semibold border border-rose-200">
                            Reorder Needed
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-600 truncate max-w-[180px]">{item.name}</p>
                    </div>

                    <div className="text-right font-mono">
                      <div className="font-bold text-stone-900">
                        {item.requiredQty.toLocaleString()} {item.uom}
                      </div>
                      <div className="text-[11px] text-stone-500">Stock: {item.stock.toLocaleString()}</div>
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
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#fbf9f5] border border-[#d6d0c0] max-w-md w-full p-6 text-stone-800 space-y-4 shadow-xl rounded-2xl">
            <h3 className="text-base font-bold text-stone-800">Register New Part in BOM Catalog</h3>

            <form onSubmit={handleAddNewItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Part Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SENSOR-TEMP-800V"
                  value={newPartNumber}
                  onChange={(e) => setNewPartNumber(e.target.value)}
                  className="input-style font-mono"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Part / Component Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. High Precision Thermal Sensor"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="input-style font-medium"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Category Classification</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="input-style"
                >
                  <option value="FINISHED_GOOD" className="bg-[#fbf9f5] text-stone-800">Finished Good</option>
                  <option value="SUB_ASSEMBLY" className="bg-[#fbf9f5] text-stone-800">Sub-assembly</option>
                  <option value="COMPONENT" className="bg-[#fbf9f5] text-stone-800">Component</option>
                  <option value="RAW_MATERIAL" className="bg-[#fbf9f5] text-stone-800">Raw Material</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Unit Cost ($)</label>
                  <input
                    type="number"
                    value={newUnitCost}
                    onChange={(e) => setNewUnitCost(Number(e.target.value))}
                    className="input-style font-mono"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(Number(e.target.value))}
                    className="input-style font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-[#eae5d8] hover:bg-[#ded8c8] text-stone-700 font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#3b7a57] hover:bg-[#2d6144] text-white font-semibold rounded-xl cursor-pointer shadow-xs"
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
