import React, { useState, useEffect } from 'react';
import { Layers, Workflow, Database, ShoppingBag, ShieldCheck, Server, Lock, Cpu, Factory, User, FileText, CheckCircle2, Clock, AlertTriangle, TrendingUp, ChevronRight, Menu, X } from 'lucide-react';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { BomExplorer } from './components/BomExplorer';
import { WorkflowsMO } from './components/WorkflowsMO';
import { WorkCentersMaster } from './components/WorkCentersMaster';
import { InventoryLedger } from './components/InventoryLedger';
import { ProcurementDb } from './components/ProcurementDb';
import { SecurityRbacAudit } from './components/SecurityRbacAudit';
import { MicroservicesScale } from './components/MicroservicesScale';
import { CloudSyncModal } from './components/CloudSyncModal';
import { UserProfileModal } from './components/UserProfileModal';
import { UserReportsModal } from './components/UserReportsModal';

import {
  INITIAL_USERS,
  INITIAL_BOM,
  INITIAL_MANUFACTURING_ORDERS,
  INITIAL_LEDGER,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_AUDIT_LOGS,
  INITIAL_MICROSERVICES,
  INITIAL_CLOUD_CONFIG,
} from './data/mockData';
import { User as UserType, Role, BomItem, ManufacturingOrder, InventoryTransaction, PurchaseOrder, AuditLogEntry, ServiceMetric, CloudStorageConfig, RateLimitStatus } from './types/mrp';

