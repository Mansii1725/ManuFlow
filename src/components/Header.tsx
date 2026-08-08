import React from 'react';
import { ShieldCheck, ShieldAlert, Cpu, Cloud, Lock, UserCheck, RefreshCw, Key, Zap } from 'lucide-react';
import { Role, User, CloudStorageConfig, RateLimitStatus } from '../types/mrp';

interface HeaderProps {
  currentUser: User;
  onRoleChange: (newRole: Role) => void;
  cloudConfig: CloudStorageConfig;
  rateLimitStatus: RateLimitStatus;
  onOpenAuthModal: (mode: 'OTP' | 'PASSWORD_GEN' | 'TWO_FACTOR' | 'RECOVERY') => void;
  onOpenCloudSync: () => void;
  onOpenSurgeModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onRoleChange,
  cloudConfig,
  rateLimitStatus,
  onOpenAuthModal,
  onOpenCloudSync,
  onOpenSurgeModal,
}) => {
  const rolesList: { role: Role; label: string }[] = [
    { role: 'ADMIN', label: 'Admin (Full System & Security)' },
    { role: 'PLANT_MANAGER', label: 'Plant Manager (MO/WO Operations)' },
    { role: 'SHOP_FLOOR_OPERATOR', label: 'Shop Floor Operator (WO Execution)' },
    { role: 'PROCUREMENT_OFFICER', label: 'Procurement Officer (PO & Vendors)' },
    { role: 'AUDITOR_COMPLIANCE', label: 'Compliance Auditor (E2E & Logs)' },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-indigo-400 flex items-center justify-center">
              <Cpu className="w-6 h-6 animate-pulse text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white font-mono">NEXUS MRP Engine</h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  v3.8 Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-400">High-Availability Manufacturing & Inventory ERP</p>
            </div>
          </div>

          {/* Quick Metrics & Security Status Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            
            {/* E2E Encryption Status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-300">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>E2E AES-256: <strong className="text-emerald-400">Encrypted</strong></span>
            </div>

            {/* Rate Limit Status Ticker */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>API Gateway: <strong className="text-indigo-300">{rateLimitStatus.tokensAvailable}/100 Tokens</strong></span>
              {rateLimitStatus.blockedRequests > 0 && (
                <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded">
                  {rateLimitStatus.blockedRequests} Blocked
                </span>
              )}
            </div>

            {/* Cloud Sync Status Button */}
            <button
              onClick={onOpenCloudSync}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 transition"
              title="Cloud Storage Sync Status"
            >
              <Cloud className="w-3.5 h-3.5 text-sky-400" />
              <span>{cloudConfig.provider}: <strong className="text-sky-300">{cloudConfig.syncStatus}</strong></span>
            </button>

            {/* Microservice Surge Simulator Trigger */}
            <button
              onClick={onOpenSurgeModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-900/60 hover:bg-indigo-800/80 border border-indigo-700/60 rounded-lg text-indigo-200 font-medium transition"
              title="Test Microservices HPA Pod Scaling"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Simulate Surge</span>
            </button>
          </div>

          {/* User Auth & Role Switcher Controls */}
          <div className="flex items-center gap-2">
            
            {/* Password & Security Tools */}
            <button
              onClick={() => onOpenAuthModal('PASSWORD_GEN')}
              className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
              title="Password Generator & Entropy Tool"
            >
              <Key className="w-4 h-4 text-amber-400" />
            </button>

            {/* OTP / 2FA Login Dialog Trigger */}
            <button
              onClick={() => onOpenAuthModal('OTP')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow transition"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Auth & 2FA</span>
            </button>

            {/* Active Role Selector Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs">
              <span className="text-slate-400 text-[11px] uppercase tracking-wider">Role:</span>
              <select
                value={currentUser.role}
                onChange={(e) => onRoleChange(e.target.value as Role)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs"
              >
                {rolesList.map((r) => (
                  <option key={r.role} value={r.role} className="bg-slate-900 text-white">
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
