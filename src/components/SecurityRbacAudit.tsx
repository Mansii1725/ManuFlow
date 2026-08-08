import React, { useState } from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, AlertTriangle, UserCheck, Key, ShieldAlert, Cpu, Activity, Server } from 'lucide-react';
import { AuditLogEntry, Role, User, RateLimitStatus } from '../types/mrp';

interface SecurityRbacAuditProps {
  auditLogs: AuditLogEntry[];
  currentUser: User;
  rateLimitStatus: RateLimitStatus;
}

export const SecurityRbacAudit: React.FC<SecurityRbacAuditProps> = ({ auditLogs, currentUser, rateLimitStatus }) => {
  const [showEncryptedOnly, setShowEncryptedOnly] = useState(false);

  const rbacMatrix: { permission: string; rolesAllowed: Role[] }[] = [
    { permission: 'View Multi-level BOM Hierarchy', rolesAllowed: ['ADMIN', 'PLANT_MANAGER', 'SHOP_FLOOR_OPERATOR', 'PROCUREMENT_OFFICER', 'AUDITOR_COMPLIANCE'] },
    { permission: 'Create Manufacturing Orders (MO)', rolesAllowed: ['ADMIN', 'PLANT_MANAGER'] },
    { permission: 'Execute Work Orders (WO) & Transition Status', rolesAllowed: ['ADMIN', 'PLANT_MANAGER', 'SHOP_FLOOR_OPERATOR'] },
    { permission: 'Manual Inventory Ledger Adjustments', rolesAllowed: ['ADMIN', 'PLANT_MANAGER'] },
    { permission: 'Issue & Receive Supplier Purchase Orders', rolesAllowed: ['ADMIN', 'PROCUREMENT_OFFICER'] },
    { permission: 'Decrypt E2E Audit Logs & Key Rotation', rolesAllowed: ['ADMIN', 'AUDITOR_COMPLIANCE'] },
    { permission: 'Configure Microservices & API Rate Limits', rolesAllowed: ['ADMIN'] },
  ];

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white font-mono">RBAC Security, Audit Trail & API Defense</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            End-to-End AES-256 Payload Encryption, Role Permissions, and Sliding-Window Token Bucket Scraper Throttling.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-emerald-400 font-mono">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Active Role: {currentUser.role}</span>
        </div>
      </div>

      {/* Top Row: Rate Limiting Defense & Token Bucket Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Token Bucket Monitor Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              <span>Token Bucket Rate Limiter</span>
            </h3>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono font-semibold">
              Sliding Window
            </span>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Tokens Available:</span>
              <strong className="text-indigo-400 font-mono">{rateLimitStatus.tokensAvailable} / 100</strong>
            </div>

            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${(rateLimitStatus.tokensAvailable / 100) * 100}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-slate-400 pt-1">
              <span>Total API Calls: <strong className="text-white">{rateLimitStatus.totalRequests}</strong></span>
              <span>Scraper IPs Blocked: <strong className="text-rose-400">{rateLimitStatus.blockedRequests}</strong></span>
            </div>
          </div>
        </div>

        {/* E2E Encryption Status Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>E2E Server Payload Encryption</span>
            </h3>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-semibold">
              AES-256-GCM
            </span>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Server Storage:</span>
              <strong className="text-emerald-400">Zero Plaintext Persistence</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Decryption Key Access:</span>
              <strong className={currentUser.role === 'ADMIN' || currentUser.role === 'AUDITOR_COMPLIANCE' ? 'text-emerald-400' : 'text-rose-400'}>
                {currentUser.role === 'ADMIN' || currentUser.role === 'AUDITOR_COMPLIANCE' ? 'AUTHORIZED' : 'RESTRICTED'}
              </strong>
            </div>
          </div>
        </div>

        {/* Role Access Level Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>RBAC Session Profile</span>
            </h3>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
            <div className="font-bold text-white">{currentUser.name}</div>
            <div className="text-slate-400">{currentUser.email}</div>
            <div className="text-indigo-400 text-[11px] font-mono">{currentUser.department}</div>
          </div>
        </div>

      </div>

      {/* RBAC Permissions Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
          Role-Based Access Control (RBAC) Permission Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">System Action / Permission</th>
                <th className="py-2.5 px-3">Allowed Roles</th>
                <th className="py-2.5 px-3 text-right">Current Role Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rbacMatrix.map((item, idx) => {
                const hasAccess = item.rolesAllowed.includes(currentUser.role);
                return (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-medium text-white">{item.permission}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {item.rolesAllowed.map((r) => (
                          <span key={r} className="px-1.5 py-0.2 bg-slate-800 text-[10px] text-slate-300 rounded font-mono">
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      {hasAccess ? (
                        <span className="text-emerald-400 text-[11px]">ALLOWED</span>
                      ) : (
                        <span className="text-rose-400 text-[11px]">DENIED</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compliance Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
              Immutable Compliance Audit Logs
            </h3>
            <p className="text-[11px] text-slate-400">All security, state changes, and API events</p>
          </div>

          <button
            onClick={() => setShowEncryptedOnly(!showEncryptedOnly)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition font-mono"
          >
            {showEncryptedOnly ? <Eye className="w-3.5 h-3.5 text-indigo-400" /> : <EyeOff className="w-3.5 h-3.5 text-amber-400" />}
            <span>{showEncryptedOnly ? 'Show Decrypted Text' : 'View Ciphertext Payload'}</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">User & Role</th>
                <th className="py-3 px-3">Action Type</th>
                <th className="py-3 px-3">Event Audit Payload</th>
                <th className="py-3 px-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-semibold text-white">{log.userEmail}</div>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono">
                      {log.userRole}
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono font-bold text-indigo-300 whitespace-nowrap">
                    {log.actionType}
                  </td>

                  <td className="py-3 px-3">
                    {showEncryptedOnly ? (
                      <span className="font-mono text-[10px] text-amber-300 bg-slate-950 px-2 py-1 rounded border border-slate-800 block truncate max-w-xs">
                        {log.detailsEncrypted}
                      </span>
                    ) : (
                      <span className="text-slate-200">
                        {log.detailsDecryptedForAdmin || log.detailsEncrypted}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {log.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
