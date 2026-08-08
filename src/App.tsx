import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Factory,
  LayoutDashboard,
  Package,
  Settings,
  Layers,
  ClipboardList,
  Timer,
  BookOpen,
  Landmark,
  Users,
  Receipt,
  FileText,
  TrendingUp,
  Plus,
  RefreshCw,
  LogOut,
  Play,
  Pause,
  CheckCircle2,
  Download,
  Shield,
  Clock,
  Award,
  ArrowRight,
  DollarSign,
  Box,
  ChevronRight,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { AuthScreen } from './components/AuthScreen';
import { UserProfileModal } from './components/UserProfileModal';
import { UserReportsModal } from './components/UserReportsModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { Role } from './types/mrp';
import { db } from './lib/firebase';
import { collection, doc, setDoc, getDocs, query, orderBy } from 'firebase/firestore';

// Types
export interface Product {
  id: string;
  name: string;
  type: 'Raw' | 'Finished';
  qtyOnHand: number;
  uom: string;
}

export interface WorkCenter {
  id: string;
  name: string;
  capacity: number; // hrs/day
  costPerHour: number; // ₹/hr
  downtimeHours: number;
}

export interface BomComponent {
  rawId: string;
  requiredQty: number;
}

export interface Bom {
  id: string;
  code: string;
  finishedProductId: string;
  components: BomComponent[];
}

export interface WorkOrderTask {
  id: string;
  name: string;
  wc: string;
  state: 'Pending' | 'In Progress' | 'Done';
  duration: number; // minutes
}

export interface ManufacturingOrder {
  id: string;
  moNumber: string;
  productId: string;
  targetQty: number;
  state: 'Planned' | 'In Progress' | 'Done';
  workOrders: WorkOrderTask[];
}

export interface StockEntry {
  id: string;
  timestamp: string;
  productName: string;
  ref: string;
  change: number;
  balance: number;
}

export interface Account {
  code: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
  balance: number;
}

export interface Contact {
  id: string;
  name: string;
  type: 'Vendor' | 'Customer' | 'Both';
  email: string;
  mobile: string;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customer: string;
  totalAmount: number;
  status: 'Draft' | 'Paid';
  date: string;
}

export interface JournalItem {
  id: string;
  date: string;
  account: string;
  narration: string;
  debit: number;
  credit: number;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
}

// Initial Pre-seeded DB state
const INITIAL_DATA = {
  products: [
    { id: '1', name: 'Steel Sheet (1mm)', type: 'Raw' as const, qtyOnHand: 500, uom: 'kg' },
    { id: '2', name: 'Aluminum Rod', type: 'Raw' as const, qtyOnHand: 300, uom: 'units' },
    { id: '3', name: 'Rubber Gasket', type: 'Raw' as const, qtyOnHand: 1000, uom: 'units' },
    { id: '4', name: 'M4 Steel Screws', type: 'Raw' as const, qtyOnHand: 5000, uom: 'units' },
    { id: '5', name: 'Electric Motor Assembly', type: 'Finished' as const, qtyOnHand: 12, uom: 'units' },
    { id: '6', name: 'Oak Wood Table', type: 'Finished' as const, qtyOnHand: 8, uom: 'units' }
  ],
  workCenters: [
    { id: '1', name: 'CNC Cutting Station', capacity: 8, costPerHour: 1500, downtimeHours: 0.5 },
    { id: '2', name: 'Welding & Brazing Bay', capacity: 8, costPerHour: 1200, downtimeHours: 1.0 },
    { id: '3', name: 'Assembly Line Alpha', capacity: 10, costPerHour: 800, downtimeHours: 0.5 }
  ],
  boms: [
    {
      id: 'b1', code: 'BOM-MOTOR-001', finishedProductId: '5',
      components: [
        { rawId: '1', requiredQty: 2 },
        { rawId: '2', requiredQty: 4 },
        { rawId: '4', requiredQty: 12 }
      ]
    },
    {
      id: 'b2', code: 'BOM-TABLE-002', finishedProductId: '6',
      components: [
        { rawId: '1', requiredQty: 5 },
        { rawId: '4', requiredQty: 24 }
      ]
    }
  ],
  mos: [
    {
      id: 'mo1', moNumber: 'MO-00001', productId: '5', targetQty: 5, state: 'In Progress' as const,
      workOrders: [
        { id: 'wo1', name: 'Cut & Stamp Casing', wc: 'CNC Cutting Station', state: 'Done' as const, duration: 30 },
        { id: 'wo2', name: 'Winding & Stator Assembly', wc: 'Assembly Line Alpha', state: 'In Progress' as const, duration: 45 }
      ]
    },
    {
      id: 'mo2', moNumber: 'MO-00002', productId: '6', targetQty: 10, state: 'Planned' as const,
      workOrders: [
        { id: 'wo3', name: 'Cut Legs & Frame', wc: 'CNC Cutting Station', state: 'Pending' as const, duration: 40 },
        { id: 'wo4', name: 'Fasten & Assemble', wc: 'Assembly Line Alpha', state: 'Pending' as const, duration: 50 }
      ]
    }
  ],
  stockLedger: [
    { id: 'st1', timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), productName: 'Steel Sheet (1mm)', ref: 'PO-9001', change: 200, balance: 500 },
    { id: 'st2', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), productName: 'Electric Motor Assembly', ref: 'MO-00000', change: 4, balance: 12 }
  ],
  coa: [
    { code: '1100', name: 'Cash / Bank Account', type: 'Asset' as const, balance: 150000 },
    { code: '1300', name: 'Accounts Receivable', type: 'Asset' as const, balance: 25000 },
    { code: '2100', name: 'Accounts Payable', type: 'Liability' as const, balance: 10000 },
    { code: '3100', name: 'Owner Equity', type: 'Equity' as const, balance: 165000 },
    { code: '4100', name: 'Sales Revenue', type: 'Income' as const, balance: 50000 },
    { code: '5100', name: 'Purchase Expense', type: 'Expense' as const, balance: 20000 }
  ],
  contacts: [
    { id: 'c1', name: 'Tata Steel Ltd', type: 'Vendor' as const, email: 'sales@tatasteel.com', mobile: '+91 98765 43210' },
    { id: 'c2', name: 'Mahindra Engineering', type: 'Customer' as const, email: 'orders@mahindra.com', mobile: '+91 98765 43211' },
    { id: 'c3', name: 'Reliance Polymers', type: 'Vendor' as const, email: 'supply@reliance.com', mobile: '+91 98765 43212' }
  ],
  salesOrders: [
    { id: 'so1', orderNumber: 'SO-00001', customer: 'Mahindra Engineering', totalAmount: 50000, status: 'Paid' as const, date: new Date().toISOString().split('T')[0] },
    { id: 'so2', orderNumber: 'SO-00002', customer: 'Mahindra Engineering', totalAmount: 35000, status: 'Draft' as const, date: new Date().toISOString().split('T')[0] }
  ],
  journal: [
    { id: 'j1', date: new Date().toISOString().split('T')[0], account: '1100 - Cash / Bank Account', narration: 'Invoiced payment for SO-00001', debit: 50000, credit: 0 },
    { id: 'j2', date: new Date().toISOString().split('T')[0], account: '4100 - Sales Revenue', narration: 'Revenue recognized for SO-00001', debit: 0, credit: 50000 }
  ]
};