export default function App() {
  // Navigation Active Tab
  const [activeTab, setActiveTab] = useState<'BOM' | 'WORKFLOWS' | 'WORK_CENTERS' | 'LEDGER' | 'PROCUREMENT' | 'SECURITY' | 'MICROSERVICES'>('WORKFLOWS');

  // Sidebar Toggle on Mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Profile and Reports Modal Drawers
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);

  // User State
  const [currentUser, setCurrentUser] = useState<UserType>(INITIAL_USERS[0]); // Default Admin

  // Data States
  const [bomData, setBomData] = useState<BomItem[]>(INITIAL_BOM);
  const [manufacturingOrders, setManufacturingOrders] = useState<ManufacturingOrder[]>(INITIAL_MANUFACTURING_ORDERS);
  const [inventoryLedger, setInventoryLedger] = useState<InventoryTransaction[]>(INITIAL_LEDGER);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(INITIAL_PURCHASE_ORDERS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [microservices, setMicroservices] = useState<ServiceMetric[]>(INITIAL_MICROSERVICES);
  const [cloudConfig, setCloudConfig] = useState<CloudStorageConfig>(INITIAL_CLOUD_CONFIG);

  // Rate Limiter State
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus>({
    totalRequests: 1420,
    blockedRequests: 142,
    currentRps: 48,
    tokensAvailable: 96,
    maxBucketCapacity: 100,
    activeIpCount: 4,
  });

  // Modal Dialog Controllers
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState<'OTP' | 'PASSWORD_GEN' | 'TWO_FACTOR' | 'RECOVERY'>('OTP');
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);

  // Sync state from backend express APIs periodically
  useEffect(() => {
    fetchDataFromBackend();
  }, []);

  const fetchDataFromBackend = async () => {
    try {
      const [bomRes, ordersRes, ledgerRes, poRes, auditRes, rateRes, svcRes, cloudRes] = await Promise.all([
        fetch('/api/mrp/bom').then((r) => r.json()),
        fetch('/api/mrp/orders').then((r) => r.json()),
        fetch('/api/mrp/ledger').then((r) => r.json()),
        fetch('/api/procurement/orders').then((r) => r.json()),
        fetch(`/api/security/audit?role=${currentUser.role}`).then((r) => r.json()),
        fetch('/api/security/ratelimit').then((r) => r.json()),
        fetch('/api/microservices/metrics').then((r) => r.json()),
        fetch('/api/cloud/sync').then((r) => r.json()),
      ]);

      if (bomRes.bom) setBomData(bomRes.bom);
      if (ordersRes.orders) setManufacturingOrders(ordersRes.orders);
      if (ledgerRes.ledger) setInventoryLedger(ledgerRes.ledger);
      if (poRes.purchaseOrders) setPurchaseOrders(poRes.purchaseOrders);
      if (auditRes.auditLogs) setAuditLogs(auditRes.auditLogs);
      if (rateRes.status) setRateLimitStatus(rateRes.status);
      if (svcRes.services) setMicroservices(svcRes.services);
      if (cloudRes.config) setCloudConfig(cloudRes.config);
    } catch (e) {
      console.warn('Backend API Sync Fallback to local state', e);
    }
  };

  // Role Change Handler
  const handleRoleChange = (newRole: Role) => {
    const foundUser = INITIAL_USERS.find((u) => u.role === newRole);
    if (foundUser) {
      setCurrentUser(foundUser);
    } else {
      setCurrentUser({ ...currentUser, role: newRole });
    }
  };

  // Open Auth Modal
  const handleOpenAuthModal = (mode: 'OTP' | 'PASSWORD_GEN' | 'TWO_FACTOR' | 'RECOVERY') => {
    setAuthModalInitialTab(mode);
    setIsAuthModalOpen(true);
  };

  // Add BOM Item
  const handleAddBomItem = async (newItem: BomItem) => {
    try {
      const res = await fetch('/api/mrp/bom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
      const data = await res.json();
      if (res.ok && data.item) {
        setBomData((prev) => [...prev, data.item]);
      } else {
        setBomData((prev) => [...prev, newItem]);
      }
    } catch (e) {
      setBomData((prev) => [...prev, newItem]);
    }
    fetchDataFromBackend();
  };

  // Work Order Status Change (PLANNED -> IN_PROGRESS -> DONE)
  const handleUpdateWoStatus = async (woId: string, newStatus: any) => {
    try {
      const res = await fetch(`/api/mrp/workorders/${woId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus, operatorEmail: currentUser.email }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'State transition rejected' };
      }
      fetchDataFromBackend();
      return { success: true };
    } catch (e: any) {
      return { error: e.message || 'Server error' };
    }
  };

  // Create Manufacturing Order (MO)
  const handleCreateMo = async (productPartNumber: string, targetQuantity: number, priority: any) => {
    try {
      let name = '800kW EV Drive Unit';
      if (productPartNumber === 'TBL-WOOD-001') name = 'Wooden Table (Solid Oak)';
      else if (productPartNumber === 'BAT-PACK-100KWH') name = '100kWh Battery Pack';

      const res = await fetch('/api/mrp/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productPartNumber,
          productName: name,
          targetQuantity,
          priority,
          createdBy: currentUser.email,
        }),
      });
      const data = await res.json();
      if (res.ok && data.order) {
        setManufacturingOrders((prev) => [data.order, ...prev]);
      }
    } catch (e) {
      console.error(e);
    }
    fetchDataFromBackend();
  };

  // Manual Stock Adjustment
  const handleAddStockAdjustment = async (partNumber: string, partName: string, quantityChange: number, location: string) => {
    try {
      await fetch('/api/mrp/ledger/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partNumber,
          partName,
          quantityChange,
          location,
          performedBy: currentUser.email,
        }),
      });
      fetchDataFromBackend();
    } catch (e) {
      console.error(e);
    }
  };

  // Issue Purchase Order
  const handleCreatePo = async (partNumber: string, partName: string, quantity: number, unitPrice: number, supplier: string) => {
    try {
      await fetch('/api/procurement/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierName: supplier,
          partNumber,
          partName,
          quantityOrdered: quantity,
          unitPrice,
          createdReason: 'Manual PO Issued by Procurement Officer',
        }),
      });
      fetchDataFromBackend();
    } catch (e) {
      console.error(e);
    }
  };

  // Receive Purchase Order (Injects stock into ledger)
  const handleReceivePo = async (poId: string) => {
    try {
      await fetch(`/api/procurement/orders/${poId}/receive`, {
        method: 'PUT',
      });
      fetchDataFromBackend();
    } catch (e) {
      console.error(e);
    }
  };

  // Trigger Traffic Surge (Microservices scale)
  const handleTriggerSurge = async () => {
    try {
      const res = await fetch('/api/microservices/surge', { method: 'POST' });
      const data = await res.json();
      if (data.services) setMicroservices(data.services);
    } catch (e) {
      console.error(e);
    }
  };

  // Trigger Cloud Sync
  const handleTriggerCloudSync = async (provider: CloudStorageConfig['provider']) => {
    try {
      await fetch('/api/cloud/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      fetchDataFromBackend();
    } catch (e) {
      console.error(e);
    }
  };

  // Compute Master KPIs
  const completedOrdersCount = manufacturingOrders.filter((o) => o.status === 'DONE').length;
  const inProgressOrdersCount = manufacturingOrders.filter((o) => o.status === 'IN_PROGRESS').length;
  const plannedOrdersCount = manufacturingOrders.filter((o) => o.status === 'PLANNED').length;
  const totalValuation = manufacturingOrders.reduce((sum, o) => sum + (o.totalEstimatedCost || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col md:flex-row">
      
      {/* Mobile Top Header Toggle */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-600/30 text-indigo-400 rounded-lg">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <span className="font-bold font-mono text-white text-sm">NEXUS MRP</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-slate-800 text-slate-200 rounded-lg"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Left Sidebar Master Navigation */}
      <aside
        className={`fixed md:sticky top-0 inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 transition-transform duration-300 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } h-screen shrink-0`}
      >
        <div className="space-y-6">
          
          {/* Brand & App Title */}
          <div className="flex items-center gap-3 px-2 pt-2">
            <div className="p-2.5 bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Cpu className="w-6 h-6 animate-pulse text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold tracking-tight text-white font-mono">NEXUS MRP</h1>
                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                  v3.8
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Manufacturing & Ledger ERP</p>
            </div>
          </div>

          {/* Left Sidebar User Profile Card ("My Profile" & "My Reports") */}
          <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600/30 border border-indigo-500/40 rounded-xl flex items-center justify-center font-bold font-mono text-indigo-300 text-sm">
                {currentUser.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-white font-mono truncate">{currentUser.name}</h4>
                <p className="text-[10px] text-indigo-400 font-medium truncate">{currentUser.role}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center justify-center gap-1 px-2 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-[10px] font-semibold rounded-lg transition"
              >
                <User className="w-3 h-3 text-indigo-400" />
                <span>My Profile</span>
              </button>

              <button
                onClick={() => setIsReportsOpen(true)}
                className="flex items-center justify-center gap-1 px-2 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-[10px] font-semibold rounded-lg transition"
              >
                <FileText className="w-3 h-3 text-amber-400" />
                <span>My Reports</span>
              </button>
            </div>
          </div>

          {/* Master Navigation Links */}
          <nav className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono px-2 mb-2">
              Master Controls
            </p>

            <button
              onClick={() => { setActiveTab('WORKFLOWS'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'WORKFLOWS'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Workflow className="w-4 h-4" />
                <span>Manufacturing Orders</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-950/80 rounded border border-slate-700/50">
                {manufacturingOrders.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('WORK_CENTERS'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'WORK_CENTERS'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Factory className="w-4 h-4" />
                <span>Work Centers Master</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('BOM'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'BOM'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4" />
                <span>Bills of Materials (BOM)</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-950/80 rounded border border-slate-700/50">
                {bomData.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('LEDGER'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'LEDGER'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4" />
                <span>Stock Hash Ledger</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('PROCUREMENT'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'PROCUREMENT'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4" />
                <span>Procurement DB</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('SECURITY'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'SECURITY'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Security & Audit</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('MICROSERVICES'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'MICROSERVICES'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Server className="w-4 h-4" />
                <span>Microservices Scale</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-slate-800/80 text-[10px] text-slate-400 space-y-1">
          <div className="flex items-center justify-between">
            <span>E2E Protection:</span>
            <span className="text-emerald-400 font-mono font-bold">AES-256</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Cloud Storage:</span>
            <span className="text-sky-300 font-mono">{cloudConfig.provider}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <Header
          currentUser={currentUser}
          onRoleChange={handleRoleChange}
          cloudConfig={cloudConfig}
          rateLimitStatus={rateLimitStatus}
          onOpenAuthModal={handleOpenAuthModal}
          onOpenCloudSync={() => setIsCloudSyncOpen(true)}
          onOpenSurgeModal={handleTriggerSurge}
        />

        {/* Real-time Metrics Dashboard KPI Banner */}
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono block">Orders Completed</span>
                <span className="text-lg font-bold font-mono text-emerald-400">{completedOrdersCount} MOs</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono block">In-Progress MOs</span>
                <span className="text-lg font-bold font-mono text-amber-400">{inProgressOrdersCount} Active</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
                <Workflow className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono block">Planned Orders</span>
                <span className="text-lg font-bold font-mono text-indigo-300">{plannedOrdersCount} Queued</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono block">Factory Throughput</span>
                <span className="text-lg font-bold font-mono text-sky-300">${(totalValuation / 1000).toFixed(1)}k</span>
              </div>
            </div>

          </div>

          {/* Active Tab View Render */}
          <div className="pb-12">
            {activeTab === 'WORKFLOWS' && (
              <WorkflowsMO
                orders={manufacturingOrders}
                currentUser={currentUser}
                onUpdateWoStatus={handleUpdateWoStatus}
                onCreateMo={handleCreateMo}
              />
            )}

            {activeTab === 'WORK_CENTERS' && <WorkCentersMaster />}

            {activeTab === 'BOM' && <BomExplorer bomData={bomData} onAddBomItem={handleAddBomItem} />}

            {activeTab === 'LEDGER' && (
              <InventoryLedger ledger={inventoryLedger} onAddStockAdjustment={handleAddStockAdjustment} />
            )}

            {activeTab === 'PROCUREMENT' && (
              <ProcurementDb
                purchaseOrders={purchaseOrders}
                onCreatePo={handleCreatePo}
                onReceivePo={handleReceivePo}
              />
            )}

            {activeTab === 'SECURITY' && (
              <SecurityRbacAudit
                auditLogs={auditLogs}
                currentUser={currentUser}
                rateLimitStatus={rateLimitStatus}
              />
            )}

            {activeTab === 'MICROSERVICES' && (
              <MicroservicesScale services={microservices} onTriggerSurge={handleTriggerSurge} />
            )}
          </div>

        </div>

      </div>

      {/* Auth & Security Modal Dialog */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialTab={authModalInitialTab}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          fetchDataFromBackend();
        }}
      />

      {/* Cloud Storage Integration Sync Modal */}
      <CloudSyncModal
        isOpen={isCloudSyncOpen}
        onClose={() => setIsCloudSyncOpen(false)}
        config={cloudConfig}
        onTriggerSync={handleTriggerCloudSync}
      />

      {/* User Profile Modal Drawer ("My Profile") */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
      />

      {/* User Work Duration & Tasks Report Modal Drawer ("My Reports") */}
      <UserReportsModal
        isOpen={isReportsOpen}
        onClose={() => setIsReportsOpen(false)}
        currentUser={currentUser}
        orders={manufacturingOrders}
      />

    </div>
  );
}
