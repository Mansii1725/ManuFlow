import React, { useState } from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, ShieldAlert, UserCheck } from 'lucide-react';
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
      <div className="glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#e1efe6] text-emerald-800 border border-[#bcdcc7] rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-800">Security, RBAC Matrix & Compliance Audit</h2>
              <p className="text-xs text-stone-600 mt-0.5">
                Role-based access matrix, token bucket rate limiting, and immutable security audit logs.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#f0ebe0] border border-[#d6d0c0] px-3 py-1.5 rounded-xl text-xs text-stone-800 font-semibold font-mono shadow-xs">
          <Lock className="w-3.5 h-3.5 text-emerald-800" />
          <span>Active Role: {currentUser.role}</span>
        </div>
      </div>

      {/* Security Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Token Bucket Monitor Card */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 font-mono flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-emerald-800" />
              <span>Token Bucket Limiter</span>
            </h3>
            <span className="text-[10px] bg-[#e1efe6] text-emerald-800 border border-[#bcdcc7] px-2 py-0.5 rounded-md font-mono font-bold">
              Rate Defense
            </span>
          </div>

          <div className="p-3 bg-[#fbf9f5] border border-[#dcd6c8] rounded-xl space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-stone-600">Tokens Available:</span>
              <strong className="text-emerald-900 font-mono">{rateLimitStatus.tokensAvailable} / 100</strong>
            </div>

            <div className="w-full h-2 bg-[#e8e3d5] rounded-full overflow-hidden border border-[#d2cbba]">
              <div
                className="h-full bg-[#3b7a57] transition-all duration-300"
                style={{ width: `${(rateLimitStatus.tokensAvailable / 100) * 100}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-stone-600 pt-1">
              <span>Total API Calls: <strong className="text-stone-900">{rateLimitStatus.totalRequests}</strong></span>
              <span>Blocked Scrapers: <strong className="text-rose-700">{rateLimitStatus.blockedRequests}</strong></span>
            </div>
          </div>
        </div>

        {/* E2E Encryption Status Card */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 font-mono flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-emerald-800" />
              <span>Payload Encryption</span>
            </h3>
            <span className="text-[10px] bg-[#e1efe6] text-emerald-800 border border-[#bcdcc7] px-2 py-0.5 rounded-md font-mono font-bold">
              AES-256
            </span>
          </div>

          <div className="p-3 bg-[#fbf9f5] border border-[#dcd6c8] rounded-xl text-xs space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-stone-600">Server Data:</span>
              <strong className="text-emerald-800">Encrypted at Rest</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600">Decryption Access:</span>
              <strong className={currentUser.role === 'ADMIN' || currentUser.role === 'AUDITOR_COMPLIANCE' ? 'text-emerald-800' : 'text-rose-800'}>
                {currentUser.role === 'ADMIN' || currentUser.role === 'AUDITOR_COMPLIANCE' ? 'AUTHORIZED' : 'RESTRICTED'}
              </strong>
            </div>
          </div>
        </div>

        {/* Role Profile Card */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 font-mono flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-amber-800" />
              <span>Current User Profile</span>
            </h3>
          </div>

          <div className="p-3 bg-[#fbf9f5] border border-[#dcd6c8] rounded-xl text-xs space-y-1">
            <div className="font-bold text-stone-800">{currentUser.name}</div>
            <div className="text-stone-600">{currentUser.email}</div>
            <div className="text-emerald-900 text-[11px] font-mono font-semibold">{currentUser.department}</div>
          </div>
        </div>

      </div>

      {/* RBAC Permissions Matrix */}
      <div className="glass-card p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 font-mono">
          Role-Based Access Control (RBAC) Permission Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-[#f0ebe0] text-stone-700 font-mono text-[11px] uppercase border-b border-[#e2ddd0]">
              <tr>
                <th className="py-2.5 px-3 font-semibold">System Action / Permission</th>
                <th className="py-2.5 px-3 font-semibold">Allowed Roles</th>
                <th className="py-2.5 px-3 text-right font-semibold">Current Role Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8e3d5]">
              {rbacMatrix.map((item, idx) => {
                const hasAccess = item.rolesAllowed.includes(currentUser.role);
                return (
                  <tr key={idx} className="hover:bg-[#f3efea]">
                    <td className="py-2.5 px-3 font-medium text-stone-800">{item.permission}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {item.rolesAllowed.map((r) => (
                          <span key={r} className="px-2 py-0.5 bg-[#f0ebe0] text-[10px] text-stone-700 border border-[#dcd6c8] rounded font-mono font-medium">
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      {hasAccess ? (
                        <span className="text-emerald-800 text-[11px]">ALLOWED</span>
                      ) : (
                        <span className="text-rose-800 text-[11px]">DENIED</span>
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
      <div className="glass-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#e2ddd0]">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 font-mono">
              Compliance Audit Logs
            </h3>
            <p className="text-[11px] text-stone-600">Immutable record of state changes and API actions</p>
          </div>

          <button
            onClick={() => setShowEncryptedOnly(!showEncryptedOnly)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#eae5d8] hover:bg-[#ded8c8] text-stone-800 text-xs rounded-lg transition font-mono font-semibold border border-[#dcd6c8] cursor-pointer"
          >
            {showEncryptedOnly ? <Eye className="w-3.5 h-3.5 text-emerald-800" /> : <EyeOff className="w-3.5 h-3.5 text-amber-800" />}
            <span>{showEncryptedOnly ? 'Show Decrypted Text' : 'View Ciphertext Payload'}</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-[#f0ebe0] text-stone-700 font-mono text-[11px] uppercase border-b border-[#e2ddd0]">
              <tr>
                <th className="py-3 px-3 font-semibold">Timestamp</th>
                <th className="py-3 px-3 font-semibold">User & Role</th>
                <th className="py-3 px-3 font-semibold">Action Type</th>
                <th className="py-3 px-3 font-semibold">Event Payload</th>
                <th className="py-3 px-3 font-semibold">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8e3d5]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#f3efea]">
                  <td className="py-3 px-3 font-mono text-xs text-stone-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-semibold text-stone-800">{log.userEmail}</div>
                    <span className="text-[10px] bg-[#f0ebe0] text-stone-700 px-1.5 py-0.2 rounded border border-[#dcd6c8] font-mono">
                      {log.userRole}
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono font-bold text-emerald-900 whitespace-nowrap">
                    {log.actionType}
                  </td>

                  <td className="py-3 px-3">
                    {showEncryptedOnly ? (
                      <span className="font-mono text-[10px] text-amber-900 bg-amber-100 px-2 py-1 rounded border border-amber-200 block truncate max-w-xs">
                        {log.detailsEncrypted}
                      </span>
                    ) : (
                      <span className="text-stone-800 font-medium">
                        {log.detailsDecryptedForAdmin || log.detailsEncrypted}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 font-mono text-[11px] text-stone-500 whitespace-nowrap">
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