export default function App() {
  // User Session State
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('ERP_USER');
    return saved ? JSON.parse(saved) : null;
  });

  // Active Tab State
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Master States
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('ERP_PRODUCTS');
    return saved ? JSON.parse(saved) : INITIAL_DATA.products;
  });

  const [workCenters, setWorkCenters] = useState<WorkCenter[]>(() => {
    const saved = localStorage.getItem('ERP_WORKCENTERS');
    return saved ? JSON.parse(saved) : INITIAL_DATA.workCenters;
  });

  const [boms, setBoms] = useState<Bom[]>(() => {
    const saved = localStorage.getItem('ERP_BOMS');
    return saved ? JSON.parse(saved) : INITIAL_DATA.boms;
  });

  const [mos, setMos] = useState<ManufacturingOrder[]>(() => {
    const saved = localStorage.getItem('ERP_MOS');
    return saved ? JSON.parse(saved) : INITIAL_DATA.mos;
  });

  const [stockLedger, setStockLedger] = useState<StockEntry[]>(() => {
    const saved = localStorage.getItem('ERP_STOCKLEDGER');
    return saved ? JSON.parse(saved) : INITIAL_DATA.stockLedger;
  });

  const [coa, setCoa] = useState<Account[]>(() => {
    const saved = localStorage.getItem('ERP_COA');
    return saved ? JSON.parse(saved) : INITIAL_DATA.coa;
  });

  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('ERP_CONTACTS');
    return saved ? JSON.parse(saved) : INITIAL_DATA.contacts;
  });

  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(() => {
    const saved = localStorage.getItem('ERP_SALESORDERS');
    return saved ? JSON.parse(saved) : INITIAL_DATA.salesOrders;
  });

  const [journal, setJournal] = useState<JournalItem[]>(() => {
    const saved = localStorage.getItem('ERP_JOURNAL');
    return saved ? JSON.parse(saved) : INITIAL_DATA.journal;
  });

  // Modals Drawer Controllers
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);

  // Form Modals
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddWcOpen, setIsAddWcOpen] = useState(false);
  const [isAddMoOpen, setIsAddMoOpen] = useState(false);
  const [isAddSoOpen, setIsAddSoOpen] = useState(false);

  // Form Inputs
  const [newProdName, setNewProdName] = useState('');
  const [newProdType, setNewProdType] = useState<'Raw' | 'Finished'>('Raw');
  const [newProdQty, setNewProdQty] = useState(100);
  const [newProdUom, setNewProdUom] = useState('units');

  const [newWcName, setNewWcName] = useState('');
  const [newWcCapacity, setNewWcCapacity] = useState(8);
  const [newWcRate, setNewWcRate] = useState(1200);

  const [newMoProdId, setNewMoProdId] = useState('5');
  const [newMoTargetQty, setNewMoTargetQty] = useState(5);

  const [newSoCustomer, setNewSoCustomer] = useState('Mahindra Engineering');
  const [newSoAmount, setNewSoAmount] = useState(25000);

  // Timer states for Shop Floor
  const [timerActiveId, setTimerActiveId] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);

  // Save changes to localStorage
  useEffect(() => {
    if (currentUser) localStorage.setItem('ERP_USER', JSON.stringify(currentUser));
    else localStorage.removeItem('ERP_USER');
  }, [currentUser]);

  useEffect(() => { localStorage.setItem('ERP_PRODUCTS', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('ERP_WORKCENTERS', JSON.stringify(workCenters)); }, [workCenters]);
  useEffect(() => { localStorage.setItem('ERP_BOMS', JSON.stringify(boms)); }, [boms]);
  useEffect(() => { localStorage.setItem('ERP_MOS', JSON.stringify(mos)); }, [mos]);
  useEffect(() => { localStorage.setItem('ERP_STOCKLEDGER', JSON.stringify(stockLedger)); }, [stockLedger]);
  useEffect(() => { localStorage.setItem('ERP_COA', JSON.stringify(coa)); }, [coa]);
  useEffect(() => { localStorage.setItem('ERP_CONTACTS', JSON.stringify(contacts)); }, [contacts]);
  useEffect(() => { localStorage.setItem('ERP_SALESORDERS', JSON.stringify(salesOrders)); }, [salesOrders]);
  useEffect(() => { localStorage.setItem('ERP_JOURNAL', JSON.stringify(journal)); }, [journal]);

  // Shop floor live timer interval
  useEffect(() => {
    let interval: any = null;
    if (timerActiveId) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActiveId]);

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ERP_USER');
  };

  // Seed Demo Data Reset
  const handleResetDemoData = () => {
    setProducts(INITIAL_DATA.products);
    setWorkCenters(INITIAL_DATA.workCenters);
    setBoms(INITIAL_DATA.boms);
    setMos(INITIAL_DATA.mos);
    setStockLedger(INITIAL_DATA.stockLedger);
    setCoa(INITIAL_DATA.coa);
    setContacts(INITIAL_DATA.contacts);
    setSalesOrders(INITIAL_DATA.salesOrders);
    setJournal(INITIAL_DATA.journal);
  };

  // 1. Save New Product
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName) return;
    const newP: Product = {
      id: Date.now().toString(),
      name: newProdName,
      type: newProdType,
      qtyOnHand: newProdQty,
      uom: newProdUom
    };
    setProducts((prev) => [...prev, newP]);
    setNewProdName('');
    setIsAddProductOpen(false);
  };

  // 2. Save New Work Center
  const handleSaveWorkCenter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWcName) return;
    const newWc: WorkCenter = {
      id: Date.now().toString(),
      name: newWcName,
      capacity: newWcCapacity,
      costPerHour: newWcRate,
      downtimeHours: 0
    };
    setWorkCenters((prev) => [...prev, newWc]);
    setNewWcName('');
    setIsAddWcOpen(false);
  };

  // Load bookings and orders from Firestore on user login
  useEffect(() => {
    if (!currentUser) return;

    const loadFirestoreData = async () => {
      try {
        const soSnap = await getDocs(collection(db, 'salesOrders'));
        if (!soSnap.empty) {
          const loadedSos: SalesOrder[] = [];
          soSnap.forEach((docSnap) => {
            const data = docSnap.data();
            loadedSos.push({
              id: docSnap.id,
              orderNumber: data.orderNumber,
              customer: data.customer,
              totalAmount: data.totalAmount,
              status: data.status,
              date: data.date
            });
          });
          if (loadedSos.length > 0) setSalesOrders(loadedSos);
        }

        const moSnap = await getDocs(collection(db, 'manufacturingOrders'));
        if (!moSnap.empty) {
          const loadedMos: ManufacturingOrder[] = [];
          moSnap.forEach((docSnap) => {
            const data = docSnap.data();
            loadedMos.push({
              id: docSnap.id,
              moNumber: data.moNumber,
              productId: data.productId,
              targetQty: data.targetQty,
              state: data.state,
              workOrders: data.workOrders || []
            });
          });
          if (loadedMos.length > 0) setMos(loadedMos);
        }
      } catch (e) {
        console.warn('Firestore load notice:', e);
      }
    };

    loadFirestoreData();
  }, [currentUser?.email]);

  // 3. Create Manufacturing Order
  const handleCreateMo = async (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === newMoProdId);
    if (!prod) return;
    const moNum = `MO-${String(mos.length + 1).padStart(5, '0')}`;
    const newMo: ManufacturingOrder = {
      id: Date.now().toString(),
      moNumber: moNum,
      productId: newMoProdId,
      targetQty: newMoTargetQty,
      state: 'Planned',
      workOrders: [
        { id: `wo_${Date.now()}_1`, name: `Precision Assembly for ${prod.name}`, wc: 'Assembly Line Alpha', state: 'Pending', duration: 45 },
        { id: `wo_${Date.now()}_2`, name: `Quality Inspection & Testing`, wc: 'CNC Cutting Station', state: 'Pending', duration: 25 }
      ]
    };
    setMos((prev) => [newMo, ...prev]);
    setIsAddMoOpen(false);

    try {
      await setDoc(doc(db, 'manufacturingOrders', newMo.id), {
        ...newMo,
        userId: currentUser?.email || 'user',
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Firestore MO sync notice:', err);
    }
  };

  // 4. Complete Manufacturing Order -> Auto Stock-Out Raw Materials & Auto Stock-In Finished Goods!
  const handleCompleteMo = (moId: string) => {
    const mo = mos.find((m) => m.id === moId);
    if (!mo || mo.state === 'Done') return;

    // Find BOM Recipe for this product
    const bomRecipe = boms.find((b) => b.finishedProductId === mo.productId);
    const finishedProd = products.find((p) => p.id === mo.productId);

    // Update MO status
    setMos((prev) =>
      prev.map((m) =>
        m.id === moId
          ? { ...m, state: 'Done', workOrders: m.workOrders.map((w) => ({ ...w, state: 'Done' })) }
          : m
      )
    );

    // Decrement raw material stock (Stock-Out)
    if (bomRecipe) {
      bomRecipe.components.forEach((comp) => {
        const rawQtyNeeded = comp.requiredQty * mo.targetQty;
        setProducts((prev) =>
          prev.map((p) =>
            p.id === comp.rawId ? { ...p, qtyOnHand: Math.max(0, p.qtyOnHand - rawQtyNeeded) } : p
          )
        );

        const rawProd = products.find((p) => p.id === comp.rawId);
        if (rawProd) {
          setStockLedger((prev) => [
            {
              id: `st_${Date.now()}_raw_${comp.rawId}`,
              timestamp: new Date().toISOString(),
              productName: rawProd.name,
              ref: mo.moNumber,
              change: -rawQtyNeeded,
              balance: Math.max(0, rawProd.qtyOnHand - rawQtyNeeded)
            },
            ...prev
          ]);
        }
      });
    }

    // Increment finished goods stock (Stock-In)
    if (finishedProd) {
      const newFinQty = finishedProd.qtyOnHand + mo.targetQty;
      setProducts((prev) =>
        prev.map((p) => (p.id === mo.productId ? { ...p, qtyOnHand: newFinQty } : p))
      );

      setStockLedger((prev) => [
        {
          id: `st_${Date.now()}_fin`,
          timestamp: new Date().toISOString(),
          productName: finishedProd.name,
          ref: mo.moNumber,
          change: mo.targetQty,
          balance: newFinQty
        },
        ...prev
      ]);
    }
  };

  // 5. Create Sales Order / Booking
  const handleCreateSo = async (e: React.FormEvent) => {
    e.preventDefault();
    const soNum = `SO-${String(salesOrders.length + 1).padStart(5, '0')}`;
    const newSo: SalesOrder = {
      id: Date.now().toString(),
      orderNumber: soNum,
      customer: newSoCustomer,
      totalAmount: newSoAmount,
      status: 'Draft',
      date: new Date().toISOString().split('T')[0]
    };
    setSalesOrders((prev) => [newSo, ...prev]);
    setIsAddSoOpen(false);

    try {
      await setDoc(doc(db, 'salesOrders', newSo.id), {
        ...newSo,
        userId: currentUser?.email || 'user',
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Firestore SO sync notice:', err);
    }
  };

  // 6. Convert SO to Invoice & Auto-Post Double-Entry Journal (Debit Cash 1100, Credit Sales 4100)
  const handleConvertSoToInvoice = async (soId: string) => {
    const so = salesOrders.find((s) => s.id === soId);
    if (!so || so.status === 'Paid') return;

    // Mark SO as Paid / Invoiced
    setSalesOrders((prev) =>
      prev.map((s) => (s.id === soId ? { ...s, status: 'Paid' } : s))
    );

    try {
      await setDoc(doc(db, 'salesOrders', soId), {
        ...so,
        status: 'Paid',
        userId: currentUser?.email || 'user'
      }, { merge: true });
    } catch (err) {
      console.warn('Firestore SO update notice:', err);
    }

    const today = new Date().toISOString().split('T')[0];

    // Post double-entry journal items
    const debitEntry: JournalItem = {
      id: `j_${Date.now()}_dr`,
      date: today,
      account: '1100 - Cash / Bank Account',
      narration: `Automated Invoice Posting for ${so.orderNumber} (${so.customer})`,
      debit: so.totalAmount,
      credit: 0
    };

    const creditEntry: JournalItem = {
      id: `j_${Date.now()}_cr`,
      date: today,
      account: '4100 - Sales Revenue',
      narration: `Sales Revenue recognized for ${so.orderNumber}`,
      debit: 0,
      credit: so.totalAmount
    };

    setJournal((prev) => [debitEntry, creditEntry, ...prev]);

    // Update Chart of Accounts balances
    setCoa((prev) =>
      prev.map((acc) => {
        if (acc.code === '1100') return { ...acc, balance: acc.balance + so.totalAmount };
        if (acc.code === '4100') return { ...acc, balance: acc.balance + so.totalAmount };
        return acc;
      })
    );
  };

  // Financial Statements Calculations
  const totalInvoicedRevenue = salesOrders
    .filter((s) => s.status === 'Paid')
    .reduce((sum, s) => sum + s.totalAmount, 0);

  const totalPurchaseExpenses = coa.find((c) => c.code === '5100')?.balance || 20000;
  const netProfitCalculated = totalInvoicedRevenue - totalPurchaseExpenses;

  const totalAssets = (coa.find((c) => c.code === '1100')?.balance || 150000) + (coa.find((c) => c.code === '1300')?.balance || 25000);
  const totalLiabilities = coa.find((c) => c.code === '2100')?.balance || 10000;
  const ownerEquityBase = coa.find((c) => c.code === '3100')?.balance || 165000;
  const totalEquity = ownerEquityBase + netProfitCalculated;

  // Render Phase 1: Onboarding Auth Gate if not logged in
  if (!currentUser) {
    return <AuthScreen onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  // Format timer
  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0 z-30">
        
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-100 shadow-sm">
              <Factory className="w-5 h-5 text-slate-200" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Manufacturing ERP</h2>
              <p className="text-[10px] text-slate-400 font-mono">Enterprise Edition</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-5 text-xs">
          
          {/* Main */}
          <div>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800 text-white font-semibold border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-slate-300" />
              <span>Unified Dashboard</span>
            </button>
          </div>

          {/* Phase 2: Manufacturing Operations (MRP) */}
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Manufacturing (MRP)
            </span>
            
            <button
              onClick={() => setActiveTab('mfg-products')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'mfg-products'
                  ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Product Master</span>
            </button>

            <button
              onClick={() => setActiveTab('mfg-workcenters')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'mfg-workcenters'
                  ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Work Centers</span>
            </button>

            <button
              onClick={() => setActiveTab('mfg-bom')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'mfg-bom'
                  ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>BOM Builder</span>
            </button>

            <button
              onClick={() => setActiveTab('mfg-orders')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'mfg-orders'
                  ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>MO Pipeline</span>
            </button>

            <button
              onClick={() => setActiveTab('mfg-shopfloor')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'mfg-shopfloor'
                  ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Timer className="w-4 h-4" />
              <span>Shop Floor Timer</span>
            </button>

            <button
              onClick={() => setActiveTab('mfg-stockledger')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'mfg-stockledger'
                  ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Stock Ledger</span>
            </button>
          </div>

          {/* Phase 3: Shiv Accounts Cloud */}
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Accounts & Finance
            </span>

            <button
              onClick={() => setActiveTab('acc-coa')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'acc-coa'
                  ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Landmark className="w-4 h-4" />
              <span>Chart of Accounts</span>
            </button>

            <button
              onClick={() => setActiveTab('acc-contacts')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'acc-contacts'
                  ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Contacts Master</span>
            </button>

            <button
              onClick={() => setActiveTab('acc-sales')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'acc-sales'
                  ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Sales & Invoices</span>
            </button>

            <button
              onClick={() => setActiveTab('acc-journal')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'acc-journal'
                  ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Double-Entry Journal</span>
            </button>

            <button
              onClick={() => setActiveTab('acc-reports')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'acc-reports'
                  ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Financial Statements</span>
            </button>
          </div>

        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-200 font-bold flex items-center justify-center text-xs border border-slate-700">
              {currentUser.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-white group-hover:text-slate-200 transition">{currentUser.name}</p>
              <p className="text-[10px] text-slate-400 font-mono">ROLE: {currentUser.role}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 transition cursor-pointer rounded-lg hover:bg-slate-800"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </aside>

      {/* MAIN VIEW AREA */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">

        {/* Top Header Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-200 text-slate-800 border border-slate-300 uppercase">
                {currentUser.department}
              </span>
              <span className="text-xs text-slate-600 font-medium">User: {currentUser.email}</span>
            </div>
          </div>
        </div>

        {/* TAB CONTENTS */}
        <AnimatePresence mode="wait">
          
          {/* 1. DASHBOARD */}
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Operational Overview</h1>
                <p className="text-xs text-slate-500 mt-0.5">Key performance indicators for Manufacturing MRP & Financial Accounts</p>
              </div>

              {/* 4 Top KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>Active Manufacturing Orders</span>
                    <ClipboardList className="w-4 h-4 text-slate-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 font-mono">{mos.length} MOs</h3>
                  <p className="text-[11px] text-slate-500">Production Pipeline</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>Invoiced Sales Revenue</span>
                    <DollarSign className="w-4 h-4 text-slate-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 font-mono">₹{totalInvoicedRevenue.toLocaleString('en-IN')}</h3>
                  <p className="text-[11px] text-slate-500">Order-to-Cash Invoices</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>Net Calculated Profit</span>
                    <TrendingUp className="w-4 h-4 text-slate-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 font-mono">₹{netProfitCalculated.toLocaleString('en-IN')}</h3>
                  <p className="text-[11px] text-slate-500">Profit & Loss Equation</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>Stock Ledger Movements</span>
                    <Box className="w-4 h-4 text-slate-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 font-mono">{stockLedger.length} Entries</h3>
                  <p className="text-[11px] text-slate-500">Double-Entry Stock Ledger</p>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center justify-between border-b border-slate-100 pb-3">
                    <span>Financial Performance</span>
                    <span className="text-xs text-slate-500 font-normal">Accounts Summary</span>
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Revenue', amount: totalInvoicedRevenue, fill: '#2563eb' },
                        { name: 'Expenses', amount: totalPurchaseExpenses, fill: '#64748b' },
                        { name: 'Net Profit', amount: Math.max(0, netProfitCalculated), fill: '#16a34a' }
                      ]}>
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '0.375rem', color: '#0f172a', fontSize: '12px' }} />
                        <Bar dataKey="amount" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center justify-between border-b border-slate-100 pb-3">
                    <span>Manufacturing Orders Breakdown</span>
                    <span className="text-xs text-slate-500 font-normal">MRP Pipeline</span>
                  </h3>
                  <div className="h-64 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Planned', value: mos.filter(m => m.state === 'Planned').length || 1 },
                            { name: 'In Progress', value: mos.filter(m => m.state === 'In Progress').length || 1 },
                            { name: 'Completed', value: mos.filter(m => m.state === 'Done').length || 1 }
                          ]}
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          <Cell fill="#3b82f6" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#16a34a" />
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '0.375rem', color: '#0f172a', fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 text-xs text-slate-600">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Planned</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> In Progress</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" /> Completed</span>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* 2. PRODUCT MASTER */}
          {activeTab === 'mfg-products' && (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">Product Master Catalog</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Define raw materials and finished goods inventory</p>
                </div>
                <button onClick={() => setIsAddProductOpen(true)} className="btn-primary text-xs">
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="p-3.5">Product Name</th>
                      <th className="p-3.5">Category Type</th>
                      <th className="p-3.5">Qty on Hand</th>
                      <th className="p-3.5">Unit of Measure</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-semibold text-slate-900">{p.name}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                            p.type === 'Finished' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-800 border-slate-200'
                          }`}>
                            {p.type} Material
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-semibold text-slate-900">{p.qtyOnHand}</td>
                        <td className="p-3.5 font-mono text-slate-600">{p.uom}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* 3. WORK CENTERS */}
          {activeTab === 'mfg-workcenters' && (
            <motion.div
              key="workcenters"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">Work Center Operations</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Machine capacities, operational rates, and downtime tracking</p>
                </div>
                <button onClick={() => setIsAddWcOpen(true)} className="btn-primary text-xs">
                  <Plus className="w-4 h-4" />
                  <span>Add Work Center</span>
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="p-3.5">Work Center</th>
                      <th className="p-3.5">Capacity</th>
                      <th className="p-3.5">Rate (₹/hr)</th>
                      <th className="p-3.5">Downtime (hrs)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {workCenters.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-semibold text-slate-900">{w.name}</td>
                        <td className="p-3.5 font-mono text-slate-700">{w.capacity} hrs/day</td>
                        <td className="p-3.5 font-mono font-semibold text-slate-900">₹{w.costPerHour} / hr</td>
                        <td className="p-3.5 font-mono text-slate-600">{w.downtimeHours} hrs</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* 4. BOM BUILDER */}
          {activeTab === 'mfg-bom' && (
            <motion.div
              key="bom"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Bill of Materials (BOM)</h1>
                <p className="text-xs text-slate-500 mt-0.5">Component recipes and component ratios required per finished item</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {boms.map((b) => {
                  const finishedProd = products.find((p) => p.id === b.finishedProductId);
                  return (
                    <div key={b.id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <span className="font-mono text-xs font-semibold text-slate-500">{b.code}</span>
                          <h3 className="text-base font-bold text-slate-900 mt-0.5">{finishedProd?.name || 'Finished Product'}</h3>
                        </div>
                        <span className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 rounded">
                          Batch Ratio: 1 Unit
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <p className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">Required Component Recipe:</p>
                        {b.components.map((c, idx) => {
                          const rawProd = products.find((p) => p.id === c.rawId);
                          return (
                            <div key={idx} className="flex justify-between items-center p-2 rounded bg-slate-50 border border-slate-100 font-mono text-xs">
                              <span className="text-slate-800">{rawProd?.name || 'Raw Material'}</span>
                              <span className="text-slate-900 font-semibold">{c.requiredQty} {rawProd?.uom || 'units'}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* 5. MO PIPELINE */}
          {activeTab === 'mfg-orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">Manufacturing Orders (MO)</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Order execution and automatic inventory movements</p>
                </div>
                <button onClick={() => setIsAddMoOpen(true)} className="btn-primary text-xs">
                  <Plus className="w-4 h-4" />
                  <span>Create MO</span>
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="p-3.5">Order #</th>
                      <th className="p-3.5">Target Finished Good</th>
                      <th className="p-3.5">Target Qty</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {mos.map((m) => {
                      const prod = products.find((p) => p.id === m.productId);
                      return (
                        <tr key={m.id} className="hover:bg-slate-50">
                          <td className="p-3.5 font-mono font-semibold text-slate-900">{m.moNumber}</td>
                          <td className="p-3.5 font-semibold text-slate-900">{prod?.name || 'Product'}</td>
                          <td className="p-3.5 font-mono font-semibold text-slate-800">{m.targetQty} units</td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                              m.state === 'Done' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                              {m.state}
                            </span>
                          </td>
                          <td className="p-3.5">
                            {m.state !== 'Done' ? (
                              <button
                                onClick={() => handleCompleteMo(m.id)}
                                className="btn-primary py-1 px-3 text-[11px]"
                              >
                                Complete MO & Post Stock
                              </button>
                            ) : (
                              <span className="text-emerald-700 font-medium flex items-center gap-1 text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed & Posted
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* 6. SHOP FLOOR TIMER */}
          {activeTab === 'mfg-shopfloor' && (
            <motion.div
              key="shopfloor"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Shop Floor Execution</h1>
                <p className="text-xs text-slate-500 mt-0.5">Live operator tracking and work center order timing</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mos.flatMap((m) =>
                  m.workOrders.map((w) => (
                    <div key={w.id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <span className="font-semibold text-slate-900 text-sm">{w.name}</span>
                        <span className="font-mono text-xs text-slate-600 font-semibold">{m.moNumber}</span>
                      </div>
                      <p className="text-xs text-slate-600">Work Center: <strong className="text-slate-800">{w.wc}</strong></p>

                      <div className="flex items-center justify-between pt-2">
                        <div className="font-mono text-lg font-bold text-slate-900">
                          {timerActiveId === w.id ? formatTimer(timerSeconds) : '00:00'}
                        </div>

                        <div className="flex gap-2">
                          {timerActiveId === w.id ? (
                            <button
                              onClick={() => setTimerActiveId(null)}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-medium transition flex items-center gap-1 cursor-pointer"
                            >
                              <Pause className="w-3.5 h-3.5" />
                              <span>Pause</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => { setTimerActiveId(w.id); setTimerSeconds(0); }}
                              className="btn-primary py-1.5 text-xs"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Start Timer</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* 7. STOCK LEDGER */}
          {activeTab === 'mfg-stockledger' && (
            <motion.div
              key="stockledger"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Stock Ledger</h1>
                <p className="text-xs text-slate-500 mt-0.5">Automated double-entry material consumption and inventory logs</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="p-3.5">Timestamp</th>
                      <th className="p-3.5">Product</th>
                      <th className="p-3.5">Order Ref</th>
                      <th className="p-3.5">Qty Movement</th>
                      <th className="p-3.5">Balance After</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {stockLedger.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-mono text-slate-500">{new Date(s.timestamp).toLocaleTimeString()}</td>
                        <td className="p-3.5 font-semibold text-slate-900">{s.productName}</td>
                        <td className="p-3.5 font-mono text-slate-700 font-semibold">{s.ref}</td>
                        <td className="p-3.5 font-mono font-semibold">
                          <span className={`px-2 py-0.5 rounded text-[11px] ${
                            s.change > 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}>
                            {s.change > 0 ? `+${s.change}` : s.change}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-semibold text-slate-900">{s.balance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* 8. CHART OF ACCOUNTS */}
          {activeTab === 'acc-coa' && (
            <motion.div
              key="coa"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Chart of Accounts (CoA)</h1>
                <p className="text-xs text-slate-500 mt-0.5">Master accounts for Asset, Liability, Income, Expense, and Equity</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="p-3.5">Account Code</th>
                      <th className="p-3.5">Account Name</th>
                      <th className="p-3.5">Type</th>
                      <th className="p-3.5">Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {coa.map((c) => (
                      <tr key={c.code} className="hover:bg-slate-50">
                        <td className="p-3.5 font-mono font-semibold text-slate-900">{c.code}</td>
                        <td className="p-3.5 font-semibold text-slate-900">{c.name}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
                            {c.type}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-semibold text-slate-900">₹{c.balance.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* 9. CONTACTS MASTER */}
          {activeTab === 'acc-contacts' && (
            <motion.div
              key="contacts"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Contacts Directory</h1>
                <p className="text-xs text-slate-500 mt-0.5">Vendors and Customers contact records</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="p-3.5">Contact Name</th>
                      <th className="p-3.5">Type</th>
                      <th className="p-3.5">Email</th>
                      <th className="p-3.5">Mobile</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {contacts.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-semibold text-slate-900">{c.name}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
                            {c.type}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600 font-mono">{c.email}</td>
                        <td className="p-3.5 text-slate-600 font-mono">{c.mobile}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* 10. SALES & INVOICES */}
          {activeTab === 'acc-sales' && (
            <motion.div
              key="sales"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sales Orders & Invoicing</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Order-to-Cash workflow with automated journal posting</p>
                </div>
                <button onClick={() => setIsAddSoOpen(true)} className="btn-primary text-xs">
                  <Plus className="w-4 h-4" />
                  <span>Create Sales Order</span>
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="p-3.5">SO #</th>
                      <th className="p-3.5">Customer Name</th>
                      <th className="p-3.5">Total Amount (₹)</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {salesOrders.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-mono font-semibold text-slate-900">{s.orderNumber}</td>
                        <td className="p-3.5 font-semibold text-slate-900">{s.customer}</td>
                        <td className="p-3.5 font-mono font-semibold text-slate-900">₹{s.totalAmount.toLocaleString('en-IN')}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                            s.status === 'Paid' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {s.status === 'Draft' ? (
                            <button
                              onClick={() => handleConvertSoToInvoice(s.id)}
                              className="btn-primary py-1 px-3 text-[11px]"
                            >
                              Convert to Invoice & Post Journal
                            </button>
                          ) : (
                            <span className="text-emerald-700 font-medium flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Invoiced & Posted
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* 11. DOUBLE ENTRY JOURNAL */}
          {activeTab === 'acc-journal' && (
            <motion.div
              key="journal"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Financial Journal Entries</h1>
                <p className="text-xs text-slate-500 mt-0.5">Double-entry debits and credits posted from sales and operational transactions</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Account</th>
                      <th className="p-3.5">Narration</th>
                      <th className="p-3.5">Debit (₹)</th>
                      <th className="p-3.5">Credit (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800 font-mono">
                    {journal.map((j) => (
                      <tr key={j.id} className="hover:bg-slate-50">
                        <td className="p-3.5 text-slate-500">{j.date}</td>
                        <td className="p-3.5 font-semibold text-slate-900">{j.account}</td>
                        <td className="p-3.5 text-slate-700 font-sans">{j.narration}</td>
                        <td className="p-3.5 font-semibold text-slate-900">{j.debit ? `₹${j.debit.toLocaleString('en-IN')}` : '-'}</td>
                        <td className="p-3.5 font-semibold text-slate-900">{j.credit ? `₹${j.credit.toLocaleString('en-IN')}` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* 12. FINANCIAL STATEMENTS */}
          {activeTab === 'acc-reports' && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Financial Statements</h1>
                <p className="text-xs text-slate-500 mt-0.5">Profit & Loss (P&L) and Balance Sheet Equation Check</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Profit & Loss */}
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                    <span>Profit & Loss Statement (P&L)</span>
                    <TrendingUp className="w-4 h-4 text-slate-400" />
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Total Invoiced Sales Revenue (Account 4100):</span>
                      <strong className="text-slate-900 font-mono text-sm">₹{totalInvoicedRevenue.toLocaleString('en-IN')}</strong>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span>Total Operating Purchase Expenses (Account 5100):</span>
                      <strong className="text-slate-900 font-mono text-sm">₹{totalPurchaseExpenses.toLocaleString('en-IN')}</strong>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-sm font-semibold text-slate-900">
                      <span>Net Calculated Profit:</span>
                      <strong className="text-slate-900 font-mono text-base">₹{netProfitCalculated.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                </div>

                {/* Balance Sheet Check */}
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                    <span>Balance Sheet Verification</span>
                    <Landmark className="w-4 h-4 text-slate-400" />
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Total Assets (Cash + AR):</span>
                      <strong className="text-slate-900 font-mono text-sm">₹{totalAssets.toLocaleString('en-IN')}</strong>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span>Total Liabilities (AP):</span>
                      <strong className="text-slate-900 font-mono text-sm">₹{totalLiabilities.toLocaleString('en-IN')}</strong>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span>Total Equity (Owner Equity + Net Profit):</span>
                      <strong className="text-slate-900 font-mono text-sm">₹{totalEquity.toLocaleString('en-IN')}</strong>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-sm font-semibold text-slate-900">
                      <span>Status:</span>
                      <span className="px-2.5 py-1 rounded text-xs font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                        BALANCED ✓ (₹{totalAssets.toLocaleString('en-IN')} = ₹{(totalLiabilities + totalEquity).toLocaleString('en-IN')})
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* FORM MODALS */}
      {/* 1. Add Product Modal */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 space-y-4 border border-slate-200 rounded-lg shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Add Product to Master Catalog</h3>
            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Product Name</label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. Copper Wire Spool"
                  className="input-style"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Material Type</label>
                <select
                  value={newProdType}
                  onChange={(e) => setNewProdType(e.target.value as any)}
                  className="input-style bg-white text-slate-900"
                >
                  <option value="Raw">Raw Material</option>
                  <option value="Finished">Finished Good</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Initial Qty on Hand</label>
                <input
                  type="number"
                  required
                  value={newProdQty}
                  onChange={(e) => setNewProdQty(Number(e.target.value))}
                  className="input-style"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Unit of Measure (UOM)</label>
                <input
                  type="text"
                  required
                  value={newProdUom}
                  onChange={(e) => setNewProdUom(e.target.value)}
                  placeholder="units, kg, meters"
                  className="input-style"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAddProductOpen(false)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add Work Center Modal */}
      {isAddWcOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 space-y-4 border border-slate-200 rounded-lg shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Configure New Work Center</h3>
            <form onSubmit={handleSaveWorkCenter} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Work Center Name</label>
                <input
                  type="text"
                  required
                  value={newWcName}
                  onChange={(e) => setNewWcName(e.target.value)}
                  placeholder="e.g. Laser Engraving Bay"
                  className="input-style"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Capacity (hrs/day)</label>
                <input
                  type="number"
                  required
                  value={newWcCapacity}
                  onChange={(e) => setNewWcCapacity(Number(e.target.value))}
                  className="input-style"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Hourly Operational Rate (₹/hr)</label>
                <input
                  type="number"
                  required
                  value={newWcRate}
                  onChange={(e) => setNewWcRate(Number(e.target.value))}
                  className="input-style"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAddWcOpen(false)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs">Save Work Center</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Create MO Modal */}
      {isAddMoOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 space-y-4 border border-slate-200 rounded-lg shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Create Manufacturing Order (MO)</h3>
            <form onSubmit={handleCreateMo} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Target Finished Good</label>
                <select
                  value={newMoProdId}
                  onChange={(e) => setNewMoProdId(e.target.value)}
                  className="input-style bg-white text-slate-900"
                >
                  {products.filter(p => p.type === 'Finished').map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Target Production Quantity</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newMoTargetQty}
                  onChange={(e) => setNewMoTargetQty(Number(e.target.value))}
                  className="input-style"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAddMoOpen(false)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs">Create MO</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Create SO Modal */}
      {isAddSoOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 space-y-4 border border-slate-200 rounded-lg shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Create Sales Order</h3>
            <form onSubmit={handleCreateSo} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Select Customer</label>
                <select
                  value={newSoCustomer}
                  onChange={(e) => setNewSoCustomer(e.target.value)}
                  className="input-style bg-white text-slate-900"
                >
                  {contacts.filter(c => c.type === 'Customer' || c.type === 'Both').map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Total Order Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={newSoAmount}
                  onChange={(e) => setNewSoAmount(Number(e.target.value))}
                  className="input-style"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAddSoOpen(false)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs">Create Sales Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER MODALS */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={{
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          isTwoFactorEnabled: true,
          isEmailVerified: true,
          createdAt: new Date().toISOString(),
          department: currentUser.department
        }}
      />

      <UserReportsModal
        isOpen={isReportsOpen}
        onClose={() => setIsReportsOpen(false)}
        currentUser={{
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          isTwoFactorEnabled: true,
          isEmailVerified: true,
          createdAt: new Date().toISOString(),
          department: currentUser.department
        }}
        orders={[]}
      />

      <CloudSyncModal
        isOpen={isCloudSyncOpen}
        onClose={() => setIsCloudSyncOpen(false)}
        config={{
          provider: 'AWS_S3',
          bucketName: 'erp-cloud-vault-archive',
          region: 'ap-south-1',
          autoSyncIntervalMinutes: 60,
          lastSyncTimestamp: new Date().toISOString(),
          isEncrypted: true
        }}
        onTriggerSync={(provider) => {
          console.log('Archive triggered for provider:', provider);
        }}
      />

    </div>
  );
}
