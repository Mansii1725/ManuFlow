import React, { useState, useEffect } from 'react';
import { Layers, Workflow, Database, ShoppingBag, ShieldCheck, Server, Lock, Cpu } from 'lucide-react';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { BomExplorer } from './components/BomExplorer';
import { WorkflowsMO } from './components/WorkflowsMO';
import { InventoryLedger } from './components/InventoryLedger';
import { ProcurementDb } from './components/ProcurementDb';
import { SecurityRbacAudit } from './components/SecurityRbacAudit';
import { MicroservicesScale } from './components/MicroservicesScale';
import { CloudSyncModal } from './components/CloudSyncModal';

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
import { User, Role, BomItem, ManufacturingOrder, InventoryTransaction, PurchaseOrder, AuditLogEntry, ServiceMetric, CloudStorageConfig, RateLimitStatus } from './types/mrp';

export default function App() {
  // Navigation Active Tab
  const [activeTab, setActiveTab] = useState<'BOM' | 'WORKFLOWS' | 'LEDGER' | 'PROCUREMENT' | 'SECURITY' | 'MICROSERVICES'>('BOM');

  // User State
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]); // Default Admin

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
      const res = await fetch('/api/mrp/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productPartNumber,
          productName: productPartNumber === 'EV-DRIVE-800KW' ? '800kW EV Drive Unit' : '100kWh Battery Pack',
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-12">
      
      {/* Top Navigation Header */}
      <Header
        currentUser={currentUser}
        onRoleChange={handleRoleChange}
        cloudConfig={cloudConfig}
        rateLimitStatus={rateLimitStatus}
        onOpenAuthModal={handleOpenAuthModal}
        onOpenCloudSync={() => setIsCloudSyncOpen(true)}
        onOpenSurgeModal={handleTriggerSurge}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Navigation Module Tabs Bar */}
        <nav className="flex items-center gap-2 overflow-x-auto p-1.5 bg-slate-900 border border-slate-800 rounded-2xl scrollbar-none">
          <button
            onClick={() => setActiveTab('BOM')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'BOM'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Recursive BOM Hierarchy</span>
          </button>

          <button
            onClick={() => setActiveTab('WORKFLOWS')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'WORKFLOWS'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Workflow className="w-4 h-4" />
            <span>MO & Work Orders Execution</span>
          </button>

          <button
            onClick={() => setActiveTab('LEDGER')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'LEDGER'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Atomic Inventory Hash Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab('PROCUREMENT')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'PROCUREMENT'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Procurement Database & POs</span>
          </button>

          <button
            onClick={() => setActiveTab('SECURITY')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'SECURITY'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>RBAC, E2E Audit & Rate Limiting</span>
          </button>

          <button
            onClick={() => setActiveTab('MICROSERVICES')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'MICROSERVICES'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Microservices & Autoscaling</span>
          </button>
        </nav>

        {/* Tab Content Rendering */}
        <div className="pt-2">
          {activeTab === 'BOM' && <BomExplorer bomData={bomData} onAddBomItem={handleAddBomItem} />}

          {activeTab === 'WORKFLOWS' && (
            <WorkflowsMO
              orders={manufacturingOrders}
              currentUser={currentUser}
              onUpdateWoStatus={handleUpdateWoStatus}
              onCreateMo={handleCreateMo}
            />
          )}

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

      </main>

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

    </div>
  );
}
